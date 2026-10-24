import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError, dateInput, h, optionalText, param, parse } from "../lib/http";
import { canInvoice, canOperate } from "../lib/permissions";
import {
  processInclude,
  recomputeProgress,
  serializeProcess,
} from "../lib/processes";

export const itemsRouter = Router();

const notFound = (what: string) => new HttpError(404, `${what} não encontrado.`);

// Regra de ouro: antes de mexer num item, confirmar que pertence à empresa
// da sessão (e a um processo não apagado). Sem isto, quem souber um id
// de outra empresa conseguia alterá-lo.

// Depois de cada alteração devolvemos a operação inteira, já com o progresso
// e a timeline atualizados: o frontend substitui o estado de uma só vez.
async function sendProcess(res: Response, processId: string) {
  const full = await prisma.process.findUniqueOrThrow({
    where: { id: processId },
    include: processInclude,
  });
  res.json(serializeProcess(full));
}

// ============ AUTORIZAÇÕES ============

const authorizationSchema = z.object({
  status: z.enum(["RECEIVED", "NOT_APPLICABLE", "PENDING"]),
});

const AUTH_LABELS = {
  RECEIVED: "Recebida",
  NOT_APPLICABLE: "Não Aplicável",
  PENDING: "Pendente",
} as const;

itemsRouter.patch(
  "/authorizations/:id",
  canOperate,
  h(async (req, res) => {
    const { organizationId, userId } = req.auth!;
    const { status } = parse(authorizationSchema, req.body);

    const existing = await prisma.authorization.findFirst({
      where: {
        id: param(req, "id"),
        organizationId,
        process: { deletedAt: null },
      },
    });
    if (!existing) throw notFound("Autorização");

    await prisma.$transaction(async (tx) => {
      await tx.authorization.update({
        where: { id: existing.id },
        data: {
          status,
          receivedAt:
            status === "RECEIVED" ? (existing.receivedAt ?? new Date()) : null,
        },
      });
      await tx.timelineEvent.create({
        data: {
          organizationId,
          processId: existing.processId,
          userId,
          action: "Autorização Atualizada",
          description: `${existing.entity}: ${AUTH_LABELS[status]}`,
        },
      });
      await recomputeProgress(tx, existing.processId);
    });

    await sendProcess(res, existing.processId);
  })
);

// ============ MARCOS ============

const milestoneSchema = z.object({
  confirmed: z.boolean(),
  date: dateInput.optional(),
});

itemsRouter.patch(
  "/milestones/:id",
  canOperate,
  h(async (req, res) => {
    const { organizationId, userId } = req.auth!;
    const { confirmed, date } = parse(milestoneSchema, req.body);

    const existing = await prisma.milestone.findFirst({
      where: {
        id: param(req, "id"),
        organizationId,
        process: { deletedAt: null },
      },
    });
    if (!existing) throw notFound("Marco");

    await prisma.$transaction(async (tx) => {
      const m = await tx.milestone.update({
        where: { id: existing.id },
        data: { confirmed, date: date ?? (confirmed ? new Date() : null) },
      });

      // ATA/ATD seguem o marco; ao desmarcar, voltam a ficar vazios
      if (m.name.includes("(ATA)")) {
        await tx.process.update({
          where: { id: m.processId },
          data: { ata: confirmed ? m.date : null },
        });
      }
      if (m.name.includes("(ATD)")) {
        await tx.process.update({
          where: { id: m.processId },
          data: { atd: confirmed ? m.date : null },
        });
      }

      await tx.timelineEvent.create({
        data: {
          organizationId,
          processId: m.processId,
          userId,
          action: confirmed ? "Marco Confirmado" : "Marco Desmarcado",
          description: m.name,
        },
      });
      await recomputeProgress(tx, m.processId);
    });

    await sendProcess(res, existing.processId);
  })
);

// ============ FATURAS ============

// Atualização parcial: o que não vier no pedido fica como está
const invoiceSchema = z.object({
  status: z.enum(["RECEIVED", "AWAITING"]).optional(),
  reference: optionalText(100).optional(),
  amount: z.preprocess(
    (v) => (v === "" ? null : v),
    z.coerce.number().nonnegative().max(1e12).nullish()
  ),
  currency: z.enum(["MZN", "USD", "EUR"]).optional(),
  dueDate: dateInput.optional(),
});

itemsRouter.patch(
  "/invoices/:id",
  canInvoice,
  h(async (req, res) => {
    const { organizationId, userId } = req.auth!;
    const { status, reference, amount, currency, dueDate } = parse(
      invoiceSchema,
      req.body
    );

    const existing = await prisma.invoice.findFirst({
      where: {
        id: param(req, "id"),
        organizationId,
        process: { deletedAt: null },
      },
    });
    if (!existing) throw notFound("Fatura");

    const nextStatus = status ?? existing.status;

    await prisma.$transaction(async (tx) => {
      // Campos undefined: o Prisma ignora-os, ficam como estavam
      await tx.invoice.update({
        where: { id: existing.id },
        data: {
          status: nextStatus,
          reference,
          amount,
          currency,
          dueDate,
          receivedAt:
            nextStatus === "RECEIVED" ? (existing.receivedAt ?? new Date()) : null,
        },
      });
      await tx.timelineEvent.create({
        data: {
          organizationId,
          processId: existing.processId,
          userId,
          action: "Fatura Atualizada",
          description: `${existing.entity} — ${
            nextStatus === "RECEIVED" ? "Recebida" : "A receber"
          }`,
        },
      });
      await recomputeProgress(tx, existing.processId);
    });

    await sendProcess(res, existing.processId);
  })
);

// ============ FICHEIROS ============

itemsRouter.delete(
  "/files/:id",
  canOperate,
  h(async (req, res) => {
    const { organizationId, userId } = req.auth!;

    const existing = await prisma.file.findFirst({
      where: {
        id: param(req, "id"),
        organizationId,
        process: { deletedAt: null },
      },
    });
    if (!existing) throw notFound("Ficheiro");

    await prisma.$transaction([
      prisma.file.delete({ where: { id: existing.id } }),
      prisma.timelineEvent.create({
        data: {
          organizationId,
          processId: existing.processId,
          userId,
          action: "Ficheiro Removido",
          description: existing.originalName,
        },
      }),
    ]);

    res.status(204).end();
  })
);