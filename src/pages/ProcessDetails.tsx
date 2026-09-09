import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit3, Lock, Upload, Trash2, FileText, 
  Calendar, Clock, Paperclip, ExternalLink, AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { 
  getProcessById, updateProcess, closeProcess, 
  addFileToProcess, removeFileFromProcess 
} from '../lib/store';
import { validateProcess, validateFile, sanitizeFileName, formatFileSize } from '../lib/validations';
import { Process } from '../lib/types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export function ProcessDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [process, setProcess] = useState<Process | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDeleteFileModal, setShowDeleteFileModal] = useState<string | null>(null);

  // Edit form
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // File upload
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    loadProcess();
  }, [id]);

  function loadProcess() {
    if (!id) return;
    const p = getProcessById(id);
    if (p) {
      setProcess(p);
      setEditTitle(p.title);
      setEditDescription(p.description || '');
    }
    setLoading(false);
  }

  function handleEdit() {
    setIsEditing(true);
    setEditTitle(process!.title);
    setEditDescription(process!.description || '');
    setEditErrors({});
  }

  function handleSaveEdit() {
    if (!process) return;

    const validation = validateProcess({ title: editTitle, description: editDescription });
    if (!validation.success) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(err => { errorMap[err.field] = err.message; });
      setEditErrors(errorMap);
      return;
    }

    const updated = updateProcess(process.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
    });

    if (updated) {
      setProcess(updated);
      setIsEditing(false);
    }
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditErrors({});
  }

  function handleCloseProcess() {
    if (!process) return;
    const updated = closeProcess(process.id);
    if (updated) {
      setProcess(updated);
      setShowCloseModal(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!process) return;
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const validation = validateFile(file);
      if (!validation.success) {
        setFileError(validation.errors[0].message);
        return;
      }

      const sanitizedName = sanitizeFileName(file.name);
      const result = addFileToProcess(process.id, {
        name: sanitizedName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      });

      if (result) {
        loadProcess();
        setFileError('');
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleDeleteFile(fileId: string) {
    if (!process) return;
    removeFileFromProcess(process.id, fileId);
    loadProcess();
    setShowDeleteFileModal(null);
  }

  function getFileIconClass(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'text-red-400';
    if (mimeType.includes('image')) return 'text-blue-400';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'text-blue-400';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'text-green-400';
    return 'text-text-muted';
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
        <h2 className="text-xl font-medium text-text-secondary mb-2">Processo não encontrado</h2>
        <p className="text-text-muted mb-6">O processo que procura não existe ou foi removido.</p>
        <Button onClick={() => navigate('/')}>Voltar ao Dashboard</Button>
      </div>
    );
  }

  const isClosed = process.status === 'CLOSED';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 mt-1 rounded-lg text-text-muted hover:text-white hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                {process.reference}
              </span>
              <StatusBadge status={process.status} />
            </div>
            {isEditing ? (
              <div className="space-y-3 mt-3">
                <Input
                  value={editTitle}
                  onChange={(e) => { setEditTitle(e.target.value); setEditErrors(prev => { const { title, ...rest } = prev; return rest; }); }}
                  error={editErrors.title}
                  autoFocus
                />
                <Textarea
                  value={editDescription}
                  onChange={(e) => { setEditDescription(e.target.value); setEditErrors(prev => { const { description, ...rest } = prev; return rest; }); }}
                  error={editErrors.description}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>Guardar</Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold font-[Syne]">{process.title}</h1>
                {process.description && (
                  <p className="text-text-secondary mt-1">{process.description}</p>
                )}
              </>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2 shrink-0">
            {!isClosed && (
              <>
                <Button variant="secondary" size="sm" onClick={handleEdit} icon={<Edit3 size={16} />}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" onClick={() => setShowCloseModal(true)} icon={<Lock size={16} />}>
                  Fechar
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-primary" />
            <div>
              <p className="text-xs text-text-muted">Criado em</p>
              <p className="text-sm font-medium">
                {format(new Date(process.createdAt), "d MMM yyyy, HH:mm", { locale: pt })}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-primary" />
            <div>
              <p className="text-xs text-text-muted">Atualizado em</p>
              <p className="text-sm font-medium">
                {format(new Date(process.updatedAt), "d MMM yyyy, HH:mm", { locale: pt })}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Lock size={18} className={isClosed ? 'text-text-muted' : 'text-primary'} />
            <div>
              <p className="text-xs text-text-muted">{isClosed ? 'Fechado em' : 'Estado'}</p>
              <p className="text-sm font-medium">
                {isClosed && process.closedAt
                  ? format(new Date(process.closedAt), "d MMM yyyy, HH:mm", { locale: pt })
                  : 'Aberto'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Files Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Paperclip size={18} className="text-primary" />
            <h2 className="font-semibold font-[Syne]">Ficheiros</h2>
            <span className="text-xs text-text-muted bg-surface-3 px-2 py-0.5 rounded-full">
              {process.files.length}
            </span>
          </div>
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
            <p className="text-text-secondary text-sm">Sem ficheiros associados</p>
            {!isClosed && (
              <p className="text-text-muted text-xs mt-1">
                Adicione documentos ao processo
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {process.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-surface-2 border border-border rounded-lg hover:border-border-light transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={20} className={`shrink-0 ${getFileIconClass(file.mimeType)}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.originalName}</p>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{format(new Date(file.createdAt), "d MMM yyyy", { locale: pt })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Abrir ficheiro"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    <ExternalLink size={16} />
                  </button>
                  {!isClosed && (
                    <button
                      className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remover ficheiro"
                      onClick={() => setShowDeleteFileModal(file.id)}
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
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </Card>

      {/* Close Confirmation Modal */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Fechar Processo"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-text-secondary">
                Tem a certeza que deseja fechar este processo? Esta ação não pode ser revertida.
              </p>
              <p className="text-xs text-text-muted mt-2">
                O processo ficará apenas para consulta. Não será possível editar ou adicionar ficheiros.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCloseModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleCloseProcess} icon={<Lock size={16} />}>
              Fechar Processo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete File Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteFileModal}
        onClose={() => setShowDeleteFileModal(null)}
        title="Remover Ficheiro"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Tem a certeza que deseja remover este ficheiro do processo?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowDeleteFileModal(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => showDeleteFileModal && handleDeleteFile(showDeleteFileModal)}
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
