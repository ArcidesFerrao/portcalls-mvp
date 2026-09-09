export type ProcessStatus = 'OPEN' | 'CLOSED';
export type AuthorizationStatus = 'RECEIVED' | 'NOT_APPLICABLE' | 'PENDING';
export type InvoiceStatus = 'RECEIVED' | 'AWAITING';

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

export interface Authorization {
  id: string;
  processId: string;
  entity: string; // Saúde, Alfândega, Imigração, Polícia Marítima, Intransmar
  reason: string;
  status: AuthorizationStatus;
  receivedAt: string | null;
}

export interface Milestone {
  id: string;
  processId: string;
  name: string;
  description?: string;
  date: string | null;
  confirmed: boolean;
  order: number;
}

export interface Invoice {
  id: string;
  processId: string;
  entity: string;
  description: string;
  reference: string | null;
  status: InvoiceStatus;
  amount: number | null;
  receivedAt: string | null;
  dueDate: string | null;
}

export interface TimelineEvent {
  id: string;
  processId: string;
  action: string;
  description: string;
  timestamp: string;
  user: string;
}

export interface PortProcess {
  id: string;
  fileNumber: string;
  srfNumber: string;
  vesselName: string;
  imo: string;
  client: string;
  port: string;
  terminal: string;
  eta: string | null;
  ata: string | null;
  etd: string | null;
  atd: string | null;
  coordinator: string;
  status: ProcessStatus;
  observations: string | null;
  progress: number; // 0-100
  
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;

  authorizations: Authorization[];
  milestones: Milestone[];
  invoices: Invoice[];
  files: ProcessFile[];
  events: TimelineEvent[];
}

export interface ProcessStats {
  total: number;
  open: number;
  closed: number;
  awaitingArrival: number;
  awaitingDeparture: number;
  invoicesReceived: number;
  invoicesAwaiting: number;
  critical: number;
}
