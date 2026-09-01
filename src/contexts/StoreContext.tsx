import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  ThemeSettings, ThemePresetName, HomepageSection, MenuItem, 
  AnnouncementBarConfig, FooterConfig, MediaItem, Offer, Coupon, StoreSettings,
  ProductGuaranteesConfig 
} from '../types';

export const THEME_PRESETS: Record<ThemePresetName, ThemeSettings> = {
  Elegant: {
    preset: 'Elegant',
    primaryColor: '#0f172a',
    secondaryColor: '#64748b',
    accentColor: '#d97706',
    backgroundColor: '#f8fafc',
    textColor: '#0f172a',
    buttonColor: '#0f172a',
    buttonTextColor: '#ffffff',
    headerColor: '#ffffff',
    footerColor: '#0f172a',
    cardStyle: 'bordered',
    borderRadius: 'xl',
    shadows: 'md',
    fontSize: 'base',
    headingStyle: 'serif',
    productCardStyle: 'modern',
    navigationStyle: 'top'
  },
  Luxury: {
    preset: 'Luxury',
    primaryColor: '#78350f',
    secondaryColor: '#451a03',
    accentColor: '#f59e0b',
    backgroundColor: '#fffbe6',
    textColor: '#291505',
    buttonColor: '#78350f',
    buttonTextColor: '#ffffff',
    headerColor: '#ffffff',
    footerColor: '#451a03',
    cardStyle: 'shadow',
    borderRadius: 'lg',
    shadows: 'lg',
    fontSize: 'base',
    headingStyle: 'serif',
    productCardStyle: 'classic',
    navigationStyle: 'centered'
  },
  Minimal: {
    preset: 'Minimal',
    primaryColor: '#18181b',
    secondaryColor: '#71717a',
    accentColor: '#18181b',
    backgroundColor: '#ffffff',
    textColor: '#18181b',
    buttonColor: '#18181b',
    buttonTextColor: '#ffffff',
    headerColor: '#ffffff',
    footerColor: '#18181b',
    cardStyle: 'flat',
    borderRadius: 'none',
    shadows: 'none',
    fontSize: 'base',
    headingStyle: 'minimal',
    productCardStyle: 'minimal',
    navigationStyle: 'minimal'
  },
  Modern: {
    preset: 'Modern',
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    accentColor: '#047857',
    backgroundColor: '#f0fdf4',
    textColor: '#064e3b',
    buttonColor: '#059669',
    buttonTextColor: '#ffffff',
    headerColor: '#ffffff',
    footerColor: '#064e3b',
    cardStyle: 'shadow',
    borderRadius: 'xl',
    shadows: 'md',
    fontSize: 'base',
    headingStyle: 'sans',
    productCardStyle: 'modern',
    navigationStyle: 'top'
  },
  Fashion: {
    preset: 'Fashion',
    primaryColor: '#be185d',
    secondaryColor: '#db2777',
    accentColor: '#f43f5e',
    backgroundColor: '#fff1f2',
    textColor: '#881337',
    buttonColor: '#be185d',
    buttonTextColor: '#ffffff',
    headerColor: '#ffffff',
    footerColor: '#881337',
    cardStyle: 'glass',
    borderRadius: 'full',
    shadows: 'md',
    fontSize: 'base',
    headingStyle: 'bold',
    productCardStyle: 'modern',
    navigationStyle: 'centered'
  },
  Classic: {
    preset: 'Classic',
    primaryColor: '#1e3a8a',
    secondaryColor: '#3b82f6',
    accentColor: '#2563eb',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    buttonColor: '#1e3a8a',
    buttonTextColor: '#ffffff',
    headerColor: '#ffffff',
    footerColor: '#0f172a',
    cardStyle: 'bordered',
    borderRadius: 'md',
    shadows: 'sm',
    fontSize: 'base',
    headingStyle: 'sans',
    productCardStyle: 'classic',
    navigationStyle: 'top'
  },
  'Dark Luxury': {
    preset: 'Dark Luxury',
    primaryColor: '#fbbf24',
    secondaryColor: '#f59e0b',
    accentColor: '#d97706',
    backgroundColor: '#09090b',
    textColor: '#f4f4f5',
    buttonColor: '#fbbf24',
    buttonTextColor: '#09090b',
    headerColor: '#18181b',
    footerColor: '#09090b',
    cardStyle: 'glass',
    borderRadius: 'xl',
    shadows: 'lg',
    fontSize: 'base',
    headingStyle: 'bold',
    productCardStyle: 'modern',
    navigationStyle: 'top'
  }
};

