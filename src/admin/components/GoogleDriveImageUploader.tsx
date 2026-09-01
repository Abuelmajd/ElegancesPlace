import React, { useState, useRef } from 'react';
import { 
  Upload, Check, Copy, ExternalLink, RefreshCw, 
  Image as ImageIcon, HardDrive, Sparkles, Link2, AlertCircle,
  HelpCircle, Settings, CheckCircle2, ShieldCheck, X, FileText,
  Folder, FolderSearch, CheckCircle
} from 'lucide-react';
import { useGoogleSheets } from '../../contexts/GoogleSheetsContext';
import { useStoreManagement } from '../../contexts/StoreContext';
import { 
  compressImageFile, 
  extractGoogleDriveId, 
  isGoogleDriveFolder,
  extractGoogleDriveFolderId,
  formatGoogleDriveDirectUrl, 
  cacheDriveImagePreview 
} from '../../utils/googleDriveUtils';
import { SafeDriveImage } from '../../components/common/SafeDriveImage';

interface GoogleDriveImageUploaderProps {
  onImageUploaded?: (directUrl: string, fileId: string, itemData?: any) => void;
  defaultTag?: string;
  buttonLabel?: string;
  showPreview?: boolean;
  compact?: boolean;
  className?: string;
}

export const GoogleDriveImageUploader: React.FC<GoogleDriveImageUploaderProps> = ({
  onImageUploaded,
  defaultTag = 'General',
  buttonLabel = 'رفع صورة من الكمبيوتر إلى Google Drive',
  showPreview = true,
  compact = false,
  className = ''
}) => {
  const { config, updateConfig, uploadImageToDrive, fetchFolderImages, syncNow } = useGoogleSheets();
  const { addMediaItem } = useStoreManagement();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [uploadedFileId, setUploadedFileId] = useState<string>('');
  const [wasLiveSaved, setWasLiveSaved] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTag, setSelectedTag] = useState(defaultTag);
  const [manualDriveInput, setManualDriveInput] = useState('');
  const [showManualConverter, setShowManualConverter] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [modalWebhookInput, setModalWebhookInput] = useState(config.webhookUrl || '');
  const [modalFolderInput, setModalFolderInput] = useState(config.folderId || '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R');
  const [scriptCopied, setScriptCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [folderNotice, setFolderNotice] = useState<string | null>(null);

  // Folder browser state
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [folderFiles, setFolderFiles] = useState<Array<{ id: string; name: string; directUrl: string; mimeType: string }>>([]);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isWebhookConfigured = Boolean(
    config.webhookUrl && 
    config.webhookUrl.startsWith('https://') && 
    !config.webhookUrl.includes('AKfycb...')
  );

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)');
      return;
    }

    setErrorMsg(null);
    setFolderNotice(null);
    setIsUploading(true);
    setUploadProgress('جاري ضغط ومعالجة الصورة...');

    try {
      // 1. Client-side compression
      const { base64, sizeKb } = await compressImageFile(file, 1400, 0.88);
      
      setUploadProgress('جاري الرفع إلى Google Drive وتوليد الرابط المباشر...');

      // 2. Upload to Drive & generate https://lh3.googleusercontent.com/d/{id}
      const targetType = defaultTag === 'Categories' ? 'categories' : 'products';
      const res = await uploadImageToDrive(base64, file.name, file.type, targetType);
      
      if (res && res.driveUrl) {
        const directUrl = res.driveUrl;
        const fileId = res.fileId || extractGoogleDriveId(directUrl) || 'drive_' + Date.now();

        // 3. Cache preview for immediate UI display
        cacheDriveImagePreview(directUrl, base64);

        // 4. Save to Media Library in StoreContext
        const newItem = {
          name: file.name.replace(/\.[^/.]+$/, ''),
          url: directUrl,
          drive_file_id: fileId,
          size_kb: sizeKb,
          type: file.type,
          used_in: [selectedTag]
        };
        addMediaItem(newItem);

        // 5. Trigger Google Sheets Sync
        try {
          syncNow();
        } catch (e) {
          // background sync
        }

        setUploadedUrl(directUrl);
        setUploadedFileId(fileId);
        setWasLiveSaved(res.isLiveDrive ?? false);
        setUploadProgress(res.isLiveDrive ? 'تم الرفع وحفظ الصورة في مجلد Google Drive بنجاح! ✨' : 'تم تجهيز رابط الصورة بنجاح! ✨');

        if (onImageUploaded) {
          onImageUploaded(directUrl, fileId, newItem);
        }
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMsg('حدث خطأ أثناء رفع الصورة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(''), 3500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleCopyLink = () => {
    if (!uploadedUrl) return;
    navigator.clipboard.writeText(uploadedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLoadFolderImages = async (folderIdToLoad?: string) => {
    const targetFolderId = folderIdToLoad || config.folderId || '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R';
    setIsLoadingFolder(true);
    setShowFolderBrowser(true);
    setErrorMsg(null);
    try {
      const res = await fetchFolderImages(targetFolderId);
      if (res.success && res.files) {
        setFolderFiles(res.files);
        if (res.files.length === 0) {
          setFolderNotice(`تم الاتصال بالمجلد (${targetFolderId}) ولكن لم يتم العثور على ملفات صور داخله بعد.`);
        }
      } else {
        setFolderNotice(`تنبيه: ${res.error || 'يرجى التأكد من تفعيل Apps Script وإعطاء صلاحيات القراءة للمجلد.'}`);
      }
    } catch (e: any) {
      setFolderNotice('تعذر استعراض صور المجلد حالياً: ' + (e.message || e));
    } finally {
      setIsLoadingFolder(false);
    }
  };

  const handleSelectFolderFile = (file: { id: string; name: string; directUrl: string }) => {
    setUploadedUrl(file.directUrl);
    setUploadedFileId(file.id);
    setWasLiveSaved(true);
    setErrorMsg(null);
    setFolderNotice(`تم اختيار الصورة "${file.name}" من مجلد Google Drive بنجاح!`);

    const newItem = {
      name: file.name,
      url: file.directUrl,
      drive_file_id: file.id,
      size_kb: 150,
      type: 'image/jpeg',
      used_in: [selectedTag]
    };
    addMediaItem(newItem);
    syncNow();

    if (onImageUploaded) {
      onImageUploaded(file.directUrl, file.id, newItem);
    }
  };

  const handleConvertManualDriveLink = async () => {
    const input = manualDriveInput.trim();
    if (!input) return;

    // Check if user entered a folder link or folder ID
    if (isGoogleDriveFolder(input) || input.includes('folders/')) {
      const folderId = extractGoogleDriveFolderId(input) || input;
      updateConfig({ folderId });
      setModalFolderInput(folderId);
      setFolderNotice(`تم ضبط مجلد Google Drive (${folderId}) كمجلد صور المتجر. جاري استعراض صوره...`);
      setShowFolderBrowser(true);
      await handleLoadFolderImages(folderId);
      setManualDriveInput('');
      return;
    }

    const fileId = extractGoogleDriveId(input);
    if (!fileId) {
      setErrorMsg('لم يتم التعرف على معرّف Google Drive صالح في الرابط المُدخل.');
      return;
    }

    setErrorMsg(null);
    const directUrl = formatGoogleDriveDirectUrl(fileId);
    setUploadedUrl(directUrl);
    setUploadedFileId(fileId);
    setWasLiveSaved(true);

    const newItem = {
      name: 'Google Drive Image (' + fileId.substring(0, 8) + ')',
      url: directUrl,
      drive_file_id: fileId,
      size_kb: 150,
      type: 'image/jpeg',
      used_in: [selectedTag]
    };
    addMediaItem(newItem);
    syncNow();

    if (onImageUploaded) {
      onImageUploaded(directUrl, fileId, newItem);
    }

    setManualDriveInput('');
  };

  const handleSaveModalSettings = () => {
    updateConfig({ 
      webhookUrl: modalWebhookInput.trim(),
      folderId: modalFolderInput.trim() || '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R'
    });
    setShowSetupModal(false);
  };

  const copyAppsScriptCode = () => {
    const activeFolder = config.folderId || '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R';
    const scriptCode = `// ==========================================================================
// Google Apps Script لمتجر النخبة: إدارة 24 جدولاً + Google Drive لحفظ واستعراض الصور
// ==========================================================================

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "get_all_tables";
    
    if (action === "get_all_tables") {
      var sheets = ss.getSheets();
      var resultTables = {};
      
      for (var i = 0; i < sheets.length; i++) {
        var sheet = sheets[i];
        var name = sheet.getName();
        var data = sheet.getDataRange().getValues();
        if (data.length > 1) {
          var headers = data[0];
          var rows = [];
          for (var r = 1; r < data.length; r++) {
            var item = {};
            for (var c = 0; c < headers.length; c++) {
              item[headers[c]] = data[r][c];
            }
            rows.push(item);
          }
          resultTables[name] = rows;
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        tables: resultTables,
        source: "Google Sheets Cloud Database"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "ok", service: "Elites Store Cloud API" })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var defaultFolderId = "${activeFolder}";
    var mediaFolder = getTargetFolder(data.folderId || defaultFolderId);
    
    // 1. رفع وتخزين صورة مباشرة في Google Drive
    if (data.action === "upload_image_to_drive") {
      var base64Data = data.base64Data;
      if (typeof base64Data === "string") {
        base64Data = base64Data.replace(/^data:image\\/[a-zA-Z0-9.+_-]+;base64,/, "");
      }
      var decoded = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decoded, data.mimeType || "image/jpeg", data.fileName || ("prod_" + new Date().getTime() + ".jpg"));
      var file = mediaFolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var fileId = file.getId();
      var directUrl = "https://lh3.googleusercontent.com/d/" + fileId;
      
      // تسجيل الصورة في جدول Media_Library
      try {
        var mediaSheet = ss.getSheetByName("Media_Library");
        if (!mediaSheet) {
          mediaSheet = ss.insertSheet("Media_Library");
          mediaSheet.appendRow(["media_id", "name", "google_drive_id", "direct_drive_link", "size_kb", "type", "used_in", "created_at"]);
          mediaSheet.getRange(1, 1, 1, 8).setBackground('#1E293B').setFontColor('#FFFFFF').setFontWeight('bold');
          mediaSheet.setRightToLeft(true);
        }
        mediaSheet.appendRow([
          "media_" + new Date().getTime(),
          data.fileName || "Uploaded Image",
          fileId,
          directUrl,
          Math.round(blob.getBytes().length / 1024),
          data.mimeType || "image/jpeg",
          data.tag || "General",
          Utilities.formatDate(new Date(), "GMT+3", "yyyy-MM-dd HH:mm:ss")
        ]);
      } catch(sheetErr) {}

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        fileId: fileId,
        driveUrl: directUrl,
        webUrl: file.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. استعراض وجلب صور مجلد Google Drive
    if (data.action === "get_folder_images") {
      var targetFolder = getTargetFolder(data.folderId || defaultFolderId);
      var filesIterator = targetFolder.getFiles();
      var filesList = [];
      while (filesIterator.hasNext() && filesList.length < 60) {
        var f = filesIterator.next();
        var mime = f.getMimeType();
        if (mime.indexOf("image/") === 0 || f.getName().match(/\\.(jpg|jpeg|png|webp|gif)$/i)) {
          filesList.push({
            id: f.getId(),
            name: f.getName(),
            directUrl: "https://lh3.googleusercontent.com/d/" + f.getId(),
            mimeType: mime
          });
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        files: filesList,
        folderId: data.folderId || defaultFolderId
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 3. مزامنة وتحديث متطابق (Idempotent Sync) لكافة الجداول الـ 24
    if (data.action === "sync_all_tables" && data.tables) {
      if (data.tables.product_images && Array.isArray(data.tables.product_images)) {
        data.tables.product_images.forEach(function(img) {
          if (img.base64_data && img.base64_data.indexOf("data:image") === 0) {
            try {
              var cleanB64 = img.base64_data.replace(/^data:image\\/[a-zA-Z0-9.+_-]+;base64,/, "");
              var blob = Utilities.newBlob(Utilities.base64Decode(cleanB64), "image/jpeg", "product_" + img.product_id + ".jpg");
              var f = mediaFolder.createFile(blob);
              f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
              img.drive_file_id = f.getId();
              img.image_url = "https://lh3.googleusercontent.com/d/" + f.getId();
            } catch(e) {}
          }
        });
      }
      
      var tables = data.tables;
      for (var tableName in tables) {
        syncTable(ss, tableName, tables[tableName]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "تم تحديث ومزامنة كافة الجداول الـ 24 سحابياً بنجاح بدون تكرار"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "ok" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getTargetFolder(folderIdOrName) {
  if (folderIdOrName && folderIdOrName.length > 15) {
    try {
      return DriveApp.getFolderById(folderIdOrName);
    } catch(e) {}
  }
  var folders = DriveApp.getFoldersByName(folderIdOrName || "Elites_Store_Media");
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderIdOrName || "Elites_Store_Media");
}

function syncTable(ss, sheetName, data) {
  if (!data) return;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.clear();
  
  if (Array.isArray(data) && data.length > 0) {
    var headers = Object.keys(data[0]);
    var rows = [headers];
    data.forEach(function(item) {
      var row = [];
      headers.forEach(function(h) {
        var val = item[h];
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        row.push(val !== undefined && val !== null ? val : '');
      });
      rows.push(row);
    });
    sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(1, 1, 1, headers.length).setBackground('#1E293B').setFontColor('#FFFFFF').setFontWeight('bold');
  } else if (typeof data === 'object' && data !== null) {
    var keys = Object.keys(data);
    var rows = [['Key', 'Value']];
    keys.forEach(function(k) { rows.push([k, data[k]]); });
    sheet.getRange(1, 1, rows.length, 2).setValues(rows);
    sheet.getRange(1, 1, 1, 2).setBackground('#1E293B').setFontColor('#FFFFFF').setFontWeight('bold');
  }
  sheet.setRightToLeft(true);
}`;

    navigator.clipboard.writeText(scriptCode);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 3000);
  };

  function renderFolderBrowserModal() {
    const activeFolderId = config.folderId || '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R';
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in" dir="rtl">
        <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
          <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm">مستعرض صور مجلد Google Drive</h3>
                <span className="text-[11px] font-mono text-stone-400">{activeFolderId}</span>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setShowFolderBrowser(false)}
              className="text-stone-400 hover:text-white cursor-pointer p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-700">المجلد الفعّال:</span>
              <a 
                href={`https://drive.google.com/drive/folders/${activeFolderId}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-emerald-700 font-mono font-bold flex items-center gap-1 hover:underline"
              >
                فتح في Google Drive <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <button
              type="button"
              onClick={() => handleLoadFolderImages(activeFolderId)}
              disabled={isLoadingFolder}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFolder ? 'animate-spin' : ''}`} />
              <span>تحديث وفحص المجلد</span>
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            {isLoadingFolder ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-stone-600">جاري فحص الصور في المجلد وجلب الروابط المباشرة...</p>
              </div>
            ) : folderFiles.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <FolderSearch className="w-12 h-12 text-stone-300 mx-auto" />
                <h4 className="font-bold text-sm text-stone-800">لم يتم جلب صور بعد</h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                  تأكد من نشر رابط Webhook وتعيين صلاحية المجلد على "Anyone with the link can view". أو اضغط زر "تحديث وفحص المجلد" أعلاه.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {folderFiles.map((file) => (
                  <div 
                    key={file.id} 
                    className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div className="aspect-square bg-stone-100 relative overflow-hidden">
                      <SafeDriveImage 
                        src={file.directUrl} 
                        alt={file.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                    </div>
                    <div className="p-2.5 space-y-1.5">
                      <span className="text-[11px] font-bold text-stone-800 line-clamp-1 block" title={file.name}>
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectFolderFile(file);
                          setShowFolderBrowser(false);
                        }}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] cursor-pointer transition-colors shadow-2xs"
                      >
                        اختيار وتطبيق ✓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderSetupModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in" dir="rtl">
        <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base">دليل وإعداد حفظ الصور التلقائي في Google Drive السحابي</h3>
            </div>
            <button 
              type="button" 
              onClick={() => setShowSetupModal(false)}
              className="text-stone-400 hover:text-white cursor-pointer p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Status overview */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isWebhookConfigured 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                  isWebhookConfigured ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {isWebhookConfigured ? '✓' : '!'}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">
                    {isWebhookConfigured ? 'الربط السحابي مع Google Drive مفعل' : 'تنبيه: بانتظار إدخال رابط Google Apps Script Webhook'}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">
                    {isWebhookConfigured 
                      ? 'يتم إرسال الصور مباشرة لإنشاء ملفات في مجلد Google Drive وتوليد روابط lh3 السريعة.' 
                      : 'لحفظ الصور فعلياً داخل حسابك في Google Drive، اتبع الخطوات الـ 4 السريعة أدناه.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Folder Configuration Field */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2">
              <label className="block text-xs font-bold text-stone-800">
                معرف أو رابط مجلد Google Drive المخصص لتخزين الصور (Folder ID):
              </label>
              <input
                type="text"
                value={modalFolderInput}
                onChange={(e) => setModalFolderInput(e.target.value)}
                placeholder="18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R"
                className="w-full p-2.5 bg-white border border-stone-200 rounded-xl font-mono text-xs text-stone-900 focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />
              <span className="text-[11px] text-stone-500 block">
                المجلد المعتمد حالياً: <code className="text-emerald-700 font-bold">18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R</code>
              </span>
            </div>

            {/* Step-by-step instructions */}
            <div className="space-y-3">
              <h5 className="font-extrabold text-xs text-stone-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                خطوات التفعيل في دقيقتين:
              </h5>

              <ol className="space-y-2 text-xs text-stone-700 list-decimal list-inside bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <li className="leading-relaxed">
                  افتح جدول بياناتك في <strong>Google Sheets</strong>.
                </li>
                <li className="leading-relaxed">
                  من القائمة العلوية اضغط على <strong>Extensions (الإضافات) &gt; Apps Script</strong>.
                </li>
                <li className="leading-relaxed">
                  احذف الكود الموجود والصق كود السكربت المحدث (بالضغط على الزر أدناه).
                </li>
                <li className="leading-relaxed">
                  اضغط على زر <strong>Deploy (نشر) &gt; New deployment (نشر جديد) &gt; Web app (تطبيق ويب)</strong>.
                  <div className="mt-1 mr-5 p-2 bg-emerald-100/60 rounded-lg text-[11px] text-emerald-900 font-semibold">
                    💡 مهم جداً: تأكد من اختيار <span className="font-bold underline">Execute as: Me</span> واختيار <span className="font-bold underline">Who has access: Anyone</span>.
                  </div>
                </li>
                <li className="leading-relaxed">
                  انسخ رابط Webhook الناتج والصقه في الحقل أدناه واضغط حفظ.
                </li>
              </ol>
            </div>

            {/* Apps Script Copy Button */}
            <div>
              <button
                type="button"
                onClick={copyAppsScriptCode}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
              >
                {scriptCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <FileText className="w-4 h-4 text-emerald-400" />}
                {scriptCopied ? 'تم نسخ كود Google Apps Script المطور بنجاح!' : 'نسخ كود Google Apps Script الداعم لـ Google Drive والمجلدات'}
              </button>
            </div>

            {/* Webhook Input Field */}
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <label className="block text-xs font-bold text-stone-800">
                رابط Google Apps Script Webhook:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={modalWebhookInput}
                  onChange={(e) => setModalWebhookInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={handleSaveModalSettings}
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

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`} dir="rtl">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isUploading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <HardDrive className="w-3.5 h-3.5" />
            )}
            {isUploading ? (uploadProgress || 'جاري الرفع...') : buttonLabel}
          </button>

          <button
            type="button"
            onClick={() => handleLoadFolderImages()}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
            title="استعراض واختيار الصور من مجلد Drive"
          >
            <FolderSearch className="w-3.5 h-3.5 text-emerald-600" />
            <span>تصفح المجلد</span>
          </button>
          
          <button
            type="button"
            onClick={() => setShowManualConverter(!showManualConverter)}
            className="p-2 text-stone-600 hover:bg-stone-100 rounded-xl border border-stone-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title="تحويل رابط Google Drive أو مجلد"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowSetupModal(true)}
            className="p-2 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl border border-stone-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title="إعدادات وحالة Google Drive"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {showManualConverter && (
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2 animate-in fade-in text-xs">
            <span className="font-bold text-stone-700 block">لصق رابط ملف أو مجلد من Google Drive:</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualDriveInput}
                onChange={(e) => setManualDriveInput(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/18P3PH04..."
                className="flex-1 p-2 bg-white border border-stone-200 rounded-xl font-mono text-xs text-stone-800"
              />
              <button
                type="button"
                onClick={handleConvertManualDriveLink}
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
            <span>{folderNotice}</span>
          </div>
        )}

        {uploadedUrl && (
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-[11px] text-emerald-900">
            <span className="font-mono truncate font-bold">{uploadedUrl}</span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-md cursor-pointer shrink-0"
              title="نسخ الرابط"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Modal inside compact if triggered */}
        {showSetupModal && renderSetupModal()}
        {showFolderBrowser && renderFolderBrowserModal()}
      </div>
    );
  }

  return (
    <div className={`p-5 bg-gradient-to-br from-emerald-50/50 via-white to-stone-50 rounded-3xl border border-emerald-100 shadow-xs space-y-4 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-stone-900">
                رافع ومخزن الصور في Google Drive
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isWebhookConfigured 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {isWebhookConfigured ? '🟢 متصل سحابياً بـ Google Drive' : '🟡 بانتظار إعداد Webhook'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              رفع وتخزين في مجلد Google Drive (المعرف: <code className="font-mono text-emerald-700 text-[10px] font-bold">{config.folderId || '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R'}</code>) مع روابط مباشرة فائقة السرعة
            </p>
          </div>
        </div>

        {/* Category Tag Selector & Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleLoadFolderImages()}
            className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <FolderSearch className="w-3.5 h-3.5 text-emerald-600" />
            تصفح صور المجلد
          </button>

          <button
            type="button"
            onClick={() => setShowSetupModal(true)}
            className="px-3 py-1.5 bg-white border border-stone-200 hover:border-emerald-500 hover:text-emerald-700 rounded-xl text-xs font-bold text-stone-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-600" />
            إعدادات Drive
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-stone-600">القسم:</span>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="p-1.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Categories">الكتالوجات والأقسام</option>
              <option value="Products">المنتجات</option>
              <option value="Banners">البنرات والواجهة</option>
              <option value="Logo">الشعارات والهوية</option>
              <option value="General">عام</option>
            </select>
          </div>
        </div>
      </div>

      {/* Webhook notification notice if not set */}
      {!isWebhookConfigured && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>لتخزين الصور فعلياً داخل حساب Google Drive الخاص بك، يرجى تفعيل رابط Webhook من إعدادات الربط.</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSetupModal(true)}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer shadow-xs"
          >
            تفعيل Google Drive الآن
          </button>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
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
            {isUploading ? (uploadProgress || 'جاري رفع ومعالجة الصورة...') : 'اسحب وأفلت الصورة هنا، أو اضغط للاختيار من الكمبيوتر'}
          </h4>
          <p className="text-xs text-stone-500">
            يدعم ملفات JPG، PNG، WebP، GIF. يتم حفظ الصورة مباشرة داخل المجلد السحابي وتوليد رابط CDN دائم.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <span className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors">
            {buttonLabel}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowManualConverter(!showManualConverter);
            }}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors"
          >
            لصق رابط Drive أو مجلد 🔗
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Folder notice banner */}
      {folderNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{folderNotice}</span>
        </div>
      )}

      {/* Manual Link Converter Tool */}
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
              value={manualDriveInput}
              onChange={(e) => setManualDriveInput(e.target.value)}
              placeholder="مثال: https://drive.google.com/drive/folders/18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R"
              className="flex-1 p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleConvertManualDriveLink}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
            >
              تحويل وتطبيق ⚡
            </button>
          </div>
          <p className="text-[11px] text-stone-400">
            يمكنك إدخال رابط ملف فردي أو رابط مجلد كامل لتصفح واختيار الصور منه مباشرة.
          </p>
        </div>
      )}

      {/* Success Result & Preview Card */}
      {uploadedUrl && showPreview && (
        <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              تم تجهيز رابط الصورة المباشر من Google Drive:
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              wasLiveSaved 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-amber-100 text-amber-800'
            }`}>
              {wasLiveSaved ? '✅ محفوظ في Google Drive & Sheets' : '⚡ تم التجهيز برابط مباشر'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
              <SafeDriveImage src={uploadedUrl} alt="Uploaded" className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 space-y-2 w-full">
              <div>
                <label className="text-[10px] font-bold text-stone-500 block mb-0.5">معرف الملف (File ID):</label>
                <div className="p-2 bg-stone-50 rounded-xl font-mono text-xs font-bold text-stone-800 border border-stone-200 select-all">
                  {uploadedFileId}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 block mb-0.5">رابط الـ CDN المباشر (Direct URL):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={uploadedUrl}
                    className="flex-1 p-2 bg-stone-50 rounded-xl font-mono text-xs font-bold text-emerald-800 border border-stone-200 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'تم النسخ' : 'نسخ الرابط'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Setup Modal */}
      {showSetupModal && renderSetupModal()}

      {/* Folder Browser Modal */}
      {showFolderBrowser && renderFolderBrowserModal()}
    </div>
  );
};
