export interface SharePointConfig {
  siteUrl: string;
  libraryName: string;
  rootFolder: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  storageMode: 'SharePoint' | 'Local';
  accessMethod: 'Microsoft 365' | 'Local Storage';
}

export interface SharePointFile {
  id: string;
  driveId: string;
  itemId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  webUrl: string;
  downloadUrl?: string;
  createdAt: string;
}

export interface SharePointFolder {
  id: string;
  name: string;
  path: string;
  childCount: number;
}

export interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}
