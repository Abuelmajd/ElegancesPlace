import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../contexts/ProductContext';
import { useInventory } from '../contexts/InventoryContext';
import { useGoogleSheets } from '../contexts/GoogleSheetsContext';
import { useReviews } from '../contexts/ReviewContext';
import { useStoreManagement } from '../contexts/StoreContext';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { OrdersManagement } from './OrdersManagement';
import { AccountingManagement } from './AccountingManagement';
import { ExecutiveReportsManagement } from './ExecutiveReportsManagement';
import { NotificationManagement } from './NotificationManagement';
import { ReviewsManagement } from './ReviewsManagement';
import { ReturnsManagement } from './ReturnsManagement';
import { StoreManagementCenter } from './store_management/StoreManagementCenter';
import { SystemSettingsPage } from './SystemSettingsPage';
import { PricingCalculatorPage } from '../components/PricingCalculatorPage';
import { UserRole, Supplier } from '../types';
import { 
  Shield, Users, Package, ShoppingCart, DollarSign, BarChart3, 
  FileText, Settings, Tags, Truck, TrendingUp, AlertTriangle, 
  CheckCircle2, Clock, Plus, ArrowUpRight, Search, Bell, UserCheck, Trash2, Edit3, Database, RefreshCcw, ExternalLink,
  Upload, HardDrive, Sparkles, Link2, Check, X, Building2, Phone, Mail, MapPin, MessageSquare, Eye, PhoneCall,
  Send, Globe, Share2, MessageCircle, Calculator
} from 'lucide-react';

// Palestinian and 1948 Area Cities List
const PALESTINIAN_CITIES = [
  'القدس',
  'رام الله والبيرة',
  'غزة',
  'نابلس',
  'الخليل',
  'جنين',
  'طولكرم',
  'قلقيلية',
  'بيت لحم',
  'أريحا',
  'سلفيت',
  'طوباس',
  'يافا',
  'حيفا',
  'عكا',
  'الناصرة',
  'اللد',
  'الرملة',
  'بئر السبع',
  'طبريا',
  'صفد',
  'بيسان',
  'أم الفحم',
  'الطيبة',
  'باقة الغربية',
  'شفاعمرو',
  'سخنين',
  'طمرة',
  'رهط',
  'كفر قاسم',
  'قلنسوة',
  'مجد الكروم',
  'عرابة',
  'كفر كنعا',
  'دير حنا',
  'يركا',
  'المغار',
  'الرينة',
  'ترشيحا',
  'تل أبيب - يافا',
  'أسدود',
  'المجدل - عسقلان',
  'نتانيا',
  'هرتسليا',
  'ريشون لتسيون',
  'بيتاح تكفا',
  'حولون',
  'بات يام',
  'خانيونس',
  'رفح',
  'دير البلح',
  'جباليا',
  'بيت لاهيا',
  'بيت حانون',
  'النصيرات',
  'البريج',
  'المغازي',
  'العيزرية',
  'أبو ديس',
  'الرام',
  'حلحول',
  'دورا',
  'يطا',
  'الظاهرية',
  'بيت جالا',
  'بيت ساحور',
  'الخضر',
  'بيرزيت',
  'عنبتا'
];

