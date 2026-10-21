import type { NextFunction, Request, Response } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// APP_ORIGIN aceita vários valores separados por vírgula.
// Em desenvolvimento, por omissão, aceita o servidor do Vite.
const allowed = (process.env.APP_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export function originCheck(req: Request, res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.headers.origin;
  // Sem Origin não é um pedido de navegador (curl, scripts); os navegadores
  // já ficam protegidos pelo SameSite do cookie.
  if (!origin || allowed.includes(origin)) return next();

  res.status(403).json({ error: "Origem não permitida." });
}