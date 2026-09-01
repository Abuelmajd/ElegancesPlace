import React, { useState } from 'react';
import { useStoreManagement } from '../../contexts/StoreContext';
import { useProducts } from '../../contexts/ProductContext';
import { 
  Settings, Globe, Share2, Megaphone, Menu as MenuIcon, Layout, 
  ShieldAlert, Lock, Unlock, Phone, Mail, MapPin, Search, Sparkles, 
  Check, Plus, Trash2, Edit3, Copy, ExternalLink, Image as ImageIcon,
  Shield, CheckCircle2, Truck, RefreshCw, Eye, EyeOff, Zap, ShoppingCart, Layers
} from 'lucide-react';
import { ProductGuaranteesConfig, ProductGuaranteeItem } from '../../types';

export const StoreSettingsManager: React.FC = () => {
  const { 
    storeSettings, updateStoreSettings, 
    announcementBar, draftAnnouncementBar, updateDraftAnnouncementBar,
    menus, draftMenus, updateDraftMenus,
    footerConfig, draftFooterConfig, updateDraftFooterConfig,
    publishChanges
  } = useStoreManagement();

  const { products } = useProducts();

  const [activeTab, setActiveTab] = useState<'branding' | 'status' | 'announcement' | 'menus' | 'footer' | 'guarantees' | 'policies' | 'seo' | 'share'>('branding');
  const [successMsg, setSuccessMsg] = useState('');

  // Guarantees State
  const initialGuarantees: ProductGuaranteesConfig = storeSettings.product_guarantees || {
    enabled: true,
    title: 'ضمان النخبة والخدمة المتميزة',
    items: [
      { id: 'g_1', text: 'منتجات أصلية ومضمونة 100%', enabled: true, icon: 'check' },
      { id: 'g_2', text: 'إمكانية الاستبدال والاسترجاع خلال 3 أيام', enabled: true, icon: 'refresh' },
      { id: 'g_3', text: 'الدفع عند الاستلام متاح لكافة المدن', enabled: true, icon: 'truck' }
    ]
  };

  const [guaranteesState, setGuaranteesState] = useState<ProductGuaranteesConfig>(initialGuarantees);

  const handleSaveGuarantees = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({ product_guarantees: guaranteesState });
    publishChanges();
    setSuccessMsg('تم حفظ وتحديث ضمانات وشروط صفحة المنتج بنجاح!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAddGuaranteeItem = () => {
    const newItem: ProductGuaranteeItem = {
      id: 'g_' + Date.now(),
      text: 'بند ضمان جديد...',
      enabled: true,
      icon: 'check'
    };
    setGuaranteesState(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const handleUpdateGuaranteeItem = (id: string, partial: Partial<ProductGuaranteeItem>) => {
    setGuaranteesState(prev => ({
      ...prev,
      items: (prev.items || []).map(item => item.id === id ? { ...item, ...partial } : item)
    }));
  };

  const handleDeleteGuaranteeItem = (id: string) => {
    setGuaranteesState(prev => ({
      ...prev,
      items: (prev.items || []).filter(item => item.id !== id)
    }));
  };

  // Product Share Preview State
  const [selectedShareProductId, setSelectedShareProductId] = useState<string>(products[0]?.id || '');
  const [copiedLink, setCopiedLink] = useState(false);

  const selectedShareProduct = products.find(p => p.id === selectedShareProductId) || products[0];

  const handleSaveStoreGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    // Publish any draft changes and trigger store context update
    publishChanges();
    setSuccessMsg('تم حفظ وتطبيق اسم وشعار وهوية المتجر بنجاح على شريط الهيدر والنظام كاملاً!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Add Menu Item
  const handleAddMenuItem = () => {
    const label = prompt('أدخل اسم العنصر في القائمة:');
    if (!label) return;
    const link = prompt('أدخل الرابط (مثال: /category/perfumes):', '/');
    if (!link) return;

    const newItem = {
      id: 'm_' + Date.now(),
      label,
      link,
      enabled: true,
      order: draftMenus.length + 1
    };
    updateDraftMenus([...draftMenus, newItem]);
  };

  // Delete Menu Item
  const handleDeleteMenuItem = (id: string) => {
    updateDraftMenus(draftMenus.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      {/* ... */}
      
      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold overflow-x-auto">
        {[
          { id: 'branding', label: 'الهوية والشعار' },
          { id: 'status', label: 'حالة المتجر والتواصل' },
          { id: 'announcement', label: 'شريط الإعلانات' },
          { id: 'menus', label: 'القوائم والتصفح' },
          { id: 'footer', label: 'تخصيص أسفل الصفحة' },
          { id: 'guarantees', label: 'ضمانات وتفاصيل المنتج 🛡️' },
          { id: 'policies', label: 'سياسات المتجر' },
          { id: 'seo', label: 'SEO والمحركات' },
          { id: 'share', label: 'مولد المشاركة الاجتماعية' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Branding & Logos */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSaveStoreGeneral} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">شعارات وهوية ونموذج عمل المتجر (Logos & Business Model)</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">قم بتحديد نمط تشغيل المتجر (تسويق بالعمولة وطلب مباشر أو دروب شيبنج مع سلة) وتحديث بيانات الهوية.</p>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> حفظ التغييرات الآن
            </button>
          </div>

          {/* SECTION: Store Business Model / Mode Selector */}
          <div className="p-5 bg-linear-to-r from-emerald-50 via-teal-50 to-blue-50 rounded-2xl border-2 border-emerald-200 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  نموذج عمل وتشغيل المتجر (Store Business Model)
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  حدد طريقة تجربة التسوق للعميل: سواء بنظام الوساطة والتسويق بالعمولة السريع (بدون سلة أو بوابات دفع) أو نظام الدروب شيبنج المتكامل مع السلة.
                </p>
              </div>
              <span className="text-[11px] font-extrabold bg-emerald-600 text-white px-2.5 py-1 rounded-lg">
                النمط الحالي: {
                  storeSettings.store_mode === 'AFFILIATE_BROKER' ? 'وساطة وتسويق بالعمولة' :
                  storeSettings.store_mode === 'DROPSHIPPING' ? 'دروب شيبنج وسلة مشتريات' : 'الوضع الهجين المزدوج'
                }
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Mode 1: Affiliate Broker */}
              <div 
                onClick={() => updateStoreSettings({ store_mode: 'AFFILIATE_BROKER' })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  (storeSettings.store_mode === 'AFFILIATE_BROKER' || !storeSettings.store_mode)
                    ? 'border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                      <Zap className="w-4 h-4" />
                    </div>
                    <h5 className="font-bold text-slate-900 text-xs">نظام الوساطة والتوصية بالعمولة</h5>
                  </div>
                  {(storeSettings.store_mode === 'AFFILIATE_BROKER' || !storeSettings.store_mode) && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  ⚡ <strong>بدون سلة مشتريات أو بوابات دفع:</strong> يضغط الزبون على «طلب وتوصية مباشرة» لفتح نموذج فوري خفيف يجمع بياناته ويرسل الطلب فوراً أو عبر الواتساب للمورد.
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2 text-[10px] text-emerald-700 font-bold">
                  <span>✓ إخفاء السلة</span>
                  <span>✓ طلب سريع بنقرة</span>
                  <span>✓ تحويل فوري للمورد</span>
                </div>
              </div>

              {/* Mode 2: Dropshipping */}
              <div 
                onClick={() => updateStoreSettings({ store_mode: 'DROPSHIPPING' })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  storeSettings.store_mode === 'DROPSHIPPING'
                    ? 'border-blue-600 bg-white shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <h5 className="font-bold text-slate-900 text-xs">نظام الدروب شيبنج والتجارة الكاملة</h5>
                  </div>
                  {storeSettings.store_mode === 'DROPSHIPPING' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  🛒 <strong>سلة مشتريات ودفع إلكتروني:</strong> إضافة عدة منتجات، حساب مصاريف الشحن، تطبيق الكوبونات، واختيار طرق الدفع المتعددة وإتمام الطلب الرسمي (Checkout).
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2 text-[10px] text-blue-700 font-bold">
                  <span>✓ سلة عائمة</span>
                  <span>✓ فحص الشحن</span>
                  <span>✓ إتمام الطلب الرسمي</span>
                </div>
              </div>

              {/* Mode 3: Hybrid */}
              <div 
                onClick={() => updateStoreSettings({ store_mode: 'HYBRID' })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  storeSettings.store_mode === 'HYBRID'
                    ? 'border-purple-600 bg-white shadow-md ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                      <Layers className="w-4 h-4" />
                    </div>
                    <h5 className="font-bold text-slate-900 text-xs">الوضع الهجين / المزدوج (Hybrid)</h5>
                  </div>
                  {storeSettings.store_mode === 'HYBRID' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  ✨ <strong>الجمع بين النمطين:</strong> يتيح للزبون خيار الشراء المباشر السريع بنقرة واحدة لأي منتج منفرد، أو خيار إضافته للسلة وشراء عدة منتجات معاً.
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2 text-[10px] text-purple-700 font-bold">
                  <span>✓ شراء فوري</span>
                  <span>✓ وسلة متاحة</span>
                  <span>✓ مرونة قصوى</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">اسم المتجر الرسمي:</label>
              <input
                type="text"
                value={storeSettings.store_name || ''}
                onChange={(e) => updateStoreSettings({ store_name: e.target.value })}
                required
                placeholder="أدخل اسم متجرك"
                className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">شعار المتجر اللفظي (Slogan):</label>
              <input
                type="text"
                value={storeSettings.store_slogan || ''}
                onChange={(e) => updateStoreSettings({ store_slogan: e.target.value })}
                placeholder="الفخامة والجودة بين يديك"
                className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 block">رابط الشعار الرئيسي (Logo Image URL):</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateStoreSettings({ logo_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80' })}
                  className="text-[10px] text-emerald-700 hover:underline font-bold"
                >
                  [تجربة شعار أحمر]
                </button>
                <button
                  type="button"
                  onClick={() => updateStoreSettings({ logo_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80' })}
                  className="text-[10px] text-blue-700 hover:underline font-bold"
                >
                  [تجربة شعار ساعة فاخرة]
                </button>
                <button
                  type="button"
                  onClick={() => updateStoreSettings({ logo_url: '' })}
                  className="text-[10px] text-rose-600 hover:underline font-bold"
                >
                  [إزالة الشعار]
                </button>
              </div>
            </div>
            <input
              type="text"
              value={storeSettings.logo_url || ''}
              onChange={(e) => updateStoreSettings({ logo_url: e.target.value })}
              placeholder="https://example.com/my-logo.png"
              className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-slate-800 dir-ltr focus:ring-2 focus:ring-emerald-500 focus:outline-none text-left"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">الوصف العام للتعريف بالمتجر:</label>
            <textarea
              rows={2}
              value={storeSettings.description || ''}
              onChange={(e) => updateStoreSettings({ description: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* SECTION: Hero Banner & Storefront Background Customizer */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                تخصيص بنر وخلفية الواجهة الرئيسية (Hero Section & Background)
              </h4>
              <span className="text-[10px] font-bold text-slate-500">
                يمكنك تغيير الصورة، الألوان، والخلفية بحرية
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">رابط صورة الواجهة الرئيسية (Hero Banner Image):</label>
                <input
                  type="text"
                  value={storeSettings.hero_banner_url || ''}
                  onChange={(e) => updateStoreSettings({ hero_banner_url: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-slate-800 dir-ltr focus:ring-2 focus:ring-emerald-500 focus:outline-none text-left"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">صورة خلفية الهيرو (Hero Background Image):</label>
                <input
                  type="text"
                  value={storeSettings.hero_bg_image || ''}
                  onChange={(e) => updateStoreSettings({ hero_bg_image: e.target.value })}
                  placeholder="ضع رابط صورة خلفية أو اختر من المقترحات أدناه"
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-slate-800 dir-ltr focus:ring-2 focus:ring-emerald-500 focus:outline-none text-left"
                />
              </div>
            </div>

            {/* Quick Background Image Presets */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">صور خلفية فاخرة مقترحة بنقرة واحدة (Hero Background Presets):</label>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { name: '🌆 نمط تجريدي مظلم', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80' },
                  { name: '🪵 خشب داكن وفاخر', url: 'https://images.unsplash.com/photo-1546484475-7f7bd55792da?w=1600&auto=format&fit=crop&q=80' },
                  { name: '🏙️ متجر عصري وحديث', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80' },
                  { name: '🌌 توهج ليلي رمردي', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80' },
                  { name: '❌ إزالة صورة الخلفية (لون فقط)', url: '' }
                ].map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => updateStoreSettings({ hero_bg_image: preset.url })}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      (storeSettings.hero_bg_image || '') === preset.url
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/30 font-black'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Hero Background Color Picker */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">لون الخلفية الداكنة/الرئيسية خلف الصورة (Hero Background Color):</label>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { name: 'بني حجري (الافتراضي)', hex: '#1c1917' },
                  { name: 'زمردي داكن', hex: '#064e3b' },
                  { name: 'كحلي ملكي', hex: '#0f172a' },
                  { name: 'بنفسجي فاخر', hex: '#1e1b4b' },
                  { name: 'أسود خالص', hex: '#000000' },
                  { name: 'عنابي / بني دافئ', hex: '#451a03' },
                  { name: 'رمادي فاتح', hex: '#f8fafc' }
                ].map((color) => (
                  <button
                    type="button"
                    key={color.hex}
                    onClick={() => updateStoreSettings({ hero_bg_color: color.hex })}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      (storeSettings.hero_bg_color || '#1c1917') === color.hex
                        ? 'border-emerald-600 ring-2 ring-emerald-500/30 font-black'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: color.hex }} />
                    {color.name}
                  </button>
                ))}

                <div className="flex items-center gap-1.5 border border-slate-300 bg-white p-1 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-500 px-1">مخصص:</span>
                  <input
                    type="color"
                    value={storeSettings.hero_bg_color || '#1c1917'}
                    onChange={(e) => updateStoreSettings({ hero_bg_color: e.target.value })}
                    className="w-7 h-7 rounded-lg cursor-pointer border-0"
                  />
                  <span className="font-mono text-[11px] text-slate-600 px-1">{storeSettings.hero_bg_color || '#1c1917'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان الواجهة الرئيسي (Hero Title):</label>
                <input
                  type="text"
                  value={storeSettings.hero_title || ''}
                  onChange={(e) => updateStoreSettings({ hero_title: e.target.value })}
                  placeholder="تسوق أرقى المنتجات بأفضل الأسعار"
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">العنوان الفرعي الوصفي (Hero Subtitle):</label>
                <input
                  type="text"
                  value={storeSettings.hero_subtitle || ''}
                  onChange={(e) => updateStoreSettings({ hero_subtitle: e.target.value })}
                  placeholder="نظام متكامل واحترافي..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 border border-slate-800 shadow-md">
            <span className="text-[11px] font-bold text-emerald-400 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> معاينة فورية لمظهر الشعار واسم المتجر في أعلى الصفحة (Header Preview):
            </span>
            <div className="p-3 bg-white text-slate-900 rounded-xl shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                {storeSettings.logo_url ? (
                  <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                    <img 
                      src={storeSettings.logo_url} 
                      alt={storeSettings.store_name || 'الشعار'} 
                      className="w-full h-full object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-emerald-800 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                    {(storeSettings.store_name || 'ن').trim().charAt(0)}
                  </div>
                )}
                <div>
                  <span className="font-extrabold text-base text-slate-900 block leading-tight">
                    {storeSettings.store_name || 'متجر النخبة'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {storeSettings.store_slogan || 'منصة التجارة الإلكترونية الفاخرة'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                ✓ سيظهر هكذا أعلى المتجر
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> حفظ التغييرات وتحديث المتجر
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Store Status & Maintenance Mode */}
      {activeTab === 'status' && (
        <form onSubmit={handleSaveStoreGeneral} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-700" /> حالة المتجر (Open / Closed / Maintenance)
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'open', label: 'المتجر مفتوح ومستعد للطلبات', color: 'emerald' },
              { id: 'closed', label: 'المتجر مغلق حالياً', color: 'amber' },
              { id: 'maintenance', label: 'وضع الصيانة والتطوير', color: 'rose' }
            ].map(st => (
              <button
                type="button"
                key={st.id}
                onClick={() => updateStoreSettings({ status: st.id as any })}
                className={`p-4 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  storeSettings.status === st.id
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {storeSettings.status === 'maintenance' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <label className="font-bold text-amber-900 block">رسالة الصيانة التي ستظهر للعملاء:</label>
              <textarea
                rows={2}
                value={storeSettings.maintenance_message || ''}
                onChange={(e) => updateStoreSettings({ maintenance_message: e.target.value })}
                className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-amber-900 font-medium"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">هاتف التواصل:</label>
              <input
                type="text"
                value={storeSettings.phone || ''}
                onChange={(e) => updateStoreSettings({ phone: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">رقم الواتساب:</label>
              <input
                type="text"
                value={storeSettings.whatsapp || ''}
                onChange={(e) => updateStoreSettings({ whatsapp: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">البريد الإلكتروني الدعم:</label>
              <input
                type="email"
                value={storeSettings.email || ''}
                onChange={(e) => updateStoreSettings({ email: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 shadow-xs"
            >
              حفظ وتطبيق
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Announcement Bar */}
      {activeTab === 'announcement' && (
        <form onSubmit={(e) => {
          e.preventDefault();
          publishChanges();
          setSuccessMsg('تم حفظ ونشر شريط الإعلانات العلوي بنجاح!');
          setTimeout(() => setSuccessMsg(''), 3000);
        }} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-600" /> محرّر شريط الإعلانات العلوي (Announcement Bar)
            </h3>
            <button
              type="button"
              onClick={() => updateDraftAnnouncementBar({ enabled: !draftAnnouncementBar.enabled })}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                draftAnnouncementBar.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {draftAnnouncementBar.enabled ? 'الشريط مفعّل' : 'الشريط معطّل'}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">نص الإعلان العلوي:</label>
              <input
                type="text"
                value={draftAnnouncementBar.text}
                onChange={(e) => updateDraftAnnouncementBar({ text: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">لون خلفية الشريط:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draftAnnouncementBar.backgroundColor}
                    onChange={(e) => updateDraftAnnouncementBar({ backgroundColor: e.target.value })}
                    className="w-9 h-9 rounded-lg border cursor-pointer"
                  />
                  <span className="font-mono text-slate-600">{draftAnnouncementBar.backgroundColor}</span>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">لون نص الإعلان:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draftAnnouncementBar.textColor}
                    onChange={(e) => updateDraftAnnouncementBar({ textColor: e.target.value })}
                    className="w-9 h-9 rounded-lg border cursor-pointer"
                  />
                  <span className="font-mono text-slate-600">{draftAnnouncementBar.textColor}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> حفظ ونشر شريط الإعلانات
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: Menus & Navigation */}
      {activeTab === 'menus' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <MenuIcon className="w-4 h-4 text-slate-700" /> إدارة القوائم وشريط التصفح (Menus)
            </h3>
            <button
              onClick={handleAddMenuItem}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
            >
              + إضافة عنصر جديد
            </button>
          </div>

          <div className="space-y-2">
            {draftMenus.map((item) => (
              <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-600 text-[11px]">
                    {item.order}
                  </span>
                  <span className="font-bold text-slate-900 text-xs">{item.label}</span>
                  <span className="font-mono text-[11px] text-slate-400">({item.link})</span>
                </div>

                <button
                  onClick={() => handleDeleteMenuItem(item.id)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t">
            <button
              onClick={() => {
                publishChanges();
                setSuccessMsg('تم حفظ ونشر قوائم التصفح بنجاح!');
                setTimeout(() => setSuccessMsg(''), 3000);
              }}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> حفظ ونشر القوائم
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: Footer */}
      {activeTab === 'footer' && (
        <form onSubmit={(e) => {
          e.preventDefault();
          publishChanges();
          setSuccessMsg('تم حفظ ونشر تخصيصات الفوتر بنجاح!');
          setTimeout(() => setSuccessMsg(''), 3000);
        }} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Layout className="w-4 h-4 text-slate-700" /> تخصيص أسفل الصفحة (Footer Builder)
          </h3>

          <div>
            <label className="font-bold text-slate-700 block mb-1">النص التعريفي عن المتجر بالفوتر:</label>
            <textarea
              rows={2}
              value={draftFooterConfig.aboutText}
              onChange={(e) => updateDraftFooterConfig({ aboutText: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">حقوق الحفظ والتأليف (Copyright):</label>
            <input
              type="text"
              value={draftFooterConfig.copyrightText}
              onChange={(e) => updateDraftFooterConfig({ copyrightText: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
            />
          </div>

          <div className="flex justify-end pt-3 border-t">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> حفظ ونشر الفوتر
            </button>
          </div>
        </form>
      )}

      {/* TAB: Product Guarantees */}
      {activeTab === 'guarantees' && (
        <form onSubmit={handleSaveGuarantees} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" /> التحكم بشروط وضمانات نافذة التفاصيل (Product Details Guarantees)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                يمكنك تعديل، إخفاء، إضافة، أو حذف الضمانات والتعهدات المعروضة للعميل عند النقر على أي منتج.
              </p>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Check className="w-4 h-4" /> حفظ ونشر الضمانات
            </button>
          </div>

          {/* Master Enable/Disable */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 text-sm block">عرض قسم الضمانات بصفحة المنتج</span>
              <span className="text-slate-500 text-xs">تفعيل أو إخفاء صندوق الضمانات كاملاً من نافذة التفاصيل</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={guaranteesState.enabled}
                onChange={(e) => setGuaranteesState({ ...guaranteesState, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Section Title */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">عنوان قسم الضمانات الرئيسي:</label>
            <input
              type="text"
              value={guaranteesState.title}
              onChange={(e) => setGuaranteesState({ ...guaranteesState, title: e.target.value })}
              placeholder="مثال: ضمان النخبة والخدمة المتميزة"
              className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Guarantees Items Manager */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs">قائمة الشروط والضمانات المعروضة ({guaranteesState.items?.length || 0}):</h4>
              <button
                type="button"
                onClick={handleAddGuaranteeItem}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" /> إضافة بند ضمان جديد
              </button>
            </div>

            <div className="space-y-2">
              {(guaranteesState.items || []).map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl transition-all">
                  {/* Icon picker */}
                  <select
                    value={item.icon || 'check'}
                    onChange={(e) => handleUpdateGuaranteeItem(item.id, { icon: e.target.value })}
                    className="p-2 border border-slate-200 rounded-lg bg-white font-bold text-slate-700 text-xs shrink-0 cursor-pointer"
                  >
                    <option value="check">✓ علامة صح (Check)</option>
                    <option value="shield">🛡️ درع الأمان (Shield)</option>
                    <option value="refresh">🔄 استرجاع/استبدال (Refresh)</option>
                    <option value="truck">🚚 شحن وتوصيل (Truck)</option>
                  </select>

                  {/* Text input */}
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => handleUpdateGuaranteeItem(item.id, { text: e.target.value })}
                    placeholder="نص الضمانة..."
                    className="flex-1 p-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                  />

                  {/* Enable/Disable Toggle */}
                  <button
                    type="button"
                    onClick={() => handleUpdateGuaranteeItem(item.id, { enabled: !item.enabled })}
                    className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                      item.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {item.enabled ? <><Eye className="w-3.5 h-3.5" /> مفعّل</> : <><EyeOff className="w-3.5 h-3.5" /> مخفي</>}
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteGuaranteeItem(item.id)}
                    className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="حذف هذا البند"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> حفظ ونشر الضمانات
            </button>
          </div>
        </form>
      )}

      {/* TAB Policies */}
      {activeTab === 'policies' && (
        <form onSubmit={handleSaveStoreGeneral} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900">سياسات المتجر (Policies)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">سياسة الشحن:</label>
              <textarea rows={4} value={storeSettings.shipping_policy || ''} onChange={(e) => updateStoreSettings({ shipping_policy: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">سياسة الاستبدال:</label>
              <textarea rows={4} value={storeSettings.exchange_policy || ''} onChange={(e) => updateStoreSettings({ exchange_policy: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">سياسة الإلغاء:</label>
              <textarea rows={4} value={storeSettings.cancellation_policy || ''} onChange={(e) => updateStoreSettings({ cancellation_policy: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">سياسة الكفالة (الضمان):</label>
              <textarea rows={4} value={storeSettings.warranty_policy || ''} onChange={(e) => updateStoreSettings({ warranty_policy: e.target.value })} className="w-full p-2.5 border border-slate-200 rounded-xl" />
            </div>
          </div>
          
          <div className="flex justify-end pt-3 border-t">
            <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs">حفظ التغييرات</button>
          </div>
        </form>
      )}

      {/* TAB 6: SEO */}
      {activeTab === 'seo' && (
        <form onSubmit={(e) => {
          e.preventDefault();
          publishChanges();
          setSuccessMsg('تم حفظ وتطبيق إعدادات محركات البحث (SEO) بنجاح!');
          setTimeout(() => setSuccessMsg(''), 3000);
        }} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" /> إعدادات SEO ومحركات البحث
          </h3>

          <div>
            <label className="font-bold text-slate-700 block mb-1">عنوان الصفحة الرئيسي (Meta Title):</label>
            <input
              type="text"
              value={storeSettings.seo?.meta_title || ''}
              onChange={(e) => updateStoreSettings({ seo: { ...storeSettings.seo, meta_title: e.target.value, meta_description: storeSettings.seo?.meta_description || '', keywords: storeSettings.seo?.keywords || '' } })}
              className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">الوصف الميتا المحسن (Meta Description):</label>
            <textarea
              rows={3}
              value={storeSettings.seo?.meta_description || ''}
              onChange={(e) => updateStoreSettings({ seo: { ...storeSettings.seo, meta_description: e.target.value, meta_title: storeSettings.seo?.meta_title || '', keywords: storeSettings.seo?.keywords || '' } })}
              className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
            />
          </div>

          <div className="flex justify-end pt-3 border-t">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> حفظ إعدادات SEO
            </button>
          </div>
        </form>
      )}

      {/* TAB 7: Social Sharing Generator */}
      {activeTab === 'share' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-600" /> مولد مشاركة المنتجات التفاعلي (Product Social Share)
          </h3>

          <div>
            <label className="font-bold text-slate-700 block mb-1">اختر المنتج لإنشاء بطاقة مشاركة سريعة:</label>
            <select
              value={selectedShareProductId}
              onChange={(e) => setSelectedShareProductId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} - {p.price} ₪</option>
              ))}
            </select>
          </div>

          {selectedShareProduct && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 max-w-md mx-auto">
              <div className="aspect-video bg-white rounded-xl overflow-hidden border">
                <img 
                  src={selectedShareProduct.images?.[0]?.image_url || selectedShareProduct.image} 
                  alt={selectedShareProduct.name}
                  className="w-full h-full object-cover" 
                />
              </div>

              <div>
                <span className="text-[10px] text-amber-600 font-bold">{storeSettings.store_name}</span>
                <h4 className="font-bold text-sm text-slate-900">{selectedShareProduct.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{selectedShareProduct.description}</p>
                <div className="mt-2 font-bold text-emerald-700 text-sm">{selectedShareProduct.price} ₪</div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                <button
                  onClick={() => {
                    const text = `اكتشف ${selectedShareProduct.name} بسعر ${selectedShareProduct.price} ₪ في ${storeSettings.store_name}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  واتساب 💬
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  {copiedLink ? 'تم نسخ الرابط!' : 'نسخ الرابط'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