const DEFAULT_HOMEPAGE_SECTIONS: HomepageSection[] = [
  {
    id: 'sec_hero',
    type: 'hero_banner',
    title: 'متجر النخبة الفاخر',
    subtitle: 'تجارب تسوق فريدة ومنتجات أصلية ذات جودة عالية مع توصيل سريع لجميع المناطق.',
    visible: true,
    order: 1,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
    buttonText: 'تسوق الآن',
    buttonLink: '#products',
    layout: 'full'
  },
  {
    id: 'sec_benefits',
    type: 'trust_benefits',
    title: 'لماذا تتسوق من النخبة؟',
    subtitle: 'ضمان الجودة والخدمة الممتازة',
    visible: true,
    order: 2,
    layout: 'grid'
  },
  {
    id: 'sec_categories',
    type: 'featured_categories',
    title: 'تصفح حسب الفئات',
    subtitle: 'اختر القسم المفضّل لديك واستكشف أحدث التشكيلات',
    visible: true,
    order: 3,
    layout: 'grid'
  },
  {
    id: 'sec_flash_sale',
    type: 'special_offers',
    title: 'عروض الفلاش السريعة ⚡',
    subtitle: 'خصومات حصرية لفترة محدودة جداً! تنتهي قريباً',
    visible: true,
    order: 4,
    layout: 'carousel'
  },
  {
    id: 'sec_featured_prods',
    type: 'featured_products',
    title: 'المنتجات المميزة 🌟',
    subtitle: 'مختارات خاصة تم انتقاؤها بعناية من أجلك',
    visible: true,
    order: 5,
    layout: 'grid'
  },
  {
    id: 'sec_new_arrivals',
    type: 'new_arrivals',
    title: 'وصل حديثاً ✨',
    subtitle: 'أحدث التشكيلات والمنتجات التي وصلت إلى متجرنا مؤخراً',
    visible: true,
    order: 6,
    layout: 'grid'
  },
  {
    id: 'sec_best_sellers',
    type: 'best_sellers',
    title: 'الأكثر مبيعاً 🔥',
    subtitle: 'المنتجات الأكثر طلباً وإقبالاً من قبل عملائنا الكرام',
    visible: true,
    order: 7,
    layout: 'grid'
  },
  {
    id: 'sec_testimonials',
    type: 'testimonials',
    title: 'ماذا يقول عملاؤنا؟ 💬',
    subtitle: 'تقييمات وثقة آلاف العملاء الذين تسوقوا معنا',
    visible: true,
    order: 8,
    layout: 'grid'
  },
  {
    id: 'sec_newsletter',
    type: 'newsletter',
    title: 'اشترك في النشرة البريدية 📩',
    subtitle: 'احصل على خصم 10% على أول طلب وأحدث العروض الحصرية مباشرة',
    visible: true,
    order: 9,
    layout: 'contained'
  }
];

const DEFAULT_MENUS: MenuItem[] = [
  { id: 'm1', label: 'الرئيسية', link: '/', enabled: true, order: 1 },
  { id: 'm2', label: 'العطور', link: '/category/perfumes', enabled: true, order: 2, targetCategorySlug: 'عطور' },
  { id: 'm3', label: 'الساعات', link: '/category/watches', enabled: true, order: 3, targetCategorySlug: 'ساعات' },
  { id: 'm4', label: 'الملابس', link: '/category/clothes', enabled: true, order: 4, targetCategorySlug: 'ملابس' },
  { id: 'm5', label: 'العروض والخصومات', link: '/offers', enabled: true, order: 5 },
  { id: 'm6', label: 'الأكثر مبيعاً', link: '/best-sellers', enabled: true, order: 6 }
];

const DEFAULT_ANNOUNCEMENT_BAR: AnnouncementBarConfig = {
  enabled: true,
  text: '🚚 توصيل مجاني على الطلبات الأعلى من 200 ₪ | خصم 15% على التشكيلة الجديدة 🎉',
  backgroundColor: '#059669',
  textColor: '#ffffff',
  link: '/offers'
};

