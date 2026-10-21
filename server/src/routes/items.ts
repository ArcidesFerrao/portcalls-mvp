import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError, dateInput, h, optionalText, param, parse } from "../lib/http";
import { canInvoice, canOperate } from "../lib/permissions";

export const itemsRouter = Router();

const notFound = (what: string) => new HttpError(404, `${what} não encontrado.`);

// Regra de ouro: antes de mexer num item, confirmar que pertence à empresa
// da sessão (e a um processo não apagado). Sem isto, quem souber um id
// de outra empresa conseguia alterá-lo.

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

    const [updated] = await prisma.$transaction([
      prisma.authorization.update({
        where: { id: existing.id },
        data: {
          status,
          receivedAt: status === "RECEIVED" ? new Date() : null,
        },
      }),
      prisma.timelineEvent.create({
        data: {
          organizationId,
          processId: existing.processId,
          userId,
          action: "Autorização Atualizada",
          description: `${existing.entity}: ${AUTH_LABELS[status]}`,
        },
      }),
    ]);

    res.json(updated);
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

    const milestone = await prisma.$transaction(async (tx) => {
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

      return m;
    });

    res.json(milestone);
  })
);

// ============ FATURAS ============

const invoiceSchema = z.object({
  status: z.enum(["RECEIVED", "AWAITING"]),
  reference: optionalText(100),
  amount: z.preprocess(
    (v) => (v === "" ? null : v),
    z.coerce.number().nonnegative().max(1e12).nullish()
  ),
  currency: z.enum(["MZN", "USD", "EUR"]).optional(),
});

itemsRouter.patch(
  "/invoices/:id",
  canInvoice,
  h(async (req, res) => {
    const { organizationId, userId } = req.auth!;
    const { status, reference, amount, currency } = parse(
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

    const [updated] = await prisma.$transaction([
      prisma.invoice.update({
        where: { id: existing.id },
        data: {
          status,
          reference,
          amount: amount ?? null,
          ...(currency ? { currency } : {}),
          receivedAt: status === "RECEIVED" ? new Date() : null,
        },
      }),
      prisma.timelineEvent.create({
        data: {
          organizationId,
          processId: existing.processId,
          userId,
          action: "Fatura Atualizada",
          description: `${existing.entity} — ${
            status === "RECEIVED" ? "Recebida" : "A receber"
          }`,
        },
      }),
    ]);

    res.json(updated);
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