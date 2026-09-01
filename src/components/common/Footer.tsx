import React, { useState } from 'react';
import { Store, ShieldCheck, Truck, Headphones, Heart } from 'lucide-react';
import { useStoreManagement } from '../../contexts/StoreContext';

export const Footer: React.FC = () => {
  const { storeSettings, footerConfig } = useStoreManagement();
  const [logoError, setLogoError] = useState(false);

  const storeName = storeSettings.store_name || 'متجر النخبة';
  const logoInitial = storeName.trim().charAt(0) || 'ن';

  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust features banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 mb-12 border-b border-stone-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">شحن سريع ومضمون</h4>
              <p className="text-xs text-stone-400">توصيل لجميع المدن والمحافظات</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">منتجات أصلية 100%</h4>
              <p className="text-xs text-stone-400">مفحوصة بعناية من أفضل الموردين</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">دعم فني مستمر</h4>
              <p className="text-xs text-stone-400">خدمة عملاء جاهزة للرد على استفساراتكم</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">نظام ربط ذكي</h4>
              <p className="text-xs text-stone-400">قاعدة بيانات Google Sheets ومخزون حي</p>
            </div>
          </div>
        </div>

        {/* Footer main info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              {storeSettings.logo_url && !logoError ? (
                <div className="w-9 h-9 rounded-xl border border-stone-700 bg-white p-0.5 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                  <img 
                    src={storeSettings.logo_url} 
                    alt={storeName}
                    className="w-full h-full object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoError(true)}
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {logoInitial}
                </div>
              )}
              <span className="font-bold text-lg text-white">{storeName}</span>
            </div>
            <p className="text-stone-400 text-sm leading-relaxed mb-4">
              {footerConfig.aboutText || storeSettings.description || 'منصة التجارة الإلكترونية الفاخرة لتسوق المنتجات الأصلية عالية الجودة.'}
            </p>
            <div className="text-xs text-stone-500">
              {footerConfig.copyrightText || `جميع الحقوق محفوظة © 2026 ${storeName}`}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-4">الأقسام السريعة</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li><a href="#store" className="hover:text-emerald-400 transition-colors">العطور الفاخرة</a></li>
              <li><a href="#store" className="hover:text-emerald-400 transition-colors">الملابس العصرية</a></li>
              <li><a href="#store" className="hover:text-emerald-400 transition-colors">الهدايا والإكسسوارات</a></li>
              <li><a href="#store" className="hover:text-emerald-400 transition-colors">العروض الخاصة</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-4">معلومات الاتصال</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>البريد الإلكتروني: {storeSettings.email || 'info@elites.ps'}</li>
              <li>الهاتف / واتساب: {storeSettings.phone || storeSettings.whatsapp || '+970 599 000 000'}</li>
              <li>الدوام: طوال أيام الأسبوع 24/7</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
