import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardView } from "../components/DashboardView";
import { getAllProcesses, getStats, seedDemoData } from "../lib/store";
import { ROUTES } from "../lib/routes";
import type { PortProcess, ProcessStats } from "../lib/types";

// Única página que ainda usa o store.ts (localStorage). É só de leitura:
// sem "Nova Operação" nem página de detalhe, porque o detalhe lê da API.
export function Demo() {
  const [processes, setProcesses] = useState<PortProcess[]>([]);
  const [stats, setStats] = useState<ProcessStats | null>(null);

  useEffect(() => {
    seedDemoData();
    setProcesses(getAllProcesses());
    setStats(getStats());
  }, []);

  if (!stats) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <DashboardView
        processes={processes}
        stats={stats}
        banner={
          <div className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-text-secondary">
            Demonstração com dados fictícios, guardados só neste navegador.{" "}
            <Link to={ROUTES.login} className="text-primary hover:underline">
              Entre na sua conta
            </Link>{" "}
            para trabalhar com as suas operações.
          </div>
        }
      />
    </div>
  );
}
