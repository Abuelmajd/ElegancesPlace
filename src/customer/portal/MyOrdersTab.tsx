import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrders } from '../../contexts/OrderContext';
import { useReturnRequests } from '../../contexts/ReturnContext';
import { Order, OrderItem } from '../../types';
import { InvoiceViewModal } from './InvoiceViewModal';
import { Package, Truck, CheckCircle2, Clock, XCircle, FileText, ArrowRightLeft, Eye, MapPin, CreditCard, ChevronRight, AlertCircle, ShoppingBag } from 'lucide-react';

export const MyOrdersTab: React.FC = () => {
  const { currentUser } = useAuth();
  const { orders, getOrderItems, getOrderTimeline, updateOrderStatus } = useOrders();
  const { createReturnRequest } = useReturnRequests();

  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  
  // Return / Exchange modal state
  const [returnOrderModal, setReturnOrderModal] = useState<Order | null>(null);
  const [requestType, setRequestType] = useState<'RETURN' | 'EXCHANGE'>('RETURN');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');

  // Customer filter logic (Strict privacy: only orders for current customer)
  const myOrders = orders.filter(o => {
    if (!currentUser) return false;
    return (
      (o.customer_id && o.customer_id === currentUser.user_id) ||
      (o.customer_phone && currentUser.phone && o.customer_phone === currentUser.phone) ||
      (o.customer_email && currentUser.email && o.customer_email === currentUser.email)
    );
  });

  const filteredOrders = myOrders.filter(o => {
    const status = (o.order_status || '').toUpperCase();
    if (filter === 'ACTIVE') {
      return status === 'NEW' || status === 'CONFIRMED' || status === 'PROCESSING' || status === 'READY_TO_SHIP' || status === 'SHIPPED';
    }
    if (filter === 'DELIVERED') {
      return status === 'DELIVERED';
    }
    if (filter === 'CANCELLED') {
      return status === 'CANCELLED' || status === 'RETURNED' || status === 'REFUNDED';
    }
    return true;
  });

  // Submit Return Request
  const handleOpenReturnModal = (order: Order) => {
    const items = getOrderItems(order.order_id);
    setReturnOrderModal(order);
    setSelectedItemIds(items.map(i => i.order_item_id)); // default all items
    setReturnReason('');
    setReturnNotes('');
    setReturnSuccessMsg('');
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrderModal) return;

    if (selectedItemIds.length === 0) {
      alert('يرجى اختيار منتج واحد على الأقل من الطلب.');
      return;
    }

    setReturnSubmitting(true);
    const orderItems = getOrderItems(returnOrderModal.order_id);
    const targetItems = orderItems
      .filter(i => selectedItemIds.includes(i.order_item_id))
      .map(i => ({
        order_item_id: i.order_item_id,
        product_id: i.product_id,
        product_name: i.product_name_at_purchase || i.product_name || 'منتج',
        quantity: i.quantity,
        selling_price: i.selling_price_at_purchase || (i.subtotal / i.quantity)
      }));

    const res = await createReturnRequest({
      order_id: returnOrderModal.order_id,
      order_number_snapshot: returnOrderModal.order_number,
      type: requestType,
      items: targetItems,
      reason: returnReason,
      notes: returnNotes
    });

    setReturnSubmitting(false);

    if (res.success) {
      setReturnSuccessMsg(res.message || 'تم تقديم الطلب بنجاح!');
      setTimeout(() => {
        setReturnOrderModal(null);
        setReturnSuccessMsg('');
      }, 2500);
    } else {
      alert(res.message || 'تعذر تقديم الطلب.');
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'DELIVERED') {
      return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> تم التسليم بنجاح</span>;
    }
    if (s === 'SHIPPED') {
      return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> تم الشحن وفي الطريق</span>;
    }
    if (s === 'PROCESSING' || s === 'CONFIRMED') {
      return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> قيد التجهيز</span>;
    }
    if (s === 'CANCELLED') {
      return <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> ملغى</span>;
    }
    return <span className="bg-stone-100 text-stone-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> جديد</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header & Status Filter Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" /> سجل طلباتي الإلكترونية
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">استعراض وحالة كافة طلباتك ومتابعة الشحنات وطباعة الفواتير</p>
        </div>

        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${filter === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}
          >
            الكل ({myOrders.length})
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${filter === 'ACTIVE' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}
          >
            النشطة
          </button>
          <button
            onClick={() => setFilter('DELIVERED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${filter === 'DELIVERED' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}
          >
            المكتملة
          </button>
          <button
            onClick={() => setFilter('CANCELLED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${filter === 'CANCELLED' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}
          >
            الملغاة
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-stone-200 text-center space-y-4">
          <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-bold text-stone-800 text-base">لا توجد طلبات في هذا القسم</h4>
            <p className="text-xs text-stone-500 mt-1">يمكنك تصفح المتجر والبدء في التسوق لشراء منتجاتك المفضلة.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const items = getOrderItems(order.order_id);
            return (
              <div key={order.order_id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-stone-300 transition-all space-y-4">
                {/* Top Row: Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      #{order.order_number.replace('ORD-', '')}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-base">{order.order_number}</h4>
                      <p className="text-xs text-stone-500">تاريخ الطلب: {order.order_date || order.created_at.split('T')[0]}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.order_status)}
                    <span className="font-extrabold text-emerald-700 text-base">{Number(order.total || 0).toLocaleString()} ₪</span>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">محتويات الطلب ({items.length} منتجات):</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {items.map(itm => (
                      <div key={itm.order_item_id} className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 flex items-center justify-between text-xs">
                        <span className="font-medium text-stone-800 truncate max-w-[180px]">{itm.product_name_at_purchase || itm.product_name}</span>
                        <span className="text-stone-500 font-bold bg-white px-2 py-0.5 rounded-md border border-stone-200">x{itm.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100">
                  <div className="text-xs text-stone-500 flex items-center gap-3">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-stone-400" /> {order.city}</span>
                    <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 text-stone-400" /> {order.payment_method}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Details */}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> التفاصيل
                    </button>

                    {/* Print Invoice */}
                    <button
                      onClick={() => setInvoiceOrder(order)}
                      className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" /> الفاتورة
                    </button>

                    {/* Cancel Order */}
                    {(order.order_status?.toUpperCase() === 'NEW' || order.order_status?.toUpperCase() === 'CONFIRMED' || order.order_status?.toUpperCase() === 'PROCESSING') && (
                      <button
                        onClick={async () => {
                          if (confirm('هل أنت متأكد أنك تريد إلغاء هذا الطلب؟')) {
                            await updateOrderStatus(order.order_id, 'CANCELLED', 'تم الإلغاء بواسطة العميل');
                          }
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" /> إلغاء الطلب
                      </button>
                    )}

                    {/* Return/Exchange if Delivered */}
                    {order.order_status?.toUpperCase() === 'DELIVERED' && (
                      <button
                        onClick={() => handleOpenReturnModal(order)}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" /> إرجاع / استبدال
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-200 my-8">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">تفاصيل الطلب {selectedOrder.order_number}</h3>
                <p className="text-xs text-stone-300 mt-0.5">تاريخ الطلب: {selectedOrder.order_date || selectedOrder.created_at.split('T')[0]}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 text-stone-400 hover:text-white rounded-lg cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Header */}
              <div className="flex items-center justify-between bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <span className="text-xs text-stone-500 block">حالة الطلب الحالية</span>
                  <div className="mt-1">{getStatusBadge(selectedOrder.order_status)}</div>
                </div>

                <div className="text-left">
                  <span className="text-xs text-stone-500 block">المبلغ الإجمالي</span>
                  <span className="text-xl font-extrabold text-emerald-700">{Number(selectedOrder.total || 0).toLocaleString()} ₪</span>
                </div>
              </div>

              {/* Shipping info */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs space-y-1">
                <p className="font-bold text-stone-800 text-sm mb-2">معلومات التوصيل والشحن:</p>
                <p><span className="text-stone-500">اسم المستلم:</span> {selectedOrder.customer_name}</p>
                <p><span className="text-stone-500">الهاتف:</span> {selectedOrder.customer_phone}</p>
                <p><span className="text-stone-500">المدينة والعنوان:</span> {selectedOrder.city} - {selectedOrder.shipping_address}</p>
                {selectedOrder.shipping_company && (
                  <p className="pt-1 text-emerald-800 font-medium">شركة الشحن: {selectedOrder.shipping_company} {selectedOrder.tracking_number && `(تتبع: ${selectedOrder.tracking_number})`}</p>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-bold text-stone-800 text-xs uppercase tracking-wider">المنتجات المطلوبة:</h4>
                <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                  {getOrderItems(selectedOrder.order_id).map(itm => {
                    const price = itm.selling_price_at_purchase !== undefined ? itm.selling_price_at_purchase : (itm.quantity ? (itm.subtotal / itm.quantity) : 0);
                    return (
                      <div key={itm.order_item_id} className="p-3.5 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-bold text-stone-900">{itm.product_name_at_purchase || itm.product_name}</p>
                          <p className="text-xs text-stone-500">الكمية: {itm.quantity} × {Number(price || 0).toLocaleString()} ₪</p>
                        </div>
                        <span className="font-extrabold text-stone-900">{Number(itm.subtotal || 0).toLocaleString()} ₪</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Timeline events preview */}
              <div>
                <h4 className="font-bold text-stone-800 text-xs uppercase tracking-wider mb-2">تتبع المخطط الزمني للطلب:</h4>
                <div className="space-y-2 bg-stone-50 p-4 rounded-xl border border-stone-200">
                  {getOrderTimeline(selectedOrder.order_id).map(evt => (
                    <div key={evt.event_id} className="text-xs flex items-start gap-2 border-r-2 border-emerald-500 pr-3 py-1">
                      <div>
                        <p className="font-bold text-stone-800">{evt.description}</p>
                        <p className="text-[10px] text-stone-400">{evt.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  onClick={() => {
                    const ord = selectedOrder;
                    setSelectedOrder(null);
                    setInvoiceOrder(ord);
                  }}
                  className="bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-stone-800 cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-emerald-400" /> عرض الفاتورة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceOrder && (
        <InvoiceViewModal
          order={invoiceOrder}
          orderItems={getOrderItems(invoiceOrder.order_id)}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

      {/* Return / Exchange Request Modal */}
      {returnOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-stone-200 my-8">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">تقديم طلب إرجاع أو استبدال - {returnOrderModal.order_number}</h3>
              </div>
              <button onClick={() => setReturnOrderModal(null)} className="text-stone-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="p-6 space-y-5">
              {returnSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {returnSuccessMsg}
                </div>
              )}

              {/* Request Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">نوع الطلب:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRequestType('RETURN')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${requestType === 'RETURN' ? 'bg-amber-500 text-white border-amber-600 shadow-xs' : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'}`}
                  >
                    طلب إرجاع واسترداد
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestType('EXCHANGE')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${requestType === 'EXCHANGE' ? 'bg-amber-500 text-white border-amber-600 shadow-xs' : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'}`}
                  >
                    طلب استبدال بمنتج آخر
                  </button>
                </div>
              </div>

              {/* Items checklist */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">حدد المنتجات المراد {requestType === 'RETURN' ? 'إرجاعها' : 'استبدالها'}:</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-stone-200 rounded-xl p-2 bg-stone-50">
                  {getOrderItems(returnOrderModal.order_id).map(itm => (
                    <label key={itm.order_item_id} className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-50 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedItemIds.includes(itm.order_item_id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedItemIds([...selectedItemIds, itm.order_item_id]);
                          else setSelectedItemIds(selectedItemIds.filter(id => id !== itm.order_item_id));
                        }}
                        className="rounded-md border-stone-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-bold text-stone-900 flex-1">{itm.product_name_at_purchase || itm.product_name}</span>
                      <span className="text-stone-500 font-mono">x{itm.quantity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">سبب الطلب:</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer bg-white"
                >
                  <option value="">-- اختر السبب --</option>
                  <option value="المنتج غير مطابق للمواصفات المعروضة">المنتج غير مطابق للمواصفات المعروضة</option>
                  <option value="تلف أو وجود عيب تصنيعي بالمنتج">تلف أو وجود عيب تصنيعي بالمنتج</option>
                  <option value="مقاس أو قياس غير مناسب">مقاس أو قياس غير مناسب</option>
                  <option value="استلام منتج خاطئ عن طريق السهو">استلام منتج خاطئ عن طريق السهو</option>
                  <option value="تغيير الرأي بعد الاستلام">تغيير الرأي بعد الاستلام</option>
                  <option value="سبب آخر">سبب آخر</option>
                </select>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">تفاصيل إضافية أو ملاحظات للخدمة:</label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="اكتب أية ملاحظات تفصيلية أو تفضيلات الاستبدال..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnOrderModal(null)}
                  className="bg-stone-100 text-stone-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-stone-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={returnSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {returnSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب للإدارة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
