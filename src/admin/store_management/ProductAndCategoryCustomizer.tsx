import React, { useState, useEffect } from 'react';
import { useProducts, StoreProduct } from '../../contexts/ProductContext';
import { useCategories, StoreCategory } from '../../contexts/CategoryContext';
import { useGoogleSheets } from '../../contexts/GoogleSheetsContext';
import { PricingMethod, ProductImage } from '../../types';
import { 
  Package, Tags, Plus, Trash2, Edit3, Check, X, Search, 
  Sparkles, Layers, Image as ImageIcon, ToggleLeft, ToggleRight,
  Eye, RefreshCw, CheckCircle2, ArrowRight, ExternalLink, HelpCircle,
  HardDrive, Upload, Send, Clock, Star, Flame
} from 'lucide-react';
import { SmartPricingCalculator } from '../components/SmartPricingCalculator';
import { GoogleDriveImageUploader } from '../components/GoogleDriveImageUploader';
import { formatGoogleDriveDirectUrl, compressImageFile, extractGoogleDriveId } from '../../utils/googleDriveUtils';
import { SafeDriveImage } from '../../components/common/SafeDriveImage';

export interface StagedProductItem {
  stagingId: string;
  action: 'add' | 'update';
  originalId?: string;
  productData: {
    name: string;
    description?: string;
    category: string;
    sku: string;
    cost_price: number;
    price: number;
    originalPrice: number;
    stock: number;
    image: string;
    featured?: boolean;
    bestSeller?: boolean;
    newProduct?: boolean;
  };
  pendingFile?: File | null;
  timestamp: number;
}

const CATEGORY_IMAGE_PRESETS = [
  {
    name: 'عطور فاخرة',
    url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600&auto=format&fit=crop&q=80',
    icon: '💎'
  },
  {
    name: 'ساعات وإكسسوارات',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
    icon: '⌚'
  },
  {
    name: 'حقائب وجلديات',
    url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
    icon: '👜'
  },
  {
    name: 'هدايا وتوزيعات',
    url: 'https://images.unsplash.com/photo-1513094735237-8f2714d57c13?w=600&auto=format&fit=crop&q=80',
    icon: '🎁'
  },
  {
    name: 'إكسسوارات ومجوهرات',
    url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',
    icon: '✨'
  },
  {
    name: 'أزياء وملابس',
    url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80',
    icon: '👗'
  },
  {
    name: 'أحذية راقية',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    icon: '👟'
  },
  {
    name: 'إلكترونيات وتقنية',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    icon: '📱'
  }
];

const EMOJI_PRESETS = ['💎', '⌚', '👜', '🎁', '✨', '👗', '👟', '📱', '🕶️', '💄', '💍', '💼', '🌸', '☕', '🎮', '🧴'];

