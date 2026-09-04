import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDriveImageCandidates,
  isGoogleDriveFolder,
  extractGoogleDriveFolderId,
  DEFAULT_DRIVE_FOLDER_ID,
  extractGoogleDriveId,
  formatGoogleDriveDirectUrl,
} from "../../utils/googleDriveUtils";

import {
  Image as ImageIcon,
  Folder,
  ExternalLink,
} from "lucide-react";

/* =========================================================
   TYPES
   ========================================================= */

interface SafeDriveImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  showFolderPrompt?: boolean;
}

/* =========================================================
   CONSTANTS
   ========================================================= */

/**
 * Stores the last successful image URL.
 *
 * This does NOT store the image itself.
 * The browser's normal HTTP cache handles the actual image.
 */
const IMAGE_CACHE_PREFIX =
  "safe_drive_image_";

/**
 * Maximum number of URL candidates to try.
 *
 * We deliberately keep this small because trying many
 * Google Drive URLs sequentially can make the UI feel slow.
 */
const MAX_CANDIDATES = 3;

/* =========================================================
   CACHE HELPERS
   ========================================================= */

function getImageCacheKey(
  source: string
): string {
  const driveId =
    extractGoogleDriveId(source);

  if (driveId) {
    return (
      IMAGE_CACHE_PREFIX +
      driveId
    );
  }

  /*
   * For normal external URLs, create a lightweight key.
   */
  try {
    return (
      IMAGE_CACHE_PREFIX +
      encodeURIComponent(source)
        .substring(0, 180)
    );
  } catch {
    return "";
  }
}

function getCachedImageUrl(
  source: string
): string {
  if (!source) {
    return "";
  }

  const key =
    getImageCacheKey(source);

  if (!key) {
    return "";
  }

  try {
    return (
      sessionStorage.getItem(
        key
      ) || ""
    );
  } catch {
    return "";
  }
}

function setCachedImageUrl(
  source: string,
  successfulUrl: string
): void {
  if (
    !source ||
    !successfulUrl
  ) {
    return;
  }

  const key =
    getImageCacheKey(source);

  if (!key) {
    return;
  }

  try {
    sessionStorage.setItem(
      key,
      successfulUrl
    );
  } catch {
    /*
     * Ignore storage errors.
     *
     * The image still works normally.
     */
  }
}

/* =========================================================
   DRIVE URL HELPERS
   ========================================================= */

/**
 * Creates an optimized list of image candidates.
 *
 * Priority:
 *
 * 1. Cached successful URL
 * 2. lh3.googleusercontent.com
 * 3. drive.google.com/uc?export=view
 * 4. drive.google.com/uc?export=download
 */
function buildOptimizedCandidates(
  source: string
): string[] {
  if (!source?.trim()) {
    return [];
  }

  const trimmed =
    source.trim();

  /*
   * If this is a Google Drive file ID,
   * immediately convert it to the preferred
   * image URL.
   */
  const driveId =
    extractGoogleDriveId(
      trimmed
    );

  if (driveId) {
    const preferredUrl =
      formatGoogleDriveDirectUrl(
        driveId
      );

    const cachedUrl =
      getCachedImageUrl(
        trimmed
      );

    const candidates = [
      cachedUrl,
      preferredUrl,
      `https://drive.google.com/uc?export=view&id=${driveId}`,
      `https://drive.google.com/uc?export=download&id=${driveId}`,
    ].filter(
      Boolean
    );

    /*
     * Remove duplicates while preserving order.
     */
    return Array.from(
      new Set(
        candidates
      )
    ).slice(
      0,
      MAX_CANDIDATES
    );
  }

  /*
   * Normal non-Drive URL.
   */
  const cachedUrl =
    getCachedImageUrl(
      trimmed
    );

  if (cachedUrl) {
    return [
      cachedUrl,
      trimmed,
    ];
  }

  return [
    trimmed,
  ];
}

/* =========================================================
   COMPONENT
   ========================================================= */

