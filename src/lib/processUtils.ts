import type { PortProcess, ProcessStatus } from "./types";

// Sem acesso a localStorage nem à API: só recebem dados e devolvem resultados.

export function getPendingCount(process: PortProcess): number {
  const pendingAuths = process.authorizations.filter(
    (a) => a.status === "PENDING"
  ).length;
  const pendingMilestones = process.milestones.filter(
    (m) => !m.confirmed
  ).length;
  const pendingInvoices = process.invoices.filter(
    (i) => i.status === "AWAITING"
  ).length;
  return pendingAuths + pendingMilestones + pendingInvoices;
}

// Crítica: aberta, com 5 ou mais pendências, ou com saída prevista em menos de 48 h
export function isCritical(process: PortProcess): boolean {
  if (process.status !== "OPEN") return false;
  const in48h = Date.now() + 48 * 60 * 60 * 1000;
  return (
    getPendingCount(process) >= 5 ||
    (!!process.etd && new Date(process.etd).getTime() < in48h)
  );
}

export function filterProcesses(
  processes: PortProcess[],
  query: string,
  status: ProcessStatus | "ALL"
): PortProcess[] {
  let result = processes;

  if (status !== "ALL") {
    result = result.filter((p) => p.status === status);
  }

  const q = query.toLowerCase().trim();
  if (q) {
    result = result.filter(
      (p) =>
        p.fileNumber.toLowerCase().includes(q) ||
        p.srfNumber.toLowerCase().includes(q) ||
        p.vesselName.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        p.port.toLowerCase().includes(q) ||
        p.coordinator.toLowerCase().includes(q)
    );
  }

  return [...result].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}