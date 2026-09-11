import { SharePointConfig } from './sharepoint-types';

const CONFIG_KEY = 'portops_sharepoint_config';

export function getSharePointConfig(): SharePointConfig | null {
  const data = localStorage.getItem(CONFIG_KEY);
  return data ? JSON.parse(data) : null;
}

export function saveSharePointConfig(config: SharePointConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function clearSharePointConfig(): void {
  localStorage.removeItem(CONFIG_KEY);
}

export function isSharePointConfigured(): boolean {
  const config = getSharePointConfig();
  return !!(config && config.siteUrl && config.libraryName && config.tenantId && config.clientId);
}

export function getDefaultConfig(): SharePointConfig {
  return {
    siteUrl: '',
    libraryName: 'Documentos',
    rootFolder: 'Processos',
    tenantId: '',
    clientId: '',
    clientSecret: '',
    storageMode: 'SharePoint',
    accessMethod: 'Microsoft 365',
  };
}
