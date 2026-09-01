import React, { useState, useRef } from 'react';
import { useStoreManagement } from '../../contexts/StoreContext';
import { useGoogleSheets } from '../../contexts/GoogleSheetsContext';
import { 
  Upload, Image as ImageIcon, Trash2, Copy, Check, Search, 
  ExternalLink, FileText, AlertCircle, RefreshCcw, Sparkles, Tag, Plus, CheckSquare,
  HardDrive
} from 'lucide-react';
import { GoogleDriveImageUploader } from '../components/GoogleDriveImageUploader';
import { extractGoogleDriveId, formatGoogleDriveDirectUrl, getCachedDriveImagePreview } from '../../utils/googleDriveUtils';

const TAG_LABELS: Record<string, string> = {
  all: 'جميع الوسائط',
  Categories: 'الكتالوجات والأقسام',
  Products: 'المنتجات',
  Banners: 'البنرات والواجهة الرئيسية',
  Logo: 'الشعارات والهوية',
  General: 'عام'
};

export const MediaLibraryManager: React.FC = () => {
  const { mediaItems, addMediaItem, updateMediaItem, deleteMediaItem, updateStoreSettings } = useStoreManagement();
  const { uploadImageToDrive } = useGoogleSheets();

  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [uploadTag, setUploadTag] = useState<string>('Categories');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress & Upload Handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP, GIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً (الأقصى 10 ميجابايت).');
      return;
    }

    setIsUploading(true);
    setUploadProgress('جاري تحسين وضغط الصورة...');

    try {
      // Client-side Image Compression
      const compressedDataUrl = await compressImage(file, 1200, 0.85);

      setUploadProgress('جاري الرفع إلى Google Drive والوسائط السحابية...');
      
      let finalUrl = compressedDataUrl;
      let driveId = '';

      if (uploadImageToDrive) {
        try {
          const driveResult = await uploadImageToDrive(compressedDataUrl, file.name);
          if (driveResult && driveResult.direct_url) {
            finalUrl = driveResult.direct_url;
            driveId = driveResult.file_id || '';
          }
        } catch (err) {
          console.warn('Drive upload fallback to compressed data URL', err);
        }
      }

      // Automatically include the selected tag + General so it appears in specific catalog/category filters!
      const tagsToAssign = Array.from(new Set(['General', uploadTag, selectedTag !== 'all' ? selectedTag : 'Categories']));

      addMediaItem({
        name: file.name.replace(/\.[^/.]+$/, ""),
        url: finalUrl,
        drive_file_id: driveId,
        size_kb: Math.round(file.size / 1024),
        type: file.type,
        used_in: tagsToAssign
      });

      setSuccessMsg('تم رفع الصورة بنجاح وإضافتها إلى القسم المحدد!');
      setTimeout(() => setSuccessMsg(null), 3000);

      setUploadProgress('');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء رفع وتحسين الصورة');
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
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
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle tag on a specific media item
  const toggleItemTag = (itemId: string, currentTags: string[] = [], tagToToggle: string) => {
    let newTags: string[];
    if (currentTags.includes(tagToToggle)) {
      newTags = currentTags.filter(t => t !== tagToToggle);
      if (newTags.length === 0) newTags = ['General'];
    } else {
      newTags = [...currentTags, tagToToggle];
    }
    updateMediaItem(itemId, { used_in: newTags });
  };

  const filteredItems = mediaItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || (item.used_in && item.used_in.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Google Drive Image Uploader Section */}
      <GoogleDriveImageUploader
        defaultTag={selectedTag !== 'all' ? selectedTag : 'Categories'}
        onImageUploaded={(directUrl, fileId) => {
          setSuccessMsg(`تم رفع الصورة وتوليد الرابط المباشر: ${directUrl}`);
          setTimeout(() => setSuccessMsg(null), 4000);
        }}
      />

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في مكتبة الصور..."
            className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
          {['all', 'Categories', 'Banners', 'Products', 'Logo', 'General'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedTag === tag 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Tag className="w-3 h-3" />
              {TAG_LABELS[tag] || tag}
              {tag !== 'all' && (
                <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                  {mediaItems.filter(m => m.used_in?.includes(tag)).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">
            لا توجد صورة مطابقة لتصنيف "{TAG_LABELS[selectedTag] || selectedTag}"
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            يمكنك رفع صورة جديدة واختيار تصنيف "{TAG_LABELS[selectedTag] || selectedTag}" من أعلى الصفحة، أو النقر على تعديل التصنيف على أي صورة قائمة أدناه لتظهر في هذا القسم.
          </p>
          <button
            onClick={() => {
              setUploadTag(selectedTag !== 'all' ? selectedTag : 'Categories');
              fileInputRef.current?.click();
            }}
            className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" /> رفع صورة لقسم {TAG_LABELS[selectedTag] || selectedTag} الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const currentTags = item.used_in || ['General'];
            const isDeletingThis = deletingId === item.id;

            return (
              <div 
                key={item.id} 
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-video sm:aspect-square bg-slate-100 overflow-hidden">
                  <img 
                    src={item.url} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  
                  {/* Overlay preview button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPreviewImage(item.url)}
                      className="px-3 py-1.5 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-md hover:bg-slate-100 cursor-pointer"
                    >
                      معاينة 🔍
                    </button>
                  </div>
                </div>

                <div className="p-3.5 space-y-3">
                  <div>
                    <p className="font-bold text-xs text-slate-900 truncate" title={item.name}>{item.name}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{item.size_kb ? `${item.size_kb} KB` : 'محسّنة'}</span>
                      <span>{new Date(item.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>

                  {/* Tags Manager Checklist */}
                  <div className="p-2 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 block flex items-center gap-1">
                      <Tag className="w-3 h-3 text-emerald-600" /> تظهَر هذه الصورة في الأقسام:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { id: 'Categories', label: 'الكتالوجات' },
                        { id: 'Banners', label: 'البنرات' },
                        { id: 'Products', label: 'المنتجات' },
                        { id: 'Logo', label: 'الشعار' }
                      ].map(t => {
                        const isChecked = currentTags.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleItemTag(item.id, currentTags, t.id)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              isChecked 
                                ? 'bg-emerald-600 text-white shadow-2xs' 
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isChecked ? '✓ ' : '+ '}
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Google Drive Link Preview & Copy */}
                  <div className="p-2 bg-stone-50 border border-stone-200/80 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-stone-500 font-bold">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-emerald-600" /> رابط Google Drive:
                      </span>
                      <span className="font-mono text-emerald-700 text-[9px] bg-emerald-50 px-1 py-0.5 rounded">
                        lh3 direct
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-stone-700 truncate bg-white p-1 rounded border border-stone-200" title={formatGoogleDriveDirectUrl(item.url)}>
                      {formatGoogleDriveDirectUrl(item.url)}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  {isDeletingThis ? (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2 animate-in fade-in">
                      <p className="text-[11px] font-bold text-rose-800">تأكيد حذف الصورة؟</p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            deleteMediaItem(item.id);
                            setDeletingId(null);
                          }}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                        >
                          نعم، حذف
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => copyToClipboard(item.url, item.id)}
                        className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> تم النسخ
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> نسخ الرابط
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          updateStoreSettings({ hero_banner_url: item.url });
                          setSuccessMsg('تم تعيين هذه الصورة كصورة للواجهة الرئيسية (Hero Banner)!');
                          setTimeout(() => setSuccessMsg(null), 3500);
                        }}
                        className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer text-[10px] font-bold border border-emerald-200"
                        title="تعيين كصورة الواجهة الرئيسية"
                      >
                        🎯 هيرو
                      </button>

                      <button
                        onClick={() => setDeletingId(item.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                        title="حذف الصورة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="bg-white p-4 rounded-2xl max-w-2xl max-h-[90vh] overflow-hidden space-y-3" onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[70vh] rounded-xl object-contain mx-auto" />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
