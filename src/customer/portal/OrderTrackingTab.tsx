import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrders } from '../../contexts/OrderContext';
import { Search, Truck, CheckCircle2, Clock, MapPin, PackageCheck, AlertCircle, Calendar, ExternalLink } from 'lucide-react';

export const OrderTrackingTab: React.FC = () => {
  const { currentUser } = useAuth();
  const { orders, getOrderTimeline } = useOrders();

  const myOrders = orders.filter(o => {
    if (!currentUser) return false;
    return (
      (o.customer_id && o.customer_id === currentUser.user_id) ||
      (o.customer_phone && currentUser.phone && o.customer_phone === currentUser.phone)
    );
  });

  const [selectedOrderId, setSelectedOrderId] = useState<string>(myOrders[0]?.order_id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const activeOrder = orders.find(o => o.order_id === selectedOrderId || o.order_number === searchQuery.trim());

  const getStepProgress = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'DELIVERED') return 4;
    if (s === 'SHIPPED') return 3;
    if (s === 'PROCESSING' || s === 'READY_TO_SHIP') return 2;
    if (s === 'CONFIRMED') return 1;
    return 0; // NEW
  };

  const currentStep = activeOrder ? getStepProgress(activeOrder.order_status) : 0;
  const timelineEvents = activeOrder ? getOrderTimeline(activeOrder.order_id) : [];

  return (
    <div className="space-y-6">
      {/* Search / Select Order Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" /> تتبع شحناتك والطلبات الحالية
          </h3>
          <p className="text-xs text-stone-500 mt-1">تابع خط سير شحنتك لحظة بلحظة والتاريخ المتوقع للوصول</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Dropdown selector of customer's orders */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">اختر من طلباتك المسجلة:</label>
            <select
              value={selectedOrderId}
              onChange={(e) => {
                setSelectedOrderId(e.target.value);
                setSearchQuery('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white cursor-pointer"
            >
              {myOrders.length === 0 ? (
                <option value="">لا توجد طلبات مسجلة</option>
              ) : (
                myOrders.map(o => (
                  <option key={o.order_id} value={o.order_id}>
                    {o.order_number} - ({o.order_date || o.created_at.split('T')[0]}) - [{o.order_status}]
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Manual search input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">أو ادخل رقم الطلب مباشرة:</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="مثال: ORD-1001"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Results Card */}
      {!activeOrder ? (
        <div className="bg-white rounded-2xl p-12 border border-stone-200 text-center space-y-3">
          <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
            <Truck className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-stone-800 text-base">اختر حجزاً أو طلباً لتتبعه</h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto">قم بانتخاب أحد طلباتك من القائمة أعلاه لعرض المخطط الزمني وموعد وصول الشحنة.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-8">
          {/* Order Snapshot Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-100 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  شحنة مؤكدة
                </span>
                <h2 className="text-xl font-extrabold text-stone-900">{activeOrder.order_number}</h2>
              </div>
              <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> تاريخ الطلب: {activeOrder.order_date || activeOrder.created_at.split('T')[0]}
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs space-y-1">
              <p className="font-bold text-stone-800">بيانات التوصيل والشحن:</p>
              <p className="text-stone-600 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-stone-400" /> {activeOrder.city} - {activeOrder.shipping_address}</p>
              {activeOrder.shipping_company && (
                <p className="text-emerald-700 font-bold mt-1">الناقل: {activeOrder.shipping_company} {activeOrder.tracking_number && `| تتبع: #${activeOrder.tracking_number}`}</p>
              )}
            </div>
          </div>

          {/* Visual Step Progress Bar */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">مراحل الشحن والتوصيل الحالية:</h4>
            
            <div className="grid grid-cols-5 gap-2 relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${currentStep >= 0 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-stone-100 text-stone-400'}`}>
                  1
                </div>
                <span className={`text-[11px] font-bold ${currentStep >= 0 ? 'text-emerald-800' : 'text-stone-400'}`}>
                  إنشاء الطلب
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${currentStep >= 1 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-stone-100 text-stone-400'}`}>
                  2
                </div>
                <span className={`text-[11px] font-bold ${currentStep >= 1 ? 'text-emerald-800' : 'text-stone-400'}`}>
                  تأكيد الطلب
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${currentStep >= 2 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-stone-100 text-stone-400'}`}>
                  3
                </div>
                <span className={`text-[11px] font-bold ${currentStep >= 2 ? 'text-emerald-800' : 'text-stone-400'}`}>
                  تجهيز الشحنة
                </span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${currentStep >= 3 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-stone-100 text-stone-400'}`}>
                  4
                </div>
                <span className={`text-[11px] font-bold ${currentStep >= 3 ? 'text-emerald-800' : 'text-stone-400'}`}>
                  في الطريق
                </span>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs transition-all ${currentStep >= 4 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-stone-100 text-stone-400'}`}>
                  5
                </div>
                <span className={`text-[11px] font-bold ${currentStep >= 4 ? 'text-emerald-800' : 'text-stone-400'}`}>
                  تم التسليم
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Timeline Events */}
          <div className="space-y-3 pt-4 border-t border-stone-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">سجل الأحداث الزمني للتحديثات:</h4>
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
              {timelineEvents.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-2">لا توجد تحديثات تفصيلية مسجلة بعد لهذا الطلب.</p>
              ) : (
                timelineEvents.map((evt, idx) => (
                  <div key={evt.event_id || idx} className="flex items-start gap-3 text-xs pb-3 border-b border-stone-200/60 last:border-0 last:pb-0">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">{evt.description}</p>
                      <span className="text-[10px] text-stone-400 mt-0.5 block">{evt.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
