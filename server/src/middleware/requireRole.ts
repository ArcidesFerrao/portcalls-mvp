import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";

// Usar sempre depois de requireAuth
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res
        .status(403)
        .json({ error: "Não tem permissão para esta ação." });
    }
    next();
  };
}