import { createHash, randomBytes } from "node:crypto";

// Tokens de sessão e de convite: aleatórios, e na base de dados só se guarda
// o hash. Se a tabela vazar, os tokens não servem para entrar nem para aceitar convites.
export const generateToken = () => randomBytes(32).toString("base64url");

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");