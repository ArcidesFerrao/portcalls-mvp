import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { verifyDummy, verifyPassword } from "../lib/passwords";
import { COOKIE_NAME, createSession, destroySession } from "../lib/sessions";
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