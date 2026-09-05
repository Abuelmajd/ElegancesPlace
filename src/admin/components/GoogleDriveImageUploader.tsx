import React, { useRef, useState } from 'react';
import {
  Upload,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  HardDrive,
  Sparkles,
  Link2,
  AlertCircle,
  Settings,
  ShieldCheck,
  X,
  Folder,
  FolderSearch,
  CheckCircle,
  Video,
  Image as ImageIcon,
} from 'lucide-react';

import { useGoogleSheets } from '../../contexts/GoogleSheetsContext';
import { useStoreManagement } from '../../contexts/StoreContext';

import {
  compressImageFile,
  extractGoogleDriveId,
  isGoogleDriveFolder,
  extractGoogleDriveFolderId,
  formatGoogleDriveDirectUrl,
  cacheDriveImagePreview,
} from '../../utils/googleDriveUtils';

import { SafeDriveImage } from '../../components/common/SafeDriveImage';

/* ============================================================
   TYPES
   ============================================================ */

interface GoogleDriveImageUploaderProps {
  onImageUploaded?: (
    directUrl: string,
    fileId: string,
    itemData?: any
  ) => void;

  defaultTag?: string;

  buttonLabel?: string;

  showPreview?: boolean;

  compact?: boolean;

  className?: string;
}

interface FolderMediaFile {
  fileId: string;
  fileName: string;
  directUrl?: string;
  viewUrl?: string;
  driveUrl?: string;
  mimeType: string;
  mediaType: 'image' | 'video';
  fileType?: 'image' | 'video';
}

/* ============================================================
   COMPONENT
   ============================================================ */

export const GoogleDriveImageUploader: React.FC<
  GoogleDriveImageUploaderProps