const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  aboutText: 'متجر النخبة هو وجهتك الأولى للتسوق الإلكتروني الموثوق والفاخر بأعلى معايير الجودة والخدمة.',
  phone: '+970 599 000 000',
  whatsapp: '+970 599 000 000',
  email: 'support@elite-store.ps',
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  tiktok: 'https://tiktok.com',
  telegram: 'https://t.me',
  youtube: 'https://youtube.com',
  quickLinks: DEFAULT_MENUS,
  showPaymentIcons: true,
  showShippingInfo: true,
  copyrightText: '© 2026 متجر النخبة. جميع الحقوق محفوظة.'
};

const DEFAULT_PRODUCT_GUARANTEES: ProductGuaranteesConfig = {
  enabled: true,
  title: 'ضمان النخبة والخدمة المتميزة',
  items: [
    { id: 'g_1', text: 'منتجات أصلية ومضمونة 100%', enabled: true, icon: 'check' },
    { id: 'g_2', text: 'إمكانية الاستبدال والاسترجاع خلال 3 أيام', enabled: true, icon: 'refresh' },
    { id: 'g_3', text: 'الدفع عند الاستلام متاح لكافة المدن', enabled: true, icon: 'truck' }
  ]
};

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  store_name: 'متجر النخبة',
  store_slogan: 'الفخامة والجودة بين يديك',
  store_mode: 'AFFILIATE_BROKER',
  logo_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80',
  description: 'منصة التجارة الإلكترونية الفاخرة لتسوق العطور، الساعات، والمنتجات الأصلية المميزة.',
  phone: '+970 599 000 000',
  whatsapp: '+970 599 000 000',
  email: 'info@elites.ps',
  address: 'شارع ارسال، رام الله، فلسطين',
  currency: '₪',
  timezone: 'Asia/Hebron',
  language: 'ar',
  status: 'open',
  maintenance_message: 'المتجر تحت الصيانة حالياً لتطوير الخدمة وإضافة تشكيلات جديدة. سنعود إليكم قريباً جداً!',
  shipping_flat_rate: 20,
  free_shipping_threshold: 250,
  return_policy: 'سياسة إرجاع مرنة خلال 14 يوماً من استلام الطلب شريطة حماية الحزمة الأصلية.',
  shipping_policy: 'يتم التوصيل خلال 3-5 أيام عمل لكافة المناطق.',
  exchange_policy: 'يمكن استبدال المنتج خلال 3 أيام من الاستلام.',
  cancellation_policy: 'يمكن إلغاء الطلب قبل خروجه للتوصيل.',
  warranty_policy: 'ضمان شامل على العيوب المصنعية لمدة 6 أشهر.',
  privacy_policy: 'نحن نحترم خصوصية بياناتك ونضمن عدم مشاركتها مع أي طرف ثالث.',
  terms: 'الشروط والأحكام الخاصة بالتسوق والطلب والتوصيل في متجر النخبة.',
  hero_banner_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
  hero_title: 'تسوق أرقى المنتجات بأفضل الأسعار والجودة العالية',
  hero_subtitle: 'نظام متكامل مرتبط بقاعدة بيانات Google Sheets ومخزون حي وتنفيذ آمن لكافة الطلبات وتوصيل فوري لجميع المدن.',
  hero_bg_color: '#1c1917',
  hero_bg_image: '',
  product_guarantees: DEFAULT_PRODUCT_GUARANTEES,
  social_links: {
    facebook: 'https://facebook.com/elites.ps',
    instagram: 'https://instagram.com/elites.ps',
    tiktok: 'https://tiktok.com/@elites.ps',
    whatsapp: 'https://wa.me/970599000000',
    telegram: 'https://t.me/elites_ps'
  },
  seo: {
    meta_title: 'متجر النخبة | التسوق الفاخر والأفضل في المنطقة',
    meta_description: 'تصفح واشترِ أحدث العطور والأجهزة والساعات والملابس بأفضل الأسعار مع خدمات الدفع عند الاستلام والتوصيل السريع.',
    keywords: 'متجر النخبة, تسوق اونلاين, عطور, ساعات, فلسطين, توصيل سريع'
  }
};

interface StoreContextType {
  // Theme & Appearance (Published vs Draft)
  themeSettings: ThemeSettings;
  draftThemeSettings: ThemeSettings;
  applyThemePreset: (preset: ThemePresetName) => void;
  updateDraftTheme: (partial: Partial<ThemeSettings>) => void;
  
