import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit3,
  Lock,
  Upload,
  Trash2,
  FileText,
  Clock,
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
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Card } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Modal } from "../components/ui/Modal";
import {
  loadProcess as fetchProcess,
  updateProcess,
  closeProcess,
  updateAuthorization,
  updateMilestone,
  updateInvoice,
  addFileToProcess,
  addSharePointFileToProcess,
  removeFileFromProcess,
} from "../lib/data";
import { ApiError } from "../lib/api";
import { getPendingCount } from "../lib/processUtils";
import { ROUTES } from "../lib/routes";
import {
  validateFile,
  sanitizeFileName,
  formatFileSize,
} from "../lib/validations";
import type {
  PortProcess,
  AuthorizationStatus,
  InvoiceStatus,
} from "../lib/types";
import { isSharePointConfigured } from "../lib/config";
import {
  uploadFile as uploadToSharePoint,
  deleteFile as deleteFromSharePoint,
} from "../lib/sharepoint";

type TabId =
  | "general"
  | "authorizations"
  | "milestones"
  | "invoices"
  | "files"
  | "timeline";

type Currency = "MZN" | "USD" | "EUR";

interface EditData {
  vesselName: string;
  imo: string;
  client: string;
  port: string;
  terminal: string;
  eta: string;
  ata: string;
  etd: string;
  atd: string;
  observations: string;
}

// ---- Datas ----
// O servidor guarda instantes absolutos (ISO, em UTC). Os campos
// datetime-local trabalham na hora local e não têm fuso horário.

function toInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