export const SafeDriveImage:
  React.FC<
    SafeDriveImageProps
  > = ({
    src = "",
    alt = "صورة",
    className = "",
    fallbackIcon,
    showFolderPrompt = true,
    loading = "lazy",
    decoding = "async",
    ...props
  }) => {

    /* =======================================================
       NORMALIZE SOURCE
       ======================================================= */

    const normalizedSrc =
      typeof src === "string"
        ? src.trim()
        : "";

    /* =======================================================
       FOLDER DETECTION
       ======================================================= */

    const isFolder =
      useMemo(() => {

        if (
          !normalizedSrc
        ) {
          return false;
        }

        return isGoogleDriveFolder(
          normalizedSrc
        );

      }, [
        normalizedSrc,
      ]);

    /* =======================================================
       FOLDER ID
       ======================================================= */

    const folderId =
      useMemo(() => {

        if (!isFolder) {
          return null;
        }

        return (
          extractGoogleDriveFolderId(
            normalizedSrc
          ) ||
          DEFAULT_DRIVE_FOLDER_ID
        );

      }, [
        normalizedSrc,
        isFolder,
      ]);

    /* =======================================================
       IMAGE CANDIDATES
       ======================================================= */

    const candidates =
      useMemo(() => {

        if (
          !normalizedSrc ||
          isFolder
        ) {
          return [];
        }

        /*
         * Use our optimized candidates first.
         */
        const optimized =
          buildOptimizedCandidates(
            normalizedSrc
          );

        /*
         * If the utility has additional
         * candidates, use them only when
         * necessary.
         */
        if (
          optimized.length > 0
        ) {
          return optimized;
        }

        return getDriveImageCandidates(
          normalizedSrc
        ).slice(
          0,
          MAX_CANDIDATES
        );

      }, [
        normalizedSrc,
        isFolder,
      ]);

    /* =======================================================
       STATE
       ======================================================= */

    const [
      candidateIndex,
      setCandidateIndex,
    ] = useState(0);

    const [
      hasError,
      setHasError,
    ] = useState(
      candidates.length === 0
    );

    const [
      isLoaded,
      setIsLoaded,
    ] = useState(false);

    /* =======================================================
       RESET ONLY WHEN SOURCE CHANGES
       ======================================================= */

    useEffect(() => {

      setCandidateIndex(0);

      setHasError(
        candidates.length === 0
      );

      setIsLoaded(false);

    }, [
      normalizedSrc,
      candidates.length,
    ]);

    /* =======================================================
       IMAGE ERROR
       ======================================================= */

    const handleImageError =
      () => {

        setIsLoaded(false);

        setCandidateIndex(
          (current) => {

            const next =
              current + 1;

            if (
              next >=
              candidates.length
            ) {
              setHasError(true);
            }

            return next;
          }
        );
      };

    /* =======================================================
       IMAGE SUCCESS
       ======================================================= */

    const handleImageLoad =
      (
        event:
          React.SyntheticEvent<
            HTMLImageElement
          >
      ) => {

        setIsLoaded(true);
        setHasError(false);

        const successfulUrl =
          event.currentTarget
            .currentSrc ||
          event.currentTarget
            .src;

        /*
         * Remember the URL that actually worked.
         *
         * On the next render/page visit,
         * we try this URL first.
         */
        if (
          normalizedSrc &&
          successfulUrl
        ) {

          setCachedImageUrl(
            normalizedSrc,
            successfulUrl
          );
        }
      };

    /* =======================================================
       FOLDER UI
       ======================================================= */

    if (
      isFolder &&
      showFolderPrompt
    ) {

      return (
        <div
          className={[
            "flex",
            "flex-col",
            "items-center",
            "justify-center",
            "gap-2",
            "w-full",
            "h-full",
            "min-h-[120px]",
            "bg-stone-100",
            "text-stone-500",
            className,
          ].join(" ")}
        >

          <Folder
            size={32}
            strokeWidth={1.5}
          />

          <span
            className="text-xs text-center px-3"
          >
            مجلد Google Drive
          </span>

          {folderId && (
            <a
              href={
                `https://drive.google.com/drive/folders/${folderId}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs underline"
            >
              فتح المجلد
              <ExternalLink
                size={12}
              />
            </a>
          )}

        </div>
      );
    }

    /* =======================================================
       EMPTY / ERROR UI
       ======================================================= */

    if (
      hasError ||
      !normalizedSrc ||
      candidates.length === 0 ||
      candidateIndex >=
        candidates.length
    ) {

      return (
        <div
          className={[
            "flex",
            "items-center",
            "justify-center",
            "w-full",
            "h-full",
            "min-h-[80px]",
            "bg-stone-100",
            "text-stone-400",
            className,
          ].join(" ")}
        >

          {fallbackIcon || (
            <ImageIcon
              size={32}
              strokeWidth={1.5}
            />
          )}

        </div>
      );
    }

    /* =======================================================
       CURRENT IMAGE
       ======================================================= */

    const currentSrc =
      candidates[
        candidateIndex
      ];

    /* =======================================================
       RENDER
       ======================================================= */

    return (
      <img
        {...props}
        src={currentSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        referrerPolicy="no-referrer"
        onError={
          handleImageError
        }
        onLoad={
          handleImageLoad
        }
        className={[
          className,
          "transition-opacity",
          "duration-200",
          isLoaded
            ? "opacity-100"
            : "opacity-0",
        ]
          .filter(Boolean)
          .join(" ")}
      />
    );
  };