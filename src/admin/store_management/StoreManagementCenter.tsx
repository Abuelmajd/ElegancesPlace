import React, { useState } from 'react';
import { useStoreManagement } from '../../contexts/StoreContext';
import { useProducts } from '../../contexts/ProductContext';
import { useOrders } from '../../contexts/OrderContext';
import { VisualStoreCustomizer } from './VisualStoreCustomizer';
import { HomepageSectionManager } from './HomepageSectionManager';
import { MediaLibraryManager } from './MediaLibraryManager';
import { OffersAndDiscountsCenter } from './OffersAndDiscountsCenter';
import { ProductAndCategoryCustomizer } from './ProductAndCategoryCustomizer';
import { StoreSettingsManager } from './StoreSettingsManager';
import { 
  Store, Palette, Layout, ImageIcon, Zap, Package, 
  Settings, Eye, ShieldCheck, Sparkles, TrendingUp, ShoppingBag, 
  Users, DollarSign, ArrowUpRight, Clock 
} from 'lucide-react';

export const StoreManagementCenter: React.FC = () => {
  const { storeSettings, themeSettings, hasUnpublishedChanges, publishChanges } = useStoreManagement();
  const { products } = useProducts();
  const { orders } = useOrders();

  const [activeTab, setActiveTab] = useState<'overview' | 'appearance' | 'homepage' | 'media' | 'offers' | 'products' | 'settings'>('overview');

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const activeProducts = products.filter(p => p.stock > 0).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner / Hero */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Store className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-black text-white">مركز إدارة ومظهر المتجر (Store Control Center)</h1>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              إدارة التنسيقات البصرية، الصفحة الرئيسية، العروض الترويجيّة، ومكتبة وسائط متجر {storeSettings.store_name} بكل سهولة وسرعة.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasUnpublishedChanges && (
              <button
                onClick={publishChanges}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-2xl transition-all cursor-pointer shadow-md flex items-center gap-2 animate-bounce"
              >
                <ShieldCheck className="w-4 h-4" /> نشر المسودة الحية للمتجر
              </button>
            )}
            <a
              href="#preview"
              onClick={() => setActiveTab('appearance')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer border border-white/10 flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" /> معاينة المتجر 🔍
            </a>
          </div>
        </div>
      </div>

      {/* Main Control Navigation Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
        {[
          { id: 'overview', label: 'نظرة عامة', icon: Store },
          { id: 'appearance', label: 'مظهر المتجر والألوان', icon: Palette, badge: hasUnpublishedChanges },
          { id: 'homepage', label: 'الصفحة الرئيسية', icon: Layout },
          { id: 'offers', label: 'العروض والكوبونات', icon: Zap },
          { id: 'products', label: 'المنتجات والتسعير', icon: Package },
          { id: 'media', label: 'مكتبة الوسائط', icon: ImageIcon },
          { id: 'settings', label: 'إعدادات والهوية', icon: Settings }
        ].map(nav => {
          const Icon = nav.icon;
          return (
            <button
              key={nav.id}
              onClick={() => setActiveTab(nav.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === nav.id 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{nav.label}</span>
              {nav.badge && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Store Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500">إجمالي المبيعات</span>
              <div className="text-xl font-black text-slate-900">{Number(totalRevenue || 0).toLocaleString()} ₪</div>
              <span className="text-[11px] text-emerald-600 font-bold">من جميع الطلبات المسجلة</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500">الطلبات الكلية</span>
              <div className="text-xl font-black text-slate-900">{orders.length} طلب</div>
              <span className="text-[11px] text-slate-400">متابعة وحالة الشحن</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500">المنتجات النشطة</span>
              <div className="text-xl font-black text-slate-900">{activeProducts} منتج</div>
              <span className="text-[11px] text-slate-400">متوفرة في المخزون</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500">الثيم الحالي المفّعل</span>
              <div className="text-xl font-black text-emerald-700">{themeSettings.preset}</div>
              <span className="text-[11px] text-slate-400">تخصيص كامل بدون كود</span>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => setActiveTab('appearance')}
              className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">تخصيص مظهر المتجر الألوان</h3>
              <p className="text-xs text-slate-500">غير الألوان، الثيمات، وحجم الخطوط فورياً مع معاينة تفاعلية للأجهزة.</p>
            </div>

            <div 
              onClick={() => setActiveTab('homepage')}
              className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Layout className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">بناء الصفحة الرئيسية</h3>
              <p className="text-xs text-slate-500">إعادة ترتيب البنرات، الأقسام الفاخرة، والعروض بالترتيب والتحكم السهل.</p>
            </div>

            <div 
              onClick={() => setActiveTab('offers')}
              className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">العروض والكوبونات والفلاش سيل</h3>
              <p className="text-xs text-slate-500">إنشاء عروض ترويجية سريعة مع عداد تنازلي لحث العملاء على الشراء.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Visual Customizer */}
      {activeTab === 'appearance' && <VisualStoreCustomizer />}

      {/* TAB 3: Homepage Builder */}
      {activeTab === 'homepage' && <HomepageSectionManager />}

      {/* TAB 4: Media Library */}
      {activeTab === 'media' && <MediaLibraryManager />}

      {/* TAB 5: Offers Center */}
      {activeTab === 'offers' && <OffersAndDiscountsCenter />}

      {/* TAB 6: Products & Categories */}
      {activeTab === 'products' && <ProductAndCategoryCustomizer />}

      {/* TAB 7: Store Settings & Identity */}
      {activeTab === 'settings' && <StoreSettingsManager />}
    </div>
  );
};
