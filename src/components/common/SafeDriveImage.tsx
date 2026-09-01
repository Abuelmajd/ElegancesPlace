import React, { useState, useEffect } from 'react';
import { 
  getDriveImageCandidates, 
  isGoogleDriveFolder, 
  extractGoogleDriveFolderId,
  extractGoogleDriveId,
  DEFAULT_DRIVE_FOLDER_ID
} from '../../utils/googleDriveUtils';
import { Image as ImageIcon, Folder, ExternalLink, AlertTriangle } from 'lucide-react';

interface SafeDriveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  showFolderPrompt?: boolean;
}

export const SafeDriveImage: React.FC<SafeDriveImageProps> = ({
  src = '',
  alt = 'صورة',
  className = '',
  fallbackIcon,
  showFolderPrompt = true,
  ...props
}) => {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const isFolder = Boolean(
    src && (
      isGoogleDriveFolder(src) || 
      src.trim() === DEFAULT_DRIVE_FOLDER_ID ||
      src.includes('/drive/folders/')
    )
  );

  const folderId = isFolder ? (extractGoogleDriveFolderId(src) || DEFAULT_DRIVE_FOLDER_ID) : null;

  useEffect(() => {
    if (!src || isFolder) {
      setCandidates([]);
      setCandidateIndex(0);
      setHasError(!src);
      setIsLoaded(false);
      return;
    }

    const list = getDriveImageCandidates(src);
    setCandidates(list);
    setCandidateIndex(0);
    setHasError(list.length === 0);
    setIsLoaded(false);
  }, [src, isFolder]);

  const handleImageError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex(prev => prev + 1);
    } else {
      setHasError(true);
    }
  };

  if (isFolder && showFolderPrompt) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100 border border-amber-200/80 rounded-2xl p-4 text-center select-none ${className}`}
        dir="rtl"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mb-2 shadow-2xs">
          <Folder className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-extrabold text-amber-900 leading-tight">
          مجلد Google Drive
        </span>
        <span className="text-[9px] font-mono text-amber-700 mt-0.5 truncate max-w-full px-2 py-0.5 bg-amber-100/70 rounded">
          {folderId}
        </span>
        <a 
          href={`https://drive.google.com/drive/folders/${folderId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-[10px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs hover:bg-emerald-50 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          تصفح الصور داخل المجلد
        </a>
      </div>
    );
  }

  if (hasError || !src || candidates.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center bg-stone-100 text-stone-400 border border-stone-200/60 rounded-xl select-none ${className}`}>
        {fallbackIcon || <ImageIcon className="w-6 h-6 stroke-[1.5]" />}
        <span className="text-[10px] text-stone-400 mt-1 font-medium">لا توجد صورة</span>
      </div>
    );
  }

  const currentSrc = candidates[candidateIndex] || src;

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={handleImageError}
      onLoad={() => setIsLoaded(true)}
      className={`${className} ${!isLoaded ? 'opacity-90 blur-[0.5px]' : 'opacity-100'} transition-opacity duration-200`}
      {...props}
    />
  );
};
