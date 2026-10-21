import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { COOKIE_NAME, findSession, setSessionCookie } from "../lib/sessions";

export interface AuthContext {
  sessionId: string;
  userId: string;
  name: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: Role;
}

// Declarado aqui (e não num .d.ts à parte) para o TypeScript o apanhar
// sempre que este ficheiro é importado, sem depender do tsconfig.
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: "Inicie sessão para continuar." });
    }

    const found = await findSession(token);
    if (!found) {
      return res
        .status(401)
        .json({ error: "A sessão expirou. Inicie sessão novamente." });
    }

    const { session, renewed } = found;
    const { user } = session;
    const membership = user.memberships[0];

    if (user.disabledAt || !membership) {
      return res.status(403).json({ error: "Esta conta não tem acesso." });
    }

    if (renewed) setSessionCookie(res, token);

    // A empresa vem SEMPRE daqui, nunca do corpo ou dos parâmetros do pedido
    req.auth = {
      sessionId: session.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      organizationId: membership.organizationId,
      organizationName: membership.organization.name,
      role: membership.role,
    };
    next();
  } catch (err) {
    next(err);
  }
}