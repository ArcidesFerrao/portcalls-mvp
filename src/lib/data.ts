import {
  apiAddFile,
  apiCloseProcess,
  apiCreateProcess,
  apiDeleteFile,
  apiGetAllProcesses,
  apiGetProcessById,
  apiGetStats,
  apiUpdateAuthorization,
  apiUpdateInvoice,
  apiUpdateMilestone,
  apiUpdateProcess,
} from "./api";
import type {
  AuthorizationStatus,
  InvoiceStatus,
  PortProcess,
  ProcessFile,
  ProcessStats,
} from "./types";

// Fonte de dados da aplicação com sessão: tudo vem do servidor.
// O store.ts (localStorage) fica só para a demonstração.
//
// As funções têm a mesma ordem de argumentos do store.ts para a migração das
// páginas ser trocar o import e acrescentar await. A diferença é que
// devolvem uma Promise e lançam ApiError se algo falhar.

export const loadProcesses = (): Promise<PortProcess[]> => apiGetAllProcesses();
export const loadStats = (): Promise<ProcessStats> => apiGetStats();
export const loadProcess = (id: string): Promise<PortProcess> =>
  apiGetProcessById(id);

export interface NewProcessInput {
  fileNumber?: string;
  srfNumber?: string;
  vesselName: string;
  imo?: string;
  client: string;
  port: string;
  terminal?: string;
  eta?: string; // ISO
  etd?: string; // ISO
  observations?: string;
}

// O coordenador é o utilizador com sessão: o servidor define-o.
export const createProcess = (data: NewProcessInput): Promise<PortProcess> =>
  apiCreateProcess(data);

export const updateProcess = (
  id: string,
  data: Partial<PortProcess>
): Promise<PortProcess> => apiUpdateProcess(id, data);

export const closeProcess = (id: string): Promise<PortProcess> =>
  apiCloseProcess(id);

// O processId deixa de ser preciso (o id do item chega), mas mantém-se
// na assinatura para ser igual ao store.ts.
export const updateAuthorization = (
  _processId: string,
  authId: string,
  status: AuthorizationStatus
): Promise<PortProcess> => apiUpdateAuthorization(authId, status);

export const updateMilestone = (
  _processId: string,
  milestoneId: string,
  confirmed: boolean,
  date?: string
): Promise<PortProcess> => apiUpdateMilestone(milestoneId, confirmed, date);

export const updateInvoice = (
  _processId: string,
  invoiceId: string,
  data: {
    status?: InvoiceStatus;
    reference?: string;
    amount?: number;
    dueDate?: string;
  }
): Promise<PortProcess> => apiUpdateInvoice(invoiceId, data);

// ---- Ficheiros ----

// Modo "Local": só regista o ficheiro, sem guardar o conteúdo.
export async function addFileToProcess(
  processId: string,
  file: { name: string; originalName: string; mimeType: string; size: number }
): Promise<ProcessFile> {
  const storageKey = `processes/${processId}/${file.name}`;
  return apiAddFile(processId, {
    ...file,
    url: `#${storageKey}`,
    storageKey,
    storageMode: "Local",
  });
}

export async function addSharePointFileToProcess(
  processId: string,
  file: {
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    driveId: string;
    itemId: string;
    webUrl: string;
  }
): Promise<ProcessFile> {
  return apiAddFile(processId, {
    name: file.name,
    originalName: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    url: file.webUrl,
    storageKey: `sharepoint/${file.driveId}/${file.itemId}`,
    sharepointDriveId: file.driveId,
    sharepointItemId: file.itemId,
    sharepointWebUrl: file.webUrl,
    storageMode: "SharePoint",
  });
}

export async function removeFileFromProcess(
  _processId: string,
  fileId: string
): Promise<boolean> {
  await apiDeleteFile(fileId);
  return true;
}