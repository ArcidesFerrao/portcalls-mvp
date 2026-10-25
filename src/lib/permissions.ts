import type { Role } from "./roles";

// Só para esconder botões. Quem decide é sempre o servidor: um pedido sem
// permissão recebe 403, mesmo que alguém consiga mostrar o botão.
// Tem de bater com server/src/lib/permissions.ts.

export const canOperate = (role?: Role): boolean =>
  role === "ADMIN" || role === "COORDENADOR";

export const canInvoice = (role?: Role): boolean =>
  canOperate(role) || role === "FINANCEIRO";

export const canManageTeam = (role?: Role): boolean => role === "ADMIN";