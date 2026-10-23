import type {
  PortProcess,
  ProcessStats,
  AuthorizationStatus,
  InvoiceStatus,
} from "./types";

// A autenticação é um cookie de sessão httpOnly. Os pedidos vão sempre para
// /api, na mesma origem (proxy do Vite em desenvolvimento, rewrite da Vercel
// em produção), e o navegador envia o cookie com credentials: "include".

// Emitido quando o servidor responde 401; o AuthProvider ouve-o e manda
// o utilizador para o login.
export const UNAUTHORIZED_EVENT = "portops:unauthorized";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// ============ COMPATIBILIDADE ============
// Estas funções existiam quando o URL da API era configurado à mão no /setup.
// Mantêm-se para o store.ts e o Setup.tsx continuarem a compilar; a API passa
// a estar sempre ativa. Podes apagá-las quando limpares esses ficheiros.

export interface ApiConfig {
  apiUrl: string;
  enabled: boolean;
}

export function getApiConfig(): ApiConfig {
  return { apiUrl: "", enabled: true };
}

/** @deprecated O URL da API já não é configurável. */
export function saveApiConfig(_config: ApiConfig): void {}

export function isApiEnabled(): boolean {
  return true;
}

// ============ BASE ============

async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Não foi possível contactar o servidor. Verifique a ligação.",
      0
    );
  }

  if (response.status === 401) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      body?.error ?? `Erro ${response.status}`,
      response.status
    );
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// O servidor guarda LOCAL / SHAREPOINT; a interface usa "Local" / "SharePoint".
const STORAGE_MODES: Record<string, string> = {
  LOCAL: "Local",
  SHAREPOINT: "SharePoint",
};

function normalizeFile<F extends { storageMode?: string }>(file: F): F {
  const mode = file.storageMode ? STORAGE_MODES[file.storageMode] : undefined;
  return mode ? { ...file, storageMode: mode } : file;
}

function normalizeProcess<P extends object>(process: P): P {
  const files = (process as { files?: unknown[] }).files;
  if (!Array.isArray(files)) return process;
  return {
    ...process,
    files: files.map((f) => normalizeFile(f as { storageMode?: string })),
  } as P;
}

// ============ PROCESSES ============

export async function apiGetAllProcesses(): Promise<PortProcess[]> {
  const list = await fetchApi<PortProcess[]>("/api/processes");
  return list.map((p) => normalizeProcess(p));
}

export async function apiGetProcessById(id: string): Promise<PortProcess> {
  return normalizeProcess(await fetchApi<PortProcess>(`/api/processes/${id}`));
}

export async function apiCreateProcess(data: {
  vesselName: string;
  imo?: string;
  client: string;
  port: string;
  terminal?: string;
  eta?: string;
  etd?: string;
  /** @deprecated O coordenador é o utilizador com sessão iniciada. */
  coordinator?: string;
  observations?: string;
}): Promise<PortProcess> {
  return normalizeProcess(
    await fetchApi<PortProcess>("/api/processes", {
      method: "POST",
      body: JSON.stringify(data),
    })
  );
}

export async function apiUpdateProcess(
  id: string,
  data: Partial<PortProcess>
): Promise<PortProcess> {
  return normalizeProcess(
    await fetchApi<PortProcess>(`/api/processes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  );
}

export async function apiCloseProcess(id: string): Promise<PortProcess> {
  return normalizeProcess(
    await fetchApi<PortProcess>(`/api/processes/${id}/close`, {
      method: "POST",
    })
  );
}

// ============ AUTHORIZATIONS ============

export async function apiUpdateAuthorization(
  id: string,
  status: AuthorizationStatus
): Promise<any> {
  return fetchApi(`/api/authorizations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ============ MILESTONES ============

export async function apiUpdateMilestone(
  id: string,
  confirmed: boolean,
  date?: string
): Promise<any> {
  return fetchApi(`/api/milestones/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ confirmed, date }),
  });
}

// ============ INVOICES ============

export async function apiUpdateInvoice(
  id: string,
  data: {
    status: InvoiceStatus;
    reference?: string;
    amount?: number;
    currency?: "MZN" | "USD" | "EUR";
  }
): Promise<any> {
  return fetchApi(`/api/invoices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ============ FILES ============

export async function apiAddFile(
  processId: string,
  file: {
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    storageKey: string;
    checksum?: string;
    sharepointDriveId?: string;
    sharepointItemId?: string;
    sharepointWebUrl?: string;
    storageMode: string;
  }
): Promise<any> {
  return normalizeFile(
    await fetchApi(`/api/processes/${processId}/files`, {
      method: "POST",
      body: JSON.stringify(file),
    })
  );
}

export async function apiDeleteFile(id: string): Promise<void> {
  return fetchApi(`/api/files/${id}`, {
    method: "DELETE",
  });
}

// ============ STATS ============

export async function apiGetStats(): Promise<ProcessStats> {
  return fetchApi("/api/stats");
}

// ============ HEALTH CHECK ============

// O servidor responde 401 sem sessão: também conta como "alcançável".
export async function apiHealthCheck(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/me", { credentials: "include" });
    return response.ok || response.status === 401;
  } catch {
    return false;
  }
}