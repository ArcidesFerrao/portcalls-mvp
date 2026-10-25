import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyDummy, verifyPassword } from "../lib/passwords";
import { COOKIE_NAME, createSession, destroySession } from "../lib/sessions";
import { HttpError, h, param, parse } from "../lib/http";
import { hashToken } from "../lib/tokens";
import { requireAuth } from "../middleware/requireAuth";

export const authRouter = Router();

// Só conta tentativas falhadas: 10 por 15 minutos por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiadas tentativas. Tente novamente dentro de alguns minutos.",
  },
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

authRouter.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Indique o e-mail e a palavra-passe." });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { memberships: { take: 1 } },
    });

    // Mesma resposta e mesmo tempo, exista ou não o e-mail
    let valid = false;
    if (user) {
      valid = await verifyPassword(user.passwordHash, password);
    } else {
      await verifyDummy(password);
    }

    if (!user || !valid || user.disabledAt) {
      return res
        .status(401)
        .json({ error: "E-mail ou palavra-passe incorretos." });
    }

    if (user.memberships.length === 0) {
      return res.status(403).json({
        error: "A sua conta ainda não está associada a nenhuma empresa.",
      });
    }

    await createSession(res, user.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    await destroySession(res, req.cookies?.[COOKIE_NAME]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  const a = req.auth!;
  res.json({
    id: a.userId,
    name: a.name,
    email: a.email,
    organizationId: a.organizationId,
    organizationName: a.organizationName,
    role: a.role,
  });
});

// ============ CONVITES (público) ============
// Quem recebe o link ainda não tem conta nem sessão.

const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiadas tentativas. Tente novamente dentro de alguns minutos.",
  },
});

// Mesma resposta para token inexistente, usado ou expirado
async function findValidInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { organization: { select: { name: true } } },
  });
  if (
    !invitation ||
    invitation.acceptedAt ||
    invitation.expiresAt.getTime() < Date.now()
  ) {
    throw new HttpError(404, "Convite inválido ou expirado.");
  }
  return invitation;
}

authRouter.get(
  "/invitations/:token",
  inviteLimiter,
  h(async (req, res) => {
    const invitation = await findValidInvitation(param(req, "token"));
    res.json({
      email: invitation.email,
      role: invitation.role,
      organizationName: invitation.organization.name,
      expiresAt: invitation.expiresAt,
    });
  })
);

const acceptSchema = z.object({
  name: z.string().trim().min(2).max(120),
  password: z.string().max(200),
});

authRouter.post(
  "/invitations/:token/accept",
  inviteLimiter,
  h(async (req, res) => {
    const { name, password } = parse(acceptSchema, req.body);
    if (password.length < 10) {
      throw new HttpError(
        400,
        "A palavra-passe tem de ter pelo menos 10 caracteres."
      );
    }

    const invitation = await findValidInvitation(param(req, "token"));

    // O e-mail vem do convite, nunca do pedido
    const taken = await prisma.user.findUnique({
      where: { email: invitation.email },
      select: { id: true },
    });
    if (taken) {
      throw new HttpError(
        409,
        "Já existe uma conta com este e-mail. Peça um novo convite ao administrador."
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      // Reclamar o convite de forma atómica: se dois pedidos chegarem
      // ao mesmo tempo, só um passa.
      const claimed = await tx.invitation.updateMany({
        where: {
          id: invitation.id,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { acceptedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw new HttpError(404, "Convite inválido ou expirado.");
      }

      const created = await tx.user.create({
        data: { email: invitation.email, name, passwordHash },
      });
      await tx.membership.create({
        data: {
          userId: created.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      });
      return created;
    });

    await createSession(res, user.id);
    res.status(201).json({ ok: true });
  })
);