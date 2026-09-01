/**
 * Google Drive Image Utility Functions
 * Supports converting, extracting, uploading, and formatting images with the direct format:
 * https://lh3.googleusercontent.com/d/{FILE_ID}
 * With robust fallback strategies (Thumbnail CDN, uc export, and cached previews).
 */

export const DEFAULT_DRIVE_FOLDER_ID = '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R';
export const DEFAULT_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${DEFAULT_DRIVE_FOLDER_ID}`;

/**
 * Check if a URL or string is a Google Drive folder link or folder ID
 */
export function isGoogleDriveFolder(input: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  if (/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Extract Google Drive Folder ID from a URL or raw ID
 */
export function extractGoogleDriveFolderId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  const folderMatch = trimmed.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i);
  if (folderMatch && folderMatch[1]) return folderMatch[1];

  if (trimmed === DEFAULT_DRIVE_FOLDER_ID) return DEFAULT_DRIVE_FOLDER_ID;

  return null;
}

/**
 * Extract Google Drive File ID from any Drive link or raw ID
 */
export function extractGoogleDriveId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // 1. Check if it's already an lh3 direct link: https://lh3.googleusercontent.com/d/{id}
  const lh3Match = trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i);
  if (lh3Match && lh3Match[1]) return lh3Match[1];

  // 2. Check standard Drive file link: drive.google.com/file/d/{id}
  const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileMatch && fileMatch[1]) return fileMatch[1];

  // 3. Check drive.google.com/thumbnail?id={id} or drive.google.com/uc?id={id} or open?id={id}
  const idQueryMatch = trimmed.match(/drive\.google\.com\/(?:open|uc|thumbnail)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i);
  if (idQueryMatch && idQueryMatch[1]) return idQueryMatch[1];

  // 4. Check folder link - note: folders are not file IDs, but we handle extraction
  const folderMatch = trimmed.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i);
  if (folderMatch && folderMatch[1]) {
    // Return folder ID (will be identified as folder by isGoogleDriveFolder)
    return folderMatch[1];
  }

  // 5. If it's a raw Drive File/Folder ID (typical length 20-50 characters alphanumeric with hyphens/underscores)
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Format any Drive ID or URL to the exact direct CDN link format:
 * https://lh3.googleusercontent.com/d/{FILE_ID}
 */
export function formatGoogleDriveDirectUrl(fileIdOrUrl: string): string {
  if (!fileIdOrUrl) return '';
  const trimmed = fileIdOrUrl.trim();
  
  // If it's already an lh3 direct link
  if (trimmed.startsWith('https://lh3.googleusercontent.com/d/')) {
    return trimmed;
  }

  const id = extractGoogleDriveId(trimmed);
  if (id) {
    return `https://lh3.googleusercontent.com/d/${id}`;
  }
  return trimmed;
}

/**
 * Generate fallback URLs for Google Drive images in order of reliability
 */
export function getDriveImageCandidates(urlOrId: string): string[] {
  if (!urlOrId) return [];
  const id = extractGoogleDriveId(urlOrId);
  const candidates: string[] = [];

  // Check if we have a locally cached preview first
  const cached = getCachedDriveImagePreview(urlOrId);
  if (cached) candidates.push(cached);

  if (id) {
    // 1. Primary: High-speed lh3 CDN
    candidates.push(`https://lh3.googleusercontent.com/d/${id}`);
    // 2. Secondary: Google Drive Thumbnail API (bypasses most CORS and referrer issues)
    candidates.push(`https://drive.google.com/thumbnail?id=${id}&sz=w1600`);
    // 3. Tertiary: Google Drive UserContent Export View
    candidates.push(`https://drive.google.com/uc?export=view&id=${id}`);
    // 4. Quaternary: docs.google.com viewer thumbnail
    candidates.push(`https://docs.google.com/uc?export=download&id=${id}`);
  }

  if ((urlOrId.startsWith('http') || urlOrId.startsWith('data:')) && !candidates.includes(urlOrId)) {
    candidates.push(urlOrId);
  }

  return candidates;
}

/**
 * Generate a standard 33-character Google Drive file ID for local mock / preview
 */
export function generateDriveFileId(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz_-';
  let result = '1';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Cache image base64 locally mapped to its https://lh3.googleusercontent.com/d/{id} URL
 * so that live browser preview displays immediately even before external network propagation
 */
export function cacheDriveImagePreview(directUrl: string, base64Data: string) {
  try {
    const key = `drive_preview_${directUrl}`;
    sessionStorage.setItem(key, base64Data);
    
    // Also store by extracted file ID if possible
    const fileId = extractGoogleDriveId(directUrl);
    if (fileId) {
      sessionStorage.setItem(`drive_preview_id_${fileId}`, base64Data);
    }

    const recentJson = localStorage.getItem('elites_recent_drive_images') || '[]';
    const recent = JSON.parse(recentJson);
    const existingIdx = recent.findIndex((r: any) => r.url === directUrl);
    const item = { url: directUrl, fileId: fileId || '', base64: base64Data, timestamp: Date.now() };
    if (existingIdx >= 0) {
      recent[existingIdx] = item;
    } else {
      recent.unshift(item);
    }
    localStorage.setItem('elites_recent_drive_images', JSON.stringify(recent.slice(0, 25)));
  } catch (e) {
    // ignore quota errors
  }
}

/**
 * Get cached preview for a drive URL if available
 */
export function getCachedDriveImagePreview(url: string): string | null {
  if (!url) return null;
  try {
    const key = `drive_preview_${url}`;
    const cached = sessionStorage.getItem(key);
    if (cached) return cached;

    const fileId = extractGoogleDriveId(url);
    if (fileId) {
      const cachedById = sessionStorage.getItem(`drive_preview_id_${fileId}`);
      if (cachedById) return cachedById;
    }

    const recentJson = localStorage.getItem('elites_recent_drive_images') || '[]';
    const recent = JSON.parse(recentJson);
    const found = recent.find((r: any) => r.url === url || (fileId && r.fileId === fileId));
    if (found?.base64) return found.base64;
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * Compress an image file to reduce upload size while maintaining high visual quality
 */
export function compressImageFile(file: File, maxWidth = 1200, quality = 0.85): Promise<{ base64: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const rawB64 = event.target?.result as string;
          resolve({ base64: rawB64, sizeKb: Math.round(file.size / 1024) });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
        const sizeEstimate = Math.round((dataUrl.length * 3) / 4 / 1024);
        resolve({ base64: dataUrl, sizeKb: sizeEstimate });
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

