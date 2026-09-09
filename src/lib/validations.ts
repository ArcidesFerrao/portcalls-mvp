export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

export function validateProcess(data: { title: string; description?: string }): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Título é obrigatório' });
  } else if (data.title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Título deve ter pelo menos 3 caracteres' });
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

export function validateFile(file: File): ValidationResult {
  const errors: ValidationError[] = [];

  if (file.size > MAX_FILE_SIZE) {
    errors.push({ field: 'file', message: `Ficheiro excede o tamanho máximo de 10MB` });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    errors.push({ field: 'file', message: 'Tipo de ficheiro não permitido' });
  }

  if (file.size === 0) {
    errors.push({ field: 'file', message: 'Ficheiro não pode estar vazio' });
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 100);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
