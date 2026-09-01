import React, { useState } from 'react';
import { useStoreManagement } from '../contexts/StoreContext';
import { 
  Settings, Globe, DollarSign, Moon, Sun, Palette, 
  Check, Sparkles, Sliders, Shield, Layout, Zap 
} from 'lucide-react';

export const SystemSettingsPage: React.FC = () => {
  const { storeSettings, updateStoreSettings, publishChanges } = useStoreManagement();

  const [language, setLanguage] = useState(storeSettings.language || 'ar');
  const [currency, setCurrency] = useState(storeSettings.currency || 'ر.س');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('elites_dark_mode') === 'true' || document.documentElement.classList.contains('dark');
  });
  const [primaryColor, setPrimaryColor] = useState(storeSettings.hero_bg_color || '#059669');
  const [successMsg, setSuccessMsg] = useState('');

  const toggleDarkMode = (dark: boolean) => {
    setIsDarkMode(dark);
    localStorage.setItem('elites_dark_mode', dark ? 'true' : 'false');
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      language,
      currency,
    });
    toggleDarkMode(isDarkMode);
    publishChanges();
    setSuccessMsg('تم حفظ وتحديث إعدادات النظام، العملة، اللغة، والوضع الليلي/النهاري بنجاح تام!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in text-xs sm:text-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            صفحة إعدادات النظام الشاملة (System Settings & Customization)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدارة اللغة، العملة، الوضع الليلي والنهاري، وتخصيص الألوان والسمات للموقع والمتجر بالكامل.
          </p>
        </div>

        {successMsg && (
          <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-2xl text-xs font-bold animate-fade-in flex items-center gap-1.5">
            <Check className="w-4 h-4" /> {successMsg}
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Language & Currency Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Globe className="w-5 h-5 text-blue-600" /> اللغة والعملة (Language & Currency Settings)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Language Selector */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">لغة الواجهة (Interface Language):</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ar">🇸🇦 العربية (Arabic - الإفتراضية)</option>
                <option value="en">🇬🇧 English (الإنجليزية)</option>
                <option value="fr">🇫🇷 Français (الفرنسية)</option>
              </select>
            </div>

            {/* Currency Selector */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">العملة الرسمية للمتجر (Store Currency):</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ر.س">ريال سعودي (SAR / ر.س)</option>
                <option value="₪">شيكل إسرائيلي (ILS / ₪)</option>
                <option value="$">دولار أمريكي (USD / $)</option>
                <option value="AED">درهم إماراتي (AED)</option>
                <option value="EGP">جنيه مصري (EGP / ج.م)</option>
                <option value="EUR">يورو أوروبي (EUR / €)</option>
                <option value="JOD">دينار أردني (JOD)</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                ملاحظة: سيتم تحديث وتطبيق العملة المختارة فوراً في جميع صفحات المتجر والأسعار والتقارير المالية.
              </span>
            </div>
          </div>
        </div>

        {/* Dark / Light Mode & Theme Color Customizer */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Palette className="w-5 h-5 text-purple-600" /> الوضع الليلي والنهاري وتخصيص الألوان (Theme & Dark/Light Mode)
          </h3>

          {/* Dark / Light Mode Toggle */}
          <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-amber-100 text-amber-700'}`}>
                {isDarkMode ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {isDarkMode ? 'الوضع الليلي مفعّل (Dark Mode)' : 'الوضع النهاري مفعّل (Light Mode)'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isDarkMode 
                    ? 'ألوان داكنة فائقة الراحة للعين (خلفيات سوداء، زرقاء داكنة، وخضراء داكنة زاهية).' 
                    : 'ألوان نهارية فاتحة، زاهية، ونظيفة تضفي طابعاً مريحاً ومشرقاً للمتجر.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleDarkMode(!isDarkMode)}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-sm ${
                isDarkMode 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {isDarkMode ? '☀️ التبديل للوضع النهاري' : '🌙 التبديل للوضع الليلي'}
            </button>
          </div>

          {/* Color Presets */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2.5">
              أنماط ألوان الموقع الفاخرة (Color Palettes & Presets):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'زمردي أخضر (الافتراضي)', color: '#059669', bg: 'bg-emerald-600' },
                { name: 'كحلي ملكي فخم', color: '#1e3a8a', bg: 'bg-blue-900' },
                { name: 'أنيق أسود وذهبي', color: '#d97706', bg: 'bg-amber-600' },
                { name: 'أرجواني عصري', color: '#7c3aed', bg: 'bg-purple-600' }
              ].map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setPrimaryColor(p.color)}
                  className={`p-3 rounded-2xl border text-center font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    primaryColor === p.color
                      ? 'border-slate-900 dark:border-white ring-2 ring-emerald-500/30 bg-slate-50 dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${p.bg}`} />
                  <span className="text-slate-900 dark:text-white">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <Check className="w-5 h-5" /> حفظ وتطبيق إعدادات النظام الآن
          </button>
        </div>
      </form>
    </div>
  );
};