interface AdminDashboardProps {
  currentView?: string;
  setCurrentView?: (view: 'store' | 'admin' | 'setup') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const { currentUser, role, allUsers, updateUserRole } = useAuth();
  const { products, addProduct, updateProduct, updateProducts, deleteProduct } = useProducts();
  const {
    inventory,
    getProductStock,
    setStockDirectly,
  } = useInventory();
  const { config, updateConfig, syncNow, uploadImageToDrive, logs } = useGoogleSheets();
  const { reviews } = useReviews();
  const { storeSettings } = useStoreManagement();
  const [activeTab, setActiveTab] = useState<'overview' | 'store_management' | 'settings' | 'products' | 'orders' | 'returns' | 'suppliers' | 'accounting' | 'reports' | 'customers' | 'googlesheets' | 'notifications' | 'reviews' | 'pricing' | 'importer'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableColumns, setNewTableColumns] = useState('');
  const [creatingTable, setCreatingTable] = useState(false);

  // Product Mode & Wholesale / Profit Margin States
  const [productMode, setProductMode] = useState<'list' | 'add' | 'edit'>('list');
  const [prodWholesalePrice, setProdWholesalePrice] = useState('100');
  const [profitMarginType, setProfitMarginType] = useState<'percentage' | 'fixed' | 'formula'>('percentage');
  const [profitMarginVal, setProfitMarginVal] = useState('30');
  const [customFormula, setCustomFormula] = useState('wholesale * 1.5 + 50');
  const [priceSuffix, setPriceSuffix] = useState('.00');

  useEffect(() => {
    const wholesale = Number(prodWholesalePrice) || 0;
    const margin = Number(profitMarginVal) || 0;
    let finalBasePrice = 0;

    if (profitMarginType === 'percentage') {
      finalBasePrice = wholesale + (wholesale * margin / 100);
    } else if (profitMarginType === 'fixed') {
      finalBasePrice = wholesale + margin;
    } else if (profitMarginType === 'formula') {
      try {
        const fn = new Function('wholesale', 'margin', `return ${customFormula}`);
        finalBasePrice = fn(wholesale, margin);
      } catch (e) {
        finalBasePrice = wholesale; 
      }
    }

    const baseStr = Math.floor(finalBasePrice).toString();
    setProdPrice(`${baseStr}${priceSuffix}`);
    setProdOldPrice((finalBasePrice * 1.25).toFixed(2));
  }, [prodWholesalePrice, profitMarginVal, profitMarginType, customFormula, priceSuffix]);

  const handleShowSupplierProducts = (supplierCompany: string) => {
    setSearchQuery(supplierCompany);
    setActiveTab('products');
    setProductMode('list');
  };

  // Categories State & Dynamic Category Adding
  const [categoriesList, setCategoriesList] = useState<string[]>(() => {
    const saved = localStorage.getItem('elites_category_names');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const rawCats = localStorage.getItem('elites_categories');
    if (rawCats) {
      try {
        const parsed = JSON.parse(rawCats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c: any) => c.name || c);
        }
      } catch (e) {}
    }
    return ['عطور', 'ساعات', 'إكسسوارات', 'حقائب', 'ملابس', 'أحذية', 'إلكترونيات', 'مستحضرات تجميل', 'هدايا وعروض'];
  });

  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const handleAddNewCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categoriesList.includes(trimmed)) {
      setProdCategory(trimmed);
      setIsAddingNewCategory(false);
      setNewCategoryInput('');
      return;
    }
    const updated = [...categoriesList, trimmed];
    setCategoriesList(updated);
    localStorage.setItem('elites_category_names', JSON.stringify(updated));

    // Update elites_categories array for Google Sheets & global sync
    try {
      const existingCats = JSON.parse(localStorage.getItem('elites_categories') || '[]');
      const newCatObj = {
        category_id: 'cat_' + Math.random().toString(36).substr(2, 6),
        name: trimmed,
        slug: trimmed.toLowerCase().replace(/\s+/g, '-'),
        description: `منتجات وتصنيف ${trimmed}`,
        sort_order: updated.length,
        status: 'active'
      };
      localStorage.setItem('elites_categories', JSON.stringify([...existingCats, newCatObj]));
    } catch (err) {}

    setProdCategory(trimmed);
    setIsAddingNewCategory(false);
    setNewCategoryInput('');
    setSuccessMsg(`تمت إضافة التصنيف الجديد "${trimmed}" بنجاح وتعيينه للمنتج!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Add/Edit Product Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showPricingCalcModal, setShowPricingCalcModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('180');
  const [prodOldPrice, setProdOldPrice] = useState('240');
  const [prodCategory, setProdCategory] = useState('عطور');
  const [prodImage, setProdImage] = useState('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60');
  const [prodDriveFileId, setProdDriveFileId] = useState<string>('');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imageFileSize, setImageFileSize] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [prodSupplier, setProdSupplier] = useState('المورد الرئيسي');
  const [prodStock, setProdStock] = useState('15');
  const [stockInputs, setStockInputs] = useState<Record<string, string>>({});
  const [prodDesc, setProdDesc] = useState('');
  const [prodSubCategory, setProdSubCategory] = useState('');
  const [prodSizes, setProdSizes] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Platform Link Helper Functions
  const getWhatsappLink = (phone?: string) => {
    if (!phone || phone === '-') return '';
    const clean = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${clean}`;
  };

  const getTelegramLink = (tg?: string) => {
    if (!tg) return '';
    if (tg.startsWith('http://') || tg.startsWith('https://')) return tg;
    const clean = tg.replace(/^@/, '').trim();
    return `https://t.me/${clean}`;
  };

  const getFacebookLink = (fb?: string) => {
    if (!fb) return '';
    if (fb.startsWith('http://') || fb.startsWith('https://')) return fb;
    return `https://facebook.com/${fb.trim()}`;
  };

  const getInstagramLink = (ig?: string) => {
    if (!ig) return '';
    if (ig.startsWith('http://') || ig.startsWith('https://')) return ig;
    const clean = ig.replace(/^@/, '').trim();
    return `https://instagram.com/${clean}`;
  };

  const getWebsiteLink = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url.trim()}`;
  };

  // Suppliers Management State
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('elites_suppliers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { 
        supplier_id: 'sup_1', 
        name: 'فهد السبيعي', 
        company_name: 'مورد العطور المميزة', 
        phone: '+970599112233', 
        whatsapp: '+970599112233', 
        telegram: '@elites_perfumes_pal',
        facebook: 'elites.perfumes.hub',
        instagram: 'elites_oud_official',
        website: 'https://elites-perfumes.catalog.me',
        preferred_platform: 'whatsapp',
        email: 'oud.supplier@elites.com', 
        city: 'القدس', 
        address: 'شارع صلاح الدين', 
        notes: 'المورد الرئيسي لعطور العود والزيوت الشرقية، التنسيق عبر واتساب وتليجرام.', 
        status: 'active', 
        created_at: '2026-01-01', 
        updated_at: '2026-01-01' 
      },
      { 
        supplier_id: 'sup_2', 
        name: 'عمر القحطاني', 
        company_name: 'مورد الساعات العالمية', 
        phone: '+970599445566', 
        whatsapp: '+970599445566', 
        telegram: '@swiss_watches_channel',
        facebook: 'luxury.watches.palestine',
        preferred_platform: 'telegram',
        email: 'watches@elites.com', 
        city: 'رام الله والبيرة', 
        address: 'شارع الإرسال', 
        notes: 'وكيل الساعات السويسرية واليابانية، كتالوج التوفر يتحدث يومياً على قناة التليجرام.', 
        status: 'active', 
        created_at: '2026-01-10', 
        updated_at: '2026-01-10' 
      },
      { 
        supplier_id: 'sup_3', 
        name: 'زياد الخالدي', 
        company_name: 'مورد الجلديات الفاخرة', 
        phone: '+970599778899', 
        whatsapp: '+970599778899', 
        facebook: 'https://facebook.com/leather.craft.pal',
        instagram: 'leather_craft_hub',
        website: 'https://leather-direct.com',
        preferred_platform: 'facebook',
        email: 'leather@elites.com', 
        city: 'نابلس', 
        address: 'المنطقة الصناعية الشرقية', 
        notes: 'توريد الحقائب الجلدية، استقبال الطلبيات وتحديث الموديلات عبر فيسبوك وانستجرام.', 
        status: 'active', 
        created_at: '2026-01-12', 
        updated_at: '2026-01-12' 
      },
      { 
        supplier_id: 'sup_4', 
        name: 'ياسر المنصور', 
        company_name: 'مورد الإكسسوارات والملابس', 
        phone: '+970599991122', 
        whatsapp: '+970599991122', 
        telegram: '@fashion_wholesale_hebron',
        instagram: 'hebron_fashion_direct',
        preferred_platform: 'telegram',
        email: 'accessories@elites.com', 
        city: 'الخليل', 
        address: 'شارع السلام', 
        notes: 'مجموعات الملابس والإكسسوارات، التواصل الأسرع عبر تليجرام وواتساب.', 
        status: 'active', 
        created_at: '2026-01-20', 
        updated_at: '2026-01-20' 
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('elites_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  // Supplier modal states
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplierView, setSelectedSupplierView] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Supplier form fields (Name and Phone are optional)
  const [supName, setSupName] = useState('');
  const [supCompany, setSupCompany] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supWhatsapp, setSupWhatsapp] = useState('');
  const [supTelegram, setSupTelegram] = useState('');
  const [supFacebook, setSupFacebook] = useState('');
  const [supInstagram, setSupInstagram] = useState('');
  const [supWebsite, setSupWebsite] = useState('');
  const [supPreferredPlatform, setSupPreferredPlatform] = useState<Supplier['preferred_platform']>('whatsapp');
  const [supEmail, setSupEmail] = useState('');
  const [supCity, setSupCity] = useState('القدس');
  const [supAddress, setSupAddress] = useState('');
  const [supNotes, setSupNotes] = useState('');
  const [supStatus, setSupStatus] = useState<'active' | 'inactive'>('active');

  const openAddSupplierModal = () => {
    setEditingSupplier(null);
    setSupName('');
    setSupCompany('');
    setSupPhone('');
    setSupWhatsapp('');
    setSupTelegram('');
    setSupFacebook('');
    setSupInstagram('');
    setSupWebsite('');
    setSupPreferredPlatform('whatsapp');
    setSupEmail('');
    setSupCity('القدس');
    setSupAddress('');
    setSupNotes('');
    setSupStatus('active');
    setIsAddSupplierModalOpen(true);
  };

  const openEditSupplierModal = (s: Supplier) => {
    setEditingSupplier(s);
    setSupName(s.name || '');
    setSupCompany(s.company_name);
    setSupPhone(s.phone && s.phone !== '-' ? s.phone : '');
    setSupWhatsapp(s.whatsapp || s.phone || '');
    setSupTelegram(s.telegram || '');
    setSupFacebook(s.facebook || '');
    setSupInstagram(s.instagram || '');
    setSupWebsite(s.website || '');
    setSupPreferredPlatform(s.preferred_platform || 'whatsapp');
    setSupEmail(s.email || '');
    setSupCity(s.city || 'القدس');
    setSupAddress(s.address || '');
    setSupNotes(s.notes || '');
    setSupStatus(s.status);
    setIsAddSupplierModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supCompany.trim()) {
      alert('يرجى كتابة اسم الشركة أو مؤسسة التوريد');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const finalName = supName.trim() || 'المسؤول العام';
    const finalPhone = supPhone.trim() || '-';
    const finalWhatsapp = supWhatsapp.trim() || (supPhone.trim() ? supPhone.trim() : '');
    const finalEmail = supEmail.trim() || `${supCompany.toLowerCase().replace(/\s+/g, '_')}@supplier.com`;
    const finalCity = supCity.trim() || 'القدس';

    if (editingSupplier) {
      setSuppliers(prev => prev.map(s => s.supplier_id === editingSupplier.supplier_id ? {
        ...s,
        name: finalName,
        company_name: supCompany.trim(),
        phone: finalPhone,
        whatsapp: finalWhatsapp,
        telegram: supTelegram.trim(),
        facebook: supFacebook.trim(),
        instagram: supInstagram.trim(),
        website: supWebsite.trim(),
        preferred_platform: supPreferredPlatform,
        email: finalEmail,
        city: finalCity,
        address: supAddress.trim(),
        notes: supNotes.trim(),
        status: supStatus,
        updated_at: todayStr
      } : s));
      setSuccessMsg(`تم تحديث بيانات المورد "${supCompany}" بنجاح!`);
    } else {
      const newSup: Supplier = {
        supplier_id: 'sup_' + Math.random().toString(36).substr(2, 7),
        name: finalName,
        company_name: supCompany.trim(),
        phone: finalPhone,
        whatsapp: finalWhatsapp,
        telegram: supTelegram.trim(),
        facebook: supFacebook.trim(),
        instagram: supInstagram.trim(),
        website: supWebsite.trim(),
        preferred_platform: supPreferredPlatform,
        email: finalEmail,
        city: finalCity,
        address: supAddress.trim(),
        notes: supNotes.trim(),
        status: supStatus,
        created_at: todayStr,
        updated_at: todayStr
      };
      setSuppliers(prev => [newSup, ...prev]);
      setSuccessMsg(`تمت إضافة المورد الجديد "${supCompany}" بنجاح وتحديث قاعدة البيانات!`);
    }

    setIsAddSupplierModalOpen(false);
    setEditingSupplier(null);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.supplier_id !== id));
    setSupplierToDelete(null);
    setSuccessMsg('تم حذف المورد بنجاح من النظام وقاعدة البيانات');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Google Sheets input states
  const [inputSheetId, setInputSheetId] = useState(config.sheetId);
  const [inputWebhook, setInputWebhook] = useState(config.apiUrl);
  const [inputFolderId, setInputFolderId] = useState(config.folderId);
  const [inputCategoriesFolderId, setInputCategoriesFolderId] = useState(config.categoriesFolderId || config.folderId);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    updateUserRole(userId, newRole);
    setSuccessMsg('تم تحديث صلاحية ودور المستخدم بنجاح');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, GIF)');
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت.');
      return;
    }

    setImageFileName(file.name);
    setImageFileSize((file.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProdImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerUploadNow = async () => {
    if (!prodImage || !prodImage.startsWith('data:image')) {
      alert('يرجى اختيار صورة أولاً للرفع إلى Google Drive');
      return;
    }
    setIsUploadingImage(true);
    try {
      const res = await uploadImageToDrive(prodImage, imageFileName || 'product.jpg');
      if (res && res.driveUrl) {
        setProdDriveFileId(res.fileId || '');
        setSuccessMsg('تم رفع الصورة بنجاح وتوليد رابط Google Drive!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error uploading image to drive:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveSelectedImage = () => {
    setProdImage('');
    setImageFileName('');
    setImageFileSize('');
    setProdDriveFileId('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateProduct = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!prodName.trim()) {
      alert("يرجى إدخال اسم المنتج");
      return;
    }

    if (!prodImage) {
      alert("يرجى إضافة صورة للمنتج");
      return;
    }

    const wholesale =
      Number(prodWholesalePrice) || 0;

    const finalPrice =
      Number(prodPrice) || 0;

    try {
      /* =====================================================
         EDIT PRODUCT
         ===================================================== */

      if (editingProduct) {
        const success =
          await updateProduct(
            editingProduct.id,
            {
              name: prodName.trim(),

              description:
                prodDesc || "",

              selling_price:
                finalPrice,

              cost_price:
                wholesale,

              old_price:
                Number(prodOldPrice) || 0,

              category_id:
                prodCategory || "",

              image_url:
                prodImage,

              drive_file_id:
                prodDriveFileId || "",

              fulfillment_method:
                "OWN_STOCK",

              stock_tracking:
                false,

              status:
                "ACTIVE",

              badge:
                "جديد",
            }
          );

        if (!success) {
          alert(
            "تعذر تحديث المنتج. تحقق من Google Sheets وGoogle Drive."
          );
          return;
        }

        setSuccessMsg(
          "تم تحديث المنتج ومزامنته بنجاح."
        );
      }

      /* =====================================================
         ADD NEW PRODUCT
         ===================================================== */

      else {
        const success =
          await addProduct({
            product_id:
              `prod_${Date.now()}`,

            sku:
              `SKU-${Date.now()}`,

            status:
              "ACTIVE",

            name:
              prodName.trim(),

            description:
              prodDesc || "",

            selling_price:
              finalPrice,

            cost_price:
              wholesale,

            old_price:
              Number(prodOldPrice) || 0,

            category_id:
              prodCategory || "",

            image_url:
              prodImage,

            drive_file_id:
              prodDriveFileId || "",

            fulfillment_method:
              "OWN_STOCK",

            stock_tracking:
              false,

            badge:
              "جديد",

            rating:
              0,

            cost_currency:
              "ILS",

            selling_currency:
              "ILS",

            old_price_currency:
              "ILS",

            product_group_id:
              "",
          });

        if (!success) {
          alert(
            "تعذر حفظ المنتج. تحقق من Google Sheets وGoogle Drive."
          );
          return;
        }

        setSuccessMsg(
          "تمت إضافة المنتج ورفع الصورة إلى Google Drive ومزامنته مع Google Sheets بنجاح."
        );
      }

      /* =====================================================
         RESET FORM
         ===================================================== */

      setProductMode("list");
      setEditingProduct(null);

      setProdName("");
      setProdDesc("");

      setProdWholesalePrice("100");
      setProfitMarginType("percentage");
      setProfitMarginVal("30");
      setProdPrice("130");
      setProdOldPrice("160");

      setImageFileName("");
      setImageFileSize("");
      setProdDriveFileId("");
      setProdImage("");

      setTimeout(
        () => setSuccessMsg(""),
        4000
      );

    } catch (error) {
      console.error(
        "خطأ أثناء حفظ المنتج:",
        error
      );

      alert(
        "حدث خطأ أثناء حفظ المنتج. افتح Console لمعرفة التفاصيل."
      );
    }
  };

  const openAddProductPage = () => {
    setEditingProduct(null);
    setProdName('');
    setProdWholesalePrice('100');
    setProfitMarginType('percentage');
    setProfitMarginVal('30');
    setProdPrice('130');
    setProdOldPrice('160');
    setProdCategory(categoriesList[0] || 'عطور');
    
    // مهم جدًا
    setProdImage('');
    setProdDriveFileId('');
    setImageFileName('');
    setImageFileSize('');
    
    setProdSupplier('المورد الرئيسي');
    setProdStock('999');
    setProdDesc('');
    setProductMode('add');
  };

  const openEditProductPage = (p: any) => {
    setEditingProduct(p);
    setProdName(p.name);
    const wholesale = p.costPrice || p.cost_price || Math.round((p.selling_price || 150) * 0.7);
    setProdWholesalePrice(String(wholesale));
    setProfitMarginType('percentage');
    const margin = Math.round((((p.selling_price - wholesale) / wholesale) * 100)) || 30;
    setProfitMarginVal(String(margin));
    setProdPrice(String(p.selling_price));
    setProdOldPrice(String(p.old_price || p.selling_price * 1.25));
    setProdCategory(p.category);
    setProdImage(p.image);
    setProdDriveFileId(p.drive_file_id || '');
    setProdSupplier(p.supplier || 'المورد الرئيسي');
    setProdStock(String(p.stock ?? 999));
    setProdDesc(p.description || '');
    setProductMode('edit');
  };

  const ROLES_OPTIONS: { role: UserRole; label: string }[] = [
    { role: 'Owner', label: 'المالك / مدير عام (Owner)' },
    { role: 'Manager', label: 'مدير المتجر (Manager)' },
    { role: 'Accountant', label: 'المحاسب المالي (Accountant)' },
    { role: 'Marketing', label: 'مسؤول التسويق (Marketing)' },
    { role: 'Employee', label: 'موظف التجهيز (Employee)' },
    { role: 'Customer', label: 'عميل مسجل (Customer)' },
  ];

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery)
  );

  return (
    <div className="flex flex-row w-full min-h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden" dir="rtl">
      {/* Sidebar - High Density Theme */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-l border-slate-800">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          {storeSettings.logo_url ? (
            <div className="w-8 h-8 rounded-lg border border-slate-700 bg-white p-0.5 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              <img 
                src={storeSettings.logo_url} 
                alt={storeSettings.store_name || 'الشعار'} 
                className="w-full h-full object-contain rounded-md"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-lg text-white shrink-0">
              {(storeSettings.store_name || 'ن').trim().charAt(0)}
            </div>
          )}
          <span className="text-xl font-bold tracking-tight truncate">
            {storeSettings.store_name || 'ElegancesPlace'}
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Helper to render items */}
          {(() => {
            const renderMenuItem = (item: any) => (
              <div
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeTab === item.id ? 'bg-blue-600 text-white font-medium shadow-sm' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <div className="w-5 h-5 flex items-center justify-center text-base">{item.icon}</div>
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge && (
                  <span className="mr-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{item.badge}</span>
                )}
              </div>
            );

            return (
              <>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase px-3">إدارة العمليات</span>
                  {[
                    { id: 'overview', label: 'لوحة التحكم', icon: '📊' },
                    { id: 'orders', label: 'الطلبات والـ Fulfillment', icon: '🛒', badge: '3' },
                    { id: 'products', label: 'المنتجات والمخزون', icon: '📦' },
                    { id: 'returns', label: 'الإرجاع والاستبدال', icon: '🔄' },
                  ].map(renderMenuItem)}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase px-3">إدارة الشركاء</span>
                  {[
                    { id: 'customers', label: 'العملاء والصلاحيات', icon: '👥' },
                    { id: 'suppliers', label: 'الموردون', icon: '🏢' },
                  ].map(renderMenuItem)}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase px-3">الإدارة والمحاسبة</span>
                  {[
                    { id: 'accounting', label: 'المحاسبة', icon: '💰' },
                    { id: 'reports', label: 'التقارير الشاملة', icon: '📈' },
                    { id: 'reviews', label: 'التقييمات والمراجعات', icon: '⭐', badge: reviews.filter(r => r.status === 'PENDING').length > 0 ? reviews.filter(r => r.status === 'PENDING').length : undefined },
                    { id: 'notifications', label: 'الإشعارات والتنبيهات', icon: '🔔' },
                    { id: 'store_management', label: 'إدارة وتنسيق المتجر', icon: '🎨' },
                    { id: 'settings', label: 'إعدادات النظام', icon: '⚙️' },
                  ].map(renderMenuItem)}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase px-3">أدوات إضافية</span>
                  {[
                    { id: 'importer', label: 'المستورد الذكي (AI)', icon: '✨' },
                    { id: 'pricing', label: 'حاسبة أسعار الجملة', icon: '🧮' },
                    { id: 'googlesheets', label: 'قاعدة بيانات Sheets', icon: '🔗' },
                  ].map(renderMenuItem)}
                </div>
              </>
            );
          })()}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
              {currentUser?.name?.[0] || 'أ'}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-white truncate">{currentUser?.name || 'أحمد محمد'}</span>
              <span className="text-[10px] text-slate-400 italic">الدور: {role || 'Owner'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-full w-96 border border-slate-200">
            <span className="text-slate-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن طلب، منتج، أو عميل..."
              className="bg-transparent border-none outline-none text-sm w-full text-right text-slate-800"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold italic">قاعدة البيانات متصلة (Google Sheets)</span>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" title="الإشعارات">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" title="الإعدادات">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="bg-emerald-600 text-white text-xs py-2 px-8 font-medium flex items-center justify-between shadow-sm">
            <span>{successMsg}</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}

        {/* Dynamic Body Area */}
        <div className="flex-1 p-8 space-y-6 overflow-y-auto">
          {activeTab === 'store_management' ? (
            <StoreManagementCenter />
          ) : activeTab === 'settings' ? (
            <SystemSettingsPage />
          ) : activeTab === 'overview' ? (
            <>
              {/* KPI Cards Grid */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">مبيعات اليوم</span>
                    <span className="text-green-600 text-xs font-bold">+12% ↑</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">₪ 1,420.50</div>
                  <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[75%] h-full bg-blue-600"></div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">الطلبات النشطة</span>
                    <span className="text-blue-600 text-xs font-bold">جديد</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">14</div>
                  <div className="mt-1 text-xs text-slate-500">بانتظار التأكيد: 3</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">صافي الربح</span>
                    <span className="text-slate-400 text-xs italic">(تقديري)</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">₪ 485.00</div>
                  <div className="mt-1 text-xs text-slate-500">الهامش: 32%</div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-r-4 border-r-red-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-600 text-xs font-bold uppercase tracking-wider">تنبيهات المخزون</span>
                    <span className="text-red-500 animate-bounce">⚠️</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">4</div>
                  <div className="mt-1 text-xs text-slate-500">منتجات قاربت على النفاذ</div>
                </div>
              </section>

              {/* Data Table & Inventory Section */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm">أحدث الطلبات (Google Sheets Connected)</h3>
                    <button onClick={() => setActiveTab('orders')} className="text-blue-600 text-xs font-bold hover:underline cursor-pointer">عرض الكل</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold">
                        <tr>
                          <th className="px-6 py-3 border-b border-slate-100">رقم الطلب</th>
                          <th className="px-6 py-3 border-b border-slate-100">العميل</th>
                          <th className="px-6 py-3 border-b border-slate-100">المبلغ</th>
                          <th className="px-6 py-3 border-b border-slate-100">الحالة</th>
                          <th className="px-6 py-3 border-b border-slate-100">التنفيذ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        <tr className="hover:bg-slate-50 transition-colors cursor-pointer">
                          <td className="px-6 py-3 font-mono font-bold text-slate-900">#ORD-8921</td>
                          <td className="px-6 py-3 text-slate-700">ياسر القحطاني</td>
                          <td className="px-6 py-3 font-bold text-slate-900">₪ 240.00</td>
                          <td className="px-6 py-3"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[10px] font-bold">قيد المعالجة</span></td>
                          <td className="px-6 py-3 text-slate-500">مخزن داخلي</td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors cursor-pointer">
                          <td className="px-6 py-3 font-mono font-bold text-slate-900">#ORD-8920</td>
                          <td className="px-6 py-3 text-slate-700">سارة خالد</td>
                          <td className="px-6 py-3 font-bold text-slate-900">₪ 115.00</td>
                          <td className="px-6 py-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold">تم الشحن</span></td>
                          <td className="px-6 py-3 text-slate-500">مورد (X-Corp)</td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors cursor-pointer">
                          <td className="px-6 py-3 font-mono font-bold text-slate-900">#ORD-8919</td>
                          <td className="px-6 py-3 text-slate-700">إبراهيم يوسف</td>
                          <td className="px-6 py-3 font-bold text-slate-900">₪ 450.00</td>
                          <td className="px-6 py-3"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">تم التوصيل</span></td>
                          <td className="px-6 py-3 text-slate-500">مخزن داخلي</td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors cursor-pointer">
                          <td className="px-6 py-3 font-mono font-bold text-slate-900">#ORD-8918</td>
                          <td className="px-6 py-3 text-slate-700">ليلى أحمد</td>
                          <td className="px-6 py-3 font-bold text-slate-900">₪ 90.00</td>
                          <td className="px-6 py-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">ملغي</span></td>
                          <td className="px-6 py-3 text-slate-500">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center justify-between">
                      <span>تنبيهات نقص المخزون</span>
                      <span className="w-5 h-5 bg-red-100 text-red-600 text-[10px] font-bold flex items-center justify-center rounded-full">4</span>
                    </h3>
                    <div className="space-y-3">
                      {[
                        { name: 'عطر العود الملكي', stock: 2, threshold: 5 },
                        { name: 'ساعة يد كلاسيكية', stock: 1, threshold: 3 },
                        { name: 'حقيبة جلد طبيعي', stock: 0, threshold: 2 },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                          <div className="w-8 h-8 bg-slate-200 rounded flex items-center justify-center font-bold text-slate-600">📦</div>
                          <div className="flex-1">
                            <span className="font-bold text-slate-900 block">{item.name}</span>
                            <span className="text-red-600 font-medium">المتبقي: {item.stock} (الحد الأدنى: {item.threshold})</span>
                          </div>
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer">
                            إعادة طلب
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </>
          ) : activeTab === 'products' ? (
            <div className="space-y-6">
              {productMode === 'list' ? (
                <>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" /> إدارة المنتجات والمخزون (نظام الأفلييت وسعر الجملة)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        أضف منتجات جديدة مع سعر الجملة وهامش الربح في صفحة منفصلة، وتتبع الموردين والأسعار فوراً.
                      </p>
                    </div>
                    <button
                      onClick={openAddProductPage}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> إضافة منتج جديد (صفحة جديدة)
                    </button>
                  </div>

                  {/* Products Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold">
                          <tr>
                            <th className="px-6 py-3 border-b border-slate-100">المنتج</th>
                            <th className="px-6 py-3 border-b border-slate-100">التصنيف والمورد</th>
                            <th className="px-6 py-3 border-b border-slate-100">سعر الجملة / البيع النهائي</th>
                            <th className="px-6 py-3 border-b border-slate-100">المخزون / الحالة</th>
                            <th className="px-6 py-3 border-b border-slate-100">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {filteredProducts.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-3 flex items-center gap-3">
                                <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" referrerPolicy="no-referrer" />
                                <div>
                                  <span className="font-bold text-slate-900 block">{p.name}</span>
                                  <span className="text-[10px] text-slate-400">ID: {p.id}</span>
                                </div>
                              </td>
                              <td className="px-6 py-3">
                                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">{p.category}</span>
                                <span className="text-slate-500 block text-[11px] mt-0.5">{p.supplier || 'المورد الرئيسي'}</span>
                              </td>
                              <td className="px-6 py-3">
                                <div className="font-extrabold text-emerald-700 text-sm">
                                  ₪ {p.selling_price}
                                  {p.old_price && <span className="text-stone-400 text-xs line-through mr-1 font-normal">₪ {p.old_price}</span>}
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                  سعر الجملة: ₪ {p.costPrice || p.cost_price || Math.round(p.selling_price * 0.7)}
                                </div>
                              </td>
                              <td className="px-6 py-3">
                                {(() => {
                                  const productId = p.product_id || p.id;
                                  const currentStock = getProductStock(productId);

                                  return (
                                    <div className="flex flex-col gap-2 min-w-[150px]">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">
                                          المتاح:
                                        </span>

                                        <span
                                          className={`font-extrabold ${
                                            currentStock <= 0
                                              ? 'text-red-600'
                                              : currentStock <= 5
                                              ? 'text-orange-600'
                                              : 'text-emerald-600'
                                          }`}
                                        >
                                          {currentStock}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          min="0"
                                          value={
                                            stockInputs[productId] ??
                                            String(currentStock)
                                          }
                                          onChange={(e) =>
                                            setStockInputs(prev => ({
                                              ...prev,
                                              [productId]: e.target.value,
                                            }))
                                          }
                                          className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center font-bold focus:outline-none focus:border-blue-500"
                                        />

                                        <button
                                          type="button"
                                          onClick={() => {
                                            const value = Number(stockInputs[productId]);

                                            if (!Number.isFinite(value) || value < 0) {
                                              alert('يرجى إدخال كمية مخزون صحيحة.');
                                              return;
                                            }

                                            setStockDirectly(
                                              productId,
                                              value,
                                              'تعديل المخزون من لوحة التحكم'
                                            );

                                            setStockInputs(prev => {
                                              const next = { ...prev };
                                              delete next[productId];
                                              return next;
                                            });

                                            setSuccessMsg(
                                              `تم تحديث مخزون "${p.name}" إلى ${value}`
                                            );

                                            setTimeout(
                                              () => setSuccessMsg(''),
                                              3000
                                            );
                                          }}
                                          className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold"
                                        >
                                          حفظ
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-6 py-3 flex items-center gap-2">
                                <button
                                  onClick={() => openEditProductPage(p)}
                                  className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-xs font-bold cursor-pointer flex items-center gap-1"
                                  title="تعديل المنتج"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> تعديل
                                </button>
                                <button
                                  onClick={() => setProductToDelete(p)}
                                  className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-xs font-bold cursor-pointer flex items-center gap-1"
                                  title="حذف المنتج"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> حذف
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Delete Confirmation Modal */}
                  {productToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
                          ⚠️
                        </div>
                        <h3 className="text-base font-bold text-slate-900">تأكيد حذف المنتج</h3>
                        <p className="text-xs text-slate-600">
                          هل أنت متأكد من حذف المنتج <span className="font-bold text-slate-900">"{productToDelete.name}"</span>؟ لا يمكن التراجع عن هذا الإجراء.
                        </p>
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            onClick={() => setProductToDelete(null)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            إلغاء
                          </button>
                          <button
                            onClick={() => {
                              deleteProduct(productToDelete.id);
                              setProductToDelete(null);
                              setSuccessMsg('تم حذف المنتج بنجاح');
                              setTimeout(() => setSuccessMsg(''), 3000);
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            نعم، احذف المنتج
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Full Page Add / Edit Product View (Instead of popup modal) */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900">
                          {productMode === 'edit' ? 'تعديل بيانات المنتج وسعر الجملة والربح' : 'إضافة منتج جديد (صفحة كاملة)'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          نظام الأفلييت ماركتنج: أدخل سعر الجملة وهامش الربح لتحديد السعر النهائي للعميل بدقة.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProductMode('list')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      ← العودة لقائمة المنتجات
                    </button>
                  </div>

                  <form onSubmit={handleCreateProduct} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المنتج <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={prodName}
                          onChange={(e) => setProdName(e.target.value)}
                          placeholder="مثال: عطر ملكي فاخر / ساعة يد كلاسيكية"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 font-bold text-slate-900"
                        />
                      </div>

                      {/* Wholesale & Profit Margin Calculator */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 sm:col-span-2 space-y-4">
                        <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-emerald-600" />
                          حاسبة سعر الجملة وهامش الربح (أفلييت)
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">سعر الجملة (₪) <span className="text-rose-500">*</span></label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={prodWholesalePrice}
                              onChange={(e) => setProdWholesalePrice(e.target.value)}
                              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                            />
                            <span className="text-[10px] text-slate-400 mt-1 block">تكلفة شراء المنتج من المورد</span>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">نوع هامش الربح</label>
                            <select
                              value={profitMarginType}
                              onChange={(e) => setProfitMarginType(e.target.value as 'percentage' | 'fixed' | 'formula')}
                              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
                            >
                              <option value="percentage">نسبة مئوية (%)</option>
                              <option value="fixed">مبلغ ثابت (₪)</option>
                              <option value="formula">معادلة حسابية</option>
                            </select>
                            <span className="text-[10px] text-slate-400 mt-1 block">نسبة، مبلغ، أو معادلة</span>
                          </div>

                          {profitMarginType === 'formula' ? (
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">المعادلة (مثال: wholesale * 1.2 + 20)</label>
                              <input
                                type="text"
                                value={customFormula}
                                onChange={(e) => setCustomFormula(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-600"
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                قيمة الربح ({profitMarginType === 'percentage' ? '%' : '₪'})
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={profitMarginVal}
                                onChange={(e) => setProfitMarginVal(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-emerald-700 focus:outline-none focus:border-blue-600"
                              />
                              <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                                صافي ربحك المتوقع: ₪ {profitMarginType === 'percentage' ? (Number(prodWholesalePrice) * Number(profitMarginVal) / 100).toFixed(2) : Number(profitMarginVal)}
                              </span>
                            </div>
                          )}
                          
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">لاحقة السعر (مثال: .99)</label>
                            <input
                              type="text"
                              value={priceSuffix}
                              onChange={(e) => setPriceSuffix(e.target.value)}
                              placeholder=".00"
                              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">سعر البيع النهائي للعميل (₪)</label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={prodPrice}
                              onChange={(e) => setProdPrice(e.target.value)}
                              className="w-full px-4 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-base font-extrabold text-emerald-800 focus:outline-none"
                            />
                            <span className="text-[10px] text-emerald-700 mt-1 block">يتم احتسابه تلقائياً (جملة + ربح) ويمكن تعديله يدوياً</span>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">السعر القديم (للعروض الشطب)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={prodOldPrice}
                              onChange={(e) => setProdOldPrice(e.target.value)}
                              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700">التصنيف</label>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingNewCategory(!isAddingNewCategory);
                              setNewCategoryInput('');
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            {isAddingNewCategory ? 'إلغاء' : '+ إضافة تصنيف'}
                          </button>
                        </div>

                        {!isAddingNewCategory ? (
                          <select
                            value={prodCategory}
                            onChange={(e) => setProdCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-600 cursor-pointer"
                          >
                            {categoriesList.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              autoFocus
                              value={newCategoryInput}
                              onChange={(e) => setNewCategoryInput(e.target.value)}
                              placeholder="اسم التصنيف الجديد..."
                              className="w-full px-3 py-2.5 bg-white border-2 border-blue-400 rounded-xl text-xs focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddNewCategory}
                              className="px-3 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                            >
                              إضافة
                            </button>
                          </div>
                        )}
                      </div>

                      {prodCategory === 'ملابس' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">نوع الملابس</label>
                          <select
                            value={prodSubCategory}
                            onChange={(e) => setProdSubCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-600 cursor-pointer"
                          >
                            <option value="">اختر النوع</option>
                            <option value="داخلية">ملابس داخلية</option>
                            <option value="رجالية">ملابس رجالية</option>
                            <option value="نسائية">ملابس نسائية</option>
                          </select>
                        </div>
                      )}

                      {prodCategory === 'ملابس' && (
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">المقاسات</label>
                          <div className="flex flex-wrap gap-2">
                            {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'].map(size => (
                              <label key={size} className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-200">
                                <input 
                                  type="checkbox" 
                                  className="w-3 h-3"
                                  value={size}
                                  checked={prodSizes.includes(size)}
                                  onChange={(e) => {
                                    if (e.target.checked) setProdSizes([...prodSizes, size]);
                                    else setProdSizes(prodSizes.filter(s => s !== size));
                                  }}
                                />
                                {size}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">المورد أو مصدر التوريد</label>
                        <select
                          value={prodSupplier}
                          onChange={(e) => setProdSupplier(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-600 cursor-pointer"
                        >
                          <option value="المورد الرئيسي">المورد الرئيسي (مستودع المتجر)</option>
                          {suppliers.map((s) => (
                            <option key={s.supplier_id} value={s.company_name}>
                              {s.company_name} ({s.name})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Image Upload Area */}
                      <div className="sm:col-span-2 space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                          صورة المنتج <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleImageFileSelect} 
                          accept="image/*" 
                          className="hidden" 
                        />
                        {prodImage ? (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                            <img src={prodImage} alt="معاينة" className="w-16 h-16 object-cover rounded-lg border border-slate-200 bg-white" referrerPolicy="no-referrer" />
                            <div className="flex-1">
                              <span className="text-xs font-bold text-slate-800 block mb-1">{imageFileName || 'صورة المنتج'}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="px-3 py-1 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  تغيير الصورة
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRemoveSelectedImage}
                                  className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  حذف
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 rounded-xl p-6 text-center cursor-pointer"
                          >
                            <Upload className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                            <p className="text-xs font-bold text-slate-800">اضغط لاختيار صورة المنتج من جهازك</p>
                          </div>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">وصف المنتج التفصيلي</label>
                        <textarea
                          rows={3}
                          value={prodDesc}
                          onChange={(e) => setProdDesc(e.target.value)}
                          placeholder="اكتب وصف المنتج ومواصفاته للعملاء..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setProductMode('list')}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer"
                      >
                        حفظ المنتج وإضافته للمتجر
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : activeTab === 'googlesheets' ? (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-600" /> ربط ومزامنة قاعدة البيانات مع Google Sheets
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    قم بربط متجرك بملف Google Sheets لحفظ بيانات العملاء، المنتجات، والطلبات تلقائياً فوراً عند تسجيل أي عميل أو إضافة طلب جديد.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await syncNow();
                    setSuccessMsg('تمت المزامنة بنجاح مع Google Sheets!');
                    setTimeout(() => setSuccessMsg(''), 4000);
                  }}
                  disabled={config.syncStatus === 'syncing'}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCcw className={`w-4 h-4 ${config.syncStatus === 'syncing' ? 'animate-spin' : ''}`} /> 
                  {config.syncStatus === 'syncing' ? 'جاري المزامنة...' : 'مزامنة فورية الآن'}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* Configuration Form */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Settings className="w-4 h-4 text-blue-600" /> إعدادات اتصال Google Sheets API
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">معرف جدول Google Sheet ID</label>
                    <input
                      type="text"
                      value={inputSheetId}
                      onChange={(e) => setInputSheetId(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-left focus:outline-none focus:border-emerald-600"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">رابط Webhook / Google Apps Script URL</label>
                    <input
                      type="url"
                      value={inputWebhook}
                      onChange={(e) => setInputWebhook(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-left focus:outline-none focus:border-emerald-600"
                      dir="ltr"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">📁 معرف مجلد صور المنتجات (Products Folder ID)</label>
                      <input
                        type="text"
                        value={inputFolderId}
                        onChange={(e) => setInputFolderId(e.target.value)}
                        placeholder="أدخل معرف مجلد الدرايف للمنتجات..."
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left focus:outline-none focus:border-emerald-600"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">📂 معرف مجلد صور الأقسام (Categories Folder ID)</label>
                      <input
                        type="text"
                        value={inputCategoriesFolderId}
                        onChange={(e) => setInputCategoriesFolderId(e.target.value)}
                        placeholder="أدخل معرف مجلد الدرايف للكاتجوريز..."
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left focus:outline-none focus:border-emerald-600"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${config.isConnected ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                      <span className="text-xs font-bold text-slate-700">
                        {config.isConnected ? 'متصل بنجاح مع Google Sheets' : 'بانتظار المزامنة الأولى'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        updateConfig({ 
                          sheetId: inputSheetId, 
                          apiUrl: inputWebhook, 
                          folderId: inputFolderId.trim(), 
                          categoriesFolderId: inputCategoriesFolderId.trim() 
                        });
                        setSuccessMsg('تم حفظ إعدادات Google Sheets ومعرفات مجلدات Google Drive بنجاح!');
                        setTimeout(() => setSuccessMsg(''), 3000);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      حفظ الإعدادات
                    </button>
                  </div>

                  {config.lastSyncedAt && (
                    <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                      آخر مزامنة ناجحة: {config.lastSyncedAt}
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[11px] text-amber-900 space-y-2 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-xs text-amber-950">
                        <HardDrive className="w-4 h-4 text-emerald-600" />
                        ربط Google Sheets & Google Drive لرفع الصور تلقائياً:
                      </span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700">
                      <li>افتح جدول بياناتك في Google Sheets.</li>
                      <li>من القائمة العلوية اختر <strong>Extensions &gt; Apps Script</strong>.</li>
                      <li>استبدل الكود بالسكربت المطور أدناه (يقوم بإنشاء مجلد <strong>Elites_Store_Media</strong> في Google Drive تلقائياً ورفع الصور ووضع الروابط في الأعمدة المخصصة).</li>
                      <li>اضغط على <strong>Deploy &gt; New deployment &gt; Web app</strong> (اختر Who has access: Anyone).</li>
                      <li>انسخ الرابط الناتج وضعه في حقل Webhook أعلاه.</li>
                    </ol>
                    
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const scriptCode = `// Google Apps Script لElegancesPlace: إدارة ومزامنة 24 جدولاً + Google Drive
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
    var mediaFolder = getOrCreateFolder("Elites_Store_Media");
    
    // 1. رفع صورة مفردة إلى Google Drive
    if (data.action === "upload_image_to_drive") {
      var base64Data = data.base64Data.replace(/^data:image\\/\\w+;base64,/, "");
      var decoded = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decoded, data.mimeType || "image/jpeg", data.fileName || ("prod_" + new Date().getTime() + ".jpg"));
      var file = mediaFolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var directUrl = "https://lh3.googleusercontent.com/d/" + file.getId();
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        fileId: file.getId(),
        driveUrl: directUrl,
        webUrl: file.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. مزامنة وتحديث متطابق (Idempotent Sync) لكافة الجداول الـ 24
    if (data.action === "sync_all_tables" && data.tables) {
      if (data.tables.product_images && Array.isArray(data.tables.product_images)) {
        data.tables.product_images.forEach(function(img) {
          if (img.base64_data && img.base64_data.indexOf("data:image") === 0) {
            try {
              var cleanB64 = img.base64_data.replace(/^data:image\\/\\w+;base64,/, "");
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

function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
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
                          setSuccessMsg('تم نسخ كود Google Apps Script المتكامل مع Google Drive إلى الحافظة!');
                          setTimeout(() => setSuccessMsg(''), 4000);
                        }}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" /> نسخ كود Google Apps Script المطور (مع دعم Google Drive)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table Management & Creation Tool */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Database className="w-4 h-4 text-emerald-600" /> 🛠️ إنشاء وإدارة جداول قاعدة البيانات (المدير والمالك فقط)
                  </h4>
                  <p className="text-xs text-slate-500">
                    يمكنك إنشاء أي جدول معتمد جديد في ملف Google Sheets الخاص بك مباشرة من هنا بضغطة زر دون الحاجة للتعامل مع الأكواد.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">اسم الجدول الجديد</label>
                      <input
                        type="text"
                        value={newTableName}
                        onChange={(e) => setNewTableName(e.target.value)}
                        placeholder="مثال: Wishlists, Coupons, Discounts..."
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">أعمدة الجدول (اختياري، تفصل بفاصلة English , )</label>
                      <input
                        type="text"
                        value={newTableColumns}
                        onChange={(e) => setNewTableColumns(e.target.value)}
                        placeholder="مثال: id, name, price, created_at"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600"
                        dir="ltr"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        إذا تركتها فارغة، فسيتم إنشاء جدول فارغ تماماً.
                      </p>
                    </div>
                    
                    <button
                      onClick={async () => {
                        if (!newTableName.trim()) {
                          alert('الرجاء إدخال اسم الجدول أولاً!');
                          return;
                        }
                        setCreatingTable(true);
                        // Parse columns
                        const colsArray = newTableColumns
                          ? newTableColumns.split(',').map(c => c.trim()).filter(Boolean)
                          : [];

                        try {
                          const response = await fetch('/api/create-table', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              tableName: newTableName.trim(),
                              columns: colsArray
                            })
                          });
                          const result = await response.json();
                          if (result.status === 'success') {
                            setSuccessMsg(`تم إنشاء جدول [${newTableName}] بنجاح مع الأعمدة المحددة!`);
                            setNewTableName('');
                            setNewTableColumns('');
                            setTimeout(() => setSuccessMsg(''), 4000);
                          } else {
                            alert(`خطأ: ${result.message || result.error || 'لم يتمكن السيرفر من إنشاء الجدول'}`);
                          }
                        } catch (err: any) {
                          alert(`خطأ في الشبكة أو السيرفر: ${err.message}`);
                        } finally {
                          setCreatingTable(false);
                        }
                      }}
                      disabled={creatingTable}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      {creatingTable ? 'جاري إنشاء الجدول والأعمدة في Google Sheets...' : 'إنشاء جدول جديد الآن'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sync Logs */}
                <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm flex flex-col">
                  <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                    <FileText className="w-4 h-4 text-emerald-400" /> سجلات المزامنة والربط المباشر
                  </h4>
                  <div className="flex-1 space-y-2 font-mono text-xs overflow-y-auto max-h-64">
                    {logs.map((log) => (
                      <div key={log.id} className="p-2.5 rounded bg-slate-800/80 border border-slate-700/50 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className={log.type === 'success' ? 'text-emerald-400 font-bold' : log.type === 'error' ? 'text-red-400 font-bold' : 'text-blue-400'}>
                            [{log.type.toUpperCase()}]
                          </span>
                          <span>{log.timestamp}</span>
                        </div>
                        <p className="text-slate-200 text-xs">{log.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'pricing' ? (
            <PricingCalculatorPage 
              products={products} 
              onUpdateProducts={(updatedProducts) => {
                const updates = updatedProducts.map(p => ({
                  id: p.id,
                  product: {
                  selling_price: Number(p.selling_price)
                }
                }));
                updateProducts(updates);
                setSuccessMsg('تم تحديث أسعار المنتجات المحددة بنجاح!');
                setTimeout(() => setSuccessMsg(''), 4000);
              }} 
            />
          ) : activeTab === 'importer' ? (
            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold mb-4">المستورد الذكي (AI)</h2>
              <p className="text-sm text-slate-500 mb-6">الصق نص المنتج أو رابطاً له من التليجرام أو الواتساب، وسيقوم الذكاء الاصطناعي باستخراج البيانات.</p>
              <textarea 
                className="w-full h-40 p-4 border rounded-lg mb-4" 
                placeholder="الصق نص المنتج هنا..."
                onChange={(e) => (window as any).importText = e.target.value}
              />
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-8"
                onClick={async () => {
                  const text = (window as any).importText;
                  if (!text) return;
                  const res = await fetch('/api/import-product', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                  });
                  const data = await res.json();
                  if (db) {
                    await addDoc(collection(db, 'import_list'), data);
                    alert('تمت إضافة المنتج إلى قائمة الاستيراد!');
                    // Refresh import list
                  }
                }}
              >
                تحليل وإضافة إلى قائمة الاستيراد
              </button>

              <h3 className="text-lg font-bold mb-4">قائمة الاستيراد (Drafts)</h3>
              <div className="space-y-4">
                {/* We need to fetch and render this list */}
                <p className="text-sm text-slate-500">سيتم عرض المنتجات المستوردة هنا للمراجعة والاعتماد.</p>
              </div>
            </div>
          ) : activeTab === 'suppliers' ? (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" /> إدارة الموردين وشبكة التوريد (Suppliers & CRM)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    إدارة دليل الموردين، حساباتهم، بيانات الاتصال والواتساب، ومزامنة بياناتهم تلقائياً مع جدول Google Sheets وقاعدة البيانات السحابية.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      await syncNow();
                      setSuccessMsg('تم رفع ومزامنة بيانات الموردين مع Google Sheets!');
                      setTimeout(() => setSuccessMsg(''), 4000);
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-4 py-2.5 rounded-xl text-xs border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" /> رفع الموردين لقاعدة البيانات
                  </button>
                  <button
                    onClick={openAddSupplierModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> إضافة مورد جديد
                  </button>
                </div>
              </div>

              {/* Suppliers Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-xs font-bold block mb-1">إجمالي الموردين</span>
                    <span className="text-2xl font-extrabold text-slate-900">{suppliers.length}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-xs font-bold block mb-1">الموردون النشطون</span>
                    <span className="text-2xl font-extrabold text-emerald-600">
                      {suppliers.filter(s => s.status === 'active').length}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-xs font-bold block mb-1">حالة المزامنة السحابية</span>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                      متصل (Google Sheets)
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Suppliers Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold">
                      <tr>
                        <th className="px-5 py-3 border-b border-slate-100">المورد والشركة</th>
                        <th className="px-5 py-3 border-b border-slate-100">منصات وقنوات التواصل والطلب</th>
                        <th className="px-5 py-3 border-b border-slate-100">المدينة والعنوان</th>
                        <th className="px-5 py-3 border-b border-slate-100">الحالة</th>
                        <th className="px-5 py-3 border-b border-slate-100 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredSuppliers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                            <p className="font-bold text-sm text-slate-700">لا يوجد موردون مسجلون حالياً</p>
                            <p className="text-xs text-slate-400 mt-1">اضغط على زر "إضافة مورد جديد" في الأعلى للبدء.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredSuppliers.map((s) => {
                          const waLink = getWhatsappLink(s.whatsapp || s.phone);
                          const tgLink = getTelegramLink(s.telegram);
                          const fbLink = getFacebookLink(s.facebook);
                          const igLink = getInstagramLink(s.instagram);
                          const webLink = getWebsiteLink(s.website);

                          return (
                            <tr key={s.supplier_id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shadow-inner shrink-0">
                                    {s.company_name[0] || 'م'}
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-900 block text-sm">{s.company_name}</span>
                                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                      👤 المسؤول: {s.name || 'المسؤول العام'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-3.5">
                                <div className="space-y-2">
                                  {/* Quick Platform Connect Links */}
                                  <div className="flex items-center flex-wrap gap-1.5">
                                    {waLink && (
                                      <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition-all shadow-xs"
                                        title={`فتح محادثة واتساب: ${s.whatsapp || s.phone}`}
                                      >
                                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>واتساب</span>
                                      </a>
                                    )}

                                    {tgLink && (
                                      <a
                                        href={tgLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-[11px] font-bold transition-all shadow-xs"
                                        title={`فتح حساب/قناة تليجرام: ${s.telegram}`}
                                      >
                                        <Send className="w-3 h-3 text-sky-600" />
                                        <span>تليجرام</span>
                                      </a>
                                    )}

                                    {fbLink && (
                                      <a
                                        href={fbLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition-all shadow-xs"
                                        title={`فتح صفحة فيسبوك: ${s.facebook}`}
                                      >
                                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                                        <span>فيسبوك</span>
                                      </a>
                                    )}

                                    {igLink && (
                                      <a
                                        href={igLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-lg text-[11px] font-bold transition-all shadow-xs"
                                        title={`فتح حساب انستجرام: ${s.instagram}`}
                                      >
                                        <Share2 className="w-3.5 h-3.5 text-pink-600" />
                                        <span>انستجرام</span>
                                      </a>
                                    )}

                                    {webLink && (
                                      <a
                                        href={webLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-[11px] font-bold transition-all shadow-xs"
                                        title={`فتح الموقع أو الكتالوج: ${s.website}`}
                                      >
                                        <ExternalLink className="w-3 h-3 text-slate-600" />
                                        <span>الكتالوج</span>
                                      </a>
                                    )}

                                    {s.phone && s.phone !== '-' && (
                                      <a
                                        href={`tel:${s.phone}`}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-mono transition-all"
                                        title="اتصال هاتفي مباشر"
                                      >
                                        <Phone className="w-3 h-3 text-slate-500" />
                                        <span dir="ltr">{s.phone}</span>
                                      </a>
                                    )}
                                  </div>

                                  {/* Preferred Platform Indicator */}
                                  {s.preferred_platform && (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                      <span className="text-amber-500">⭐</span>
                                      <span>المنصة المفضلة للطلب: </span>
                                      <span className="font-bold text-slate-800">
                                        {s.preferred_platform === 'telegram' ? 'تليجرام' :
                                         s.preferred_platform === 'whatsapp' ? 'واتساب' :
                                         s.preferred_platform === 'facebook' ? 'فيسبوك' :
                                         s.preferred_platform === 'instagram' ? 'انستجرام' :
                                         s.preferred_platform === 'website' ? 'الكتالوج / الموقع' :
                                         s.preferred_platform === 'phone' ? 'الاتصال الهاتفي' : 'أخرى'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="px-5 py-3.5">
                                <span className="font-bold text-slate-800 block">{s.city}</span>
                                <span className="text-slate-500 text-[11px] line-clamp-1">{s.address || 'العنوان غير محدد'}</span>
                              </td>

                              <td className="px-5 py-3.5">
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  s.status === 'active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {s.status === 'active' ? 'نشط ومتاح' : 'غير نشط'}
                                </span>
                              </td>

                              <td className="px-5 py-3.5 text-center">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  <button
                                    onClick={() => handleShowSupplierProducts(s.company_name)}
                                    className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors text-xs font-bold cursor-pointer flex items-center gap-1"
                                    title="عرض كافة المنتجات المرتبطة بهذا المورد"
                                  >
                                    <Package className="w-3.5 h-3.5" /> منتجات المورد
                                  </button>
                                  <button
                                    onClick={() => setSelectedSupplierView(s)}
                                    className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors text-xs font-bold cursor-pointer flex items-center gap-1"
                                    title="عرض بطاقة المورد الكاملة وروابط المنصات"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-blue-600" /> تفاصيل
                                  </button>
                                  <button
                                    onClick={() => openEditSupplierModal(s)}
                                    className="px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-xs font-bold cursor-pointer flex items-center gap-1"
                                    title="تعديل بيانات المورد والمنصات"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" /> تعديل
                                  </button>
                                  <button
                                    onClick={() => setSupplierToDelete(s)}
                                    className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors text-xs font-bold cursor-pointer"
                                    title="حذف المورد"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* View Supplier Details Modal */}
              {selectedSupplierView && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-400" />
                        <h3 className="font-bold text-base">بطاقة بيانات المورد: {selectedSupplierView.company_name}</h3>
                      </div>
                      <button 
                        onClick={() => setSelectedSupplierView(null)} 
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-500 font-bold block">معرف المورد (Supplier ID)</span>
                          <span className="font-mono font-bold text-blue-700 text-sm">{selectedSupplierView.supplier_id}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          selectedSupplierView.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {selectedSupplierView.status === 'active' ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-xs text-slate-500 font-bold block mb-1">اسم المسؤول المعتمد</span>
                          <span className="text-sm font-bold text-slate-900">{selectedSupplierView.name || 'المسؤول العام'}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-xs text-slate-500 font-bold block mb-1">المدينة والمنطقة</span>
                          <span className="text-sm font-bold text-slate-900">{selectedSupplierView.city}</span>
                        </div>
                      </div>

                      {/* Direct Platform Links Section */}
                      <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <Share2 className="w-4 h-4 text-blue-600" /> منصات وقنوات التواصل المباشرة
                          </span>
                          {selectedSupplierView.preferred_platform && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                              ⭐ المفضلة: {
                                selectedSupplierView.preferred_platform === 'telegram' ? 'تليجرام' :
                                selectedSupplierView.preferred_platform === 'whatsapp' ? 'واتساب' :
                                selectedSupplierView.preferred_platform === 'facebook' ? 'فيسبوك' :
                                selectedSupplierView.preferred_platform === 'instagram' ? 'انستجرام' :
                                selectedSupplierView.preferred_platform === 'website' ? 'الموقع/الكتالوج' :
                                selectedSupplierView.preferred_platform === 'phone' ? 'الاتصال' : 'أخرى'
                              }
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {getWhatsappLink(selectedSupplierView.whatsapp || selectedSupplierView.phone) && (
                            <a
                              href={getWhatsappLink(selectedSupplierView.whatsapp || selectedSupplierView.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                            >
                              <span className="flex items-center gap-1.5">
                                <MessageCircle className="w-4 h-4" /> فتح محادثة واتساب
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                            </a>
                          )}

                          {getTelegramLink(selectedSupplierView.telegram) && (
                            <a
                              href={getTelegramLink(selectedSupplierView.telegram)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                            >
                              <span className="flex items-center gap-1.5">
                                <Send className="w-4 h-4" /> فتح قناة/حساب تليجرام
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                            </a>
                          )}

                          {getFacebookLink(selectedSupplierView.facebook) && (
                            <a
                              href={getFacebookLink(selectedSupplierView.facebook)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                            >
                              <span className="flex items-center gap-1.5">
                                <Globe className="w-4 h-4" /> صفحة فيسبوك
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                            </a>
                          )}

                          {getInstagramLink(selectedSupplierView.instagram) && (
                            <a
                              href={getInstagramLink(selectedSupplierView.instagram)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                            >
                              <span className="flex items-center gap-1.5">
                                <Share2 className="w-4 h-4" /> حساب انستجرام
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                            </a>
                          )}

                          {getWebsiteLink(selectedSupplierView.website) && (
                            <a
                              href={getWebsiteLink(selectedSupplierView.website)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors shadow-xs sm:col-span-2"
                            >
                              <span className="flex items-center gap-1.5">
                                <ExternalLink className="w-4 h-4" /> فتح الكتالوج أو الموقع الإلكتروني للمورد
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                            </a>
                          )}
                        </div>

                        {/* General details text */}
                        <div className="pt-2 border-t border-blue-200/60 grid grid-cols-2 gap-2 text-xs">
                          {selectedSupplierView.phone && selectedSupplierView.phone !== '-' && (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span dir="ltr" className="font-mono">{selectedSupplierView.phone}</span>
                            </div>
                          )}
                          {selectedSupplierView.email && (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span dir="ltr">{selectedSupplierView.email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-xs text-slate-500 font-bold block mb-1">العنوان التفصيلي وموقع المستودع</span>
                        <p className="text-xs text-slate-700">{selectedSupplierView.address || 'لم يتم تسجيل عنوان تفصيلي.'}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-xs text-slate-500 font-bold block mb-1">ملاحظات التوريد والاتفاقيات</span>
                        <p className="text-xs text-slate-700">{selectedSupplierView.notes || 'لا توجد ملاحظات إضافية.'}</p>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>بيانات هذا المورد محفوظة محلياً وفي جدول Suppliers في Google Sheets.</span>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => handleShowSupplierProducts(selectedSupplierView.company_name)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Package className="w-3.5 h-3.5" /> عرض منتجات المورد
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const target = selectedSupplierView;
                              setSelectedSupplierView(null);
                              openEditSupplierModal(target);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> تعديل بيانات المورد
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSupplierView(null)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            إغلاق
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add / Edit Supplier Modal */}
              {isAddSupplierModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-400" />
                        {editingSupplier ? 'تعديل بيانات المورد ومنصات التواصل' : 'إضافة مورد جديد إلى قاعدة البيانات'}
                      </h3>
                      <button onClick={() => setIsAddSupplierModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
                    </div>

                    <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          اسم الشركة أو مؤسسة التوريد <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={supCompany}
                          onChange={(e) => setSupCompany(e.target.value)}
                          placeholder="مثال: مورد العطور المميزة / مصنع الجلديات الفاخرة"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            اسم الشخص المسؤول <span className="text-slate-400 font-normal">(اختياري)</span>
                          </label>
                          <input
                            type="text"
                            value={supName}
                            onChange={(e) => setSupName(e.target.value)}
                            placeholder="مثال: فهد السبيعي (أو اتركه فارغاً)"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            رقم الهاتف <span className="text-slate-400 font-normal">(اختياري)</span>
                          </label>
                          <input
                            type="tel"
                            value={supPhone}
                            onChange={(e) => setSupPhone(e.target.value)}
                            placeholder="+970590000000 / 0590000000"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {/* Social & Messaging Platforms Section */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Share2 className="w-3.5 h-3.5 text-blue-600" /> منصات وقنوات التواصل والطلبات
                          </span>
                          <span className="text-[10px] text-slate-500">(واتساب، تليجرام، فيسبوك، انستجرام، وغيرها)</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              💬 رقم أو رابط الواتساب (WhatsApp)
                            </label>
                            <input
                              type="text"
                              value={supWhatsapp}
                              onChange={(e) => setSupWhatsapp(e.target.value)}
                              placeholder="+970590000000"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600"
                              dir="ltr"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              ✈️ تليجرام (Telegram)
                            </label>
                            <input
                              type="text"
                              value={supTelegram}
                              onChange={(e) => setSupTelegram(e.target.value)}
                              placeholder="@username أو رابط القناة"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600"
                              dir="ltr"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              🌐 فيسبوك (Facebook)
                            </label>
                            <input
                              type="text"
                              value={supFacebook}
                              onChange={(e) => setSupFacebook(e.target.value)}
                              placeholder="رابط الصفحة أو اسم المستخدم"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600"
                              dir="ltr"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              📸 انستجرام (Instagram)
                            </label>
                            <input
                              type="text"
                              value={supInstagram}
                              onChange={(e) => setSupInstagram(e.target.value)}
                              placeholder="@account أو رابط الحساب"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600"
                              dir="ltr"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              🔗 رابط الكتالوج أو الموقع الإلكتروني للمورد
                            </label>
                            <input
                              type="text"
                              value={supWebsite}
                              onChange={(e) => setSupWebsite(e.target.value)}
                              placeholder="https://catalog.supplier.com"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600"
                              dir="ltr"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              ⭐ القناة أو المنصة المفضلة للطلب والتواصل
                            </label>
                            <select
                              value={supPreferredPlatform}
                              onChange={(e) => setSupPreferredPlatform(e.target.value as any)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 cursor-pointer"
                            >
                              <option value="whatsapp">واتساب (WhatsApp)</option>
                              <option value="telegram">تليجرام (Telegram)</option>
                              <option value="facebook">فيسبوك (Facebook)</option>
                              <option value="instagram">انستجرام (Instagram)</option>
                              <option value="phone">اتصال هاتفي (Phone Call)</option>
                              <option value="website">الموقع / الكتالوج الإلكتروني</option>
                              <option value="other">أخرى</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني (اختياري)</label>
                          <input
                            type="email"
                            value={supEmail}
                            onChange={(e) => setSupEmail(e.target.value)}
                            placeholder="supplier@company.com"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">حالة التوريد</label>
                          <select
                            value={supStatus}
                            onChange={(e) => setSupStatus(e.target.value as any)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 cursor-pointer"
                          >
                            <option value="active">نشط ومتاح للتوريد</option>
                            <option value="inactive">غير نشط (متوقف مؤقتاً)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            المدينة <span className="text-blue-600 font-normal text-[11px]">(اكتب للبحث السريع في المدن)</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              list="palestinian-cities-list"
                              value={supCity}
                              onChange={(e) => setSupCity(e.target.value)}
                              placeholder="ابحث أو اختر المدينة (مثال: القدس، رام الله، يافا...)"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 font-medium"
                            />
                            <datalist id="palestinian-cities-list">
                              {PALESTINIAN_CITIES.map((city) => (
                                <option key={city} value={city} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">العنوان التفصيلي للمستودع</label>
                        <input
                          type="text"
                          value={supAddress}
                          onChange={(e) => setSupAddress(e.target.value)}
                          placeholder="المنطقة الصناعية، شارع المستودعات..."
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات وشروط الاتفاق</label>
                        <textarea
                          rows={2}
                          value={supNotes}
                          onChange={(e) => setSupNotes(e.target.value)}
                          placeholder="شروط الدفع، فترات التوريد، الخصومات المتفق عليها..."
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsAddSupplierModalOpen(false)}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors cursor-pointer"
                        >
                          {editingSupplier ? 'تحديث وحفظ التغييرات' : 'إضافة المورد لقاعدة البيانات'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Delete Supplier Confirmation Modal */}
              {supplierToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
                      ⚠️
                    </div>
                    <h3 className="text-base font-bold text-slate-900">تأكيد حذف المورد</h3>
                    <p className="text-xs text-slate-600">
                      هل أنت متأكد من حذف المورد <span className="font-bold text-slate-900">"{supplierToDelete.company_name}"</span>؟ سيتم حذفه من قاعدة البيانات وسجلات التوريد.
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => setSupplierToDelete(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(supplierToDelete.supplier_id)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        نعم، احذف المورد
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (activeTab === 'orders' || activeTab === 'fulfillment') ? (
            <OrdersManagement />
          ) : activeTab === 'returns' ? (
            <ReturnsManagement />
          ) : activeTab === 'accounting' ? (
            <AccountingManagement />
          ) : activeTab === 'reports' ? (
            <ExecutiveReportsManagement />
          ) : activeTab === 'notifications' ? (
            <NotificationManagement />
          ) : activeTab === 'reviews' ? (
            <ReviewsManagement />
          ) : activeTab === 'customers' ? (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" /> إدارة العملاء والمستخدمين والصلاحيات
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    بصفتك (المدير / Owner)، يمكنك التحكم الكامل بصلاحيات المستخدمين وتعيين الأدوار (مدير، محاسب، تسويق، موظف، عميل).
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-200">
                  <span>إجمالي الحسابات: {allUsers.length}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-bold">
                      <tr>
                        <th className="px-6 py-3 border-b border-slate-100">المستخدم</th>
                        <th className="px-6 py-3 border-b border-slate-100">البريد الإلكتروني</th>
                        <th className="px-6 py-3 border-b border-slate-100">رقم الهاتف</th>
                        <th className="px-6 py-3 border-b border-slate-100">الدور والصلاحية الحالية</th>
                        <th className="px-6 py-3 border-b border-slate-100">تعديل الصلاحية (من المالك)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredUsers.map((u) => (
                        <tr key={u.user_id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-bold text-slate-900 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                              {u.name[0]}
                            </div>
                            {u.name}
                          </td>
                          <td className="px-6 py-3 text-slate-600">{u.email}</td>
                          <td className="px-6 py-3 text-slate-600">{u.phone || 'غير محدد'}</td>
                          <td className="px-6 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              u.role === 'Owner' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                              u.role === 'Manager' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                              u.role === 'Accountant' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              u.role === 'Marketing' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              u.role === 'Employee' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                              'bg-slate-100 text-slate-700 border border-slate-250'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.user_id, e.target.value as UserRole)}
                              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                              {ROLES_OPTIONS.map((opt) => (
                                <option key={opt.role} value={opt.role}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-2">قسم {activeTab}</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                هذا القسم مدمج بالكامل مع نظام Google Sheets وقاعدة البيانات السحابية وفق معمارية High Density الاحترافية.
              </p>
              <button
                onClick={() => setActiveTab('overview')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                العودة للوحة الرئيسية
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
