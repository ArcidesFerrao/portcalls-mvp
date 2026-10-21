import { createHash, randomBytes } from "node:crypto";
import type { CookieOptions, Response } from "express";
import { prisma } from "./prisma";

export const COOKIE_NAME = "portops_session";

const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? 7);
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

// Na base de dados guardamos só o hash do token: se a tabela vazar,
// os tokens não servem para entrar.
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: TTL_MS });
}

export async function createSession(res: Response, userId: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  });
  setSessionCookie(res, token);
}

export async function findSession(token: string) {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          // Por agora cada utilizador usa a sua primeira empresa
          memberships: {
            orderBy: { createdAt: "asc" },
            take: 1,
            include: { organization: true },
          },
        },
      },
    },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Sessão deslizante: renova quando falta menos de metade do prazo
  let renewed = false;
  if (session.expiresAt.getTime() - Date.now() < TTL_MS / 2) {
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() + TTL_MS) },
    });
    renewed = true;
  }

  return { session, renewed };
}

export async function destroySession(res: Response, token?: string) {
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  res.clearCookie(COOKIE_NAME, cookieOptions());
}