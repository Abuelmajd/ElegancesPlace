import React, { useState } from 'react';
import { useStoreManagement, THEME_PRESETS } from '../../contexts/StoreContext';
import { ThemePresetName, ThemeSettings } from '../../types';
import { 
  Palette, Monitor, Tablet, Smartphone, Sparkles, Check, RefreshCw, 
  Layers, Type, Layout, Eye, Save, RotateCcw, ShieldCheck, ArrowRight
} from 'lucide-react';

export const VisualStoreCustomizer: React.FC = () => {
  const { 
    storeSettings,
    draftThemeSettings, 
    updateDraftTheme, 
    applyThemePreset, 
    hasUnpublishedChanges, 
    publishChanges, 
    revertDraftChanges 
  } = useStoreManagement();

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'presets' | 'colors' | 'typography' | 'cards'>('presets');

  return (
    <div className="space-y-6">
      {/* Top Header & Draft/Publish Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">مظهر المتجر والألوان (Visual Customization)</h2>
            {hasUnpublishedChanges && (
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[11px] font-bold animate-pulse">
                تغييرات غير منشورة (مسودة)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            خصص الألوان، الخطوط، حواف البطاقات والأنماط البصرية دون الحاجة لأي برمجة.
          </p>
        </div>

        {/* Publish / Revert Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {hasUnpublishedChanges && (
            <button
              onClick={revertDraftChanges}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> إلغاء التعديلات
            </button>
          )}

          <button
            onClick={publishChanges}
            disabled={!hasUnpublishedChanges}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" /> نشر المظهر الحي للمتجر
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Settings Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sub Navigation */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            {[
              { id: 'presets', label: 'الأنماط الجاهزة', icon: Sparkles },
              { id: 'colors', label: 'الألوان', icon: Palette },
              { id: 'typography', label: 'الخطوط والحواف', icon: Type },
              { id: 'cards', label: 'البطاقات والتنقل', icon: Layout }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-white text-emerald-800 shadow-xs font-extrabold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Theme Presets */}
          {activeTab === 'presets' && (
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> اختر ثيم جاهز لمتجرك (Theme Presets)
              </h3>
              <p className="text-xs text-slate-500">
                اختيار القالب يغير التنسيقات والألوان فورياً دون التأثير على المنتجات أو الطلبات.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(THEME_PRESETS) as ThemePresetName[]).map(presetName => {
                  const preset = THEME_PRESETS[presetName];
                  const isSelected = draftThemeSettings.preset === presetName;
                  return (
                    <button
                      key={presetName}
                      onClick={() => applyThemePreset(presetName)}
                      className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-xs text-slate-900">{presetName}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                      </div>

                      {/* Color dots preview */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: preset.primaryColor }} />
                        <span className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: preset.accentColor }} />
                        <span className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: preset.backgroundColor }} />
                        <span className="w-4 h-4 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: preset.buttonColor }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Colors Editor */}
          {activeTab === 'colors' && (
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">تخصيص لوحة الألوان الفرعية</h3>

              <div className="space-y-3 text-xs">
                {[
                  { key: 'primaryColor', label: 'اللون الرئيسي (Primary)' },
                  { key: 'secondaryColor', label: 'اللون الثانوي (Secondary)' },
                  { key: 'accentColor', label: 'لون التمييز (Accent)' },
                  { key: 'backgroundColor', label: 'خلفية المتجر (Background)' },
                  { key: 'textColor', label: 'لون النصوص (Text)' },
                  { key: 'buttonColor', label: 'لون الأزرار (Button)' },
                  { key: 'buttonTextColor', label: 'نص الأزرار (Button Text)' },
                  { key: 'headerColor', label: 'لون الهيدر (Header)' },
                  { key: 'heroBgColor', label: 'خلفية قسم الهيرو والواجهة (Hero BG)' },
                  { key: 'footerColor', label: 'لون الفوتر (Footer)' }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-700">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-500">{(draftThemeSettings as any)[item.key] || '#1c1917'}</span>
                      <input
                        type="color"
                        value={(draftThemeSettings as any)[item.key] || '#1c1917'}
                        onChange={(e) => updateDraftTheme({ [item.key]: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Typography & Border Radius */}
          {activeTab === 'typography' && (
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900">أنماط الخطوط والحواف والتأثيرات</h3>

              <div>
                <label className="font-bold text-slate-700 block mb-1">نمط العنوان الرئيسي (Heading Style):</label>
                <select
                  value={draftThemeSettings.headingStyle}
                  onChange={(e) => updateDraftTheme({ headingStyle: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="sans">عصري مبسط (Sans-serif)</option>
                  <option value="serif">فاخر كلاسيكي (Serif)</option>
                  <option value="bold">بارز وعريض (Bold)</option>
                  <option value="minimal">مينيمال بسيط (Minimal)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">انحناء زوايا العناصر (Border Radius):</label>
                <div className="grid grid-cols-3 gap-2">
                  {['none', 'sm', 'md', 'lg', 'xl', 'full'].map(r => (
                    <button
                      key={r}
                      onClick={() => updateDraftTheme({ borderRadius: r as any })}
                      className={`py-2 rounded-lg border font-bold capitalize transition-all cursor-pointer ${
                        draftThemeSettings.borderRadius === r 
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800' 
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">نمط الظلال (Shadows):</label>
                <select
                  value={draftThemeSettings.shadows}
                  onChange={(e) => updateDraftTheme({ shadows: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="none">بدون ظلال (Flat)</option>
                  <option value="sm">ظلال خفيفة (Small)</option>
                  <option value="md">ظلال متوسطة (Medium)</option>
                  <option value="lg">ظلال عميقة بارزة (Large)</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 4: Cards & Navigation */}
          {activeTab === 'cards' && (
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900">نمط عرض كروت المنتجات والقوائم</h3>

              <div>
                <label className="font-bold text-slate-700 block mb-1">نمط كرت المنتج (Product Card Style):</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'modern', label: 'حديث وفاخر (Modern)' },
                    { id: 'classic', label: 'تقليدي كلاسيكي (Classic)' },
                    { id: 'minimal', label: 'بسيط جداً (Minimal)' },
                    { id: 'compact', label: 'مدمج ومكثف (Compact)' }
                  ].map(style => (
                    <button
                      key={style.id}
                      onClick={() => updateDraftTheme({ productCardStyle: style.id as any })}
                      className={`p-2.5 rounded-xl border text-right font-bold transition-all cursor-pointer ${
                        draftThemeSettings.productCardStyle === style.id 
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900' 
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">تصميم الهيدر والتنقل (Navigation Style):</label>
                <select
                  value={draftThemeSettings.navigationStyle}
                  onChange={(e) => updateDraftTheme({ navigationStyle: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="top">شريط علوي قياسي (Top Header)</option>
                  <option value="centered">شعار متوسط وكبير (Centered Logo)</option>
                  <option value="minimal">شريط مينيمال بسيط (Minimal Header)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Right Live Device Frame Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Device Controls */}
          <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-2xl shadow-md">
            <span className="text-xs font-bold flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" /> المعاينة التفاعلية المباشرة (Live Preview)
            </span>

            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${previewDevice === 'desktop' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="شاشة كمبيوتر"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${previewDevice === 'tablet' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="تابلت"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${previewDevice === 'mobile' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="هاتف جوال"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Live Screen Sandbox */}
          <div className="flex justify-center bg-slate-200 p-4 rounded-2xl overflow-hidden min-h-[500px]">
            <div 
              className={`transition-all duration-300 bg-white rounded-xl overflow-hidden shadow-xl border border-slate-300 flex flex-col ${
                previewDevice === 'mobile' ? 'w-[360px]' : previewDevice === 'tablet' ? 'w-[640px]' : 'w-full'
              }`}
              style={{
                backgroundColor: draftThemeSettings.backgroundColor,
                color: draftThemeSettings.textColor
              }}
            >
              {/* Header Preview */}
              <div 
                className="p-3 border-b flex items-center justify-between shadow-xs"
                style={{ backgroundColor: draftThemeSettings.headerColor }}
              >
                <div className="flex items-center gap-2">
                  {storeSettings.logo_url ? (
                    <div className="w-6 h-6 rounded-md border border-slate-200 bg-white p-0.5 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                      <img 
                        src={storeSettings.logo_url} 
                        alt={storeSettings.store_name || 'الشعار'} 
                        className="w-full h-full object-contain rounded-xs"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                      {(storeSettings.store_name || 'N').trim().charAt(0)}
                    </div>
                  )}
                  <span className="font-bold text-xs" style={{ color: draftThemeSettings.primaryColor }}>
                    {storeSettings.store_name || 'ElegancesPlace'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100">سلة التسوق (2)</span>
                </div>
              </div>

              {/* Hero Banner Sample */}
              <div className="p-6 text-center space-y-3 relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold border border-amber-500/30">
                  تشكيلة النخبة 2026
                </span>
                <h4 className="font-bold text-lg" style={{ fontFamily: draftThemeSettings.headingStyle === 'serif' ? 'serif' : 'sans-serif' }}>
                  عالم الفخامة والتسوق المميز
                </h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  تصفح المنتجات الفاخرة التي تناسب ذوقك الرفيع مع ضمان التوصيل السريع.
                </p>
                <div>
                  <button 
                    className="px-5 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95 shadow-md cursor-pointer"
                    style={{
                      backgroundColor: draftThemeSettings.buttonColor,
                      color: draftThemeSettings.buttonTextColor
                    }}
                  >
                    تسوق التشكيلة الآن
                  </button>
                </div>
              </div>

              {/* Product Card Preview */}
              <div className="p-4 space-y-3">
                <span className="text-xs font-bold block" style={{ color: draftThemeSettings.primaryColor }}>
                  منتج تجريبي من الثيم:
                </span>

                <div 
                  className={`p-3 bg-white border border-slate-200 transition-all ${
                    draftThemeSettings.borderRadius === 'full' ? 'rounded-3xl' :
                    draftThemeSettings.borderRadius === 'xl' ? 'rounded-2xl' :
                    draftThemeSettings.borderRadius === 'lg' ? 'rounded-xl' : 'rounded-none'
                  } ${draftThemeSettings.shadows === 'lg' ? 'shadow-lg' : draftThemeSettings.shadows === 'md' ? 'shadow-md' : 'shadow-none'}`}
                >
                  <div className="aspect-video bg-slate-100 rounded-lg mb-2 flex items-center justify-center text-slate-400 text-xs font-bold">
                    معاينة كرت المنتج ({draftThemeSettings.productCardStyle})
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-amber-600 font-bold">عطور فاخرة</span>
                    <h5 className="font-bold text-xs text-slate-900">عطر ملكي نخبوي فاخر 100مل</h5>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-bold text-emerald-700 text-sm">240 ₪</span>
                      <button 
                        className="px-3 py-1 text-xs rounded-lg font-bold"
                        style={{
                          backgroundColor: draftThemeSettings.buttonColor,
                          color: draftThemeSettings.buttonTextColor
                        }}
                      >
                        إضافة للسلة
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Sample */}
              <div 
                className="p-4 text-center text-[10px] mt-auto border-t text-slate-300"
                style={{ backgroundColor: draftThemeSettings.footerColor }}
              >
                جميع الحقوق محفوظة © 2026 ElegancesPlace
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
