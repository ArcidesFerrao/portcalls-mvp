export type ProcessStatus = 'OPEN' | 'CLOSED';

export interface ProcessFile {
  id: string;
  processId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  storageKey: string;
  createdAt: string;
}

export interface Process {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  status: ProcessStatus;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  files: ProcessFile[];
}

export interface ProcessStats {
  total: number;
  open: number;
  closed: number;
}
