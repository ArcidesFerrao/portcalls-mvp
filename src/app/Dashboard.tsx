import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardView } from "../components/DashboardView";
import { loadProcesses, loadStats } from "../lib/data";
import { ROUTES } from "../lib/routes";
import type { PortProcess, ProcessStats } from "../lib/types";

const EMPTY_STATS: ProcessStats = {
  total: 0,
  open: 0,
  closed: 0,
  awaitingArrival: 0,
  awaitingDeparture: 0,
  invoicesReceived: 0,
  invoicesAwaiting: 0,
  critical: 0,
};

export function Dashboard() {
  const navigate = useNavigate();
  const [processes, setProcesses] = useState<PortProcess[]>([]);
  const [stats, setStats] = useState<ProcessStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, s] = await Promise.all([loadProcesses(), loadStats()]);
      setProcesses(list);
      setStats(s);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as operações.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardView
      processes={processes}
      stats={stats}
      loading={loading}
      error={error}
      onRetry={load}
      onOpenProcess={(id) => navigate(ROUTES.process(id))}
      onNewProcess={() => navigate(ROUTES.newProcess)}
    />
  );
}