export const ProductAndCategoryCustomizer: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { 
    categories, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    toggleDisplayMode, 
    resetToDefaults 
  } = useCategories();

  const { uploadImageToDrive, syncNow } = useGoogleSheets();
  const [stagedProducts, setStagedProducts] = useState<StagedProductItem[]>(() => {
    const saved = localStorage.getItem('elites_staged_products');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    localStorage.setItem('elites_staged_products', JSON.stringify(stagedProducts));
  }, [stagedProducts]);

  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'draft_staging' | 'bulk_actions'>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Selected products for bulk actions
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Product Editor Full Page State
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [isProductEditorOpen, setIsProductEditorOpen] = useState(false);

  // Form fields for product editor
  const [prodName, setProdName] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodCategory, setProdCategory] = useState('عطور');
  const [costPrice, setCostPrice] = useState<number>(50);
  const [sellingPrice, setSellingPrice] = useState<number>(120);
  const [compareAtPrice, setCompareAtPrice] = useState<number>(150);
  const [stockQuantity, setStockQuantity] = useState<number>(50);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);

  // Category Editor Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);

  // Form fields for category editor
  const [catName, setCatName] = useState('');
  const [catTitle, setCatTitle] = useState('');
  const [catSubtitle, setCatSubtitle] = useState('');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [catIcon, setCatIcon] = useState('💎');
  const [catDisplayMode, setCatDisplayMode] = useState<'image' | 'icon'>('image');
  const [catStatus, setCatStatus] = useState<'active' | 'inactive'>('active');
  const [catSortOrder, setCatSortOrder] = useState<number>(1);

  // Notification / Feedback banner
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);
  const triggerFeedback = (msg: string) => {
    setBannerMsg(msg);
    setTimeout(() => setBannerMsg(null), 4000);
  };

  // Open Edit Category Modal
  const handleOpenEditCategory = (cat: StoreCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatTitle(cat.title || cat.name);
    setCatSubtitle(cat.subtitle || '');
    setCatImageUrl(cat.image_url || '');
    setCatIcon(cat.icon || '💎');
    setCatDisplayMode(cat.display_mode || 'image');
    setCatStatus(cat.status || 'active');
    setCatSortOrder(cat.sort_order || 1);
    setShowCategoryModal(true);
  };

  // Open Add Category Modal
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatTitle('');
    setCatSubtitle('');
    setCatImageUrl(CATEGORY_IMAGE_PRESETS[0].url);
    setCatIcon('💎');
    setCatDisplayMode('image');
    setCatStatus('active');
    setCatSortOrder(categories.length + 1);
    setShowCategoryModal(true);
  };

  // Save Category
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: catName.trim(),
        title: catTitle.trim() || catName.trim(),
        subtitle: catSubtitle.trim(),
        image_url: catImageUrl.trim(),
        icon: catIcon.trim() || '💎',
        display_mode: catDisplayMode,
        status: catStatus,
        sort_order: Number(catSortOrder) || 1
      });
      triggerFeedback(`تم تحديث القسم "${catTitle || catName}" بنجاح!`);
    } else {
      addCategory({
        name: catName.trim(),
        title: catTitle.trim() || catName.trim(),
        subtitle: catSubtitle.trim(),
        slug: catName.trim().toLowerCase().replace(/\s+/g, '-'),
        image_url: catImageUrl.trim() || CATEGORY_IMAGE_PRESETS[0].url,
        icon: catIcon.trim() || '💎',
        display_mode: catDisplayMode,
        status: catStatus,
        sort_order: Number(catSortOrder) || (categories.length + 1)
      });
      triggerFeedback(`تمت إضافة القسم الجديد "${catTitle || catName}" بنجاح!`);
    }

    setShowCategoryModal(false);
  };

  // Open Edit Product Full Page View
  const handleOpenEditProduct = (p: StoreProduct) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDescription(p.description || '');
    setProdCategory(p.category);
    setCostPrice(p.cost_price || 50);
    setSellingPrice(p.price);
    setCompareAtPrice(p.originalPrice || p.price);
    setStockQuantity(p.stock);
    setImages(p.images || []);
    setIsFeatured(p.featured || false);
    setIsBestSeller(p.bestSeller || false);
    setIsNewArrival(p.newProduct || false);
    setIsProductEditorOpen(true);
  };

  // Open Add Product Full Page View
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDescription('');
    setProdCategory(categories[0]?.name || 'عطور');
    setCostPrice(50);
    setSellingPrice(120);
    setCompareAtPrice(150);
    setStockQuantity(30);
    setImages([]);
    setIsFeatured(false);
    setIsBestSeller(false);
    setIsNewArrival(true);
    setIsProductEditorOpen(true);
  };

  // Save to Staging Drafts or Direct Publish with Automatic Drive Upload
  const handleSaveToStaging = async (e: React.FormEvent, publishDirectly = false) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    const primaryImage = images.find(img => img.is_primary) || images[0];
    let finalImageUrl = primaryImage?.image_url || '';

    if (publishDirectly && pendingImageFile) {
      try {
        triggerFeedback('جاري ضغط الصورة والرفع التلقائي إلى Google Drive...');
        const { base64 } = await compressImageFile(pendingImageFile, 1200, 0.85);
        const res = await uploadImageToDrive(base64, pendingImageFile.name, pendingImageFile.type);
        if (res && res.driveUrl) {
          finalImageUrl = res.driveUrl;
        }
      } catch (err) {
        console.error('Auto upload to drive failed:', err);
      }
    }

    const autoSku = editingProduct?.sku || ('AFF-' + Math.floor(1000 + Math.random() * 9000));

    const productPayload = {
      name: prodName,
      description: prodDescription,
      category: prodCategory,
      sku: autoSku,
      cost_price: Number(costPrice),
      price: Number(sellingPrice),
      originalPrice: Number(compareAtPrice),
      stock: Number(stockQuantity),
      image: finalImageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
      featured: isFeatured,
      bestSeller: isBestSeller,
      newProduct: isNewArrival
    };

    if (publishDirectly) {
      if (editingProduct) {
        updateProduct(editingProduct.id, productPayload);
        triggerFeedback(`تم تعديل ونشر المنتج "${prodName}" فوراً بنجاح!`);
      } else {
        addProduct({
          ...productPayload,
          supplier: 'المورد الرئيسي',
          fulfillmentType: 'internal'
        });
        triggerFeedback(`تمت إضافة ونشر المنتج "${prodName}" فوراً بنجاح!`);
      }
      try { syncNow(); } catch (e) {}
    } else {
      const stagingId = 'stg_' + Date.now();
      const newItem: StagedProductItem = {
        stagingId,
        action: editingProduct ? 'update' : 'add',
        originalId: editingProduct ? editingProduct.id : undefined,
        productData: productPayload,
        pendingFile: pendingImageFile,
        timestamp: Date.now()
      };
      setStagedProducts(prev => [...prev.filter(p => p.originalId !== editingProduct?.id), newItem]);
      triggerFeedback(`تم حفظ المنتج "${prodName}" في بروفا المعاينة بنجاح! انتقل لتبويب 'بروفا المعاينة' لمراجعته.`);
    }

    setPendingImageFile(null);
    setIsProductEditorOpen(false);
  };

  const publishAllStaged = async () => {
    if (stagedProducts.length === 0) return;
    setIsPublishing(true);
    triggerFeedback('جاري رفع الصور إلى Google Drive ونشر جميع المنتجات والتعديلات المعلقة...');

    try {
      for (const item of stagedProducts) {
        let finalImg = item.productData.image;
        if (item.pendingFile) {
          try {
            const { base64 } = await compressImageFile(item.pendingFile, 1200, 0.85);
            const res = await uploadImageToDrive(base64, item.pendingFile.name, item.pendingFile.type);
            if (res && res.driveUrl) {
              finalImg = res.driveUrl;
            }
          } catch (e) {
            console.error('Batch upload error:', e);
          }
        }

        const dataToSave = { ...item.productData, image: finalImg };

        if (item.action === 'add') {
          addProduct({
            ...dataToSave,
            supplier: 'المورد الرئيسي',
            fulfillmentType: 'internal'
          });
        } else if (item.action === 'update' && item.originalId) {
          updateProduct(item.originalId, dataToSave);
        }
      }

      setStagedProducts([]);
      localStorage.removeItem('elites_staged_products');
      try { await syncNow(); } catch (e) {}

      triggerFeedback('🚀 تم نشر جميع المنتجات والتعديلات دفعة واحدة إلى المتجر وجداول Google Sheets بنجاح!');
      setActiveTab('products');
    } catch (err) {
      console.error('Publish error:', err);
      triggerFeedback('حدث خطأ أثناء النشر الشامل، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Checkbox toggle for Bulk Selection
  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  // Bulk Actions
  const handleBulkFeature = (featured: boolean) => {
    selectedProductIds.forEach(id => updateProduct(id, { featured }));
    setSelectedProductIds([]);
    triggerFeedback(`تم تحديث حالة التمييز لـ ${selectedProductIds.length} منتج`);
  };

  const handleBulkDelete = () => {
    if (confirm(`هل أنت متأكد من حذف ${selectedProductIds.length} من المنتجات المحددة؟`)) {
      selectedProductIds.forEach(id => deleteProduct(id));
      setSelectedProductIds([]);
      triggerFeedback('تم حذف المنتجات المحددة بنجاح');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Feedback Banner */}
      {bannerMsg && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl flex items-center justify-between shadow-md animate-fade-in text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{bannerMsg}</span>
          </div>
          <button onClick={() => setBannerMsg(null)} className="p-1 hover:bg-emerald-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <Tags className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-stone-900">
              إدارة الأقسام والمنتجات والتسعير الذكي
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            تخصيص صور الأقسام وتحديد طريقة العرض (صور فوتوغرافية أو رموز تعبيرية)، إدارة كتالوج المنتجات، وضبط استراتيجيات التسعير.
          </p>
        </div>

        {/* Action button based on active tab */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'categories' && (
            <>
              <button
                onClick={() => {
                  if (confirm('هل تريد استعادة الأقسام والصور الافتراضية؟')) {
                    resetToDefaults();
                    triggerFeedback('تمت استعادة الأقسام الافتراضية بنجاح!');
                  }
                }}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="استعادة الأقسام الافتراضية"
              >
                <RefreshCw className="w-3.5 h-3.5" /> استعادة الافتراضي
              </button>
              <button
                onClick={handleOpenAddCategory}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> إضافة قسم جديد
              </button>
            </>
          )}

          {activeTab === 'products' && (
            <button
              onClick={handleOpenAddProduct}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> إضافة منتج جديد
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-200/70 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-emerald-600" />
          <span>تخصيص الأقسام والصور ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'products'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Package className="w-4 h-4 text-emerald-600" />
          <span>إدارة المنتجات والتسعير ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('draft_staging')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer relative ${
            activeTab === 'draft_staging'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Eye className="w-4 h-4 text-amber-600" />
          <span>بروفا المعاينة والتعديلات</span>
          {stagedProducts.length > 0 && (
            <span className="w-5 h-5 bg-amber-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse">
              {stagedProducts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('bulk_actions')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'bulk_actions'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>العمليات الجماعية</span>
        </button>
      </div>

      {/* FULL PAGE PRODUCT EDITOR */}
      {isProductEditorOpen ? (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-md p-6 sm:p-8 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsProductEditorOpen(false)}
                className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowRight className="w-4 h-4" /> العودة إلى المنتجات
              </button>
              <div>
                <h3 className="font-extrabold text-lg text-stone-900">
                  {editingProduct ? 'تعديل تفاصيل المنتج (التسويق بالعمولة)' : 'إضافة منتج جديد (التسويق بالعمولة)'}
                </h3>
                <p className="text-xs text-stone-500">
                  أضف اسم المنتج، الوصف، الفئة، الصور، والأسعار. لا توجد حاجة لكود SKU.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => handleSaveToStaging(e, false)} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="font-bold text-stone-700 block mb-1.5">اسم المنتج:</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                  placeholder="أدخل اسم المنتج الواضح والجذاب..."
                  className="w-full p-3 border border-stone-200 rounded-xl font-bold text-stone-900 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1.5">الفئة / القسم (Category):</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  required
                  className="w-full p-3 border border-stone-200 rounded-xl font-bold text-stone-900 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.icon} {c.title} ({c.name})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Description Field (Full Writable Textarea) */}
            <div>
              <label className="font-bold text-stone-700 block mb-1.5 flex items-center justify-between">
                <span>وصف المنتج (وصف تسويقي تفصيلي):</span>
                <span className="text-[10px] text-stone-400">اكتب أو الصق الوصف التسويقي هنا بكل حرية</span>
              </label>
              <textarea
                value={prodDescription}
                onChange={(e) => setProdDescription(e.target.value)}
                rows={5}
                placeholder="اكتب وصف المنتج التفصيلي، المميزات، والفوائد التي تهم العملاء..."
                className="w-full p-3 border border-stone-200 rounded-xl font-medium text-stone-900 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 text-xs leading-relaxed"
              />
            </div>

            {/* Advanced Smart Pricing Calculator Engine */}
            <div className="space-y-2 p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <label className="font-bold text-stone-900 block text-xs">حاسبة واستراتيجية التسعير الذكي للمنتج:</label>
              <SmartPricingCalculator
                isEmbedded={true}
                initialCost={costPrice}
                initialSellingPrice={sellingPrice}
                onApplyPrices={(p, op, cp) => {
                  setSellingPrice(p);
                  setCompareAtPrice(op);
                  setCostPrice(cp);
                }}
              />
            </div>

            <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-700 block">صورة المنتج (رابط أو رفع من الجهاز):</label>
                <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  رفع تلقائي إلى Google Drive عند الحفظ
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-stone-700 block">
                  📁 اختر صورة من جهازك:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setPendingImageFile(file);
                    triggerFeedback('جاري ضغط ومعالجة الصورة...');

                    try {
                      const { base64 } = await compressImageFile(file, 1200, 0.85);
                      setImages(prev => {
                        const existsPrimary = prev.some(img => img.is_primary);
                        if (existsPrimary) {
                          return prev.map(img => img.is_primary ? {...img, image_url: base64} : img);
                        } else {
                          return [...prev, { image_url: base64, is_primary: true, sort_order: prev.length, priceAdjustment: 0 }];
                        }
                      });
                      triggerFeedback('تمت معالجة الصورة بنجاح!');
                    } catch (err) {
                      const localUrl = URL.createObjectURL(file);
                      setImages(prev => {
                        const existsPrimary = prev.some(img => img.is_primary);
                        if (existsPrimary) {
                          return prev.map(img => img.is_primary ? {...img, image_url: localUrl} : img);
                        } else {
                          return [...prev, { image_url: localUrl, is_primary: true, sort_order: prev.length, priceAdjustment: 0 }];
                        }
                      });
                    }
                  }}
                  className="w-full text-xs text-stone-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer bg-white border border-stone-200 rounded-xl p-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">أو رابط الصورة المباشر:</label>
                <input
                  type="text"
                  value={images.find(img => img.is_primary)?.image_url || images[0]?.image_url || ''}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    setImages(prev => {
                      const existsPrimary = prev.some(img => img.is_primary);
                      if (existsPrimary) {
                        return prev.map(img => img.is_primary ? {...img, image_url: newUrl} : img);
                      } else {
                        return [...prev, { image_url: newUrl, is_primary: true, sort_order: prev.length, priceAdjustment: 0 }];
                      }
                    });
                  }}
                  placeholder="https://lh3.googleusercontent.com/d/..."
                  className="w-full p-3 border border-stone-200 rounded-xl font-mono text-stone-800 bg-white focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              {/* Live Preview Box in the same page */}
              <div className="mt-4 p-4 bg-white rounded-xl border border-emerald-200 flex items-center gap-4 shadow-sm">
                <div className="relative w-20 h-20 bg-stone-100 rounded-xl overflow-hidden border border-stone-200 flex-shrink-0 flex items-center justify-center">
                  {(images.find(img => img.is_primary) || images[0]) ? (
                    <SafeDriveImage
                      src={(images.find(img => img.is_primary) || images[0]).image_url}
                      alt={prodName || 'معاينة'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-stone-400 font-medium text-center p-1">لا توجد صورة</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">معاينة حية في نفس الصفحة</span>
                    <span className="text-[10px] text-stone-500 font-semibold">{prodCategory || 'التصنيف'}</span>
                  </div>
                  <h4 className="font-extrabold text-stone-900 text-sm truncate">{prodName || 'اسم المنتج سيظهر هنا...'}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-emerald-700 font-black text-xs">{sellingPrice} ر.س</span>
                    {compareAtPrice > sellingPrice && (
                      <span className="text-stone-400 line-through text-[11px]">{compareAtPrice} ر.س</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Badges toggles */}
            <div className="flex items-center gap-6 p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded-md w-4 h-4 text-emerald-600" />
                منتج مميز 🌟
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                <input type="checkbox" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} className="rounded-md w-4 h-4 text-emerald-600" />
                أكثر مبيعاً 🔥
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                <input type="checkbox" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} className="rounded-md w-4 h-4 text-emerald-600" />
                وصل حديثاً ✨
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsProductEditorOpen(false)}
                className="px-5 py-2.5 bg-stone-100 text-stone-700 rounded-xl font-bold cursor-pointer hover:bg-stone-200 transition-colors"
              >
                إلغاء والعودة
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => handleSaveToStaging(e, false)}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-2 text-xs"
                >
                  <Eye className="w-4 h-4" /> حفظ في بروفا المعاينة 📋
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveToStaging(e, true)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-xs flex items-center gap-2 text-xs"
                >
                  <Send className="w-4 h-4" /> 🚀 نشر فوري للمتجر
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <>
          {activeTab === 'draft_staging' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-white rounded-3xl border border-amber-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                  <Eye className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-black text-stone-900">
                  بروفا المعاينة والتعديلات المعلقة ({stagedProducts.length})
                </h3>
              </div>
              <p className="text-xs text-stone-600 mt-1 max-w-2xl">
                هنا يمكنك معاينة المنتجات المضافة أو المعدلة ورؤية شكلها تماماً كما ستظهر للعملاء في الصفحة الرئيسية للمتجر قبل النشر النهائي. بضغطة زر واحدة سيتم رفع صورها للدرايف ونشرها جميعاً دفعة واحدة وتحديث جداول Google Sheets.
              </p>
            </div>

            {stagedProducts.length > 0 && (
              <button
                disabled={isPublishing}
                onClick={publishAllStaged}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> جاري النشر ورفع الصور للدرايف...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> 🚀 نشر الكل دفعة واحدة ({stagedProducts.length}) للمتجر وجداول Google Sheets
                  </>
                )}
              </button>
            )}
          </div>

          {stagedProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                <Package className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-stone-800 text-sm">لا توجد منتجات أو تعديلات في البروفا المعلقة حالياً</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                قم بإضافة منتج جديد أو تعديل منتج قائم من تبويب "إدارة المنتجات" واختر "حفظ إلى بروفا المعاينة" لمعاينته هنا قبل النشر.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> محاكي عرض المنتجات في الصفحة الرئيسية (Live Homepage Preview)
                </h4>
                <span className="text-[11px] text-stone-500">
                  {stagedProducts.length} منتج قيد الانتظار للنشر
                </span>
              </div>

              {/* Grid simulating storefront product cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stagedProducts.map((item) => {
                  const p = item.productData;
                  const discountPercent = p.originalPrice > p.price 
                    ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) 
                    : 0;
                  let previewImg = p.image;
                  if (item.pendingFile && (item.pendingFile instanceof Blob || item.pendingFile instanceof File)) {
                    try {
                      previewImg = URL.createObjectURL(item.pendingFile);
                    } catch (e) {
                      previewImg = p.image;
                    }
                  }

                  return (
                    <div key={item.stagingId} className="bg-white rounded-3xl border-2 border-amber-300/60 shadow-md overflow-hidden flex flex-col group relative">
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
                        <span className="px-2 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-bold shadow-xs">
                          {item.action === 'add' ? '✨ منتج جديد (بروفا)' : '✏️ تعديل معلق'}
                        </span>
                      </div>

                      <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                        <SafeDriveImage 
                          src={previewImg} 
                          alt={p.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        {discountPercent > 0 && (
                          <span className="absolute top-3 left-3 px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold">
                            -{discountPercent}%
                          </span>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-stone-500">
                            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">{p.category}</span>
                          </div>
                          <h5 className="font-bold text-stone-900 text-sm line-clamp-1">{p.name}</h5>
                          <p className="text-[11px] text-stone-500 line-clamp-2">{p.description || 'لا يوجد وصف'}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-base font-black text-emerald-700">{p.price} ر.س</span>
                              {p.originalPrice > p.price && (
                                <span className="text-xs text-stone-400 line-through">{p.originalPrice} ر.س</span>
                              )}
                            </div>
                            <span className="text-[10px] text-stone-500 block">المخزون: {p.stock} قطعة</span>
                          </div>

                          <button
                            onClick={() => {
                              setStagedProducts(prev => prev.filter(x => x.stagingId !== item.stagingId));
                              triggerFeedback('تمت إزالة المنتج من قائمة المعاينة.');
                            }}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="إزالة من البروفا"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: CATEGORIES CUSTOMIZER */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Informational Guidance Box */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">خيارات تمثيل وعرض الأقسام على الصفحة الرئيسية:</p>
              <p className="text-amber-800 leading-relaxed">
                يمكنك تخصيص كل قسم ليعرض <strong>صورة فوتوغرافية حقيقية</strong> (مثل صورة عطور فاخرة، ساعات، حقائب جلدية، هدايا) بدلاً من المربعات الفارغة، أو التبديل إلى <strong>رمز تعبيري (أيقونة)</strong> بضغطة زر واحدة. التغييرات تظهر فوراً على الصفحة الرئيسية للمتجر!
              </p>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => {
              const productCount = products.filter(
                p => p.category === cat.name || (p.category_id && p.category_id === cat.id)
              ).length;
              const isImageMode = cat.display_mode === 'image';

              return (
                <div
                  key={cat.id}
                  className={`bg-white rounded-3xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                    cat.status === 'active' ? 'border-stone-200' : 'border-dashed border-stone-300 opacity-60'
                  }`}
                >
                  {/* Category Visual Preview Box */}
                  <div className="relative h-44 w-full bg-stone-100 overflow-hidden group">
                    {isImageMode && cat.image_url ? (
                      <>
                        <img
                          src={cat.image_url}
                          alt={cat.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 to-stone-200">
                        <span className="text-5xl mb-2 drop-shadow-sm">{cat.icon || '💎'}</span>
                        <span className="text-xs font-bold text-stone-500">تمثيل رمزي / أيقونة</span>
                      </div>
                    )}

                    {/* Top Status & Mode Badges */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold backdrop-blur-md shadow-xs ${
                        cat.status === 'active' 
                          ? 'bg-emerald-500/90 text-white' 
                          : 'bg-stone-600/90 text-stone-100'
                      }`}>
                        {cat.status === 'active' ? '● نشط بالمتجر' : '○ معطل'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
                          {isImageMode ? '🖼️ صورة' : '💎 رمز'}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-white text-stone-900 flex items-center justify-center text-xs shadow-xs font-bold">
                          {cat.icon || '💎'}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Info on Image */}
                    {isImageMode && (
                      <div className="absolute bottom-3 inset-x-4 text-white">
                        <h3 className="font-extrabold text-base drop-shadow-md">{cat.title}</h3>
                        <p className="text-[11px] text-stone-200 drop-shadow-xs line-clamp-1">{cat.subtitle}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Body & Controls */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      {!isImageMode && (
                        <div className="mb-2">
                          <h3 className="font-extrabold text-base text-stone-900">{cat.title}</h3>
                          <p className="text-xs text-stone-500">{cat.subtitle}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs py-2 border-y border-stone-100 text-stone-600">
                        <span>اسم الفئة الداخلي:</span>
                        <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                          {cat.name}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs py-2 border-b border-stone-100 text-stone-600">
                        <span>المنتجات المرتبطة:</span>
                        <span className="font-extrabold text-emerald-700">
                          {productCount} منتج
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="space-y-2 pt-2">
                      {/* Fast Toggle Mode Button */}
                      <button
                        onClick={() => {
                          toggleDisplayMode(cat.id);
                          triggerFeedback(`تم تحويل عرض "${cat.title}" إلى ${cat.display_mode === 'image' ? 'الرمز' : 'الصورة'}`);
                        }}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
                          isImageMode
                            ? 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isImageMode ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                            <span>تبديل إلى رمز تعبيري / أيقونة</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-stone-400" />
                            <span>تبديل إلى صورة فوتوغرافية</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditCategory(cat)}
                          className="flex-1 py-2 bg-stone-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> تعديل الصورة والبيانات
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف قسم "${cat.title}"؟`)) {
                              deleteCategory(cat.id);
                              triggerFeedback(`تم حذف القسم "${cat.title}" بنجاح`);
                            }
                          }}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-100"
                          title="حذف القسم"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS TABLE */}
      {activeTab === 'products' && (
        <div className="space-y-5">
          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم، الـ SKU، أو الفئة..."
                className="w-full pr-10 pl-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-stone-600 whitespace-nowrap">تصفية حسب القسم:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 cursor-pointer"
              >
                <option value="all">جميع الأقسام ({products.length})</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.icon} {c.title} ({c.name})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Selection Notice */}
          {selectedProductIds.length > 0 && (
            <div className="p-4 bg-stone-900 text-white rounded-2xl flex items-center justify-between gap-4 animate-fade-in shadow-md">
              <span className="text-xs font-bold">تم تحديد ({selectedProductIds.length}) من المنتجات</span>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => handleBulkFeature(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  تميز كـ Featured 🌟
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  حذف المحدد
                </button>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-bold">
                  <tr>
                    <th className="p-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded-md border-stone-300 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">المنتج</th>
                    <th className="p-3.5">الفئة والقسم</th>
                    <th className="p-3.5">سعر التكلفة</th>
                    <th className="p-3.5">سعر البيع</th>
                    <th className="p-3.5">المخزون</th>
                    <th className="p-3.5">شارات العرض</th>
                    <th className="p-3.5 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => toggleSelectProduct(product.id)}
                          className="rounded-md border-stone-300 cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt={product.name} className="w-10 h-10 rounded-xl object-cover border border-stone-200" />
                          <div>
                            <span className="font-bold text-stone-900 block">{product.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-[11px] font-bold">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-stone-500">{product.cost_price || 50} ₪</td>
                      <td className="p-3.5 font-extrabold text-emerald-700">{product.price} ₪</td>
                      <td className="p-3.5 font-bold">{product.stock} وحدة</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1">
                          {product.featured && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold">مميز 🌟</span>}
                          {product.bestSeller && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded-md text-[10px] font-bold">أكثر مبيعاً 🔥</span>}
                          {product.newProduct && <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded-md text-[10px] font-bold">جديد ✨</span>}
                        </div>
                      </td>
                      <td className="p-3.5 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditProduct(product)}
                            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold cursor-pointer transition-colors"
                            title="تعديل المنتج"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`حذف المنتج "${product.name}"؟`)) {
                                deleteProduct(product.id);
                                triggerFeedback(`تم حذف المنتج "${product.name}" بنجاح`);
                              }
                            }}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors border border-rose-100"
                            title="حذف المنتج"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BULK OPERATIONS */}
      {activeTab === 'bulk_actions' && (
        <div className="p-6 bg-white rounded-3xl border border-stone-200 space-y-4">
          <h3 className="font-bold text-stone-900 text-base">العمليات السريعة الجماعية:</h3>
          <p className="text-xs text-stone-500">
            حدد المنتجات من جدول المنتجات لتطبيق التعديلات دفعة واحدة أو تصدير البيانات.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab('products');
                setSelectedProductIds(products.map(p => p.id));
              }}
              className="px-4 py-2 bg-emerald-50 text-emerald-800 rounded-xl font-bold text-xs cursor-pointer hover:bg-emerald-100"
            >
              تحديد جميع المنتجات ({products.length})
            </button>
            <button
              onClick={() => {
                categories.forEach(c => updateCategory(c.id, { display_mode: 'image' }));
                triggerFeedback('تم تحويل جميع الأقسام لعرض الصور الفوتوغرافية 🖼️');
              }}
              className="px-4 py-2 bg-stone-100 text-stone-800 rounded-xl font-bold text-xs cursor-pointer hover:bg-stone-200"
            >
              عرض جميع الأقسام كصور فوتوغرافية
            </button>
            <button
              onClick={() => {
                categories.forEach(c => updateCategory(c.id, { display_mode: 'icon' }));
                triggerFeedback('تم تحويل جميع الأقسام لعرض الرموز التعبيرية 💎');
              }}
              className="px-4 py-2 bg-stone-100 text-stone-800 rounded-xl font-bold text-xs cursor-pointer hover:bg-stone-200"
            >
              عرض جميع الأقسام كرموز تعبيرية
            </button>
          </div>
        </div>
      )}

      {/* CATEGORY EDITOR MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <ImageIcon className="w-5 h-5" />
                </span>
                <h3 className="font-extrabold text-base text-stone-900">
                  {editingCategory ? `تعديل قسم: ${editingCategory.title}` : 'إضافة قسم / فئة جديدة للمتجر'}
                </h3>
              </div>
              <button 
                onClick={() => setShowCategoryModal(false)} 
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              {/* Internal Name vs Display Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    اسم الفئة الداخلي (لربط المنتجات):
                  </label>
                  <input
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    required
                    placeholder="مثال: عطور، ساعات، حقائب..."
                    className="w-full p-3 border border-stone-200 rounded-xl font-bold text-stone-900 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">هذا الاسم يربط المنتجات بهذا القسم تلقائياً.</p>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    عنوان العرض في المتجر (Display Title):
                  </label>
                  <input
                    type="text"
                    value={catTitle}
                    onChange={(e) => setCatTitle(e.target.value)}
                    required
                    placeholder="مثال: عطور فاخرة، ساعات وإكسسوارات..."
                    className="w-full p-3 border border-stone-200 rounded-xl font-bold text-stone-900 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  الوصف المختصر (Subtitle):
                </label>
                <input
                  type="text"
                  value={catSubtitle}
                  onChange={(e) => setCatSubtitle(e.target.value)}
                  placeholder="مثال: أرقى العطور الشرقية والعالمية"
                  className="w-full p-3 border border-stone-200 rounded-xl text-stone-900 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Display Mode Switcher (Image vs Icon) */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <label className="font-bold text-stone-900 block text-xs">
                  طريقة التمثيل البصري للقسم على الصفحة الرئيسية:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label 
                    onClick={() => setCatDisplayMode('image')}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      catDisplayMode === 'image'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-1 ring-emerald-500'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="display_mode" 
                      checked={catDisplayMode === 'image'} 
                      onChange={() => setCatDisplayMode('image')}
                      className="text-emerald-600"
                    />
                    <div>
                      <span className="block text-xs font-extrabold">🖼️ صورة فوتوغرافية</span>
                      <span className="text-[10px] text-stone-500 block">عرض صورة عالية الدقة تعبر عن القسم</span>
                    </div>
                  </label>

                  <label 
                    onClick={() => setCatDisplayMode('icon')}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      catDisplayMode === 'icon'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-1 ring-emerald-500'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="display_mode" 
                      checked={catDisplayMode === 'icon'} 
                      onChange={() => setCatDisplayMode('icon')}
                      className="text-emerald-600"
                    />
                    <div>
                      <span className="block text-xs font-extrabold">💎 رمز تعبيري / أيقونة</span>
                      <span className="text-[10px] text-stone-500 block">عرض رمز أو إيموجي مميز</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Image URL & Preset Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-700 block">
                    رابط صورة القسم (Image URL):
                  </label>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    Google Drive direct (lh3)
                  </span>
                </div>

                {/* Google Drive Direct Uploader Button */}
                <GoogleDriveImageUploader
                  compact={true}
                  defaultTag="Categories"
                  buttonLabel="📁 رفع صورة من الكمبيوتر إلى Google Drive للقسم"
                  onImageUploaded={(url) => {
                    setCatImageUrl(url);
                    setCatDisplayMode('image');
                  }}
                />

                <input
                  type="text"
                  value={catImageUrl}
                  onChange={(e) => setCatImageUrl(e.target.value)}
                  placeholder="https://lh3.googleusercontent.com/d/..."
                  className="w-full p-3 border border-stone-200 rounded-xl font-mono text-stone-900 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />

                {/* Quick Presets for Category Images */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-stone-600 block mb-2">
                    ⚡ صور جاهزة عالية الجودة للاختيار السريع:
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {CATEGORY_IMAGE_PRESETS.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setCatImageUrl(preset.url);
                          setCatIcon(preset.icon);
                          if (!catTitle) setCatTitle(preset.name);
                        }}
                        className="relative h-14 rounded-xl overflow-hidden border border-stone-200 cursor-pointer group hover:ring-2 hover:ring-emerald-500 transition-all"
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold text-center p-0.5 opacity-90 group-hover:opacity-100">
                          {preset.icon}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Icon / Emoji Picker */}
              <div className="space-y-2">
                <label className="font-bold text-stone-700 block">
                  الرمز التعبيري / الإيموجي (Icon / Emoji):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    className="w-20 p-3 text-center text-xl border border-stone-200 rounded-xl bg-stone-50 font-bold"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap flex-1">
                    {EMOJI_PRESETS.map((em, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCatIcon(em)}
                        className={`w-8 h-8 rounded-xl border text-base flex items-center justify-center transition-all ${
                          catIcon === em ? 'bg-emerald-100 border-emerald-500 scale-110' : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status & Sort Order */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">ترتيب الظهور (Sort Order):</label>
                  <input
                    type="number"
                    value={catSortOrder}
                    onChange={(e) => setCatSortOrder(Number(e.target.value))}
                    className="w-full p-2.5 border border-stone-200 rounded-xl font-bold text-stone-800"
                    min={1}
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">حالة القسم بالمتجر:</label>
                  <select
                    value={catStatus}
                    onChange={(e) => setCatStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full p-2.5 border border-stone-200 rounded-xl font-bold text-stone-800"
                  >
                    <option value="active">● نشط وظاهر للمتسوقين</option>
                    <option value="inactive">○ معطل ومخفي مؤقتاً</option>
                  </select>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 bg-stone-900 rounded-2xl text-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-300">معاينة شكل البطاقة في المتجر:</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Live Preview</span>
                </div>
                <div className="max-w-xs mx-auto">
                  <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-stone-800 shadow-md">
                    {catDisplayMode === 'image' && catImageUrl ? (
                      <div className="relative h-28 w-full">
                        <img src={catImageUrl} alt="preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 text-stone-900 flex items-center justify-center text-xs">
                          {catIcon || '💎'}
                        </div>
                        <div className="absolute bottom-2 inset-x-2 text-right">
                          <h4 className="font-bold text-xs text-white drop-shadow-sm">{catTitle || catName || 'عنوان القسم'}</h4>
                          <p className="text-[9px] text-stone-300 line-clamp-1">{catSubtitle || 'وصف القسم'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center bg-stone-800">
                        <div className="w-10 h-10 mx-auto rounded-xl bg-white text-emerald-800 flex items-center justify-center text-xl mb-1 shadow-xs">
                          {catIcon || '💎'}
                        </div>
                        <h4 className="font-bold text-xs text-white">{catTitle || catName || 'عنوان القسم'}</h4>
                        <p className="text-[9px] text-stone-400">{catSubtitle || 'وصف القسم'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-5 py-2.5 bg-stone-100 text-stone-700 rounded-xl font-bold cursor-pointer hover:bg-stone-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 cursor-pointer shadow-xs"
                >
                  {editingCategory ? 'حفظ التعديلات' : 'إضافة القسم الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        </>
      )}
    </div>
  );
};
