import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError, h, param, parse } from "../lib/http";
import { canManageTeam } from "../lib/permissions";
import { generateToken, hashToken } from "../lib/tokens";

export const teamRouter = Router();

// Tudo aqui exige administrador
teamRouter.use(canManageTeam);

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const roleSchema = z.enum(["ADMIN", "COORDENADOR", "GESTOR", "FINANCEIRO"]);

// Endereço do frontend, para montar o link do convite
function appBaseUrl() {
  const first = (process.env.APP_ORIGIN ?? "http://localhost:5173")
    .split(",")[0]
    .trim();
  return first.replace(/\/$/, "");
}

// ============ MEMBROS ============

function toMember(m: {
  userId: string;
  role: string;
  createdAt: Date;
  user: { name: string; email: string; disabledAt: Date | null };
}) {
  return {
    id: m.userId,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    disabled: m.user.disabledAt !== null,
    joinedAt: m.createdAt,
  };
}

const memberSelect = {
  user: { select: { name: true, email: true, disabledAt: true } },
} as const;

teamRouter.get(
  "/members",
  h(async (req, res) => {
    const { organizationId } = req.auth!;
    const memberships = await prisma.membership.findMany({
      where: { organizationId },
      include: memberSelect,
      orderBy: { createdAt: "asc" },
    });
    res.json(memberships.map(toMember));
  })
);

const memberUpdateSchema = z
  .object({
    role: roleSchema.optional(),
    disabled: z.boolean().optional(),
  })
  .refine((v) => v.role !== undefined || v.disabled !== undefined);

teamRouter.patch(
  "/members/:userId",
  h(async (req, res) => {
    const { organizationId, userId: actorId } = req.auth!;
    const targetId = param(req, "userId");
    const { role, disabled } = parse(memberUpdateSchema, req.body);

    // Quem altera é sempre um administrador ativo e diferente do alvo,
    // por isso a empresa nunca fica sem administrador.
    if (targetId === actorId) {
      throw new HttpError(
        400,
        "Não pode alterar o seu próprio papel nem desativar a sua conta."
      );
    }

    // Só se mexe em membros desta empresa
    const key = { userId_organizationId: { userId: targetId, organizationId } };
    const existing = await prisma.membership.findUnique({ where: key });
    if (!existing) throw new HttpError(404, "Membro não encontrado.");

    await prisma.$transaction(async (tx) => {
      if (role !== undefined) {
        await tx.membership.update({ where: key, data: { role } });
      }
      if (disabled !== undefined) {
        await tx.user.update({
          where: { id: targetId },
          data: { disabledAt: disabled ? new Date() : null },
        });
        // Desativar corta o acesso já: termina as sessões abertas
        if (disabled) {
          await tx.session.deleteMany({ where: { userId: targetId } });
        }
      }
    });

    const updated = await prisma.membership.findUniqueOrThrow({
      where: key,
      include: memberSelect,
    });
    res.json(toMember(updated));
  })
);

// ============ CONVITES ============

teamRouter.get(
  "/invitations",
  h(async (req, res) => {
    const { organizationId } = req.auth!;
    const invitations = await prisma.invitation.findMany({
      where: { organizationId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    });
    const now = Date.now();
    res.json(
      invitations.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        createdAt: i.createdAt,
        expiresAt: i.expiresAt,
        expired: i.expiresAt.getTime() < now,
      }))
    );
  })
);

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: roleSchema,
});

teamRouter.post(
  "/invitations",
  h(async (req, res) => {
    const { organizationId } = req.auth!;
    const { email, role } = parse(inviteSchema, req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { memberships: { select: { organizationId: true } } },
    });
    if (existingUser) {
      const sameOrg = existingUser.memberships.some(
        (m) => m.organizationId === organizationId
      );
      throw new HttpError(
        409,
        sameOrg
          ? "Esta pessoa já faz parte da empresa."
          : "Não é possível convidar este e-mail."
      );
    }

    // O token só existe aqui, em claro: na base de dados fica o hash.
    // Um novo convite para o mesmo e-mail substitui o anterior.
    const token = generateToken();
    const [, invitation] = await prisma.$transaction([
      prisma.invitation.deleteMany({
        where: { organizationId, email, acceptedAt: null },
      }),
      prisma.invitation.create({
        data: {
          organizationId,
          email,
          role,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        },
      }),
    ]);

    res.status(201).json({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      link: `${appBaseUrl()}/invite/${token}`,
    });
  })
);

teamRouter.delete(
  "/invitations/:id",
  h(async (req, res) => {
    const { organizationId } = req.auth!;
    const { count } = await prisma.invitation.deleteMany({
      where: { id: param(req, "id"), organizationId, acceptedAt: null },
    });
    if (count === 0) throw new HttpError(404, "Convite não encontrado.");
    res.status(204).end();
  })
);