> = ({
  onImageUploaded,
  defaultTag = 'General',
  buttonLabel = 'رفع صورة أو فيديو إلى Google Drive',
  showPreview = true,
  compact = false,
  className = '',
}) => {
  const {
    config,
    setConfig,
    uploadMediaToDrive,
    fetchFolderMedia,
    syncNow,
  } = useGoogleSheets();

  const { addMediaItem } = useStoreManagement();

  /* ==========================================================
     STATE
     ========================================================== */

  const [isUploading, setIsUploading] =
    useState(false);

  const [uploadProgress, setUploadProgress] =
    useState<string>('');

  const [uploadedUrl, setUploadedUrl] =
    useState<string>('');

  const [uploadedMediaType, setUploadedMediaType] =
    useState<'image' | 'video'>('image');

  const [uploadedFileId, setUploadedFileId] =
    useState<string>('');

  const [wasLiveSaved, setWasLiveSaved] =
    useState<boolean | null>(null);

  const [copied, setCopied] =
    useState(false);

  const [isDragging, setIsDragging] =
    useState(false);

  const [selectedTag, setSelectedTag] =
    useState(defaultTag);

  const [manualDriveInput, setManualDriveInput] =
    useState('');

  const [showManualConverter, setShowManualConverter] =
    useState(false);

  const [showSetupModal, setShowSetupModal] =
    useState(false);

  const [modalWebhookInput, setModalWebhookInput] =
    useState(config.apiUrl || '');

  const [modalFolderInput, setModalFolderInput] =
    useState(config.folderId || '');

  const [errorMsg, setErrorMsg] =
    useState<string | null>(null);

  const [folderNotice, setFolderNotice] =
    useState<string | null>(null);

  /* ==========================================================
     FOLDER BROWSER
     ========================================================== */

  const [showFolderBrowser, setShowFolderBrowser] =
    useState(false);

  const [folderFiles, setFolderFiles] =
    useState<FolderMediaFile[]>([]);

  const [isLoadingFolder, setIsLoadingFolder] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  /* ==========================================================
     WEBHOOK STATUS
     ========================================================== */

  const isWebhookConfigured = Boolean(
    config.apiUrl &&
      config.apiUrl.startsWith('https://') &&
      !config.apiUrl.includes('AKfycb...')
  );

  /* ==========================================================
     FILE -> DATA URL
     ========================================================== */

  const fileToDataUrl = (
    file: File
  ): Promise<string> => {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () => {
          if (
            typeof reader.result ===
            'string'
          ) {
            resolve(
              reader.result
            );
          } else {
            reject(
              new Error(
                'تعذر قراءة الملف.'
              )
            );
          }
        };

        reader.onerror = () => {
          reject(
            reader.error ||
              new Error(
                'تعذر قراءة الملف.'
              )
          );
        };

        reader.readAsDataURL(
          file
        );
      }
    );
  };

  /* ==========================================================
     PROCESS IMAGE / VIDEO
     ========================================================== */

  const handleProcessFile =
    async (
      file: File
    ) => {
      const isImage =
        file.type.startsWith(
          'image/'
        );

      const isVideo =
        file.type.startsWith(
          'video/'
        );

      if (
        !isImage &&
        !isVideo
      ) {
        setErrorMsg(
          'يرجى اختيار صورة أو فيديو صالح.'
        );

        return;
      }

      setErrorMsg(null);
      setFolderNotice(null);
      setIsUploading(true);

      const mediaType:
        | 'image'
        | 'video' =
        isVideo
          ? 'video'
          : 'image';

      try {
        let base64Data = '';

        let sizeKb =
          Math.round(
            file.size / 1024
          );

        /* ------------------------------------------------------
           IMAGE
           ------------------------------------------------------ */

        if (isImage) {
          setUploadProgress(
            'جاري ضغط ومعالجة الصورة...'
          );

          const compressed =
            await compressImageFile(
              file,
              1400,
              0.88
            );

          base64Data =
            compressed.base64;

          sizeKb =
            compressed.sizeKb;
        }

        /* ------------------------------------------------------
           VIDEO
           ------------------------------------------------------ */

        if (isVideo) {
          setUploadProgress(
            'جاري تجهيز الفيديو للرفع...'
          );

          base64Data =
            await fileToDataUrl(
              file
            );
        }

        /* ------------------------------------------------------
           UPLOAD
           ------------------------------------------------------ */

        setUploadProgress(
          isVideo
            ? 'جاري رفع الفيديو إلى Google Drive...'
            : 'جاري رفع الصورة إلى Google Drive...'
        );

        const targetType =
          defaultTag ===
          'Categories'
            ? 'categories'
            : 'products';

        /*
         * الرفع الموحد V3.
         *
         * uploadMediaToDrive يستخدم:
         * action = upload_media_to_drive
         */
        const res =
          await uploadMediaToDrive(
            base64Data,
            file.name,
            file.type,
            targetType
          );

        if (
          !res ||
          !res.success
        ) {
          throw new Error(
            res?.error ||
              'فشل رفع الملف إلى Google Drive.'
          );
        }

        if (
          !res.fileId
        ) {
          throw new Error(
            'تمت الاستجابة بنجاح ولكن لم يتم إرجاع File ID.'
          );
        }

        const fileId =
          res.fileId;

        /*
         * الصور:
         * نفضل directUrl.
         *
         * الفيديو:
         * نفضل viewUrl.
         */
        const mediaUrl =
          mediaType ===
          'video'
            ? res.viewUrl ||
              res.directUrl ||
              res.driveUrl ||
              ''
            : res.directUrl ||
              res.viewUrl ||
              res.driveUrl ||
              '';

        if (!mediaUrl) {
          throw new Error(
            'لم يتم الحصول على رابط للملف.'
          );
        }

        /* ------------------------------------------------------
           IMAGE CACHE ONLY
           ------------------------------------------------------ */

        if (
          mediaType ===
          'image'
        ) {
          try {
            cacheDriveImagePreview(
              fileId,
              base64Data
            );
          } catch (
            cacheError
          ) {
            console.warn(
              'تعذر حفظ معاينة الصورة مؤقتًا:',
              cacheError
            );
          }
        }

        /* ------------------------------------------------------
           MEDIA LIBRARY ITEM
           ------------------------------------------------------ */

        const newItem = {
          name:
            file.name.replace(
              /\.[^/.]+$/,
              ''
            ),

          url:
            mediaUrl,

          drive_file_id:
            fileId,

          size_kb:
            sizeKb,

          type:
            res.mimeType ||
            file.type,

          media_type:
            mediaType,

          mime_type:
            res.mimeType ||
            file.type,

          used_in: [
            selectedTag,
          ],
        };

        addMediaItem(
          newItem
        );

        /* ------------------------------------------------------
           BACKGROUND SYNC
           ------------------------------------------------------ */

        try {
          void syncNow();
        } catch {
          // لا نوقف عملية الرفع بسبب فشل المزامنة الخلفية.
        }

        /* ------------------------------------------------------
           RESULT STATE
           ------------------------------------------------------ */

        setUploadedUrl(
          mediaUrl
        );

        setUploadedFileId(
          fileId
        );

        setUploadedMediaType(
          mediaType
        );

        setWasLiveSaved(
          true
        );

        setUploadProgress(
          mediaType ===
          'video'
            ? 'تم رفع الفيديو وحفظه في Google Drive بنجاح! 🎬✨'
            : 'تم رفع الصورة وحفظها في Google Drive بنجاح! ✨'
        );

        if (
          onImageUploaded
        ) {
          onImageUploaded(
            mediaUrl,
            fileId,
            newItem
          );
        }
      } catch (
        err: any
      ) {
        console.error(
          'Media upload failed:',
          err
        );

        setErrorMsg(
          err?.message ||
            'حدث خطأ أثناء رفع الملف، يرجى المحاولة مرة أخرى.'
        );

        setUploadProgress('');
      } finally {
        setIsUploading(
          false
        );

        setTimeout(
          () =>
            setUploadProgress(
              ''
            ),
          3500
        );
      }
    };

  /* ==========================================================
     FILE INPUT
     ========================================================== */

  const handleFileChange =
    (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        e.target.files?.[0];

      if (file) {
        void handleProcessFile(
          file
        );
      }

      e.target.value = '';
    };

  /* ==========================================================
     DRAG & DROP
     ========================================================== */

  const handleDrop =
    (
      e: React.DragEvent
    ) => {
      e.preventDefault();

      setIsDragging(
        false
      );

      const file =
        e.dataTransfer.files?.[0];

      if (file) {
        void handleProcessFile(
          file
        );
      }
    };

  const handleDragOver =
    (
      e: React.DragEvent
    ) => {
      e.preventDefault();

      setIsDragging(
        true
      );
    };

  const handleDragLeave =
    () => {
      setIsDragging(
        false
      );
    };

  /* ==========================================================
     COPY LINK
     ========================================================== */

  const handleCopyLink =
    async () => {
      if (!uploadedUrl) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          uploadedUrl
        );

        setCopied(
          true
        );

        setTimeout(
          () =>
            setCopied(
              false
            ),
          2500
        );
      } catch {
        setErrorMsg(
          'تعذر نسخ الرابط تلقائيًا.'
        );
      }
    };

  /* ==========================================================
     FETCH FOLDER MEDIA
     ========================================================== */

  const handleLoadFolderMedia =
    async (
      folderIdToLoad?: string
    ) => {
      const targetFolderId =
        folderIdToLoad ||
        config.folderId;

      if (!targetFolderId) {
        setFolderNotice(
          'لم يتم تحديد مجلد Google Drive.'
        );

        return;
      }

      setIsLoadingFolder(
        true
      );

      setShowFolderBrowser(
        true
      );

      setErrorMsg(
        null
      );

      try {
        const res =
          await fetchFolderMedia(
            targetFolderId
          );

        if (
          res.success &&
          Array.isArray(
            res.files
          )
        ) {
          setFolderFiles(
            res.files
          );

          if (
            res.files.length ===
            0
          ) {
            setFolderNotice(
              'تم الاتصال بالمجلد ولكن لم يتم العثور على صور أو فيديوهات داخله.'
            );
          } else {
            const imageCount =
              res.files.filter(
                (
                  file
                ) =>
                  file.mediaType ===
                  'image'
              ).length;

            const videoCount =
              res.files.filter(
                (
                  file
                ) =>
                  file.mediaType ===
                  'video'
              ).length;

            setFolderNotice(
              `تم العثور على ${imageCount} صورة و${videoCount} فيديو في المجلد.`
            );
          }
        } else {
          setFolderFiles(
            []
          );

          setFolderNotice(
            `تعذر جلب الوسائط: ${
              res.error ||
              'يرجى التأكد من إعداد Apps Script وصلاحيات Google Drive.'
            }`
          );
        }
      } catch (
        e: any
      ) {
        setFolderFiles(
          []
        );

        setFolderNotice(
          'تعذر استعراض وسائط المجلد حاليًا: ' +
            (
              e?.message ||
              e
            )
        );
      } finally {
        setIsLoadingFolder(
          false
        );
      }
    };

  /* ==========================================================
     SELECT FOLDER MEDIA
     ========================================================== */

  const handleSelectFolderFile =
    (
      file: FolderMediaFile
    ) => {
      const mediaUrl =
        file.mediaType ===
        'video'
          ? file.viewUrl ||
            file.directUrl ||
            file.driveUrl ||
            ''
          : file.directUrl ||
            file.viewUrl ||
            file.driveUrl ||
            '';

      if (!mediaUrl) {
        setErrorMsg(
          'لم يتم العثور على رابط صالح لهذا الملف.'
        );

        return;
      }

      setUploadedUrl(
        mediaUrl
      );

      setUploadedFileId(
        file.fileId
      );

      setUploadedMediaType(
        file.mediaType
      );

      setWasLiveSaved(
        true
      );

      setErrorMsg(
        null
      );

      setFolderNotice(
        `تم اختيار ${
          file.mediaType ===
          'video'
            ? 'الفيديو'
            : 'الصورة'
        } "${file.fileName}" من Google Drive بنجاح!`
      );

      const newItem = {
        name:
          file.fileName,

        url:
          mediaUrl,

        drive_file_id:
          file.fileId,

        /*
         * لا نفترض حجمًا وهميًا.
         */
        size_kb:
          0,

        type:
          file.mimeType ||
          (
            file.mediaType ===
            'video'
              ? 'video/mp4'
              : 'image/jpeg'
          ),

        media_type:
          file.mediaType,

        mime_type:
          file.mimeType,

        used_in: [
          selectedTag,
        ],
      };

      addMediaItem(
        newItem
      );

      try {
        void syncNow();
      } catch {
        // background sync
      }

      if (
        onImageUploaded
      ) {
        onImageUploaded(
          mediaUrl,
          file.fileId,
          newItem
        );
      }
    };

  /* ==========================================================
     MANUAL DRIVE LINK
     ========================================================== */

  const handleConvertManualDriveLink =
    async () => {
      const input =
        manualDriveInput.trim();

      if (!input) {
        return;
      }

      /*
       * Folder link / Folder ID
       */
      if (
        isGoogleDriveFolder(
          input
        ) ||
        input.includes(
          'folders/'
        )
      ) {
        const folderId =
          extractGoogleDriveFolderId(
            input
          ) ||
          input;

        setConfig(
          (previous) => ({
            ...previous,
            folderId,
          })
        );

        setModalFolderInput(
          folderId
        );

        setFolderNotice(
          `تم ضبط مجلد Google Drive (${folderId}) كمجلد الوسائط. جاري استعراض محتواه...`
        );

        setShowFolderBrowser(
          true
        );

        await handleLoadFolderMedia(
          folderId
        );

        setManualDriveInput(
          ''
        );

        return;
      }

      /*
       * Individual file
       */
      const fileId =
        extractGoogleDriveId(
          input
        );

      if (!fileId) {
        setErrorMsg(
          'لم يتم التعرف على معرّف Google Drive صالح في الرابط المُدخل.'
        );

        return;
      }

      setErrorMsg(
        null
      );

      const directUrl =
        formatGoogleDriveDirectUrl(
          fileId
        );

      setUploadedUrl(
        directUrl
      );

      setUploadedFileId(
        fileId
      );

      setUploadedMediaType(
        'image'
      );

      setWasLiveSaved(
        true
      );

      /*
       * الرابط اليدوي لا يحتوي لدينا على MIME موثوق.
       * لذلك يبقى متوافقًا كصورة قديمة.
       */
      const newItem = {
        name:
          'Google Drive Image (' +
          fileId.substring(
            0,
            8
          ) +
          ')',

        url:
          directUrl,

        drive_file_id:
          fileId,

        size_kb:
          0,

        type:
          'image/jpeg',

        media_type:
          'image',

        mime_type:
          'image/jpeg',

        used_in: [
          selectedTag,
        ],
      };

      addMediaItem(
        newItem
      );

      try {
        void syncNow();
      } catch {
        // background sync
      }

      if (
        onImageUploaded
      ) {
        onImageUploaded(
          directUrl,
          fileId,
          newItem
        );
      }

      setManualDriveInput(
        ''
      );
    };

  /* ==========================================================
     SAVE SETTINGS
     ========================================================== */

  const handleSaveModalSettings =
    () => {
      const apiUrl =
        modalWebhookInput.trim();

      const folderId =
        modalFolderInput.trim();

      setConfig(
        (previous) => ({
          ...previous,

          apiUrl,

          folderId,
        })
      );

      setShowSetupModal(
        false
      );
    };

  /* ==========================================================
     SETUP MODAL
     ========================================================== */

  function renderSetupModal() {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in"
        dir="rtl"
      >
        <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-400" />

              <h3 className="font-bold text-base">
                إعداد حفظ الوسائط في Google Drive
              </h3>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowSetupModal(
                  false
                )
              }
              className="text-stone-400 hover:text-white cursor-pointer p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Status */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                isWebhookConfigured
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                    isWebhookConfigured
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {isWebhookConfigured
                    ? '✓'
                    : '!'}
                </div>

                <div>
                  <h4 className="font-extrabold text-sm">
                    {isWebhookConfigured
                      ? 'الربط السحابي مع Google Drive مفعل'
                      : 'بانتظار إعداد رابط Google Apps Script'}
                  </h4>

                  <p className="text-xs mt-0.5 opacity-90">
                    {isWebhookConfigured
                      ? 'يمكن رفع الصور والفيديوهات واستعراضها من Google Drive.'
                      : 'أدخل رابط Webhook الخاص بنسخة Apps Script V3 المنشورة.'}
                  </p>
                </div>
              </div>
            </div>

            {/* V3 warning */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />

                <div className="space-y-1.5">
                  <strong>
                    قاعدة مهمة — Google Sheets / Apps Script V3
                  </strong>

                  <p className="leading-relaxed">
                    هذا المكوّن يستخدم نسخة
                    <strong> API V3 الحالية </strong>
                    التي تم إعدادها للمشروع.
                    لا تحذف كود Apps Script الحالي
                    ولا تستبدله بكود قديم من هذه الواجهة.
                  </p>

                  <p className="leading-relaxed">
                    الرفع يستخدم
                    <code className="mx-1 font-mono font-bold">
                      upload_media_to_drive
                    </code>
                    والاستعراض يستخدم
                    <code className="mx-1 font-mono font-bold">
                      fetch_folder_media
                    </code>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Folder */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2">
              <label className="block text-xs font-bold text-stone-800">
                معرف مجلد Google Drive:
              </label>

              <input
                type="text"
                value={
                  modalFolderInput
                }
                onChange={(e) =>
                  setModalFolderInput(
                    e.target.value
                  )
                }
                placeholder="Google Drive Folder ID"
                className="w-full p-2.5 bg-white border border-stone-200 rounded-xl font-mono text-xs text-stone-900 focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />

              <span className="text-[11px] text-stone-500 block">
                المجلد المعتمد حاليًا:
                {' '}
                <code className="text-emerald-700 font-bold">
                  {config.folderId ||
                    'غير محدد'}
                </code>
              </span>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <h5 className="font-extrabold text-xs text-stone-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />

                إعداد Webhook V3
              </h5>

              <ol className="space-y-2 text-xs text-stone-700 list-decimal list-inside bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <li className="leading-relaxed">
                  افتح Google Sheets المرتبط بالمشروع.
                </li>

                <li className="leading-relaxed">
                  افتح
                  <strong>
                    {' '}
                    Extensions &gt; Apps Script
                  </strong>
                  .
                </li>

                <li className="leading-relaxed">
                  استخدم نسخة Apps Script V3 الحالية التي تم إعدادها للمشروع.
                  <strong>
                    {' '}
                    لا تستبدلها بالكود القديم.
                  </strong>
                </li>

                <li className="leading-relaxed">
                  انشر السكربت كتطبيق ويب:
                  <strong>
                    {' '}
                    Deploy &gt; New deployment &gt; Web app
                  </strong>
                  .
                </li>

                <li className="leading-relaxed">
                  اختر:
                  <div className="mt-1 mr-5 p-2 bg-emerald-100/60 rounded-lg text-[11px] text-emerald-900 font-semibold">
                    Execute as: Me
                    {' — '}
                    Who has access: Anyone
                  </div>
                </li>

                <li className="leading-relaxed">
                  ضع رابط Web App الناتج في الحقل أدناه.
                </li>
              </ol>
            </div>

            {/* Webhook */}
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <label className="block text-xs font-bold text-stone-800">
                رابط Google Apps Script Webhook V3:
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={
                    modalWebhookInput
                  }
                  onChange={(e) =>
                    setModalWebhookInput(
                      e.target.value
                    )
                  }
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  dir="ltr"
                />

                <button
                  type="button"
                  onClick={
                    handleSaveModalSettings
                  }
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                >
                  حفظ وتفعيل
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     FOLDER BROWSER MODAL
     ========================================================== */

  function renderFolderBrowserModal() {
    const activeFolderId =
      config.folderId ||
      '';

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in"
        dir="rtl"
      >
        <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-emerald-400" />

              <div>
                <h3 className="font-bold text-sm">
                  مستعرض وسائط مجلد Google Drive
                </h3>

                <span className="text-[11px] font-mono text-stone-400">
                  {activeFolderId}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowFolderBrowser(
                  false
                )
              }
              className="text-stone-400 hover:text-white cursor-pointer p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-700">
                المجلد الفعّال:
              </span>

              {activeFolderId ? (
                <a
                  href={`https://drive.google.com/drive/folders/${activeFolderId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 font-mono font-bold flex items-center gap-1 hover:underline"
                >
                  فتح في Google Drive

                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-stone-400">
                  غير محدد
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                handleLoadFolderMedia(
                  activeFolderId
                )
              }
              disabled={
                isLoadingFolder ||
                !activeFolderId
              }
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isLoadingFolder
                    ? 'animate-spin'
                    : ''
                }`}
              />

              <span>
                تحديث وفحص المجلد
              </span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 overflow-y-auto">
            {isLoadingFolder ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />

                <p className="text-xs font-bold text-stone-600">
                  جاري فحص الصور والفيديوهات وجلب الروابط...
                </p>
              </div>
            ) : folderFiles.length ===
              0 ? (
              <div className="py-12 text-center space-y-3">
                <FolderSearch className="w-12 h-12 text-stone-300 mx-auto" />

                <h4 className="font-bold text-sm text-stone-800">
                  لم يتم العثور على وسائط
                </h4>

                <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                  تأكد من أن المجلد يحتوي على صور أو فيديوهات وأن Apps Script V3 يعمل بشكل صحيح.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {folderFiles.map(
                  (
                    file
                  ) => (
                    <div
                      key={
                        file.fileId
                      }
                      className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                      {/* Preview */}
                      <div className="aspect-square bg-stone-100 relative overflow-hidden">
                        {file.mediaType ===
                        'video' ? (
                          <video
                            src={
                              file.viewUrl ||
                              file.directUrl ||
                              file.driveUrl
                            }
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                            onClick={(
                              e
                            ) =>
                              e.stopPropagation()
                            }
                          />
                        ) : (
                          <SafeDriveImage
                            src={
                              file.directUrl ||
                              file.viewUrl ||
                              file.driveUrl ||
                              ''
                            }
                            alt={
                              file.fileName
                            }
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              file.mediaType ===
                              'video'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {file.mediaType ===
                            'video' ? (
                              <>
                                <Video className="inline w-3 h-3 ml-1" />
                                فيديو
                              </>
                            ) : (
                              <>
                                <ImageIcon className="inline w-3 h-3 ml-1" />
                                صورة
                              </>
                            )}
                          </span>

                          <span className="text-[10px] text-stone-400 truncate">
                            {
                              file.mimeType
                            }
                          </span>
                        </div>

                        <span
                          className="text-[11px] font-bold text-stone-800 line-clamp-1 block"
                          title={
                            file.fileName
                          }
                        >
                          {
                            file.fileName
                          }
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            handleSelectFolderFile(
                              file
                            );

                            setShowFolderBrowser(
                              false
                            );
                          }}
                          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] cursor-pointer transition-colors shadow-2xs"
                        >
                          اختيار وتطبيق ✓
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     COMPACT MODE
     ========================================================== */

  if (compact) {
    return (
      <div
        className={`space-y-2 ${className}`}
        dir="rtl"
      >
        <input
          type="file"
          ref={
            fileInputRef
          }
          onChange={
            handleFileChange
          }
          accept="image/*,video/*"
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={
              isUploading
            }
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isUploading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <HardDrive className="w-3.5 h-3.5" />
            )}

            {isUploading
              ? uploadProgress ||
                'جاري الرفع...'
              : buttonLabel}
          </button>

          <button
            type="button"
            onClick={() =>
              handleLoadFolderMedia()
            }
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
            title="استعراض الصور والفيديوهات من مجلد Drive"
          >
            <FolderSearch className="w-3.5 h-3.5 text-emerald-600" />

            <span>
              تصفح الوسائط
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setShowManualConverter(
                !showManualConverter
              )
            }
            className="p-2 text-stone-600 hover:bg-stone-100 rounded-xl border border-stone-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title="تحويل رابط Google Drive أو مجلد"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() =>
              setShowSetupModal(
                true
              )
            }
            className="p-2 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl border border-stone-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title="إعدادات Google Drive"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Manual converter */}
        {showManualConverter && (
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2 animate-in fade-in text-xs">
            <span className="font-bold text-stone-700 block">
              لصق رابط ملف أو مجلد من Google Drive:
            </span>

            <div className="flex gap-2">
              <input
                type="text"
                value={
                  manualDriveInput
                }
                onChange={(e) =>
                  setManualDriveInput(
                    e.target.value
                  )
                }
                placeholder="https://drive.google.com/drive/folders/..."
                className="flex-1 p-2 bg-white border border-stone-200 rounded-xl font-mono text-xs text-stone-800"
              />

              <button
                type="button"
                onClick={
                  handleConvertManualDriveLink
                }
                className="px-3 py-2 bg-stone-900 text-white rounded-xl font-bold cursor-pointer hover:bg-stone-800"
              >
                تطبيق
              </button>
            </div>
          </div>
        )}

        {folderNotice && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />

            <span>
              {folderNotice}
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />

            <span>
              {errorMsg}
            </span>
          </div>
        )}

        {uploadedUrl && (
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-[11px] text-emerald-900">
            <span className="font-mono truncate font-bold">
              {uploadedUrl}
            </span>

            <button
              type="button"
              onClick={
                handleCopyLink
              }
              className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-md cursor-pointer shrink-0"
              title="نسخ الرابط"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}

        {showSetupModal &&
          renderSetupModal()}

        {showFolderBrowser &&
          renderFolderBrowserModal()}
      </div>
    );
  }

  /* ==========================================================
     FULL MODE
     ========================================================== */

  return (
    <div
      className={`p-5 bg-gradient-to-br from-emerald-50/50 via-white to-stone-50 rounded-3xl border border-emerald-100 shadow-xs space-y-4 ${className}`}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <HardDrive className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-stone-900">
                رافع الوسائط إلى Google Drive
              </h3>

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isWebhookConfigured
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {isWebhookConfigured
                  ? '🟢 متصل بـ Google Drive'
                  : '🟡 بانتظار Webhook'}
              </span>
            </div>

            <p className="text-xs text-stone-500 mt-0.5">
              رفع الصور والفيديوهات إلى مجلد Google Drive.
              {' '}
              {config.folderId && (
                <>
                  المجلد:
                  {' '}
                  <code className="font-mono text-emerald-700 text-[10px] font-bold">
                    {
                      config.folderId
                    }
                  </code>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() =>
              handleLoadFolderMedia()
            }
            className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <FolderSearch className="w-3.5 h-3.5 text-emerald-600" />

            تصفح الوسائط
          </button>

          <button
            type="button"
            onClick={() =>
              setShowSetupModal(
                true
              )
            }
            className="px-3 py-1.5 bg-white border border-stone-200 hover:border-emerald-500 hover:text-emerald-700 rounded-xl text-xs font-bold text-stone-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-600" />

            إعدادات Drive
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-stone-600">
              القسم:
            </span>

            <select
              value={
                selectedTag
              }
              onChange={(e) =>
                setSelectedTag(
                  e.target.value
                )
              }
              className="p-1.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Categories">
                الكتالوجات والأقسام
              </option>

              <option value="Products">
                المنتجات
              </option>

              <option value="Banners">
                البنرات والواجهة
              </option>

              <option value="Logo">
                الشعارات والهوية
              </option>

              <option value="General">
                عام
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Webhook warning */}
      {!isWebhookConfigured && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />

            <span>
              لتخزين الوسائط فعليًا داخل حساب Google Drive، يرجى التأكد من إعداد Webhook V3.
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowSetupModal(
                true
              )
            }
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer shadow-xs"
          >
            إعداد Google Drive
          </button>
        </div>
      )}

      {/* File input */}
      <input
        type="file"
        ref={
          fileInputRef
        }
        onChange={
          handleFileChange
        }
        accept="image/*,video/*"
        className="hidden"
      />

      {/* Drag & Drop */}
      <div
        onDrop={
          handleDrop
        }
        onDragOver={
          handleDragOver
        }
        onDragLeave={
          handleDragLeave
        }
        onClick={() =>
          !isUploading &&
          fileInputRef.current?.click()
        }
        className={`p-8 border-2 border-dashed rounded-3xl text-center ${
          isUploading
            ? 'cursor-wait'
            : 'cursor-pointer'
        } transition-all flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
            : 'border-stone-300 hover:border-emerald-500 bg-white/80 hover:bg-emerald-50/30'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
          {isUploading ? (
            <RefreshCw className="w-7 h-7 animate-spin text-emerald-600" />
          ) : (
            <Upload className="w-7 h-7" />
          )}
        </div>

        <div className="space-y-1">
          <h4 className="font-extrabold text-sm text-stone-900">
            {isUploading
              ? uploadProgress ||
                'جاري رفع ومعالجة الملف...'
              : 'اسحب وأفلت صورة أو فيديو هنا، أو اضغط للاختيار'}
          </h4>

          <p className="text-xs text-stone-500">
            يدعم الصور والفيديوهات.
            الصور يتم ضغطها تلقائيًا، بينما الفيديو يُرفع كفيديو أصلي.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 flex-wrap justify-center">
          <span className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors">
            {buttonLabel}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();

              setShowManualConverter(
                !showManualConverter
              );
            }}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors"
          >
            لصق رابط Drive 🔗
          </button>
        </div>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />

          <span>
            {errorMsg}
          </span>
        </div>
      )}

      {/* Folder notice */}
      {folderNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />

          <span>
            {folderNotice}
          </span>
        </div>
      )}

      {/* Manual converter */}
      {showManualConverter && (
        <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-emerald-600" />

              أدخل رابط ملف أو رابط مجلد من Google Drive:
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={
                manualDriveInput
              }
              onChange={(e) =>
                setManualDriveInput(
                  e.target.value
                )
              }
              placeholder="https://drive.google.com/drive/folders/..."
              className="flex-1 p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />

            <button
              type="button"
              onClick={
                handleConvertManualDriveLink
              }
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
            >
              تحويل وتطبيق ⚡
            </button>
          </div>

          <p className="text-[11px] text-stone-400">
            يمكنك إدخال رابط ملف أو رابط مجلد كامل لتصفح واختيار الصور والفيديوهات منه.
          </p>
        </div>
      )}

      {/* Result */}
      {uploadedUrl &&
        showPreview && (
          <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />

                تم تجهيز الوسائط من Google Drive:
              </span>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  wasLiveSaved
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {wasLiveSaved
                  ? '✅ محفوظ في Google Drive'
                  : '⚡ تم تجهيز الرابط'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Preview */}
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                {uploadedMediaType ===
                'video' ? (
                  <video
                    src={
                      uploadedUrl
                    }
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                  />
                ) : (
                  <SafeDriveImage
                    src={
                      uploadedUrl
                    }
                    alt="Uploaded media"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 space-y-2 w-full">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-0.5">
                    نوع الوسائط:
                  </label>

                  <div className="p-2 bg-stone-50 rounded-xl text-xs font-bold text-stone-800 border border-stone-200">
                    {uploadedMediaType ===
                    'video'
                      ? '🎬 فيديو'
                      : '🖼️ صورة'}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-0.5">
                    معرف الملف (File ID):
                  </label>

                  <div className="p-2 bg-stone-50 rounded-xl font-mono text-xs font-bold text-stone-800 border border-stone-200 select-all">
                    {
                      uploadedFileId
                    }
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-0.5">
                    رابط الملف:
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={
                        uploadedUrl
                      }
                      className="flex-1 p-2 bg-stone-50 rounded-xl font-mono text-xs font-bold text-emerald-800 border border-stone-200 select-all"
                    />

                    <button
                      type="button"
                      onClick={
                        handleCopyLink
                      }
                      className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}

                      {copied
                        ? 'تم النسخ'
                        : 'نسخ الرابط'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Modals */}
      {showSetupModal &&
        renderSetupModal()}

      {showFolderBrowser &&
        renderFolderBrowserModal()}
    </div>
  );
};

export default GoogleDriveImageUploader;