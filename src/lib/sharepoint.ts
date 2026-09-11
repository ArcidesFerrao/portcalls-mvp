import { SharePointConfig, SharePointFile, SharePointFolder, ValidationResult } from './sharepoint-types';
import { getSharePointConfig } from './config';

// Microsoft Graph API endpoints
const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

// Cache for access token
let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get access token using client credentials flow
 */
async function getAccessToken(config?: SharePointConfig): Promise<string> {
  const cfg = config || getSharePointConfig();
  if (!cfg) throw new Error('SharePoint not configured');

  // Return cached token if still valid (with 5 min buffer)
  if (accessToken && Date.now() < tokenExpiry - 300000) {
    return accessToken;
  }

  const tokenUrl = `https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`;
  
  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Authentication failed: ${error.error_description || error.error}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000);
  
  return accessToken!;
}

/**
 * Get SharePoint site ID from URL
 */
async function getSiteId(config: SharePointConfig): Promise<string> {
  const token = await getAccessToken(config);
  
  // Extract hostname from site URL
  const url = new URL(config.siteUrl);
  const hostname = url.hostname;
  const sitePath = url.pathname.replace(/\/$/, '');
  
  const response = await fetch(
    `${GRAPH_API_BASE}/sites/${hostname}:${sitePath}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get site: ${response.statusText}`);
  }

  const site = await response.json();
  return site.id;
}

/**
 * Get document library drive ID
 */
