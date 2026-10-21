import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError, dateInput, h, optionalText, param, parse } from "../lib/http";
import { canOperate } from "../lib/permissions";
import {
  DEFAULT_AUTHORIZATIONS,
  DEFAULT_INVOICES,
  DEFAULT_MILESTONES,
  generateFileNumber,
  generateSrfNumber,
  processInclude,
  serializeProcess,
} from "../lib/processes";

export const processesRouter = Router();

const notFound = () => new HttpError(404, "Operação não encontrada.");

// ============ LISTAR / OBTER ============

processesRouter.get(
  "/processes",
  h(async (req, res) => {
    const { organizationId } = req.auth!;
    const processes = await prisma.process.findMany({
      where: { organizationId, deletedAt: null },
      include: processInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(processes.map(serializeProcess));
  })
);

processesRouter.get(
  "/processes/:id",
  h(async (req, res) => {
    const { organizationId } = req.auth!;
    const found = await prisma.process.findFirst({
      where: { id: param(req, "id"), organizationId, deletedAt: null },
      include: processInclude,
    });
    if (!found) throw notFound();
    res.json(serializeProcess(found));
  })
);

// ============ CRIAR ============

const createSchema = z.object({
  fileNumber: optionalText(50),
  srfNumber: optionalText(50),
  vesselName: z.string().trim().min(1).max(120),
  imo: optionalText(20),
  client: z.string().trim().min(1).max(120),
  port: z.string().trim().min(1).max(120),
  terminal: optionalText(120),
  eta: dateInput.optional(),
  etd: dateInput.optional(),
  observations: optionalText(2000),
});

processesRouter.post(
  "/processes",
  canOperate,
  h(async (req, res) => {
    const { organizationId, userId } = req.auth!;
    const body = parse(createSchema, req.body);

    // Tudo ou nada: se algo falhar, não fica um processo a meio
    const id = await prisma.$transaction(async (tx) => {
      const created = await tx.process.create({
        data: {
          organizationId,
          coordinatorId: userId,
          fileNumber: body.fileNumber ?? generateFileNumber(),
          srfNumber: body.srfNumber ?? generateSrfNumber(),
          vesselName: body.vesselName,
          imo: body.imo,
          client: body.client,
          port: body.port,
          terminal: body.terminal,
          eta: body.eta ?? null,
          etd: body.etd ?? null,
          observations: body.observations,
        },
      });

      await tx.authorization.createMany({
        data: DEFAULT_AUTHORIZATIONS.map((a) => ({
          ...a,
          organizationId,
          processId: created.id,
        })),
      });
      await tx.milestone.createMany({
        data: DEFAULT_MILESTONES.map((m) => ({
          ...m,
          organizationId,
          processId: created.id,
        })),
      });
      await tx.invoice.createMany({
        data: DEFAULT_INVOICES.map((i) => ({
          ...i,
          organizationId,
          processId: created.id,
        })),
      });
      await tx.timelineEvent.create({
        data: {
          organizationId,
          processId: created.id,
          userId,
          action: "Ficheiro Criado",
          description: `Operação registada para ${body.vesselName}`,
        },
      });

      return created.id;
    });

    const full = await prisma.process.findUniqueOrThrow({
      where: { id },
      include: processInclude,
    });
    res.status(201).json(serializeProcess(full));
  })
);

// ============ ATUALIZAR ============

// Lista fechada de campos: o cliente nunca consegue alterar
// organizationId, status, closedAt, etc. por esta rota.
const updateSchema = z
  .object({
    vesselName: z.string().trim().min(1).max(120),
    imo: optionalText(20),
    client: z.string().trim().min(1).max(120),
    port: z.string().trim().min(1).max(120),
    terminal: optionalText(120),
    eta: dateInput,
    ata: dateInput,
    etd: dateInput,
    atd: dateInput,
    observations: optionalText(2000),
    progress: z.number().int().min(0).max(100),
  })
  .partial();

processesRouter.patch(
  "/processes/:id",
  canOperate,
  h(async (req, res) => {
    const { organizationId } = req.auth!;
    const data = parse(updateSchema, req.body);

    const { count } = await prisma.process.updateMany({
      where: { id: param(req, "id"), organizationId, deletedAt: null },
      data,
    });
    if (count === 0) throw notFound();

    const full = await prisma.process.findUniqueOrThrow({
      where: { id: param(req, "id") },
      include: processInclude,
    });
    res.json(serializeProcess(full));
  })
);

// ============ ENCERRAR ============

processesRouter.post(
  "/processes/:id/close",
  canOperate,
  h(async (req, res) => {
    const { organizationId, userId } = req.auth!;
    const id = param(req, "id");

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.process.updateMany({
        where: { id, organizationId, deletedAt: null, status: "OPEN" },
        data: { status: "CLOSED", closedAt: new Date(), progress: 100 },
      });
      if (count === 0) {
        throw new HttpError(404, "Operação não encontrada ou já encerrada.");
      }
      await tx.timelineEvent.create({
        data: {
          organizationId,
          processId: id,
          userId,
          action: "Ficheiro Encerrado",
          description: "Operação encerrada",
        },
      });
    });

    const full = await prisma.process.findUniqueOrThrow({
      where: { id },
      include: processInclude,
    });
    res.json(serializeProcess(full));
  })
);

// ============ FICHEIROS (registo) ============

const fileSchema = z.object({
  name: z.string().trim().min(1).max(255),
  originalName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(150),
  size: z
    .number()
    .int()
    .nonnegative()
    .max(10 * 1024 * 1024),
  url: z.string().min(1).max(2000),
  storageKey: z.string().min(1).max(500),
  checksum: optionalText(128),
  // aceita "Local"/"SharePoint" (formato antigo) e "LOCAL"/"SHAREPOINT"
  storageMode: z
    .preprocess(
      (v) => (typeof v === "string" ? v.toUpperCase() : v),
      z.enum(["LOCAL", "SHAREPOINT"])
    )
    .default("LOCAL"),
  sharepointDriveId: optionalText(200),
  sharepointItemId: optionalText(200),
  sharepointWebUrl: optionalText(2000),
});

processesRouter.post(
  "/processes/:id/files",
  canOperate,
  h(async (req, res) => {
    const { organizationId, userId } = req.auth!;
    const body = parse(fileSchema, req.body);

    const owner = await prisma.process.findFirst({
      where: { id: param(req, "id"), organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!owner) throw notFound();

    const [file] = await prisma.$transaction([
      prisma.file.create({
        data: { ...body, organizationId, processId: owner.id },
      }),
      prisma.timelineEvent.create({
        data: {
          organizationId,
          processId: owner.id,
          userId,
          action: "Ficheiro Anexado",
          description: body.originalName,
        },
      }),
    ]);

    res.status(201).json(file);
  })
);