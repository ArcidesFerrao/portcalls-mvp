import { requireRole } from "../middleware/requireRole";

// Ler: qualquer utilizador autenticado da empresa.
// Alterar: só os papéis abaixo. Ajusta conforme o teu modelo de equipa.

// Criar e editar operações, autorizações, marcos e ficheiros
export const canOperate = requireRole("ADMIN", "COORDENADOR");

// Atualizar faturas
export const canInvoice = requireRole("ADMIN", "COORDENADOR", "FINANCEIRO");

// Convites e gestão de membros
export const canManageTeam = requireRole("ADMIN");