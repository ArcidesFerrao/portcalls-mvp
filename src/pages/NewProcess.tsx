import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { createProcess, addFileToProcess } from '../lib/store';
import { validateProcess, validateFile, sanitizeFileName, formatFileSize } from '../lib/validations';

interface FileItem {
  file: File;
  id: string;
}

export function NewProcess() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files || []);
    
    const newFiles: FileItem[] = [];
    const newErrors: Record<string, string> = {};

    selectedFiles.forEach(file => {
      const validation = validateFile(file);
      if (!validation.success) {
        newErrors.file = validation.errors[0].message;
      } else {
        newFiles.push({
          file,
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        });
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
    } else {
      setFiles(prev => [...prev, ...newFiles]);
      setErrors(prev => { const { file, ...rest } = prev; return rest; });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function removeFile(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate
    const validation = validateProcess({ title, description });
    if (!validation.success) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(err => { errorMap[err.field] = err.message; });
      setErrors(errorMap);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Create process
      const process = createProcess({ title: title.trim(), description: description.trim() || undefined });

      // Add files
      for (const fileItem of files) {
        const sanitizedName = sanitizeFileName(fileItem.file.name);
        addFileToProcess(process.id, {
          name: sanitizedName,
          originalName: fileItem.file.name,
          mimeType: fileItem.file.type,
          size: fileItem.file.size,
        });
      }

      navigate(`/processes/${process.id}`);
    } catch {
      setErrors({ submit: 'Erro ao criar processo. Tente novamente.' });
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-surface-2 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-[Syne]">Novo Processo</h1>
          <p className="text-text-secondary text-sm">Preencha os dados para criar um novo processo</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-5">
          <Input
            label="Título"
            placeholder="Ex: Licença de Construção — Edifício A"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors(prev => { const { title, ...rest } = prev; return rest; }); }}
            error={errors.title}
            autoFocus
          />

          <Textarea
            label="Descrição"
            placeholder="Descreva o processo (opcional)"
            value={description}
            onChange={(e) => { setDescription(e.target.value); setErrors(prev => { const { description, ...rest } = prev; return rest; }); }}
            error={errors.description}
            rows={4}
            hint="Máximo 2000 caracteres"
          />
        </Card>

        {/* File Upload */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Ficheiros</h3>
            <span className="text-xs text-text-muted">{files.length} ficheiro(s)</span>
          </div>

          {errors.file && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {errors.file}
            </div>
          )}

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="flex items-center justify-between p-3 bg-surface-2 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={18} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                      <p className="text-xs text-text-muted">{formatFileSize(fileItem.file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(fileItem.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
          >
            <Upload size={24} className="mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-secondary">
              Clique para selecionar ficheiros
            </p>
            <p className="text-xs text-text-muted mt-1">
              PDF, imagens, documentos — Máx. 10MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </Card>

        {errors.submit && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'A criar...' : 'Criar Processo'}
          </Button>
        </div>
      </form>
    </div>
  );
}
