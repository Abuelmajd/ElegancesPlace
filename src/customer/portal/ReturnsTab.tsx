import React from 'react';
import { useReturnRequests } from '../../contexts/ReturnContext';
import { ArrowRightLeft, CheckCircle2, Clock, XCircle, AlertCircle, HelpCircle, Package, MessageSquare } from 'lucide-react';

export const ReturnsTab: React.FC = () => {
  const { userReturnRequests } = useReturnRequests();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> قيد المراجعة</span>;
      case 'APPROVED':
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> تمت الموافقة المبدئية</span>;
      case 'REJECTED':
        return <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> عذراً، طلب غير مقبول</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> تم التنفيذ والإغلاق</span>;
      default:
        return <span className="bg-stone-100 text-stone-800 text-xs font-bold px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Return Policy Info Box */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-600" /> الإرجاع والاستبدال
          </h3>
          <p className="text-xs text-stone-500 mt-1">متابعة وحالة طلبات الإرجاع والاستبدال الخاصة بمنتجاتك المشتراة</p>
        </div>

        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-2">
          <div className="flex items-center gap-2 font-bold text-stone-900">
            <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>سياسة الشحن والإرجاع في ElegancesPlace:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-stone-600 pl-2 text-[11px]">
            <li>يحق للعميل تقديم طلب إرجاع خلال 3 أيام من تاريخ استلام الشحنة.</li>
            <li>يمكن تقديم طلب استبدال بمنتج آخر خلال 7 أيام من الاستلام بشرط التغليف الأصلي.</li>
            <li>يجب تقديم طلب الإرجاع أو الاستبدال مباشرة عبر زر "إرجاع / استبدال" داخل صفحة "طلباتي".</li>
          </ul>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">طلبات الإرجاع والاستبدال المقدمة ({userReturnRequests.length}):</h4>

        {userReturnRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-stone-200 text-center space-y-3">
            <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
              <ArrowRightLeft className="w-8 h-8" />
            </div>
            <h5 className="font-bold text-stone-800 text-sm">لا توجد طلبات إرجاع أو استبدال حالية</h5>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">عند شراء طلب وتسليمه يمكنك إرسال طلبات الإرجاع أو الاستبدال مباشرة وسوف تظهر متابعتها هنا.</p>
          </div>
        ) : (
          userReturnRequests.map(req => (
            <div key={req.request_id} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
              {/* Top info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${req.type === 'RETURN' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'}`}>
                    {req.type === 'RETURN' ? 'طلب إرجاع' : 'طلب استبدال'}
                  </span>
                  <div>
                    <h5 className="font-bold text-stone-900 text-sm">الطلب #{req.order_number_snapshot}</h5>
                    <p className="text-[11px] text-stone-400">تاريخ الطلب: {new Date(req.created_at).toLocaleDateString('ar-SA')}</p>
                  </div>
                </div>

                <div>
                  {getStatusBadge(req.status)}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 text-xs">
                <p className="font-bold text-stone-600">المنتجات المشمولة:</p>
                <div className="flex flex-wrap gap-2">
                  {req.items.map(i => (
                    <span key={i.order_item_id} className="bg-stone-50 text-stone-800 px-3 py-1 rounded-lg border border-stone-200 font-medium">
                      {i.product_name} (x{i.quantity}) - {i.selling_price} ₪
                    </span>
                  ))}
                </div>
              </div>

              {/* Reason & Notes */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs space-y-1">
                <p><span className="font-bold text-stone-800">سبب الطلب:</span> {req.reason}</p>
                {req.notes && <p><span className="font-bold text-stone-800">تفاصيل إضافية:</span> {req.notes}</p>}
              </div>

              {/* Admin feedback if exists */}
              {req.admin_notes && (
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-xs space-y-1 text-emerald-950">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>رد إدارة المتجر ({req.admin_handled_by || 'المدير'}):</span>
                  </div>
                  <p className="pr-5 text-emerald-800">{req.admin_notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
