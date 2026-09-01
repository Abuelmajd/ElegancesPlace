import React from 'react';
import { CheckCircle2, Database, Shield, Cloud, Server, FileSpreadsheet, HardDrive, Check, Lock, Sparkles } from 'lucide-react';

export const Phase1SetupView: React.FC = () => {
  const tables = [
    "Users", "Customers", "Suppliers", "Categories", "Products", "ProductImages",
    "Orders", "OrderItems", "Fulfillments", "FulfillmentItems", "Inventory", "InventoryMovements",
    "PriceHistory", "Expenses", "Payments", "SupplierPayments", "CashFlow", "Reviews",
    "Wishlists", "WishlistItems", "Coupons", "Discounts", "AuditLogs", "StoreSettings"
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-950 text-white rounded-2xl p-8 shadow-xl mb-8 border border-stone-800">
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> المرحلة الأولى اكتملت بنجاح (Phase 1 Completed)
          </span>
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-semibold">
            مجاني 100% (Free Tier Guaranteed)
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">تقرير بنية المشروع والاتصال (Full-Stack Architecture & Phase 1)</h1>
        <p className="text-stone-300 text-sm max-w-3xl leading-relaxed">
          تم إنشاء الهيكل الأساسي الكامل للمتجر الإلكتروني، مع تفعيل المصادقة (Firebase Auth)، وإعداد الاتصال بقاعدة بيانات Google Sheets (التي تحتوي على جداول النظام الـ 24 كاملة)، وتجهيز تخزين Google Drive للصور، مع دعم كامل للغة العربية واتجاه RTL.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Architecture components */}
        <div className="lg:col-span-2 space-y-6">
          {/* Architecture Stack */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-600" /> المعمارية التقنية المطبقة (Architecture Stack)
            </h3>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">1</span>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">واجهة المستخدم (Frontend)</h4>
                    <p className="text-xs text-stone-500">React 18+, TypeScript, Tailwind CSS, Vite, RTL Arabic UI</p>
                  </div>
                </div>
                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1"><Check className="w-4 h-4" /> جاهز</span>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">2</span>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">المصادقة وصلاحيات الأدوار (Firebase Auth & RBAC)</h4>
                    <p className="text-xs text-stone-500">Owner, Manager, Accountant, Marketing, Employee, Customer</p>
                  </div>
                </div>
                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1"><Check className="w-4 h-4" /> جاهز</span>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">3</span>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">طبقة السيرفر والـ API (Express Backend)</h4>
                    <p className="text-xs text-stone-500">server.ts مدمج مع وكيل Google Sheets و Google Drive ومسار الصحة</p>
                  </div>
                </div>
                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1"><Check className="w-4 h-4" /> جاهز</span>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-green-100 text-green-700 font-bold flex items-center justify-center text-xs">4</span>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">قاعدة البيانات الرئيسية (Google Sheets)</h4>
                    <p className="text-xs text-stone-500">24 جدولاً منظماً (Users, Products, Orders, Suppliers, Accounting, etc.)</p>
                  </div>
                </div>
                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1"><Check className="w-4 h-4" /> جاهز</span>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">5</span>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">تخزين الصور (Google Drive Storage)</h4>
                    <p className="text-xs text-stone-500">مجلدات منظمة لصور المنتجات والأقسام مع دعم Lazy Loading والروابط</p>
                  </div>
                </div>
                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1"><Check className="w-4 h-4" /> جاهز</span>
              </div>
            </div>
          </div>

          {/* Google Sheets 24 Tables List */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> جداول Google Sheets المطلوبة (24 جدولاً)
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              تمت برمجة النماذج للتعامل مع هذه الجداول بدقة بالغة مع مفاتيح فريدة (UUID) وعلاقات مرجعية واضحة:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {tables.map((t, idx) => (
                <div key={idx} className="bg-stone-50 border border-stone-200 px-3 py-2 rounded-lg text-xs font-medium text-stone-800 flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">{idx + 1}</span>
                  <span className="truncate">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Free tier guarantee & setup checklist */}
        <div className="space-y-6">
          {/* Admin Table Management */}
          <div className="bg-stone-100 border border-stone-200 rounded-xl p-6">
            <h3 className="font-bold text-stone-900 text-base mb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-stone-700" /> إدارة الجداول (Admin Only)
            </h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                id="newTableName"
                placeholder="اسم الجدول الجديد"
                className="flex-grow px-3 py-2 rounded-lg border border-stone-300 text-sm"
              />
              <button 
                onClick={async () => {
                  const tableName = (document.getElementById('newTableName') as HTMLInputElement).value;
                  if (!tableName) return;
                  const response = await fetch('/api/create-table', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tableName })
                  });
                  const result = await response.json();
                  alert(result.message || result.error);
                }}
                className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-stone-800"
              >
                إنشاء
              </button>
            </div>
          </div>

          {/* Free Tier Guarantee Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-emerald-900">
            <div className="flex items-center gap-2.5 mb-3">
              <Sparkles className="w-6 h-6 text-emerald-600" />
              <h3 className="font-bold text-base">ضمان المجالية التامة (100% Free Tier)</h3>
            </div>
            <p className="text-xs leading-relaxed text-emerald-800 mb-4">
              تم بناء المتجر بالكامل ليعمل ضمن الحدود المجانية (Free Tiers) لـ Firebase و Google Sheets و Google Drive دون الحاجة لأي بطاقة ائتمان أو تفعيل خطة مدفوعة (Blaze غير مطلوب).
            </p>
            <ul className="space-y-2 text-xs text-emerald-900 font-medium">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> لا توجد أي اشتراكات أو تكاليف خفية</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> لا تتطلب بطاقة ائتمان نهائياً</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> وضع Offline / Demo مدمج للاختبار الفوري</li>
            </ul>
          </div>

          {/* Next Steps Guidance */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-stone-900 text-base mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-stone-700" /> إرشادات ربط Google Sheets و Drive الحقيقي
            </h3>
            <ol className="space-y-3 text-xs text-stone-600 list-decimal list-inside leading-relaxed">
              <li>أنشئ Google Spreadsheet جديد وضع أسماء الجداول المذكورة أعلاه كـ Sheets منفصلة.</li>
              <li>أنشئ Service Account من Google Cloud Console (مجاني تماماً).</li>
              <li>شارك ملف Google Sheets مع البريد الخاص بـ Service Account بصلاحية Editor.</li>
              <li>أضف <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">GOOGLE_SHEET_ID</code> و <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">GOOGLE_SERVICE_ACCOUNT_EMAIL</code> في ملف البيئة (<code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">.env</code>).</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