  // Homepage Sections
  homepageSections: HomepageSection[];
  draftHomepageSections: HomepageSection[];
  updateDraftHomepageSections: (sections: HomepageSection[]) => void;
  addHomepageSection: (type: any, title: string) => void;
  toggleHomepageSection: (id: string) => void;
  removeHomepageSection: (id: string) => void;
  reorderHomepageSections: (draggedId: string, targetId: string) => void;

  // Menus & Header & Footer
  menus: MenuItem[];
  draftMenus: MenuItem[];
  updateDraftMenus: (menus: MenuItem[]) => void;
  announcementBar: AnnouncementBarConfig;
  draftAnnouncementBar: AnnouncementBarConfig;
  updateDraftAnnouncementBar: (partial: Partial<AnnouncementBarConfig>) => void;
  footerConfig: FooterConfig;
  draftFooterConfig: FooterConfig;
  updateDraftFooterConfig: (partial: Partial<FooterConfig>) => void;

  // Store General Settings
  storeSettings: StoreSettings;
  updateStoreSettings: (partial: Partial<StoreSettings>) => void;

  // Offers & Flash Sales & Coupons
  offers: Offer[];
  addOffer: (offer: Omit<Offer, 'id' | 'created_at'>) => void;
  updateOffer: (id: string, offer: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;
  toggleOffer: (id: string) => void;

  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, 'coupon_id' | 'used_count'>) => void;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;

  // Media Library
  mediaItems: MediaItem[];
  addMediaItem: (item: Omit<MediaItem, 'id' | 'created_at'>) => void;
  updateMediaItem: (id: string, partial: Partial<MediaItem>) => void;
  deleteMediaItem: (id: string) => void;

