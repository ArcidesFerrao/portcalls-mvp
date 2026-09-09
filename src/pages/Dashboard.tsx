import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Anchor,
  Ship,
  FileCheck,
  FileWarning,
  AlertTriangle,
  Clock,
  ArrowRight,
  Container,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import {
  getAllProcesses,
  getStats,
  searchProcesses,
  getPendingCount,
} from "../lib/store";
import { PortProcess, ProcessStatus } from "../lib/types";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export function Dashboard() {
  const navigate = useNavigate();
  const [processes, setProcesses] = useState<PortProcess[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    awaitingArrival: 0,
    awaitingDeparture: 0,
    invoicesReceived: 0,
    invoicesAwaiting: 0,
    critical: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | "ALL">(
    "ALL",
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = searchProcesses(search, statusFilter);
    setProcesses(filtered);
  }, [search, statusFilter]);

  function loadData() {
    setProcesses(getAllProcesses());
    setStats(getStats());
  }

  const statCards = [
    {
      label: "Total Ficheiros",
      value: stats.total,
      icon: Container,
      color: "primary",
    },
    { label: "Abertos", value: stats.open, icon: FileCheck, color: "primary" },
    { label: "Fechados", value: stats.closed, icon: FileCheck, color: "muted" },
    {
      label: "Aguard. Chegada",
      value: stats.awaitingArrival,
      icon: Anchor,
      color: "warning",
    },
    {
      label: "Aguard. Partida",
      value: stats.awaitingDeparture,
      icon: Ship,
      color: "blue",
    },
    {
      label: "Faturas Pendentes",
      value: stats.invoicesAwaiting,
      icon: FileWarning,
      color: "orange",
    },
    {
      label: "Críticos",
      value: stats.critical,
      icon: AlertTriangle,
      color: "danger",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[Syne]">
            Painel de Operações
          </h1>
          <p className="text-text-secondary mt-1">
            Gestão de escalas portuárias e documentação
          </p>
        </div>
        <Button
          onClick={() => navigate("/processes/new")}
          icon={<Plus size={18} />}
        >
          Nova Operação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex flex-col gap-2">
              <div
                className={`p-2 rounded-lg w-fit ${
                  stat.color === "primary"
                    ? "bg-primary/10"
                    : stat.color === "muted"
                      ? "bg-surface-3"
                      : stat.color === "warning"
                        ? "bg-amber-500/10"
                        : stat.color === "blue"
                          ? "bg-blue-500/10"
                          : stat.color === "orange"
                            ? "bg-orange-500/10"
                            : "bg-red-500/10"
                }`}
              >
                <stat.icon
                  size={16}
                  className={
                    stat.color === "primary"
                      ? "text-primary"
                      : stat.color === "muted"
                        ? "text-text-muted"
                        : stat.color === "warning"
                          ? "text-amber-400"
                          : stat.color === "blue"
                            ? "text-blue-400"
                            : stat.color === "orange"
                              ? "text-orange-400"
                              : "text-red-400"
                  }
                />
              </div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-text-muted leading-tight">
                  {stat.label}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Pesquisar por nº ficheiro, SRF, navio, cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-border rounded-lg text-text-secondary placeholder-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ProcessStatus | "ALL")
            }
            className="px-4 py-2.5 bg-surface-2 border border-border rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          >
            <option value="ALL">Todos</option>
            <option value="OPEN">Abertos</option>
            <option value="CLOSED">Fechados</option>
          </select>
        </div>
      </div>

      {/* Process Table */}
      {processes.length === 0 ? (
        <Card className="p-12 text-center">
          <Anchor size={48} className="mx-auto text-text-muted mb-4" />
          <h3 className="text-lg font-medium text-text-secondary mb-2">
            {search || statusFilter !== "ALL"
              ? "Nenhuma operação encontrada"
              : "Sem operações registadas"}
          </h3>
          <p className="text-text-muted text-sm mb-4">
            {search || statusFilter !== "ALL"
              ? "Tente ajustar os filtros de pesquisa"
              : "Registe a sua primeira operação portuária"}
          </p>
          {!search && statusFilter === "ALL" && (
            <Button
              onClick={() => navigate("/processes/new")}
              icon={<Plus size={16} />}
            >
              Nova Operação
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                    Nº / SRF
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                    Navio
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                    Progresso
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                    Porto / Terminal
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                    ATA / ATD
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                    Coordenador
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                    Pend.
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {processes.map((process) => {
                  const pending = getPendingCount(process);
                  const isCritical =
                    process.status === "OPEN" &&
                    (pending >= 5 ||
                      (process.etd &&
                        new Date(process.etd) <
                          new Date(Date.now() + 48 * 60 * 60 * 1000)));

                  return (
                    <tr
                      key={process.id}
                      className="border-b border-border/50 hover:bg-surface-2/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/processes/${process.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-mono text-primary text-xs font-medium">
                            {process.fileNumber}
                          </p>
                          <p className="text-text-muted text-xs">
                            {process.srfNumber}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Ship
                            size={14}
                            className="text-text-muted shrink-0"
                          />
                          <span className="font-medium text-white truncate max-w-[140px]">
                            {process.vesselName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                process.progress >= 80
                                  ? "bg-primary"
                                  : process.progress >= 50
                                    ? "bg-amber-400"
                                    : "bg-orange-400"
                              }`}
                              style={{ width: `${process.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-muted w-8">
                            {process.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-text-secondary truncate max-w-[120px] block">
                          {process.client}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-text-secondary text-xs">
                            {process.port}
                          </p>
                          <p className="text-text-muted text-xs">
                            {process.terminal}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          {process.ata && (
                            <p className="text-text-secondary">
                              <span className="text-text-muted">ATA:</span>{" "}
                              {format(new Date(process.ata), "dd/MM")}
                            </p>
                          )}
                          {process.atd && (
                            <p className="text-text-secondary">
                              <span className="text-text-muted">ATD:</span>{" "}
                              {format(new Date(process.atd), "dd/MM")}
                            </p>
                          )}
                          {!process.ata && process.eta && (
                            <p className="text-amber-400">
                              <Clock size={10} className="inline mr-1" />
                              ETA: {format(new Date(process.eta), "dd/MM")}
                            </p>
                          )}
                          {!process.ata && !process.eta && (
                            <span className="text-text-muted">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-text-secondary text-xs">
                          {process.coordinator}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={process.status} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        {pending > 0 ? (
                          <span
                            className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-medium ${
                              isCritical
                                ? "bg-red-500/20 text-red-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {pending}
                          </span>
                        ) : (
                          <span className="text-text-muted text-xs">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="inline-flex items-center gap-1 text-primary hover:text-primary-light text-xs font-medium transition-colors">
                          Ver <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
