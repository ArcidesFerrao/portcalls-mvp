export type Role = "ADMIN" | "COORDENADOR" | "GESTOR" | "FINANCEIRO";

export const ROLES: Role[] = ["ADMIN", "COORDENADOR", "GESTOR", "FINANCEIRO"];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  COORDENADOR: "Coordenador",
  GESTOR: "Gestor",
  FINANCEIRO: "Financeiro",
};

// O que cada papel pode fazer (tem de bater com server/src/lib/permissions.ts)
export const ROLE_HELP: Record<Role, string> = {
  ADMIN: "Gere a equipa e tem acesso a tudo.",
  COORDENADOR: "Cria e edita operações, marcos, documentos e faturas.",
  GESTOR: "Consulta tudo, sem alterar nada.",
  FINANCEIRO: "Atualiza as faturas e consulta o resto.",
};