  // Draft & Publish Control
  hasUnpublishedChanges: boolean;
  publishChanges: () => void;
  revertDraftChanges: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // LocalStorage Helper
  const getStored = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(`Error loading ${key} from storage`, e);
    }
    return fallback;
  };

  // State initialization
  const [storeSettings, setStoreSettingsState] = useState<StoreSettings>(() => getStored('elites_store_settings', DEFAULT_STORE_SETTINGS));
  const [themeSettings, setThemeSettingsState] = useState<ThemeSettings>(() => getStored('elites_theme_published', THEME_PRESETS.Modern));
  const [draftThemeSettings, setDraftThemeSettings] = useState<ThemeSettings>(() => getStored('elites_theme_draft', themeSettings));
  
  const [homepageSections, setHomepageSectionsState] = useState<HomepageSection[]>(() => getStored('elites_homepage_sections_published', DEFAULT_HOMEPAGE_SECTIONS));
  const [draftHomepageSections, setDraftHomepageSections] = useState<HomepageSection[]>(() => getStored('elites_homepage_sections_draft', homepageSections));

  const [menus, setMenusState] = useState<MenuItem[]>(() => getStored('elites_menus_published', DEFAULT_MENUS));
  const [draftMenus, setDraftMenus] = useState<MenuItem[]>(() => getStored('elites_menus_draft', menus));

  const [announcementBar, setAnnouncementBarState] = useState<AnnouncementBarConfig>(() => getStored('elites_announcement_published', DEFAULT_ANNOUNCEMENT_BAR));
  const [draftAnnouncementBar, setDraftAnnouncementBar] = useState<AnnouncementBarConfig>(() => getStored('elites_announcement_draft', announcementBar));

  const [footerConfig, setFooterConfigState] = useState<FooterConfig>(() => getStored('elites_footer_published', DEFAULT_FOOTER_CONFIG));
  const [draftFooterConfig, setDraftFooterConfig] = useState<FooterConfig>(() => getStored('elites_footer_draft', footerConfig));

  const [offers, setOffers] = useState<Offer[]>(() => getStored('elites_offers', [
    {
      id: 'off_flash_1',
      title: 'خصم عاصفة الفلاش السريعة ⚡',
      description: 'خصم 25% على كافة العطور والساعات الفاخرة لفترة محدودة جداً',
      type: 'percentage',
      value: 25,
      target_type: 'all',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days
      active: true,
      is_flash_sale: true,
      created_at: new Date().toISOString()
    }
  ]));

  const [coupons, setCoupons] = useState<Coupon[]>(() => getStored('elites_coupons', [
    {
      coupon_id: 'coup_1',
      code: 'ELITE2026',
      discount_type: 'percentage',
      discount_value: 15,
      min_spend: 100,
      usage_limit: 500,
      used_count: 42,
      start_date: new Date().toISOString(),
      end_date: '2026-12-31T23:59:59Z',
      status: 'active'
    },
    {
      coupon_id: 'coup_2',
      code: 'WELCOME50',
      discount_type: 'fixed',
      discount_value: 50,
      min_spend: 300,
      usage_limit: 100,
      used_count: 18,
      start_date: new Date().toISOString(),
      end_date: '2026-12-31T23:59:59Z',
      status: 'active'
    }
  ]));

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => getStored('elites_media_library', [
    {
      id: 'med_1',
      name: 'شعار متجر النخبة',
      url: DEFAULT_STORE_SETTINGS.logo_url,
      type: 'image/jpeg',
      created_at: new Date().toISOString(),
      used_in: ['Logo']
    },
    {
      id: 'med_2',
      name: 'صورة البانر الرئيسي',
      url: DEFAULT_HOMEPAGE_SECTIONS[0].image || '',
      type: 'image/jpeg',
      created_at: new Date().toISOString(),
      used_in: ['Hero Banner']
    }
  ]));

  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);

  // Sync helpers to localStorage
  useEffect(() => {
    localStorage.setItem('elites_store_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    localStorage.setItem('elites_theme_draft', JSON.stringify(draftThemeSettings));
  }, [draftThemeSettings]);

  useEffect(() => {
    localStorage.setItem('elites_homepage_sections_draft', JSON.stringify(draftHomepageSections));
  }, [draftHomepageSections]);

  useEffect(() => {
    localStorage.setItem('elites_menus_draft', JSON.stringify(draftMenus));
  }, [draftMenus]);

  useEffect(() => {
    localStorage.setItem('elites_announcement_draft', JSON.stringify(draftAnnouncementBar));
  }, [draftAnnouncementBar]);

  useEffect(() => {
    localStorage.setItem('elites_footer_draft', JSON.stringify(draftFooterConfig));
  }, [draftFooterConfig]);

  useEffect(() => {
    localStorage.setItem('elites_offers', JSON.stringify(offers));
  }, [offers]);

  useEffect(() => {
    localStorage.setItem('elites_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('elites_media_library', JSON.stringify(mediaItems));
  }, [mediaItems]);

  // Actions
  const applyThemePreset = (preset: ThemePresetName) => {
    const config = THEME_PRESETS[preset] || THEME_PRESETS.Modern;
    setDraftThemeSettings(config);
    setHasUnpublishedChanges(true);
  };

  const updateDraftTheme = (partial: Partial<ThemeSettings>) => {
    setDraftThemeSettings(prev => ({ ...prev, ...partial }));
    setHasUnpublishedChanges(true);
  };

  const updateDraftHomepageSections = (sections: HomepageSection[]) => {
    setDraftHomepageSections(sections);
    setHasUnpublishedChanges(true);
  };

  const addHomepageSection = (type: any, title: string) => {
    const newSec: HomepageSection = {
      id: 'sec_' + Date.now(),
      type,
      title,
      subtitle: 'وصف إضافي للقطاع الجديد',
      visible: true,
      order: draftHomepageSections.length + 1,
      layout: 'grid'
    };
    updateDraftHomepageSections([...draftHomepageSections, newSec]);
  };

  const toggleHomepageSection = (id: string) => {
    const updated = draftHomepageSections.map(s => s.id === id ? { ...s, visible: !s.visible } : s);
    updateDraftHomepageSections(updated);
  };

  const removeHomepageSection = (id: string) => {
    const updated = draftHomepageSections.filter(s => s.id !== id);
    updateDraftHomepageSections(updated);
  };

  const reorderHomepageSections = (draggedId: string, targetId: string) => {
    const list = [...draftHomepageSections];
    const dragIdx = list.findIndex(s => s.id === draggedId);
    const targetIdx = list.findIndex(s => s.id === targetId);
    if (dragIdx === -1 || targetIdx === -1) return;
    const [moved] = list.splice(dragIdx, 1);
    list.splice(targetIdx, 0, moved);
    const reordered = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    updateDraftHomepageSections(reordered);
  };

  const updateDraftMenus = (updatedMenus: MenuItem[]) => {
    setDraftMenus(updatedMenus);
    setHasUnpublishedChanges(true);
  };

  const updateDraftAnnouncementBar = (partial: Partial<AnnouncementBarConfig>) => {
    setDraftAnnouncementBar(prev => ({ ...prev, ...partial }));
    setHasUnpublishedChanges(true);
  };

  const updateDraftFooterConfig = (partial: Partial<FooterConfig>) => {
    setDraftFooterConfig(prev => ({ ...prev, ...partial }));
    setHasUnpublishedChanges(true);
  };

  const updateStoreSettings = (partial: Partial<StoreSettings>) => {
    setStoreSettingsState(prev => ({ ...prev, ...partial }));
  };

  const addOffer = (newOff: Omit<Offer, 'id' | 'created_at'>) => {
    const item: Offer = {
      ...newOff,
      id: 'off_' + Date.now(),
      created_at: new Date().toISOString()
    };
    setOffers(prev => [item, ...prev]);
  };

  const updateOffer = (id: string, partial: Partial<Offer>) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...partial } : o));
  };

  const deleteOffer = (id: string) => {
    setOffers(prev => prev.filter(o => o.id !== id));
  };

  const toggleOffer = (id: string) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, active: !o.active } : o));
  };

  const addCoupon = (c: Omit<Coupon, 'coupon_id' | 'used_count'>) => {
    const item: Coupon = {
      ...c,
      coupon_id: 'coup_' + Date.now(),
      used_count: 0
    };
    setCoupons(prev => [item, ...prev]);
  };

  const updateCoupon = (id: string, partial: Partial<Coupon>) => {
    setCoupons(prev => prev.map(c => c.coupon_id === id ? { ...c, ...partial } : c));
  };

  const deleteCoupon = (id: string) => {
    setCoupons(prev => prev.filter(c => c.coupon_id !== id));
  };

  const addMediaItem = (item: Omit<MediaItem, 'id' | 'created_at'>) => {
    const newItem: MediaItem = {
      ...item,
      id: 'med_' + Date.now(),
      created_at: new Date().toISOString()
    };
    setMediaItems(prev => [newItem, ...prev]);
  };

  const updateMediaItem = (id: string, partial: Partial<MediaItem>) => {
    setMediaItems(prev => prev.map(m => m.id === id ? { ...m, ...partial } : m));
  };

  const deleteMediaItem = (id: string) => {
    setMediaItems(prev => prev.filter(m => m.id !== id));
  };

  const publishChanges = () => {
    setThemeSettingsState(draftThemeSettings);
    localStorage.setItem('elites_theme_published', JSON.stringify(draftThemeSettings));

    setHomepageSectionsState(draftHomepageSections);
    localStorage.setItem('elites_homepage_sections_published', JSON.stringify(draftHomepageSections));

    setMenusState(draftMenus);
    localStorage.setItem('elites_menus_published', JSON.stringify(draftMenus));

    setAnnouncementBarState(draftAnnouncementBar);
    localStorage.setItem('elites_announcement_published', JSON.stringify(draftAnnouncementBar));

    setFooterConfigState(draftFooterConfig);
    localStorage.setItem('elites_footer_published', JSON.stringify(draftFooterConfig));

    setHasUnpublishedChanges(false);
  };

  const revertDraftChanges = () => {
    setDraftThemeSettings(themeSettings);
    setDraftHomepageSections(homepageSections);
    setDraftMenus(menus);
    setDraftAnnouncementBar(announcementBar);
    setDraftFooterConfig(footerConfig);
    setHasUnpublishedChanges(false);
  };

  return (
    <StoreContext.Provider
      value={{
        themeSettings,
        draftThemeSettings,
        applyThemePreset,
        updateDraftTheme,
        homepageSections,
        draftHomepageSections,
        updateDraftHomepageSections,
        addHomepageSection,
        toggleHomepageSection,
        removeHomepageSection,
        reorderHomepageSections,
        menus,
        draftMenus,
        updateDraftMenus,
        announcementBar,
        draftAnnouncementBar,
        updateDraftAnnouncementBar,
        footerConfig,
        draftFooterConfig,
        updateDraftFooterConfig,
        storeSettings,
        updateStoreSettings,
        offers,
        addOffer,
        updateOffer,
        deleteOffer,
        toggleOffer,
        coupons,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        mediaItems,
        addMediaItem,
        updateMediaItem,
        deleteMediaItem,
        hasUnpublishedChanges,
        publishChanges,
        revertDraftChanges
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStoreManagement = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStoreManagement must be used within a StoreProvider');
  }
  return context;
};
