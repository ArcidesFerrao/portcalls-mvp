import { PortProcess, ProcessStats, AuthorizationStatus, InvoiceStatus } from './types';

const API_CONFIG_KEY = 'portops_api_config';

export interface ApiConfig {
  apiUrl: string;
  enabled: boolean;
}

export function getApiConfig(): ApiConfig {
  const data = localStorage.getItem(API_CONFIG_KEY);
  if (data) {
    return JSON.parse(data);
  }
  return { apiUrl: '', enabled: false };
}

export function saveApiConfig(config: ApiConfig): void {
  localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
}

export function isApiEnabled(): boolean {
  const config = getApiConfig();
  return config.enabled && !!config.apiUrl;
}

async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<any> {
  const config = getApiConfig();
  if (!config.enabled || !config.apiUrl) {
    throw new Error('API not configured');
  }

  const url = `${config.apiUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// ============ PROCESSES ============

export async function apiGetAllProcesses(): Promise<PortProcess[]> {
  return fetchApi('/api/processes');
}

export async function apiGetProcessById(id: string): Promise<PortProcess> {
  return fetchApi(`/api/processes/${id}`);
}

export async function apiCreateProcess(data: {
  vesselName: string;
  imo?: string;
  client: string;
  port: string;
  terminal?: string;
  eta?: string;
  etd?: string;
  coordinator: string;
  observations?: string;
}): Promise<PortProcess> {
  return fetchApi('/api/processes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateProcess(id: string, data: Partial<PortProcess>): Promise<PortProcess> {
  return fetchApi(`/api/processes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function apiCloseProcess(id: string): Promise<PortProcess> {
  return fetchApi(`/api/processes/${id}/close`, {
    method: 'POST',
  });
}

// ============ AUTHORIZATIONS ============

export async function apiUpdateAuthorization(id: string, status: AuthorizationStatus): Promise<any> {
  return fetchApi(`/api/authorizations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ============ MILESTONES ============

export async function apiUpdateMilestone(id: string, confirmed: boolean, date?: string): Promise<any> {
  return fetchApi(`/api/milestones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ confirmed, date }),
  });
}

// ============ INVOICES ============

export async function apiUpdateInvoice(
  id: string,
  data: { status: InvoiceStatus; reference?: string; amount?: number }
): Promise<any> {
  return fetchApi(`/api/invoices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ============ FILES ============

export async function apiAddFile(processId: string, file: {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  storageKey: string;
  sharepointDriveId?: string;
  sharepointItemId?: string;
  sharepointWebUrl?: string;
  storageMode: string;
}): Promise<any> {
  return fetchApi(`/api/processes/${processId}/files`, {
    method: 'POST',
    body: JSON.stringify(file),
  });
}

export async function apiDeleteFile(id: string): Promise<void> {
  return fetchApi(`/api/files/${id}`, {
    method: 'DELETE',
  });
}

// ============ STATS ============

export async function apiGetStats(): Promise<ProcessStats> {
  return fetchApi('/api/stats');
}

// ============ HEALTH CHECK ============

export async function apiHealthCheck(): Promise<boolean> {
  try {
    const config = getApiConfig();
    const response = await fetch(`${config.apiUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
