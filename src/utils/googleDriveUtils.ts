/**
 * Google Drive Image Utility Functions
 *
 * Responsibilities:
 * - Extract Google Drive file/folder IDs
 * - Format Drive image URLs
 * - Generate reliable image fallback URLs
 * - Keep only lightweight image metadata in localStorage
 * - Compress images before upload
 *
 * IMPORTANT:
 * Base64 image data is NEVER stored in localStorage/sessionStorage.
 * Google Drive remains the source of truth for image files.
 */

export const DEFAULT_DRIVE_FOLDER_ID =
  '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R';

export const DEFAULT_DRIVE_FOLDER_URL =
  `https://drive.google.com/drive/folders/${DEFAULT_DRIVE_FOLDER_ID}`;

/**
 * Key used for lightweight recent Drive image metadata.
 */
const RECENT_DRIVE_IMAGES_KEY = 'elites_recent_drive_images';

/**
 * Maximum number of lightweight image records kept locally.
 */
const MAX_RECENT_DRIVE_IMAGES = 25;

/**
 * Check if a URL or string is a Google Drive folder link or folder ID.
 */
export function isGoogleDriveFolder(input: string): boolean {
  if (!input) return false;

  const trimmed = input.trim();

  if (
    /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i.test(
      trimmed
    )
  ) {
    return true;
  }

  return trimmed === DEFAULT_DRIVE_FOLDER_ID;
}

/**
 * Extract Google Drive Folder ID from a URL or raw ID.
 */
export function extractGoogleDriveFolderId(
  input: string
): string | null {
  if (!input) return null;

  const trimmed = input.trim();

  const folderMatch = trimmed.match(
    /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i
  );

  if (folderMatch?.[1]) {
    return folderMatch[1];
  }

  if (trimmed === DEFAULT_DRIVE_FOLDER_ID) {
    return DEFAULT_DRIVE_FOLDER_ID;
  }

  return null;
}

/**
 * Extract Google Drive File ID from any supported Drive link or raw ID.
 */
