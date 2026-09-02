import React, { useState } from "react";
import {
  CheckCircle2,
  Database,
  Shield,
  Cloud,
  Server,
  FileSpreadsheet,
  HardDrive,
  Check,
  Lock,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { useGoogleSheets } from "../../contexts/GoogleSheetsContext";

export const Phase1SetupView: React.FC = () => {
  const {
    pullFromSheets,
    syncNow,
    isSyncing,
    lastSync,
    syncError,
    config,
  } = useGoogleSheets();

  const [pullResult, setPullResult] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  /*
   * جداول Database V3 الرسمية.
   */
  const tables = [
    "products",
    "product_variants",
    "product_groups",
    "categories",
    "product_sources",
    "product_images",
    "price_history",
    "suppliers",
    "supplier_channels",
    "supplier_product_discoveries",
    "supplier_shipping_rates",
    "supplier_transactions",
    "warehouses",
    "inventory",
    "inventory_movements",
    "customers",
    "orders",
    "order_items",
    "fulfillments",
    "returns",
    "shipping_zones",
    "shipping",
    "payments",
    "commissions",
    "expenses",
    "accounting_entries",
    "tax_profiles",
    "sales_channels",
    "product_channel_listings",
    "customer_messages",
    "users",
    "notifications",
    "activity_log",
    "store_settings",
    "discounts",
    "reviews",
    "wishlists",
    "media",
    "currencies",
    "exchange_rates",
  ];

  /*
   * اختبار القراءة من Google Sheets.
   */
  const handlePullTest = async () => {
    setPullResult(null);
    setSyncResult(null);

    const success = await pullFromSheets();

    if (success) {
      setPullResult(
        "تم تحميل بيانات Google Sheets V3 بنجاح إلى الكاش المحلي."
      );
    } else {
      setPullResult(
        "فشل تحميل بيانات Google Sheets. راجع رسالة الخطأ."
      );
    }
  };

  /*
   * اختبار الكتابة إلى Google Sheets.
   *
   * لا يتم تشغيله تلقائيًا.
   */
  const handleSyncTest = async () => {
    setSyncResult(null);

    const success = await syncNow();

    if (success) {
      setSyncResult(
        "تمت مزامنة البيانات المحلية مع Google Sheets V3 بنجاح."
      );
    } else {
      setSyncResult(
        "فشلت مزامنة البيانات مع Google Sheets. راجع رسالة الخطأ."
      );
    }
  };

  return (
    <div
      className="max-w-7xl mx-auto px-4 py-8"
      dir="rtl"
    >
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-950 text-white rounded-2xl p-8 shadow-xl mb-8 border border-stone-800">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Database V3 جاهزة
          </span>

          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-3 py-1 rounded-full font-semibold">
            Schema 3.0.0
          </span>

          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-semibold">
            Auto Sync مغلق
          </span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-3">
          إعداد واختبار قاعدة البيانات V3
        </h1>

        <p className="text-stone-300 text-sm max-w-3xl leading-relaxed">
          قاعدة البيانات الرسمية للمتجر تتكون من 40 جدولًا في Google
          Sheets، مع Google Drive لتخزين الصور. في هذه المرحلة نختبر
          الاتصال والقراءة والكتابة يدويًا قبل تفعيل المزامنة التلقائية.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ====================================================
            LEFT COLUMN
        ===================================================== */}

        <div className="lg:col-span-2 space-y-6">

          {/* ==================================================
              CONNECTION STATUS
          =================================================== */}

          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-emerald-600" />
              حالة الاتصال
            </h3>

            <div className="space-y-3">

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-sm text-stone-900">
                      Google Apps Script V3
                    </div>

                    <div className="text-xs text-stone-500 mt-1 break-all">
                      {config.webhookUrl}
                    </div>
                  </div>

                  <span className="shrink-0 text-emerald-600 text-xs font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    V3 مفعّل
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xs text-emerald-700 mb-1">
                    Schema
                  </div>

                  <div className="font-bold text-emerald-900">
                    3.0.0
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-xs text-blue-700 mb-1">
                    الجداول
                  </div>

                  <div className="font-bold text-blue-900">
                    40
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-xs text-amber-700 mb-1">
                    Auto Sync
                  </div>

                  <div className="font-bold text-amber-900">
                    مغلق
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ==================================================
              V3 TEST CONTROLS
          =================================================== */}

          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">

            <h3 className="text-lg font-bold text-stone-900 mb-2 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              اختبار Google Sheets V3
            </h3>

            <p className="text-xs text-stone-500 mb-5 leading-relaxed">
              نفّذ الاختبارات يدويًا وبالترتيب. لا يتم تشغيل أي مزامنة
              تلقائيًا في هذه المرحلة.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Pull */}

              <button
                type="button"
                onClick={handlePullTest}
                disabled={isSyncing}
                className="group p-5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed text-right transition"
              >
                <div className="flex items-center gap-3 mb-3">

                  <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  </span>

                  <div>
                    <div className="font-bold text-emerald-900">
                      اختبار Pull
                    </div>

                    <div className="text-xs text-emerald-700">
                      Google Sheets → التطبيق
                    </div>
                  </div>

                </div>

                <div className="text-xs text-emerald-800 leading-relaxed">
                  تحميل جميع جداول V3 من Google Sheets واستبدال الكاش
                  المحلي بها.
                </div>
              </button>

              {/* Sync */}

              <button
                type="button"
                onClick={handleSyncTest}
                disabled={isSyncing}
                className="group p-5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed text-right transition"
              >
                <div className="flex items-center gap-3 mb-3">

                  <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <Cloud className="w-5 h-5" />
                  </span>

                  <div>
                    <div className="font-bold text-blue-900">
                      اختبار Sync
                    </div>

                    <div className="text-xs text-blue-700">
                      التطبيق → Google Sheets
                    </div>
                  </div>

                </div>

                <div className="text-xs text-blue-800 leading-relaxed">
                  إرسال البيانات المحلية الحالية إلى Google Sheets V3.
                </div>
              </button>

            </div>

            {/* Pull result */}

            {pullResult && (
              <div className="mt-4 p-4 rounded-xl bg-stone-50 border border-stone-200 text-sm">
                <div className="flex items-start gap-2">

                  {pullResult.startsWith("تم") ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}

                  <span className="text-stone-700">
                    {pullResult}
                  </span>

                </div>
              </div>
            )}

            {/* Sync result */}

            {syncResult && (
              <div className="mt-4 p-4 rounded-xl bg-stone-50 border border-stone-200 text-sm">
                <div className="flex items-start gap-2">

                  {syncResult.startsWith("تم") ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}

                  <span className="text-stone-700">
                    {syncResult}
                  </span>

                </div>
              </div>
            )}

            {/* Global error */}

            {syncError && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-start gap-2">

                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />

                  <div>
                    <div className="font-bold text-red-800 text-sm mb-1">
                      آخر خطأ
                    </div>

                    <div className="text-xs text-red-700 break-words">
                      {syncError}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {lastSync && (
              <div className="mt-4 text-xs text-stone-500">
                آخر مزامنة:
                {" "}
                {new Date(lastSync).toLocaleString("ar")}
              </div>
            )}

          </div>

          {/* ==================================================
              ARCHITECTURE
          =================================================== */}

          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">

            <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-600" />
              المعمارية التقنية
            </h3>

            <div className="space-y-3">

              {[
                {
                  number: "1",
                  title: "Frontend",
                  description:
                    "React + TypeScript + Vite + Tailwind CSS + RTL",
                },
                {
                  number: "2",
                  title: "Authentication",
                  description:
                    "المصادقة وإدارة صلاحيات المستخدمين",
                },
                {
                  number: "3",
                  title: "Google Apps Script V3",
                  description:
                    "API للمزامنة مع Google Sheets وGoogle Drive",
                },
                {
                  number: "4",
                  title: "Google Sheets",
                  description:
                    "قاعدة البيانات الرسمية — 40 جدولًا",
                },
                {
                  number: "5",
                  title: "Google Drive",
                  description:
                    "تخزين صور المنتجات والملفات",
                },
              ].map((item) => (
                <div
                  key={item.number}
                  className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">

                    <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                      {item.number}
                    </span>

                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">
                        {item.title}
                      </h4>

                      <p className="text-xs text-stone-500">
                        {item.description}
                      </p>
                    </div>

                  </div>

                  <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    جاهز
                  </span>

                </div>
              ))}

            </div>
          </div>

          {/* ==================================================
              TABLES
          =================================================== */}

          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">

            <h3 className="text-lg font-bold text-stone-900 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              جداول Database V3 — 40 جدولًا
            </h3>

            <p className="text-xs text-stone-500 mb-4">
              هذه هي الجداول الرسمية المعتمدة في Schema 3.0.0.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">

              {tables.map((tableName, index) => (
                <div
                  key={tableName}
                  className="bg-stone-50 border border-stone-200 px-3 py-2 rounded-lg text-xs font-medium text-stone-800 flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                    {index + 1}
                  </span>

                  <span className="truncate">
                    {tableName}
                  </span>
                </div>
              ))}

            </div>
          </div>

        </div>

        {/* ====================================================
            RIGHT COLUMN
        ===================================================== */}

        <div className="space-y-6">

          {/* Security */}

          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">

            <h3 className="font-bold text-stone-900 text-base mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-stone-700" />
              حماية البيانات
            </h3>

            <ul className="space-y-3 text-xs text-stone-600">

              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                Google Sheets هو المصدر الرسمي للبيانات.
              </li>

              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                لا يتم تخزين Base64 للصور في LocalStorage.
              </li>

              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                الصور تحفظ في Google Drive.
              </li>

              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                Auto Sync مغلق أثناء الاختبار.
              </li>

              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                Schema Version مثبت على 3.0.0.
              </li>

            </ul>
          </div>

          {/* Free */}

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-emerald-900">

            <div className="flex items-center gap-2.5 mb-3">
              <Sparkles className="w-6 h-6 text-emerald-600" />

              <h3 className="font-bold text-base">
                البنية الحالية
              </h3>
            </div>

            <p className="text-xs leading-relaxed text-emerald-800">
              تم تجهيز قاعدة البيانات V3 وواجهة الاتصال مع Google
              Sheets وGoogle Drive. الاختبارات الحالية يدوية حتى نتأكد
              من سلامة جميع عمليات القراءة والكتابة.
            </p>

          </div>

          {/* Drive */}

          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">

            <h3 className="font-bold text-stone-900 text-base mb-3 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-stone-700" />
              Google Drive
            </h3>

            <div className="text-xs text-stone-600 leading-relaxed">

              <div className="mb-2">
                <span className="font-bold text-stone-800">
                  مجلد المنتجات:
                </span>
              </div>

              <code className="block bg-stone-100 p-2 rounded-lg break-all">
                {config.folderId}
              </code>

              <div className="mt-3 text-stone-500">
                سيتم اختبار إنشاء مجلد منتج ورفع صورة بعد نجاح
                اختبار المزامنة.
              </div>

            </div>

          </div>

          {/* Status */}

          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">

            <h3 className="font-bold text-stone-900 text-base mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-stone-700" />
              المرحلة الحالية
            </h3>

            <div className="space-y-2 text-xs">

              <div className="flex justify-between">
                <span className="text-stone-500">
                  Database V3
                </span>

                <span className="text-emerald-600 font-bold">
                  جاهزة
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stone-500">
                  API V3
                </span>

                <span className="text-emerald-600 font-bold">
                  جاهز
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stone-500">
                  Pull
                </span>

                <span className="text-amber-600 font-bold">
                  اختبار الآن
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stone-500">
                  Product Flow
                </span>

                <span className="text-stone-400 font-bold">
                  لاحقًا
                </span>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
