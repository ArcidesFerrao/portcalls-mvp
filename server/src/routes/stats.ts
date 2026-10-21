import { Router } from "express";
import { prisma } from "../lib/prisma";
import { h } from "../lib/http";

export const statsRouter = Router();

statsRouter.get(
  "/stats",
  h(async (req, res) => {
    const { organizationId } = req.auth!;
    const base = { organizationId, deletedAt: null };
    const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const [
      total,
      open,
      closed,
      awaitingArrival,
      awaitingDeparture,
      invoicesReceived,
      invoicesAwaiting,
      openProcesses,
    ] = await Promise.all([
      prisma.process.count({ where: base }),
      prisma.process.count({ where: { ...base, status: "OPEN" } }),
      prisma.process.count({ where: { ...base, status: "CLOSED" } }),
      prisma.process.count({
        where: { ...base, status: "OPEN", ata: null },
      }),
      prisma.process.count({
        where: { ...base, status: "OPEN", ata: { not: null }, atd: null },
      }),
      prisma.invoice.count({
        where: {
          organizationId,
          status: "RECEIVED",
          process: { deletedAt: null },
        },
      }),
      prisma.invoice.count({
        where: {
          organizationId,
          status: "AWAITING",
          process: { deletedAt: null },
        },
      }),
      prisma.process.findMany({
        where: { ...base, status: "OPEN" },
        select: {
          etd: true,
          authorizations: { select: { status: true } },
          milestones: { select: { confirmed: true } },
          invoices: { select: { status: true } },
        },
      }),
    ]);

    // Crítica: 5 ou mais pendências, ou saída prevista em menos de 48 h
    let critical = 0;
    for (const p of openProcesses) {
      const pending =
        p.authorizations.filter((a) => a.status === "PENDING").length +
        p.milestones.filter((m) => !m.confirmed).length +
        p.invoices.filter((i) => i.status === "AWAITING").length;

      if (pending >= 5 || (p.etd && p.etd < in48h)) critical++;
    }

    res.json({
      total,
      open,
      closed,
      awaitingArrival,
      awaitingDeparture,
      invoicesReceived,
      invoicesAwaiting,
      critical,
    });
  })
);