export function extractGoogleDriveId(
  input: string
): string | null {
  if (!input) return null;

  const trimmed = input.trim();

  // 1. Already an lh3 direct link
  const lh3Match = trimmed.match(
    /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i
  );

  if (lh3Match?.[1]) {
    return lh3Match[1];
  }

  // 2. Standard Drive file URL
  const fileMatch = trimmed.match(
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i
  );

  if (fileMatch?.[1]) {
    return fileMatch[1];
  }

  // 3. Drive query URLs
  const idQueryMatch = trimmed.match(
    /drive\.google\.com\/(?:open|uc|thumbnail)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i
  );

  if (idQueryMatch?.[1]) {
    return idQueryMatch[1];
  }

  // 4. Folder URL
  const folderMatch = trimmed.match(
    /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i
  );

  if (folderMatch?.[1]) {
    return folderMatch[1];
  }

  // 5. Raw Drive ID
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Format any Drive ID or URL to:
 * https://lh3.googleusercontent.com/d/{FILE_ID}
 */
export function formatGoogleDriveDirectUrl(
  fileIdOrUrl: string
): string {
  if (!fileIdOrUrl) return '';

  const trimmed = fileIdOrUrl.trim();

  if (
    trimmed.startsWith(
      'https://lh3.googleusercontent.com/d/'
    )
  ) {
    return trimmed;
  }

  const id = extractGoogleDriveId(trimmed);

  if (id) {
    return `https://lh3.googleusercontent.com/d/${id}`;
  }

  return trimmed;
}

/**
 * Generate fallback URLs for Google Drive images.
 */
export function getDriveImageCandidates(
  urlOrId: string
): string[] {
  if (!urlOrId) return [];

  const candidates: string[] = [];

  const id = extractGoogleDriveId(urlOrId);

  /**
   * We only cache lightweight URLs now.
   * No Base64 data is returned from the cache.
   */
  const cached = getCachedDriveImagePreview(urlOrId);

  if (cached) {
    candidates.push(cached);
  }

  if (id) {
    // 1. Primary CDN
    candidates.push(
      `https://lh3.googleusercontent.com/d/${id}`
    );

    // 2. Drive thumbnail
    candidates.push(
      `https://drive.google.com/thumbnail?id=${id}&sz=w1600`
    );

    // 3. Drive export view
    candidates.push(
      `https://drive.google.com/uc?export=view&id=${id}`
    );

    // 4. Drive download fallback
    candidates.push(
      `https://docs.google.com/uc?export=download&id=${id}`
    );
  }

  /**
   * Keep the original URL as a final fallback.
   *
   * data: URLs are intentionally accepted here because this
   * function may be used before an image has been uploaded.
   */
  if (
    (urlOrId.startsWith('http') ||
      urlOrId.startsWith('data:')) &&
    !candidates.includes(urlOrId)
  ) {
    candidates.push(urlOrId);
  }

  /**
   * Remove duplicates while preserving order.
   */
  return [...new Set(candidates)];
}

/**
 * Generate a standard 33-character Google Drive-style ID
 * for local mock/preview purposes.
 */
export function generateDriveFileId(): string {
  const chars =
    '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz_-';

  let result = '1';

  for (let i = 0; i < 32; i++) {
    result += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return result;
}

/**
 * Lightweight Drive image cache.
 *
 * IMPORTANT:
 * The previous implementation stored the complete Base64 image
 * in localStorage and sessionStorage.
 *
 * That could easily cause:
 *
 *   QuotaExceededError
 *
 * and could crash the product creation process.
 *
 * The new implementation stores ONLY:
 *
 *   - URL
 *   - File ID
 *   - timestamp
 *
 * Base64 is deliberately ignored.
 */
export function cacheDriveImagePreview(
  directUrl: string,
  _base64Data?: string
): void {
  if (!directUrl) return;

  try {
    const fileId =
      extractGoogleDriveId(directUrl) || '';

    let recent: Array<{
      url: string;
      fileId: string;
      timestamp: number;
    }> = [];

    /**
     * Read existing metadata safely.
     */
    try {
      const existing =
        localStorage.getItem(
          RECENT_DRIVE_IMAGES_KEY
        );

      if (existing) {
        const parsed = JSON.parse(existing);

        if (Array.isArray(parsed)) {
          recent = parsed.filter(
            item =>
              item &&
              typeof item.url === 'string'
          );
        }
      }
    } catch {
      recent = [];
    }

    /**
     * Remove an existing record for the same image.
     */
    recent = recent.filter(
      item =>
        item.url !== directUrl &&
        (!fileId || item.fileId !== fileId)
    );

    /**
     * Add lightweight metadata only.
     */
    recent.unshift({
      url: directUrl,
      fileId,
      timestamp: Date.now()
    });

    /**
     * Keep only a small number of records.
     */
    recent = recent.slice(
      0,
      MAX_RECENT_DRIVE_IMAGES
    );

    /**
     * This object is intentionally tiny.
     *
     * NEVER add:
     *   base64
     *   image_data
     *   blob
     *   binary data
     */
    try {
      localStorage.setItem(
        RECENT_DRIVE_IMAGES_KEY,
        JSON.stringify(recent)
      );
    } catch (storageError) {
      /**
       * Storage failure must NEVER break:
       *
       * - image upload
       * - product creation
       * - product editing
       * - synchronization
       */
      console.warn(
        'تعذر حفظ كاش صور Google Drive المحلي:',
        storageError
      );

      /**
       * If the browser is already near its quota,
       * remove the old image metadata and make one
       * final lightweight attempt.
       */
      try {
        localStorage.removeItem(
          RECENT_DRIVE_IMAGES_KEY
        );

        localStorage.setItem(
          RECENT_DRIVE_IMAGES_KEY,
          JSON.stringify(
            recent.slice(0, 5)
          )
        );
      } catch {
        // Ignore all storage failures.
      }
    }
  } catch (error) {
    /**
     * Absolutely no cache error should interrupt
     * the main application flow.
     */
    console.warn(
      'فشل كاش صورة Google Drive:',
      error
    );
  }
}

/**
 * Get a cached Drive URL.
 *
 * IMPORTANT:
 * This function NEVER returns Base64.
 *
 * It only returns a lightweight URL.
 */
export function getCachedDriveImagePreview(
  url: string
): string | null {
  if (!url) return null;

  try {
    const fileId =
      extractGoogleDriveId(url);

    const recentJson =
      localStorage.getItem(
        RECENT_DRIVE_IMAGES_KEY
      );

    if (!recentJson) {
      return null;
    }

    const recent = JSON.parse(
      recentJson
    );

    if (!Array.isArray(recent)) {
      return null;
    }

    const found = recent.find(
      (item: any) =>
        item?.url === url ||
        (
          fileId &&
          item?.fileId === fileId
        )
    );

    if (
      found &&
      typeof found.url === 'string' &&
      found.url.length > 0
    ) {
      return found.url;
    }
  } catch {
    // Ignore cache errors.
  }

  return null;
}

/**
 * Remove all locally cached Drive image metadata.
 *
 * This is useful for cleanup/migration after the old
 * Base64 cache implementation.
 */
export function clearDriveImagePreviewCache(): void {
  try {
    localStorage.removeItem(
      RECENT_DRIVE_IMAGES_KEY
    );
  } catch {
    // Ignore storage errors.
  }

  /**
   * Remove any old sessionStorage previews.
   *
   * We intentionally do not call sessionStorage.clear()
   * because other parts of the application may use it.
   */
  try {
    const keysToRemove: string[] = [];

    for (
      let i = 0;
      i < sessionStorage.length;
      i++
    ) {
      const key =
        sessionStorage.key(i);

      if (
        key &&
        (
          key.startsWith('drive_preview_') ||
          key.startsWith('drive_preview_id_')
        )
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // Ignore individual removal failures.
      }
    });
  } catch {
    // Ignore sessionStorage errors.
  }
}

/**
 * Compress an image file before uploading.
 *
 * Returns a Base64 Data URL for the upload process only.
 *
 * IMPORTANT:
 * This Base64 value is NOT automatically stored in
 * localStorage by this utility.
 */
export function compressImageFile(
  file: File,
  maxWidth = 1200,
  quality = 0.85
): Promise<{
  base64: string;
  sizeKb: number;
}> {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.readAsDataURL(file);

      reader.onload = event => {
        const source =
          event.target?.result;

        if (
          typeof source !== 'string'
        ) {
          reject(
            new Error(
              'تعذر قراءة الصورة'
            )
          );
          return;
        }

        const img =
          new Image();

        img.src = source;

        img.onload = () => {
          const canvas =
            document.createElement(
              'canvas'
            );

          let width =
            img.width;

          let height =
            img.height;

          if (width > maxWidth) {
            height =
              Math.round(
                (height * maxWidth) /
                  width
              );

            width = maxWidth;
          }

          canvas.width =
            width;

          canvas.height =
            height;

          const ctx =
            canvas.getContext(
              '2d'
            );

          if (!ctx) {
            resolve({
              base64: source,
              sizeKb:
                Math.round(
                  file.size / 1024
                )
            });

            return;
          }

          ctx.drawImage(
            img,
            0,
            0,
            width,
            height
          );

          /**
           * PNG keeps PNG format.
           * Other formats are converted to JPEG
           * for smaller size.
           */
          const outputType =
            file.type ===
            'image/png'
              ? 'image/png'
              : 'image/jpeg';

          const dataUrl =
            canvas.toDataURL(
              outputType,
              quality
            );

          /**
           * Approximate decoded file size.
           */
          const sizeEstimate =
            Math.round(
              (dataUrl.length * 3) /
                4 /
                1024
            );

          resolve({
            base64: dataUrl,
            sizeKb:
              sizeEstimate
          });
        };

        img.onerror = error => {
          reject(error);
        };
      };

      reader.onerror = error => {
        reject(error);
      };
    }
  );
}