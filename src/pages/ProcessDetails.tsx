import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit3,
  Lock,
  Upload,
  Trash2,
  FileText,
  Calendar,
  Clock,
  Anchor,
  AlertTriangle,
  Ship,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Eye,
  ClipboardList,
  Receipt,
  Paperclip,
  Activity,
  Info,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Card } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Modal } from "../components/ui/Modal";
import {
  getProcessById,
  updateProcess,
  closeProcess,
  updateAuthorization,
  updateMilestone,
  updateInvoice,
  addFileToProcess,
  removeFileFromProcess,
  getPendingCount,
} from "../lib/store";
import {
  validateFile,
  sanitizeFileName,
  formatFileSize,
} from "../lib/validations";
import { PortProcess, AuthorizationStatus, InvoiceStatus } from "../lib/types";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

type TabId =
  | "general"
  | "authorizations"
  | "milestones"
  | "invoices"
  | "files"
  | "timeline";

export function ProcessDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [process, setProcess] = useState<PortProcess | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [isEditing, setIsEditing] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDeleteFileModal, setShowDeleteFileModal] = useState<string | null>(
    null,
  );
  const [fileError, setFileError] = useState("");

  // Edit form
  const [editData, setEditData] = useState({
    vesselName: "",
    imo: "",
    client: "",
    port: "",
    terminal: "",
    eta: "",
    ata: "",
    etd: "",
    atd: "",
    coordinator: "",
    observations: "",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProcess();
  }, [id]);

  function loadProcess() {
    if (!id) return;
    const p = getProcessById(id);
    if (p) {
      setProcess(p);
      setEditData({
        vesselName: p.vesselName,
        imo: p.imo,
        client: p.client,
        port: p.port,
        terminal: p.terminal,
        eta: p.eta ? p.eta.slice(0, 16) : "",
        ata: p.ata ? p.ata.slice(0, 16) : "",
        etd: p.etd ? p.etd.slice(0, 16) : "",
        atd: p.atd ? p.atd.slice(0, 16) : "",
        coordinator: p.coordinator,
        observations: p.observations || "",
      });
    }
    setLoading(false);
  }

  function handleEdit() {
    setIsEditing(true);
    setEditErrors({});
  }

  function handleSaveEdit() {
    if (!process) return;
    const newErrors: Record<string, string> = {};
    if (!editData.vesselName.trim()) newErrors.vesselName = "Obrigatório";
    if (!editData.client.trim()) newErrors.client = "Obrigatório";
    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }

    const updated = updateProcess(process.id, {
      vesselName: editData.vesselName.trim(),
      imo: editData.imo.trim(),
      client: editData.client.trim(),
      port: editData.port.trim(),
      terminal: editData.terminal.trim(),
      eta: editData.eta || undefined,
      ata: editData.ata || undefined,
      etd: editData.etd || undefined,
      atd: editData.atd || undefined,
      coordinator: editData.coordinator.trim(),
      observations: editData.observations.trim() || undefined,
    });

    if (updated) {
      setProcess(updated);
      setIsEditing(false);
    }
  }

  function handleCloseProcess() {
    if (!process) return;
    const updated = closeProcess(process.id);
    if (updated) {
      setProcess(updated);
      setShowCloseModal(false);
    }
  }

  function handleAuthChange(authId: string, status: AuthorizationStatus) {
    if (!process) return;
    const updated = updateAuthorization(process.id, authId, status);
    if (updated) setProcess(updated);
  }

  function handleMilestoneToggle(msId: string, confirmed: boolean) {
    if (!process) return;
    const updated = updateMilestone(process.id, msId, confirmed);
    if (updated) setProcess(updated);
  }

  function handleInvoiceChange(
    invId: string,
    status: InvoiceStatus,
    reference?: string,
    amount?: number,
  ) {
    if (!process) return;
    const updated = updateInvoice(process.id, invId, {
      status,
      reference,
      amount,
    });
    if (updated) setProcess(updated);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!process) return;
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const validation = validateFile(file);
      if (!validation.success) {
        setFileError(validation.errors[0].message);
        return;
      }
      addFileToProcess(process.id, {
        name: sanitizeFileName(file.name),
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      });
    });
    loadProcess();
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDeleteFile(fileId: string) {
    if (!process) return;
    removeFileFromProcess(process.id, fileId);
    loadProcess();
    setShowDeleteFileModal(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!process) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <AlertTriangle size={48} className="mx-auto text-text-muted mb-4" />
        <h2 className="text-xl font-medium text-text-secondary mb-2">
          Operação não encontrada
        </h2>
        <Button onClick={() => navigate("/")}>Voltar ao Painel</Button>
      </div>
    );
  }

  const isClosed = process.status === "CLOSED";
  const pending = getPendingCount(process);

  const tabs: {
    id: TabId;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    { id: "general", label: "Geral", icon: <Info size={16} /> },
    {
      id: "authorizations",
      label: "Autorizações",
      icon: <ClipboardList size={16} />,
      count: process.authorizations.filter((a) => a.status === "PENDING")
        .length,
    },
    {
      id: "milestones",
      label: "Marcos",
      icon: <Activity size={16} />,
      count: process.milestones.filter((m) => !m.confirmed).length,
    },
    {
      id: "invoices",
      label: "Faturas",
      icon: <Receipt size={16} />,
      count: process.invoices.filter((i) => i.status === "AWAITING").length,
    },
    {
      id: "files",
      label: "Documentos",
      icon: <Paperclip size={16} />,
      count: process.files.length,
    },
    { id: "timeline", label: "Histórico", icon: <Clock size={16} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 mt-1 rounded-lg text-text-muted hover:text-white hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                {process.fileNumber}
              </span>
              <span className="text-xs font-mono text-text-muted bg-surface-3 px-2 py-0.5 rounded">
                {process.srfNumber}
              </span>
              <StatusBadge status={process.status} />
              {pending > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  <AlertTriangle size={12} /> {pending} pendências
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold font-[Syne] flex items-center gap-2">
              <Ship size={22} className="text-primary" />
              {process.vesselName}
            </h1>
            <p className="text-text-secondary text-sm mt-0.5">
              {process.client} — {process.port}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {process.progress}%
            </p>
            <p className="text-xs text-text-muted">Progresso</p>
          </div>
          <div className="w-24 h-24 relative">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="#222"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="#1D9E75"
                strokeWidth="3"
                strokeDasharray={`${process.progress} 100`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center gap-2">
          {!isClosed && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleEdit}
                icon={<Edit3 size={16} />}
              >
                Editar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowCloseModal(true)}
                icon={<Lock size={16} />}
              >
                Encerrar
              </Button>
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "text-primary border-primary bg-primary/5"
                : "text-text-muted border-transparent hover:text-white hover:border-border-light"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-surface-3 text-text-secondary text-xs px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === "general" && (
          <GeneralTab
            process={process}
            isEditing={isEditing}
            editData={editData}
            editErrors={editErrors}
            setEditData={setEditData}
            setEditErrors={setEditErrors}
            onSave={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
          />
        )}
        {activeTab === "authorizations" && (
          <AuthorizationsTab
            process={process}
            onAuthChange={handleAuthChange}
            isClosed={isClosed}
          />
        )}
        {activeTab === "milestones" && (
          <MilestonesTab
            process={process}
            onToggle={handleMilestoneToggle}
            isClosed={isClosed}
          />
        )}
        {activeTab === "invoices" && (
          <InvoicesTab
            process={process}
            onInvoiceChange={handleInvoiceChange}
            isClosed={isClosed}
          />
        )}
        {activeTab === "files" && (
          <FilesTab
            process={process}
            fileInputRef={fileInputRef}
            fileError={fileError}
            onUpload={handleFileUpload}
            onDelete={(id) => setShowDeleteFileModal(id)}
            isClosed={isClosed}
          />
        )}
        {activeTab === "timeline" && <TimelineTab process={process} />}
      </div>

      {/* Close Modal */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Encerrar Operação"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-text-secondary">
                Tem a certeza que deseja encerrar esta operação?
              </p>
              <p className="text-xs text-text-muted mt-2">
                O ficheiro ficará apenas para consulta.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCloseModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleCloseProcess}
              icon={<Lock size={16} />}
            >
              Encerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete File Modal */}
      <Modal
        isOpen={!!showDeleteFileModal}
        onClose={() => setShowDeleteFileModal(null)}
        title="Remover Documento"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Tem a certeza que deseja remover este documento?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteFileModal(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                showDeleteFileModal && handleDeleteFile(showDeleteFileModal)
              }
              icon={<Trash2 size={16} />}
            >
              Remover
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ===== GENERAL TAB =====
function GeneralTab({
  process,
  isEditing,
  editData,
  editErrors,
  setEditData,
  setEditErrors,
  onSave,
  onCancel,
}: {
  process: PortProcess;
  isEditing: boolean;
  editData: any;
  editErrors: any;
  setEditData: any;
  setEditErrors: any;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (isEditing) {
    return (
      <Card className="p-6 space-y-5">
        <h3 className="font-semibold font-[Syne]">Editar Dados</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Navio"
            value={editData.vesselName}
            onChange={(e: any) =>
              setEditData({ ...editData, vesselName: e.target.value })
            }
            error={editErrors.vesselName}
          />
          <Input
            label="IMO"
            value={editData.imo}
            onChange={(e: any) =>
              setEditData({ ...editData, imo: e.target.value })
            }
          />
          <Input
            label="Cliente"
            value={editData.client}
            onChange={(e: any) =>
              setEditData({ ...editData, client: e.target.value })
            }
            error={editErrors.client}
          />
          <Input
            label="Coordenador"
            value={editData.coordinator}
            onChange={(e: any) =>
              setEditData({ ...editData, coordinator: e.target.value })
            }
          />
          <Input
            label="Porto"
            value={editData.port}
            onChange={(e: any) =>
              setEditData({ ...editData, port: e.target.value })
            }
          />
          <Input
            label="Terminal"
            value={editData.terminal}
            onChange={(e: any) =>
              setEditData({ ...editData, terminal: e.target.value })
            }
          />
          <Input
            label="ETA"
            type="datetime-local"
            value={editData.eta}
            onChange={(e: any) =>
              setEditData({ ...editData, eta: e.target.value })
            }
          />
          <Input
            label="ATA"
            type="datetime-local"
            value={editData.ata}
            onChange={(e: any) =>
              setEditData({ ...editData, ata: e.target.value })
            }
          />
          <Input
            label="ETD"
            type="datetime-local"
            value={editData.etd}
            onChange={(e: any) =>
              setEditData({ ...editData, etd: e.target.value })
            }
          />
          <Input
            label="ATD"
            type="datetime-local"
            value={editData.atd}
            onChange={(e: any) =>
              setEditData({ ...editData, atd: e.target.value })
            }
          />
        </div>
        <Textarea
          label="Observações"
          value={editData.observations}
          onChange={(e: any) =>
            setEditData({ ...editData, observations: e.target.value })
          }
          rows={3}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave}>
            Guardar
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </Card>
    );
  }

  const infoItems = [
    { label: "Nº Ficheiro", value: process.fileNumber },
    { label: "SRF", value: process.srfNumber },
    { label: "Navio", value: process.vesselName },
    { label: "IMO", value: process.imo || "—" },
    { label: "Cliente", value: process.client },
    { label: "Porto", value: process.port },
    { label: "Terminal", value: process.terminal || "—" },
    { label: "Coordenador", value: process.coordinator },
    {
      label: "ETA",
      value: process.eta
        ? format(new Date(process.eta), "d MMM yyyy, HH:mm", { locale: pt })
        : "—",
    },
    {
      label: "ATA",
      value: process.ata
        ? format(new Date(process.ata), "d MMM yyyy, HH:mm", { locale: pt })
        : "—",
    },
    {
      label: "ETD",
      value: process.etd
        ? format(new Date(process.etd), "d MMM yyyy, HH:mm", { locale: pt })
        : "—",
    },
    {
      label: "ATD",
      value: process.atd
        ? format(new Date(process.atd), "d MMM yyyy, HH:mm", { locale: pt })
        : "—",
    },
    {
      label: "Criado",
      value: format(new Date(process.createdAt), "d MMM yyyy, HH:mm", {
        locale: pt,
      }),
    },
    {
      label: "Atualizado",
      value: format(new Date(process.updatedAt), "d MMM yyyy, HH:mm", {
        locale: pt,
      }),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="font-semibold font-[Syne] mb-4">Dados Gerais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {infoItems.map((item) => (
            <div key={item.label}>
              <p className="text-xs text-text-muted">{item.label}</p>
              <p className="text-sm font-medium">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>
      {process.observations && (
        <Card className="p-6">
          <h3 className="font-semibold font-[Syne] mb-2">Observações</h3>
          <p className="text-sm text-text-secondary">{process.observations}</p>
        </Card>
      )}
    </div>
  );
}

// ===== AUTHORIZATIONS TAB =====
function AuthorizationsTab({
  process,
  onAuthChange,
  isClosed,
}: {
  process: PortProcess;
  onAuthChange: (id: string, status: AuthorizationStatus) => void;
  isClosed: boolean;
}) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold font-[Syne] mb-4">
        Autorizações das Entidades
      </h3>
      <div className="space-y-3">
        {process.authorizations.map((auth) => (
          <div
            key={auth.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-2 border border-border rounded-lg"
          >
            <div className="flex-1">
              <p className="font-medium text-sm">{auth.entity}</p>
              <p className="text-xs text-text-muted">{auth.reason}</p>
              {auth.receivedAt && (
                <p className="text-xs text-text-muted mt-1">
                  Recebido:{" "}
                  {format(new Date(auth.receivedAt), "d MMM yyyy", {
                    locale: pt,
                  })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => !isClosed && onAuthChange(auth.id, "RECEIVED")}
                disabled={isClosed}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  auth.status === "RECEIVED"
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-surface-3 text-text-muted hover:text-primary hover:bg-primary/10"
                } ${isClosed ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <CheckCircle2 size={14} /> Recebido
              </button>
              <button
                onClick={() =>
                  !isClosed && onAuthChange(auth.id, "NOT_APPLICABLE")
                }
                disabled={isClosed}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  auth.status === "NOT_APPLICABLE"
                    ? "bg-text-muted/20 text-text-secondary border border-border"
                    : "bg-surface-3 text-text-muted hover:text-text-secondary hover:bg-surface-3"
                } ${isClosed ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <MinusCircle size={14} /> N/A
              </button>
              {auth.status === "PENDING" && (
                <span className="flex items-center gap-1 text-xs text-amber-400">
                  <XCircle size={14} /> Pendente
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ===== MILESTONES TAB =====
function MilestonesTab({
  process,
  onToggle,
  isClosed,
}: {
  process: PortProcess;
  onToggle: (id: string, confirmed: boolean) => void;
  isClosed: boolean;
}) {
  const sortedMilestones = [...process.milestones].sort(
    (a, b) => a.order - b.order,
  );

  return (
    <Card className="p-6">
      <h3 className="font-semibold font-[Syne] mb-4">Marcos da Escala</h3>
      <div className="space-y-2">
        {sortedMilestones.map((ms, idx) => (
          <div
            key={ms.id}
            className="flex items-center gap-4 p-4 bg-surface-2 border border-border rounded-lg"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                ms.confirmed
                  ? "bg-primary/20 text-primary"
                  : "bg-surface-3 text-text-muted"
              }`}
            >
              {ms.confirmed ? (
                <CheckCircle2 size={16} />
              ) : (
                <span className="text-xs font-medium">{idx + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium text-sm ${ms.confirmed ? "text-white" : "text-text-secondary"}`}
              >
                {ms.name}
              </p>
              {ms.description && (
                <p className="text-xs text-text-muted">{ms.description}</p>
              )}
              {ms.date && (
                <p className="text-xs text-text-muted mt-0.5">
                  {format(new Date(ms.date), "d MMM yyyy, HH:mm", {
                    locale: pt,
                  })}
                </p>
              )}
            </div>
            <button
              onClick={() => !isClosed && onToggle(ms.id, !ms.confirmed)}
              disabled={isClosed}
              className={`shrink-0 w-10 h-6 rounded-full transition-colors relative ${
                ms.confirmed ? "bg-primary" : "bg-surface-3"
              } ${isClosed ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  ms.confirmed ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ===== INVOICES TAB =====
function InvoicesTab({
  process,
  onInvoiceChange,
  isClosed,
}: {
  process: PortProcess;
  onInvoiceChange: (
    id: string,
    status: InvoiceStatus,
    reference?: string,
    amount?: number,
  ) => void;
  isClosed: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRef, setEditRef] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const received = process.invoices.filter((i) => i.status === "RECEIVED");
  const awaiting = process.invoices.filter((i) => i.status === "AWAITING");

  function handleMarkReceived(inv: any) {
    onInvoiceChange(
      inv.id,
      "RECEIVED",
      editRef || undefined,
      editAmount ? parseFloat(editAmount) : undefined,
    );
    setEditingId(null);
    setEditRef("");
    setEditAmount("");
  }

  return (
    <div className="space-y-4">
      {/* Missing Invoices */}
      {awaiting.length > 0 && (
        <Card className="p-6 border-amber-500/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-400" />
            <h3 className="font-semibold font-[Syne] text-amber-400">
              Faturas em Falta ({awaiting.length})
            </h3>
          </div>
          <div className="space-y-2">
            {awaiting.map((inv) => (
              <div
                key={inv.id}
                className="p-4 bg-surface-2 border border-border rounded-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{inv.entity}</p>
                    <p className="text-xs text-text-muted">{inv.description}</p>
                  </div>
                  {editingId === inv.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Ref."
                        value={editRef}
                        onChange={(e) => setEditRef(e.target.value)}
                        className="w-24 px-2 py-1 bg-surface border border-border rounded text-xs text-text-secondary"
                      />
                      <input
                        type="number"
                        placeholder="Valor"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-24 px-2 py-1 bg-surface border border-border rounded text-xs text-text-secondary"
                      />
                      <Button size="sm" onClick={() => handleMarkReceived(inv)}>
                        Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingId(inv.id);
                        setEditRef(inv.reference || "");
                        setEditAmount(inv.amount?.toString() || "");
                      }}
                      disabled={isClosed}
                    >
                      Marcar Recebida
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Received Invoices */}
      {received.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={18} className="text-primary" />
            <h3 className="font-semibold font-[Syne]">
              Faturas Recebidas ({received.length})
            </h3>
          </div>
          <div className="space-y-2">
            {received.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-4 bg-surface-2 border border-border rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{inv.entity}</p>
                  <p className="text-xs text-text-muted">{inv.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                    {inv.reference && <span>Ref: {inv.reference}</span>}
                    {inv.amount && <span>€{inv.amount.toLocaleString()}</span>}
                    {inv.receivedAt && (
                      <span>
                        {format(new Date(inv.receivedAt), "d MMM yyyy", {
                          locale: pt,
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                  Recebida
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ===== FILES TAB =====
function FilesTab({
  process,
  fileInputRef,
  fileError,
  onUpload,
  onDelete,
  isClosed,
}: {
  process: PortProcess;
  fileInputRef: React.RefObject<HTMLInputElement>;
  fileError: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (id: string) => void;
  isClosed: boolean;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold font-[Syne]">
          Documentos ({process.files.length})
        </h3>
        {!isClosed && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload size={16} />}
          >
            Adicionar
          </Button>
        )}
      </div>

      {fileError && (
        <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {fileError}
        </div>
      )}

      {process.files.length === 0 ? (
        <div className="text-center py-8">
          <FileText size={36} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-secondary text-sm">
            Sem documentos associados
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {process.files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-surface-2 border border-border rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={20} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatFileSize(file.size)} —{" "}
                    {format(new Date(file.createdAt), "d MMM yyyy", {
                      locale: pt,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Ver"
                >
                  <Eye size={16} />
                </button>
                {!isClosed && (
                  <button
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remover"
                    onClick={() => onDelete(file.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt,.csv"
        onChange={onUpload}
        className="hidden"
      />
    </Card>
  );
}

// ===== TIMELINE TAB =====
function TimelineTab({ process }: { process: PortProcess }) {
  const sortedEvents = [...process.events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <Card className="p-6">
      <h3 className="font-semibold font-[Syne] mb-4">Histórico de Eventos</h3>
      {sortedEvents.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-8">
          Sem eventos registados
        </p>
      ) : (
        <div className="space-y-4">
          {sortedEvents.map((event, idx) => (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full ${idx === 0 ? "bg-primary" : "bg-border"}`}
                />
                {idx < sortedEvents.length - 1 && (
                  <div className="w-px flex-1 bg-border mt-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="text-sm font-medium">{event.action}</p>
                <p className="text-xs text-text-muted">{event.description}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                  <span>
                    {format(new Date(event.timestamp), "d MMM yyyy, HH:mm", {
                      locale: pt,
                    })}
                  </span>
                  <span>•</span>
                  <span>{event.user}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
