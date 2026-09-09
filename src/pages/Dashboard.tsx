import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FolderOpen, FolderCheck, BarChart3, Filter } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/StatusBadge';
import { getAllProcesses, getStats, searchProcesses } from '../lib/store';
import { Process, ProcessStatus } from '../lib/types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export function Dashboard() {
  const navigate = useNavigate();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | 'ALL'>('ALL');

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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[Syne]">Dashboard</h1>
          <p className="text-text-secondary mt-1">Gestão de processos e documentos</p>
        </div>
        <Button
          onClick={() => navigate('/processes/new')}
          icon={<Plus size={18} />}
        >
          Novo Processo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <BarChart3 size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-text-secondary">Total de Processos</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <FolderOpen size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.open}</p>
              <p className="text-sm text-text-secondary">Processos Abertos</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-surface-3">
              <FolderCheck size={22} className="text-text-muted" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.closed}</p>
              <p className="text-sm text-text-secondary">Processos Fechados</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Pesquisar por referência ou título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-border rounded-lg text-white placeholder-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProcessStatus | 'ALL')}
            className="pl-9 pr-8 py-2.5 bg-surface-2 border border-border rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          >
            <option value="ALL">Todos os estados</option>
            <option value="OPEN">Abertos</option>
            <option value="CLOSED">Fechados</option>
          </select>
        </div>
      </div>

      {/* Process List */}
      {processes.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen size={48} className="mx-auto text-text-muted mb-4" />
          <h3 className="text-lg font-medium text-text-secondary mb-2">
            {search || statusFilter !== 'ALL' ? 'Nenhum processo encontrado' : 'Sem processos'}
          </h3>
          <p className="text-text-muted text-sm mb-4">
            {search || statusFilter !== 'ALL'
              ? 'Tente ajustar os filtros de pesquisa'
              : 'Crie o seu primeiro processo para começar'}
          </p>
          {!search && statusFilter === 'ALL' && (
            <Button onClick={() => navigate('/processes/new')} icon={<Plus size={16} />}>
              Criar Processo
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {processes.map((process) => (
            <Card
              key={process.id}
              hover
              onClick={() => navigate(`/processes/${process.id}`)}
              className="p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {process.reference}
                    </span>
                    <StatusBadge status={process.status} size="sm" />
                  </div>
                  <h3 className="font-medium text-white truncate">{process.title}</h3>
                  {process.description && (
                    <p className="text-sm text-text-muted truncate mt-0.5">{process.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-text-muted shrink-0">
                  {process.files.length > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {process.files.length}
                    </span>
                  )}
                  <span>{format(new Date(process.createdAt), "d MMM yyyy", { locale: pt })}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