// "" limpa o campo (null); o servidor ignora o que não for enviado
function toIsoOrNull(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toEditData(p: PortProcess): EditData {
  return {
    vesselName: p.vesselName,
    imo: p.imo ?? "",
    client: p.client,
    port: p.port,
    terminal: p.terminal ?? "",
    eta: toInputValue(p.eta),
    ata: toInputValue(p.ata),
    etd: toInputValue(p.etd),
    atd: toInputValue(p.atd),
    observations: p.observations ?? "",
  };
}

// A moeda vem do servidor em cada fatura. Se o tipo Invoice ainda não tiver
// o campo `currency`, acrescenta-o lá e podes remover este cast.
const currencyOf = (invoice: object): Currency =>
  (invoice as { currency?: Currency }).currency ?? "USD";

const EMPTY_EDIT: EditData = {
  vesselName: "",
  imo: "",
  client: "",
  port: "",
  terminal: "",
  eta: "",
  ata: "",
  etd: "",
  atd: "",
  observations: "",
};

export function ProcessDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [process, setProcess] = useState<PortProcess | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{
    message: string;
    notFound: boolean;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [isEditing, setIsEditing] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDeleteFileModal, setShowDeleteFileModal] = useState<string | null>(
    null,
  );
  const [fileError, setFileError] = useState("");

  const [editData, setEditData] = useState<EditData>(EMPTY_EDIT);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) {
      setLoadError({ message: "Operação não encontrada.", notFound: true });
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetchProcess(id)
      .then((p) => {
        if (cancelled) return;
        setProcess(p);
        setEditData(toEditData(p));
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError({
          message:
            err instanceof Error
              ? err.message
              : "Não foi possível carregar a operação.",
          notFound: err instanceof ApiError && err.status === 404,
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  // Executa uma ação contra a API: impede cliques duplos, mostra o erro
  // e, se a ação devolver a operação atualizada, substitui o estado.
  async function run(
    action: () => Promise<PortProcess | void>,
  ): Promise<boolean> {
    if (busy) return false;
    setBusy(true);
    setActionError("");
    try {
      const result = await action();
      if (result) setProcess(result);
      return true;
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Não foi possível concluir a ação.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  function handleEdit() {
    if (!process) return;
    setEditData(toEditData(process));
    setEditErrors({});
    setIsEditing(true);
  }

  async function handleSaveEdit() {
    if (!process) return;
    const newErrors: Record<string, string> = {};
    if (!editData.vesselName.trim()) newErrors.vesselName = "Obrigatório";
    if (!editData.client.trim()) newErrors.client = "Obrigatório";
    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }

    const ok = await run(() =>
      updateProcess(process.id, {
        vesselName: editData.vesselName.trim(),
        imo: editData.imo.trim(),
        client: editData.client.trim(),
        port: editData.port.trim(),
        terminal: editData.terminal.trim(),
        eta: toIsoOrNull(editData.eta),
        ata: toIsoOrNull(editData.ata),
        etd: toIsoOrNull(editData.etd),
        atd: toIsoOrNull(editData.atd),
        observations: editData.observations.trim(),
      }),
    );
    if (ok) setIsEditing(false);
  }

  async function handleCloseProcess() {
    if (!process) return;
    const ok = await run(() => closeProcess(process.id));
    if (ok) setShowCloseModal(false);
  }

  function handleAuthChange(authId: string, status: AuthorizationStatus) {
    if (!process) return;
    run(() => updateAuthorization(process.id, authId, status));
  }

  function handleMilestoneToggle(msId: string, confirmed: boolean) {
    if (!process) return;
    run(() => updateMilestone(process.id, msId, confirmed));
  }

  function handleInvoiceChange(
    invId: string,
    status: InvoiceStatus,
    reference?: string,
    amount?: number,
    currency?: Currency,
  ) {
    if (!process) return;
    run(() =>
      updateInvoice(process.id, invId, { status, reference, amount, currency }),
    );
  }

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    if (!process) return;
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;

    const useSharePoint = isSharePointConfigured();
    const errors: string[] = [];

    await run(async () => {
      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.success) {
          errors.push(`${file.name}: ${validation.errors[0].message}`);
          continue;
        }

        try {
          if (useSharePoint) {
            const spFile = await uploadToSharePoint(file, process.id);
            await addSharePointFileToProcess(process.id, {
              name: spFile.name,
              originalName: spFile.originalName,
              mimeType: spFile.mimeType,
              size: spFile.size,
              driveId: spFile.driveId,
              itemId: spFile.itemId,
              webUrl: spFile.webUrl,
            });
          } else {
            // Sem SharePoint só se regista o ficheiro, o conteúdo não é guardado
            await addFileToProcess(process.id, {
              name: sanitizeFileName(file.name),
              originalName: file.name,
              mimeType: file.type,
              size: file.size,
            });
          }
        } catch (error) {
          errors.push(
            `${file.name}: ${
              error instanceof Error ? error.message : "falha no envio"
            }`,
          );
        }
      }
      return fetchProcess(process.id);
    });

    setFileError(errors.join(" "));
  }

  async function handleDeleteFile(fileId: string) {
    if (!process) return;
    const file = process.files.find((f) => f.id === fileId);
    setShowDeleteFileModal(null);
    if (!file) return;

    setFileError("");
    await run(async () => {
      // Se o ficheiro está no SharePoint, apaga-se lá primeiro
      if (file.storageMode === "SharePoint" && file.sharepointItemId) {
        await deleteFromSharePoint(file.sharepointItemId);
      }
      await removeFileFromProcess(process.id, fileId);
      return fetchProcess(process.id);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError || !process) {
    const notFound = loadError?.notFound ?? true;
    return (
      <div className="text-center py-16 animate-fade-in">
        <AlertTriangle size={48} className="mx-auto text-text-muted mb-4" />
        <h2 className="text-xl font-medium text-text-secondary mb-2">
          {notFound ? "Operação não encontrada" : "Não foi possível carregar"}
        </h2>
        {!notFound && loadError && (
          <p role="alert" className="text-sm text-red-400 mb-4">
            {loadError.message}
          </p>
        )}
        <div className="flex justify-center gap-3">
          {!notFound && (
            <Button onClick={() => setReloadKey((k) => k + 1)}>
              Tentar novamente
            </Button>
          )}
          <Button
            variant={notFound ? "primary" : "ghost"}
            onClick={() => navigate(ROUTES.dashboard)}
          >
            Voltar ao Painel
          </Button>
        </div>
      </div>
    );
  }

  const isClosed = process.status === "CLOSED";
  const locked = isClosed || busy; // desativa os controlos durante um pedido
  const pending = getPendingCount(process);

  const tabs: {
    id: TabId;
    label: string;
    icon: ReactNode;
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
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(ROUTES.dashboard)}
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

        {/* Progresso */}
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

      {/* Ações */}
      {!isEditing && !isClosed && (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEdit}
            icon={<Edit3 size={16} />}
            disabled={busy}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowCloseModal(true)}
            icon={<Lock size={16} />}
            disabled={busy}
          >
            Encerrar
          </Button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400"
        >
          {actionError}
        </div>
      )}

      {/* Separadores */}
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

      {/* Conteúdo */}
      <div className="animate-fade-in">
        {activeTab === "general" && (
          <GeneralTab
            process={process}
            isEditing={isEditing}
            saving={busy}
            editData={editData}
            editErrors={editErrors}
            setEditData={setEditData}
            onSave={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
          />
        )}
        {activeTab === "authorizations" && (
          <AuthorizationsTab
            process={process}
            onAuthChange={handleAuthChange}
            locked={locked}
          />
        )}
        {activeTab === "milestones" && (
          <MilestonesTab
            process={process}
            onToggle={handleMilestoneToggle}
            locked={locked}
          />
        )}
        {activeTab === "invoices" && (
          <InvoicesTab
            process={process}
            onInvoiceChange={handleInvoiceChange}
            locked={locked}
          />
        )}
        {activeTab === "files" && (
          <FilesTab
            process={process}
            fileError={fileError}
            onAdd={() => fileInputRef.current?.click()}
            onDelete={(fileId) => setShowDeleteFileModal(fileId)}
            isClosed={isClosed}
            busy={busy}
          />
        )}
        {activeTab === "timeline" && <TimelineTab process={process} />}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt,.csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Modal: encerrar */}
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
              disabled={busy}
            >
              Encerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: remover documento */}
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
              disabled={busy}
            >
              Remover
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ===== GERAL =====
const EDIT_FIELDS: { key: keyof EditData; label: string; type?: string }[] = [
  { key: "vesselName", label: "Navio" },
  { key: "imo", label: "IMO" },
  { key: "client", label: "Cliente" },
  { key: "port", label: "Porto" },
  { key: "terminal", label: "Terminal" },
  { key: "eta", label: "ETA", type: "datetime-local" },
  { key: "ata", label: "ATA", type: "datetime-local" },
  { key: "etd", label: "ETD", type: "datetime-local" },
  { key: "atd", label: "ATD", type: "datetime-local" },
];

function GeneralTab({
  process,
  isEditing,
  saving,
  editData,
  editErrors,
  setEditData,
  onSave,
  onCancel,
}: {
  process: PortProcess;
  isEditing: boolean;
  saving: boolean;
  editData: EditData;
  editErrors: Record<string, string>;
  setEditData: (data: EditData) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (isEditing) {
    return (
      <Card className="p-6 space-y-5">
        <h3 className="font-semibold font-[Syne]">Editar Dados</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EDIT_FIELDS.map(({ key, label, type }) => (
            <Input
              key={key}
              label={label}
              type={type}
              value={editData[key]}
              onChange={(e) =>
                setEditData({ ...editData, [key]: e.target.value })
              }
              error={editErrors[key]}
            />
          ))}
        </div>
        <Textarea
          label="Observações"
          value={editData.observations}
          onChange={(e) =>
            setEditData({ ...editData, observations: e.target.value })
          }
          rows={3}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? "A guardar..." : "Guardar"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </Button>
        </div>
      </Card>
    );
  }

  const fmt = (iso: string | null) =>
    iso ? format(new Date(iso), "d MMM yyyy, HH:mm", { locale: pt }) : "—";

  const infoItems = [
    { label: "Nº Ficheiro", value: process.fileNumber },
    { label: "SRF", value: process.srfNumber },
    { label: "Navio", value: process.vesselName },
    { label: "IMO", value: process.imo || "—" },
    { label: "Cliente", value: process.client },
    { label: "Porto", value: process.port },
    { label: "Terminal", value: process.terminal || "—" },
    { label: "Coordenador", value: process.coordinator },
    { label: "ETA", value: fmt(process.eta) },
    { label: "ATA", value: fmt(process.ata) },
    { label: "ETD", value: fmt(process.etd) },
    { label: "ATD", value: fmt(process.atd) },
    { label: "Criado", value: fmt(process.createdAt) },
    { label: "Atualizado", value: fmt(process.updatedAt) },
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

// ===== AUTORIZAÇÕES =====
function AuthorizationsTab({
  process,
  onAuthChange,
  locked,
}: {
  process: PortProcess;
  onAuthChange: (id: string, status: AuthorizationStatus) => void;
  locked: boolean;
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
              {/* Voltar a clicar no estado ativo repõe "Pendente" */}
              <button
                onClick={() =>
                  onAuthChange(
                    auth.id,
                    auth.status === "RECEIVED" ? "PENDING" : "RECEIVED",
                  )
                }
                disabled={locked}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  auth.status === "RECEIVED"
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-surface-3 text-text-muted hover:text-primary hover:bg-primary/10"
                } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <CheckCircle2 size={14} /> Recebido
              </button>
              <button
                onClick={() =>
                  onAuthChange(
                    auth.id,
                    auth.status === "NOT_APPLICABLE"
                      ? "PENDING"
                      : "NOT_APPLICABLE",
                  )
                }
                disabled={locked}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  auth.status === "NOT_APPLICABLE"
                    ? "bg-text-muted/20 text-text-secondary border border-border"
                    : "bg-surface-3 text-text-muted hover:text-text-secondary hover:bg-surface-3"
                } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
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

// ===== MARCOS =====
function MilestonesTab({
  process,
  onToggle,
  locked,
}: {
  process: PortProcess;
  onToggle: (id: string, confirmed: boolean) => void;
  locked: boolean;
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
              onClick={() => onToggle(ms.id, !ms.confirmed)}
              disabled={locked}
              className={`shrink-0 w-10 h-6 rounded-full transition-colors relative ${
                ms.confirmed ? "bg-primary" : "bg-surface-3"
              } ${locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
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

// ===== FATURAS =====
function InvoicesTab({
  process,
  onInvoiceChange,
  locked,
}: {
  process: PortProcess;
  onInvoiceChange: (
    id: string,
    status: InvoiceStatus,
    reference?: string,
    amount?: number,
    currency?: Currency,
  ) => void;
  locked: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRef, setEditRef] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCurrency, setEditCurrency] = useState<Currency>("USD");

  const received = process.invoices.filter((i) => i.status === "RECEIVED");
  const awaiting = process.invoices.filter((i) => i.status === "AWAITING");

  function handleMarkReceived(invId: string) {
    const amount = editAmount ? parseFloat(editAmount) : undefined;
    onInvoiceChange(
      invId,
      "RECEIVED",
      editRef || undefined,
      amount !== undefined && !Number.isNaN(amount) ? amount : undefined,
      editCurrency,
    );
    setEditingId(null);
    setEditRef("");
    setEditAmount("");
  }

  return (
    <div className="space-y-4">
      {/* Faturas em falta */}
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
                    <div className="flex flex-wrap items-center gap-2">
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
                      <select
                        value={editCurrency}
                        onChange={(e) =>
                          setEditCurrency(e.target.value as Currency)
                        }
                        className="px-2 py-1 bg-surface border border-border rounded text-xs text-text-secondary"
                      >
                        <option value="MZN">MZN</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                      <Button
                        size="sm"
                        onClick={() => handleMarkReceived(inv.id)}
                        disabled={locked}
                      >
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
                        setEditCurrency(currencyOf(inv));
                      }}
                      disabled={locked}
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

      {/* Faturas recebidas */}
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
                    {inv.amount != null && (
                      <span>
                        {currencyOf(inv)}{" "}
                        {Number(inv.amount).toLocaleString("pt-PT")}
                      </span>
                    )}
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

// ===== DOCUMENTOS =====
function FilesTab({
  process,
  fileError,
  onAdd,
  onDelete,
  isClosed,
  busy,
}: {
  process: PortProcess;
  fileError: string;
  onAdd: () => void;
  onDelete: (id: string) => void;
  isClosed: boolean;
  busy: boolean;
}) {
  const hasSharePointFiles = process.files.some(
    (f) => f.storageMode === "SharePoint",
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold font-[Syne]">
            Documentos ({process.files.length})
          </h3>
          {hasSharePointFiles && (
            <p className="text-xs text-primary mt-1">
              ☁️ Guardados no SharePoint
            </p>
          )}
        </div>
        {!isClosed && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onAdd}
            icon={<Upload size={16} />}
            disabled={busy}
          >
            {busy ? "A enviar..." : "Adicionar"}
          </Button>
        )}
      </div>

      {!isClosed && !isSharePointConfigured() && (
        <p className="p-3 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
          O SharePoint não está configurado: ao adicionar, só o registo do
          documento é guardado, e não o próprio ficheiro.
        </p>
      )}

      {fileError && (
        <div
          role="alert"
          className="p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400"
        >
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
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-text-muted">
                      {formatFileSize(file.size)} —{" "}
                      {format(new Date(file.createdAt), "d MMM yyyy", {
                        locale: pt,
                      })}
                    </p>
                    {file.storageMode === "SharePoint" && (
                      <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        SharePoint
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={file.sharepointWebUrl || file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Ver no SharePoint"
                >
                  <Eye size={16} />
                </a>
                {!isClosed && (
                  <button
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remover"
                    onClick={() => onDelete(file.id)}
                    disabled={busy}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ===== HISTÓRICO =====
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
