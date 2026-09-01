import React, { useState } from 'react';
import { Order, OrderItem } from '../../types';
import { X, Printer, CheckCircle2, ShieldCheck, MapPin, Phone, Mail, FileText, Package } from 'lucide-react';
import { useStoreManagement } from '../../contexts/StoreContext';

interface InvoiceViewModalProps {
  order: Order;
  orderItems: OrderItem[];
  onClose: () => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({ order, orderItems, onClose }) => {
  const { storeSettings } = useStoreManagement();
  const [logoError, setLogoError] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = order.order_date || new Date(order.created_at).toLocaleDateString('ar-SA');
  const storeName = storeSettings.store_name || 'متجر النخبة';
  const logoInitial = storeName.trim().charAt(0) || 'ن';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden print:shadow-none print:m-0 print:w-full print:max-w-none border border-stone-200 my-8">
        {/* Header Bar - Hidden when printing */}
        <div className="bg-stone-900 text-stone-100 p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg">فاتورة ضريبية رسمية - {order.order_number}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" /> طباعة الفاتورة
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-8 space-y-8 bg-white text-stone-900" id="printable-invoice">
          {/* Store Branding & Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-stone-200 pb-6 gap-6">
            <div>
              <div className="flex items-center gap-3">
                {storeSettings.logo_url && !logoError ? (
                  <div className="w-12 h-12 rounded-xl border border-stone-200 bg-white p-0.5 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                    <img 
                      src={storeSettings.logo_url} 
                      alt={storeName}
                      className="w-full h-full object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                      onError={() => setLogoError(true)}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
                    {logoInitial}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">{storeName}</h1>
                  <p className="text-xs text-stone-500 font-medium">{storeSettings.store_slogan || 'منصة التجارة الإلكترونية الرقمية الفاخرة'}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-xs text-stone-600">
                <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-stone-400" /> {storeSettings.address || 'فلسطين - القدس / رام الله'}</p>
                <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-stone-400" /> {storeSettings.phone || storeSettings.whatsapp || '+970 599 000 000'}</p>
                <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-stone-400" /> {storeSettings.email || 'support@elites-store.com'}</p>
              </div>
            </div>

            <div className="text-right sm:text-left bg-stone-50 p-4 rounded-xl border border-stone-200 min-w-[200px]">
              <span className="inline-block bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full mb-2">
                فاتورة مبسطة
              </span>
              <h2 className="text-xl font-bold text-stone-900">{order.order_number}</h2>
              <p className="text-xs text-stone-500 mt-1">التاريخ: {formattedDate}</p>
              <p className="text-xs text-stone-500">طريقة الدفع: {order.payment_method}</p>
              <p className="text-xs font-semibold text-emerald-700 mt-1">حالة الدفع: {order.payment_status === 'paid' ? 'تم الدفع بنجاح' : 'معلق / الدفع عند الاستلام'}</p>
            </div>
          </div>

          {/* Customer Info Box */}
          <div className="bg-stone-50 rounded-xl p-5 border border-stone-200">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">بيانات العميل والشحن</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-bold text-stone-900">{order.customer_name}</p>
                <p className="text-stone-600 text-xs mt-1">{order.customer_phone}</p>
                {order.customer_email && <p className="text-stone-600 text-xs">{order.customer_email}</p>}
              </div>
              <div>
                <p className="text-stone-700 text-xs font-semibold">عنوان التوصيل:</p>
                <p className="text-stone-600 text-xs mt-0.5">{order.city} - {order.shipping_address || order.address}</p>
                {order.shipping_company && (
                  <p className="text-stone-600 text-xs mt-1">شركة الشحن: <span className="font-medium text-stone-900">{order.shipping_company}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* Purchased Items Table */}
          <div>
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-stone-400" /> تفاصيل المنتجات والمشتريات
            </h4>
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-sm">
                <thead className="bg-stone-100 text-stone-700 font-bold text-xs">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">المنتج</th>
                    <th className="p-3 text-center">رمز SKU</th>
                    <th className="p-3 text-center">الكمية</th>
                    <th className="p-3 text-left">سعر الوحدة</th>
                    <th className="p-3 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {orderItems.map((item, idx) => {
                    const price = item.selling_price_at_purchase !== undefined ? item.selling_price_at_purchase : (item.quantity ? (item.subtotal / item.quantity) : 0);
                    return (
                      <tr key={item.order_item_id || idx} className="hover:bg-stone-50/50">
                        <td className="p-3 text-stone-400 text-xs">{idx + 1}</td>
                        <td className="p-3 font-semibold text-stone-900">{item.product_name_at_purchase || item.product_name}</td>
                        <td className="p-3 text-center text-xs text-stone-500 font-mono">{item.sku_at_purchase || item.sku || '-'}</td>
                        <td className="p-3 text-center font-bold text-stone-800">{item.quantity || 1}</td>
                        <td className="p-3 text-left text-stone-700 font-medium">{Number(price || 0).toLocaleString()} ₪</td>
                        <td className="p-3 text-left font-bold text-stone-900">{Number(item.subtotal || 0).toLocaleString()} ₪</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pt-2">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200 max-w-sm text-xs text-emerald-900">
              <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-emerald-950">فاتورة إلكترونية موثقة</p>
                <p className="text-emerald-700 mt-0.5">صادرة عن متجر النخبة ومزامنة سحابياً مع سجلات الطلبات المحفوطة.</p>
              </div>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-sm bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="flex justify-between text-stone-600">
                <span>المجموع الفرعي:</span>
                <span className="font-medium text-stone-900">{Number(order.subtotal || 0).toLocaleString()} ₪</span>
              </div>
              {Number(order.discount || 0) > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>الخصم:</span>
                  <span className="font-bold">-{Number(order.discount || 0).toLocaleString()} ₪</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>رسوم التوصيل والشحن:</span>
                <span className="font-medium text-stone-900">{Number(order.shipping_cost || 0).toLocaleString()} ₪</span>
              </div>
              <div className="border-t border-stone-300 pt-2 flex justify-between font-extrabold text-stone-900 text-base">
                <span>المبلغ الإجمالي النهائي:</span>
                <span className="text-emerald-700">{Number(order.total || 0).toLocaleString()} ₪</span>
              </div>
            </div>
          </div>

          {/* Footer Seal */}
          <div className="border-t border-stone-200 pt-6 text-center text-xs text-stone-500 space-y-1">
            <p className="font-medium">شكراً لتسوقك معنا في متجر النخبة!</p>
            <p className="text-[11px] text-stone-400">لأي استفسارات بخصوص هذه الفاتورة أو شروط الإرجاع والاستبدال، يسعدنا تواصلكم معنا عبر الدعم الفني.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