async function getDriveId(config: SharePointConfig, siteId: string): Promise<string> {
  const token = await getAccessToken(config);
  
  const response = await fetch(
    `${GRAPH_API_BASE}/sites/${siteId}/drives`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get drives: ${response.statusText}`);
  }

  const data = await response.json();
  const drive = data.value.find((d: any) => d.name === config.libraryName);
  
  if (!drive) {
    throw new Error(`Library "${config.libraryName}" not found`);
  }

  return drive.id;
}

/**
 * Validate SharePoint connection and configuration
 */
export async function validateSharePointConnection(config?: SharePointConfig): Promise<ValidationResult> {
  try {
    const cfg = config || getSharePointConfig();
    if (!cfg) {
      return { success: false, message: 'SharePoint not configured' };
    }

    // Test authentication
    await getAccessToken(cfg);

    // Get site ID
    const siteId = await getSiteId(cfg);

    // Get drive ID
    const driveId = await getDriveId(cfg, siteId);

    // Check if root folder exists
    const folderExists = await checkFolderExists(cfg, siteId, driveId);

    return {
      success: true,
      message: folderExists 
        ? 'Connection successful. Folder exists.' 
        : 'Connection successful. Folder will be created on first use.',
      details: { siteId, driveId, folderExists },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Connection failed',
    };
  }
}

/**
 * Check if the root folder exists in the library
 */
async function checkFolderExists(config: SharePointConfig, siteId: string, driveId: string): Promise<boolean> {
  const token = await getAccessToken(config);
  
  const response = await fetch(
    `${GRAPH_API_BASE}/drives/${driveId}/root:/${config.rootFolder}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return response.ok;
}

/**
 * Create folder in SharePoint library
 */
export async function createFolder(folderName: string, config?: SharePointConfig): Promise<SharePointFolder> {
  const cfg = config || getSharePointConfig();
  if (!cfg) throw new Error('SharePoint not configured');

  const token = await getAccessToken(cfg);
  const siteId = await getSiteId(cfg);
  const driveId = await getDriveId(cfg, siteId);

  // Ensure root folder exists
  let rootFolderId: string;
  try {
    const rootResponse = await fetch(
      `${GRAPH_API_BASE}/drives/${driveId}/root:/${cfg.rootFolder}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (!rootResponse.ok) {
      // Create root folder
      const createRoot = await fetch(
        `${GRAPH_API_BASE}/drives/${driveId}/root/children`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: cfg.rootFolder,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'fail',
          }),
        }
      );
      const rootData = await createRoot.json();
      rootFolderId = rootData.id;
    } else {
      const rootData = await rootResponse.json();
      rootFolderId = rootData.id;
    }
  } catch {
    throw new Error('Failed to access root folder');
  }

  // Create subfolder
  const response = await fetch(
    `${GRAPH_API_BASE}/drives/${driveId}/items/${rootFolderId}/children`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'fail',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    if (error.error?.code === 'nameAlreadyExists') {
      // Folder already exists, get its ID
      const existing = await fetch(
        `${GRAPH_API_BASE}/drives/${driveId}/root:/${cfg.rootFolder}/${folderName}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const existingData = await existing.json();
      return {
        id: existingData.id,
        name: folderName,
        path: `${cfg.rootFolder}/${folderName}`,
        childCount: existingData.folder?.childCount || 0,
      };
    }
    throw new Error(`Failed to create folder: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    name: folderName,
    path: `${cfg.rootFolder}/${folderName}`,
    childCount: 0,
  };
}

/**
 * List files in a process folder
 */
export async function listFiles(processId: string, config?: SharePointConfig): Promise<SharePointFile[]> {
  const cfg = config || getSharePointConfig();
  if (!cfg) throw new Error('SharePoint not configured');

  const token = await getAccessToken(cfg);
  const siteId = await getSiteId(cfg);
  const driveId = await getDriveId(cfg, siteId);

  const folderPath = `${cfg.rootFolder}/${processId}`;
  
  const response = await fetch(
    `${GRAPH_API_BASE}/drives/${driveId}/root:/${folderPath}:/children`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return []; // Folder doesn't exist yet
    }
    throw new Error(`Failed to list files: ${response.statusText}`);
  }

  const data = await response.json();
  
  return data.value
    .filter((item: any) => item.file) // Only files, not folders
    .map((item: any) => ({
      id: item.id,
      driveId: driveId,
      itemId: item.id,
      name: item.name,
      originalName: item.name,
      mimeType: item.file.mimeType || 'application/octet-stream',
      size: item.size,
      webUrl: item.webUrl,
      downloadUrl: item['@microsoft.graph.downloadUrl'],
      createdAt: item.createdDateTime,
    }));
}

/**
 * Upload file to SharePoint
 */
export async function uploadFile(
  file: File,
  processId: string,
  config?: SharePointConfig
): Promise<SharePointFile> {
  const cfg = config || getSharePointConfig();
  if (!cfg) throw new Error('SharePoint not configured');

  const token = await getAccessToken(cfg);
  const siteId = await getSiteId(cfg);
  const driveId = await getDriveId(cfg, siteId);

  // Ensure process folder exists
  let folderId: string;
  try {
    const folderResponse = await fetch(
      `${GRAPH_API_BASE}/drives/${driveId}/root:/${cfg.rootFolder}/${processId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (!folderResponse.ok) {
      const folder = await createFolder(processId, cfg);
      folderId = folder.id;
    } else {
      const folderData = await folderResponse.json();
      folderId = folderData.id;
    }
  } catch {
    const folder = await createFolder(processId, cfg);
    folderId = folder.id;
  }

  // Upload file
  const uploadUrl = `${GRAPH_API_BASE}/drives/${driveId}/items/${folderId}:/${file.name}:/content`;
  
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Upload failed: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  return {
    id: data.id,
    driveId: driveId,
    itemId: data.id,
    name: data.name,
    originalName: data.name,
    mimeType: data.file.mimeType || file.type,
    size: data.size,
    webUrl: data.webUrl,
    downloadUrl: data['@microsoft.graph.downloadUrl'],
    createdAt: data.createdDateTime,
  };
}

/**
 * Delete file from SharePoint
 */
export async function deleteFile(itemId: string, config?: SharePointConfig): Promise<void> {
  const cfg = config || getSharePointConfig();
  if (!cfg) throw new Error('SharePoint not configured');

  const token = await getAccessToken(cfg);
  const siteId = await getSiteId(cfg);
  const driveId = await getDriveId(cfg, siteId);

  const response = await fetch(
    `${GRAPH_API_BASE}/drives/${driveId}/items/${itemId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok && response.status !== 204) {
    throw new Error(`Delete failed: ${response.statusText}`);
  }
}

/**
 * Get file download URL (for viewing/downloading)
 */
export async function getFileDownloadUrl(itemId: string, config?: SharePointConfig): Promise<string> {
  const cfg = config || getSharePointConfig();
  if (!cfg) throw new Error('SharePoint not configured');

  const token = await getAccessToken(cfg);
  const siteId = await getSiteId(cfg);
  const driveId = await getDriveId(cfg, siteId);

  const response = await fetch(
    `${GRAPH_API_BASE}/drives/${driveId}/items/${itemId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get file: ${response.statusText}`);
  }

  const data = await response.json();
  return data['@microsoft.graph.downloadUrl'] || data.webUrl;
}

/**
 * Clear token cache (for re-authentication)
 */
export function clearTokenCache(): void {
  accessToken = null;
  tokenExpiry = 0;
}
