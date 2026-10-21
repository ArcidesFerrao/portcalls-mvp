import type { NextFunction, Request, Response } from "express";
import { COOKIE_NAME, findSession, setSessionCookie } from "../lib/sessions";

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