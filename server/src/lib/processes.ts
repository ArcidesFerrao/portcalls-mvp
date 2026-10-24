import { Prisma } from "@prisma/client";

export const processInclude = {
  authorizations: true,
  milestones: { orderBy: { order: "asc" } },
  invoices: true,
  files: true,
  events: {
    orderBy: { timestamp: "desc" },
    include: { user: { select: { name: true } } },
  },
  coordinator: { select: { name: true } },
} satisfies Prisma.ProcessInclude;

type FullProcess = Prisma.ProcessGetPayload<{
  include: typeof processInclude;
}>;

// Mantém o formato que o frontend já espera:
// `coordinator` e `event.user` continuam a ser o nome (texto).
export function serializeProcess(p: FullProcess) {
  const { coordinator, events, ...rest } = p;
  return {
    ...rest,
    coordinator: coordinator.name,
    events: events.map((e) => ({ ...e, user: e.user.name })),
  };
}

export const generateFileNumber = () =>
  String(Math.floor(300000 + Math.random() * 99999));

export const generateSrfNumber = () =>
  `SRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 8999)}`;

export const DEFAULT_AUTHORIZATIONS = [
  { entity: "Saúde Portuária", reason: "Inspeção sanitária do navio" },
  { entity: "Alfândega", reason: "Declaração de carga e manifesto" },
  { entity: "Imigração", reason: "Controlo de tripulação" },
  { entity: "Polícia Marítima", reason: "Segurança portuária" },
  { entity: "Intransmar", reason: "Agência marítima" },
];

export const DEFAULT_MILESTONES = [
  { name: "Receção do Pedido", description: "Pedido recebido do cliente", order: 1 },
  { name: "Agendamento", description: "Escala agendada com o porto", order: 2 },
  { name: "Notificação Autoridades", description: "Comunicação às entidades portuárias", order: 3 },
  { name: "Chegada do Navio (ATA)", description: "Navio atracado no terminal", order: 4 },
  { name: "Início de Operações", description: "Operações de carga/descarga iniciadas", order: 5 },
  { name: "Fim de Operações", description: "Operações concluídas", order: 6 },
  { name: "Partida do Navio (ATD)", description: "Navio deixou o porto", order: 7 },
  { name: "Recolha de Faturas", description: "Todas as faturas recebidas", order: 8 },
  { name: "Handover Financeiro", description: "Entregue à contabilidade", order: 9 },
  { name: "Encerramento", description: "Ficheiro encerrado", order: 10 },
];

export const DEFAULT_INVOICES = [
  { entity: "PBT", description: "Port Charges — Taxas Portuárias" },
  { entity: "Terminal", description: "Taxas de Terminal — Movimentação" },
  { entity: "Rebocadores", description: "Serviço de Rebocagem" },
  { entity: "Praticagem", description: "Serviço de Praticagem" },
  { entity: "Amarradores", description: "Serviço de Amarração" },
  { entity: "Agência", description: "Taxas de Agência Marítima" },
];

// O progresso é calculado no servidor, numa só fórmula, sempre que algo muda:
// autorizações tratadas + marcos confirmados + faturas recebidas + estado fechado.
export async function recomputeProgress(
  tx: Prisma.TransactionClient,
  processId: string
) {
  const p = await tx.process.findUniqueOrThrow({
    where: { id: processId },
    select: {
      status: true,
      authorizations: { select: { status: true } },
      milestones: { select: { confirmed: true } },
      invoices: { select: { status: true } },
    },
  });

  const total =
    p.authorizations.length + p.milestones.length + p.invoices.length + 1;
  const done =
    p.authorizations.filter((a) => a.status !== "PENDING").length +
    p.milestones.filter((m) => m.confirmed).length +
    p.invoices.filter((i) => i.status === "RECEIVED").length +
    (p.status === "CLOSED" ? 1 : 0);

  await tx.process.update({
    where: { id: processId },
    data: { progress: Math.round((done / total) * 100) },
  });
}