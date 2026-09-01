import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Send, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  MessageCircle, 
  Phone, 
  Package, 
  DollarSign, 
  User, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  RefreshCw, 
  Play, 
  ArrowRight, 
  ChevronDown, 
  Check, 
  Layers, 
  Eye, 
  X,
  FileText,
  History,
  TrendingUp,
  Boxes,
  Image as ImageIcon,
  Share2,
  MessageSquare
} from 'lucide-react';
import { useOrders } from '../contexts/OrderContext';
import { useProducts } from '../contexts/ProductContext';
import { useAuth } from '../contexts/AuthContext';
import { Order, OrderStatus, FulfillmentStatus, ProductFulfillmentMethod } from '../types';

export const OrdersManagement: React.FC = () => {
  const { 
    orders, 
    orderItems, 
    supplierFulfillments, 
    supplierSettlements,
    timelineEvents, 
    auditLogs, 
    inventoryMovements, 
    updateOrderStatus, 
    updateFulfillmentStatus, 
    sendOrderToSupplier, 
    updateSupplierFulfillmentDetails,
    recordSupplierSettlement,
    updateOrderTracking, 
    syncOrdersWithSheets,
    runTestScenario1,
    runTestScenario2,
    getOrderItems,
    getOrderFulfillments,
    getOrderTimeline,
    getOrderAuditLogs
  } = useOrders();

  const { products } = useProducts();
  const { currentUser } = useAuth();

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [syncFilter, setSyncFilter] = useState<string>('ALL');

  // Modals & Selected States
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState<'overview' | 'items' | 'supplier' | 'shipping' | 'timeline' | 'audit'>('overview');
  
  // Supplier Send Modal
  const [supplierModalOrder, setSupplierModalOrder] = useState<Order | null>(null);
  const [supplierNotes, setSupplierNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedImageUrl, setCopiedImageUrl] = useState<string | null>(null);

  // Tracking Modal
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
  const [shippingCompany, setShippingCompany] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');

  // Status Change Quick Popover / Confirmation
  const [statusChangeOrder, setStatusChangeOrder] = useState<Order | null>(null);
  const [targetOrderStatus, setTargetOrderStatus] = useState<OrderStatus>('CONFIRMED');
  const [statusChangeNotes, setStatusChangeNotes] = useState('');

  // Test Runner State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  // Syncing state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Computed KPIs
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const newOrders = orders.filter(o => o.order_status === 'NEW' || o.order_status === 'new').length;
    const awaitingSupplier = orders.filter(o => o.fulfillment_status === 'AWAITING_SUPPLIER' || o.fulfillment_status === 'pending').length;
    const shippedOrders = orders.filter(o => o.order_status === 'SHIPPED' || o.order_status === 'shipped').length;
    const deliveredOrders = orders.filter(o => o.order_status === 'DELIVERED' || o.order_status === 'delivered').length;
    
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalProfit = orderItems.reduce((sum, item) => sum + (item.profit || 0), 0);

    return { totalOrders, newOrders, awaitingSupplier, shippedOrders, deliveredOrders, totalRevenue, totalProfit };
  }, [orders, orderItems]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchSearch = 
        (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer_phone || order.phone || '').includes(searchTerm) ||
        (order.city || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || order.order_status.toUpperCase() === statusFilter.toUpperCase();
      const matchFulfillment = fulfillmentFilter === 'ALL' || order.fulfillment_status.toUpperCase() === fulfillmentFilter.toUpperCase();
      
      const items = getOrderItems(order.order_id);
      const hasOwnStock = items.some(i => i.fulfillment_method_at_purchase === 'OWN_STOCK');
      const hasDropship = items.some(i => i.fulfillment_method_at_purchase === 'SUPPLIER_DROPSHIPPING');

      let matchMethod = true;
      if (methodFilter === 'OWN_STOCK') matchMethod = hasOwnStock && !hasDropship;
      else if (methodFilter === 'SUPPLIER_DROPSHIPPING') matchMethod = hasDropship;

      const matchSync = syncFilter === 'ALL' || order.sync_status === syncFilter;

      return matchSearch && matchStatus && matchFulfillment && matchMethod && matchSync;
    });
  }, [orders, searchTerm, statusFilter, fulfillmentFilter, methodFilter, syncFilter, getOrderItems]);

  // Supplier Message Generator
  const generateSupplierMessage = (order: Order) => {
    const items = getOrderItems(order.order_id);
    const productsList = items
      .map(item => {
        const prod = products.find(p => p.id === item.product_id || p.sku === item.sku_at_purchase);
        const imageUrl = prod?.image || '';
        const imageText = imageUrl ? `\n   🖼️ رابط صورة المنتج: ${imageUrl}` : '';
        return `• ${item.product_name_at_purchase} (SKU: ${item.sku_at_purchase}) - الكمية: ${item.quantity}${imageText}`;
      })
      .join('\n\n');

    return `طلب توريد رقم: #${order.order_number}

مرحباً،

لدينا طلب جديد مطلوب تنفيذه:

👤 بيانات العميل:
- الاسم: ${order.customer_name}
- الهاتف: ${order.customer_phone || order.phone || '-'}
- العنوان: ${order.shipping_address || order.address || '-'}
- المدينة: ${order.city || '-'}

📦 المنتجات وصور المعاينة:
${productsList}

📝 ملاحظات:
${order.notes || 'لا توجد ملاحظات خاصة'}

يرجى تأكيد استلام الطلب وتجهيزه للشحن.

شكراً.`;
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    const ok = await syncOrdersWithSheets();
    setIsSyncing(false);
    setSyncToast(ok ? 'تمت مزامنة جميع الطلبات وعناصرها مع Google Sheets بنجاح!' : 'حدث خطأ أثناء المزامنة، تم الحفظ في الذاكرة المحلية كاحتياط.');
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleRunTests = async (scenario: 1 | 2 | 'both') => {
    setIsRunningTest(true);
    setTestLogs([]);
    setTestSuccess(null);

    const logs: string[] = [];

    if (scenario === 1 || scenario === 'both') {
      const res1 = await runTestScenario1();
      logs.push(...res1.log);
      if (!res1.success) {
        setTestSuccess(false);
        setTestLogs(logs);
        setIsRunningTest(false);
        return;
      }
    }

    if (scenario === 2 || scenario === 'both') {
      logs.push('----------------------------------------------------');
      const res2 = await runTestScenario2();
      logs.push(...res2.log);
      if (!res2.success) {
        setTestSuccess(false);
        setTestLogs(logs);
        setIsRunningTest(false);
        return;
      }
    }

    logs.push('🎉 تم اجتياز جميع سيناريوهات الاختبار بنجاح تام وفق متطلبات النظام!');
    setTestSuccess(true);
    setTestLogs(logs);
    setIsRunningTest(false);
  };

  const openSupplierModal = (order: Order) => {
    setSupplierModalOrder(order);
    setSupplierNotes(order.notes || '');
    setAdminNotes('');
    setCopiedMessage(false);
  };

  const handleConfirmSendToSupplier = async () => {
    if (!supplierModalOrder) return;
    await sendOrderToSupplier(supplierModalOrder.order_id, supplierNotes, adminNotes);
    setSupplierModalOrder(null);
  };

  const openTrackingModal = (order: Order) => {
    setTrackingModalOrder(order);
    setShippingCompany(order.shipping_company || 'شركة أرامكس Express');
    setTrackingNumber(order.tracking_number || '');
    setTrackingUrl(order.tracking_url || '');
  };

  const handleSaveTracking = async () => {
    if (!trackingModalOrder || !trackingNumber.trim()) return;
    await updateOrderTracking(
      trackingModalOrder.order_id,
      shippingCompany,
      trackingNumber,
      trackingUrl || `https://track.courier.com/${trackingNumber}`
    );
    setTrackingModalOrder(null);
  };

  const handleQuickStatusChange = async () => {
    if (!statusChangeOrder) return;
    await updateOrderStatus(statusChangeOrder.order_id, targetOrderStatus, statusChangeNotes);
    setStatusChangeOrder(null);
    setStatusChangeNotes('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 text-sm font-semibold animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Top Header & Action Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">إدارة الطلبات والتنفيذ والتوريد</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                تتبع دورة حياة الطلبات (مخزون ذاتي / دروب شيبينغ)، تجميد أسعار الشراء، وتكامل الموردين والشحن.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Test Runner Button */}
          <button
            onClick={() => {
              setIsTestModalOpen(true);
              setTestLogs([]);
              setTestSuccess(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Play className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
            <span>تشغيل سيناريوهات الاختبار (1 & 2)</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'جارٍ المزامنة السحابية...' : 'مزامنة مع Google Sheets'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">إجمالي الطلبات</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-slate-900">{stats.totalOrders}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">مسجلة بالنظام</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">طلبات جديدة</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600">{stats.newOrders}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">تحتاج مراجعة</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">بانتظار المورد</span>
            <Send className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-black text-purple-600">{stats.awaitingSupplier}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">دروب شيبينغ</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">تم الشحن</span>
            <Truck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-black text-sky-600">{stats.shippedOrders}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">مع شركات التوصيل</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">إجمالي المبيعات</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600">{Number(stats.totalRevenue || 0).toLocaleString()} ₪</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">شامل التوصيل</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold">صافي الأرباح</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-indigo-600">{Number(stats.totalProfit || 0).toLocaleString()} ₪</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">مجمدة حسب التكلفة</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث برقم الطلب (ORD-1001)، اسم العميل، الهاتف، المدينة..."
              className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Order Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">جميع حالات الطلب</option>
              <option value="NEW">جديد (NEW)</option>
              <option value="CONFIRMED">مؤكد (CONFIRMED)</option>
              <option value="PROCESSING">قيد التجهيز (PROCESSING)</option>
              <option value="READY_TO_SHIP">جاهز للشحن (READY_TO_SHIP)</option>
              <option value="SHIPPED">تم الشحن (SHIPPED)</option>
              <option value="DELIVERED">تم التسليم (DELIVERED)</option>
              <option value="CANCELLED">ملغي (CANCELLED)</option>
              <option value="REFUNDED">مسترجع (REFUNDED)</option>
            </select>
          </div>

          {/* Fulfillment Status Filter */}
          <div>
            <select
              value={fulfillmentFilter}
              onChange={(e) => setFulfillmentFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">جميع حالات التنفيذ</option>
              <option value="PENDING">معلق (PENDING)</option>
              <option value="AWAITING_SUPPLIER">بانتظار المورد (AWAITING_SUPPLIER)</option>
              <option value="SUPPLIER_CONFIRMED">مؤكد من المورد (SUPPLIER_CONFIRMED)</option>
              <option value="PACKED">تم التجهيز والتغليف (PACKED)</option>
              <option value="SHIPPED">تم الشحن (SHIPPED)</option>
              <option value="DELIVERED">تم التسليم (DELIVERED)</option>
            </select>
          </div>

          {/* Fulfillment Method Filter */}
          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">جميع طرق التوريد</option>
              <option value="OWN_STOCK">مخزون المتجر الذاتي (OWN_STOCK)</option>
              <option value="SUPPLIER_DROPSHIPPING">دروب شيبينغ الموردين (DROPSHIPPING)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span>النتائج المعروضة: <strong className="text-slate-800">{filteredOrders.length}</strong> من أصل {orders.length} طلب</span>
          </div>
          {(searchTerm || statusFilter !== 'ALL' || fulfillmentFilter !== 'ALL' || methodFilter !== 'ALL' || syncFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setFulfillmentFilter('ALL');
                setMethodFilter('ALL');
                setSyncFilter('ALL');
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              إعادة تعيين الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">رقم الطلب</th>
                <th className="px-4 py-3.5">العميل والتوصيل</th>
                <th className="px-4 py-3.5">التاريخ والوقت</th>
                <th className="px-4 py-3.5">المنتجات</th>
                <th className="px-4 py-3.5">الإجمالي والدفع</th>
                <th className="px-4 py-3.5">طريقة وحالة التنفيذ</th>
                <th className="px-4 py-3.5">حالة الطلب</th>
                <th className="px-4 py-3.5">المزامنة</th>
                <th className="px-4 py-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold text-slate-600">لا توجد طلبات تطابق خيارات البحث الحالية</p>
                    <p className="text-xs text-slate-400 mt-1">جرّب تغيير كلمات البحث أو إعادة تعيين الفلاتر.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const items = getOrderItems(order.order_id);
                  const isDropship = items.some(i => i.fulfillment_method_at_purchase === 'SUPPLIER_DROPSHIPPING');
                  const isOwnStock = items.some(i => i.fulfillment_method_at_purchase === 'OWN_STOCK');

                  return (
                    <tr key={order.order_id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order Number */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                            {order.order_number}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(order.order_number);
                            }}
                            title="نسخ رقم الطلب"
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{order.order_id}</span>
                      </td>

                      {/* Customer Info */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{order.customer_name}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{order.city}</span>
                          <span className="text-slate-300">•</span>
                          <span dir="ltr" className="font-mono">{order.customer_phone || order.phone}</span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="font-semibold text-slate-800">{order.order_date}</div>
                        <div className="text-[10px] text-slate-400">{order.order_time}</div>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {items.length} {items.length === 1 ? 'منتج' : 'منتجات'}
                        </div>
                        <div className="text-[10px] text-slate-500 max-w-[140px] truncate" title={items.map(i => `${i.product_name_at_purchase} (${i.quantity})`).join(', ')}>
                          {items.map(i => i.product_name_at_purchase).join(', ')}
                        </div>
                      </td>

                      {/* Total & Payment */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{order.total} ₪</div>
                        <div className="mt-0.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            order.payment_status === 'refunded' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {order.payment_status === 'paid' ? 'مدفوع' : order.payment_status === 'refunded' ? 'مسترد' : 'عند الاستلام'}
                          </span>
                        </div>
                      </td>

                      {/* Fulfillment Method & Status */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          {/* Method Badge */}
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isDropship 
                              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {isDropship ? 'دروب شيبينغ' : 'مخزون ذاتي'}
                          </span>

                          {/* Fulfillment Status */}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            order.fulfillment_status === 'AWAITING_SUPPLIER' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            order.fulfillment_status === 'SUPPLIER_CONFIRMED' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                            order.fulfillment_status === 'SHIPPED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            order.fulfillment_status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {order.fulfillment_status === 'AWAITING_SUPPLIER' ? 'بانتظار المورد' :
                             order.fulfillment_status === 'SUPPLIER_CONFIRMED' ? 'مؤكد من المورد' :
                             order.fulfillment_status === 'PACKED' ? 'تم التجهيز' :
                             order.fulfillment_status === 'SHIPPED' ? 'تم الشحن' :
                             order.fulfillment_status === 'DELIVERED' ? 'تم التسليم' : 'معلق'}
                          </span>
                        </div>
                      </td>

                      {/* Order Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          order.order_status === 'NEW' || order.order_status === 'new' ? 'bg-amber-100 text-amber-800' :
                          order.order_status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                          order.order_status === 'PROCESSING' || order.order_status === 'processing' ? 'bg-indigo-100 text-indigo-800' :
                          order.order_status === 'SHIPPED' || order.order_status === 'shipped' ? 'bg-sky-100 text-sky-800' :
                          order.order_status === 'DELIVERED' || order.order_status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                          order.order_status === 'CANCELLED' || order.order_status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {order.order_status}
                        </span>
                      </td>

                      {/* Sync Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                          order.sync_status === 'SYNCED' ? 'text-emerald-600' :
                          order.sync_status === 'FAILED' ? 'text-rose-600' :
                          'text-amber-600'
                        }`}>
                          {order.sync_status === 'SYNCED' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> سحابي
                            </>
                          ) : order.sync_status === 'FAILED' ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5" /> فشل
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 animate-pulse" /> محلي
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Details */}
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setActiveDetailsTab('overview');
                            }}
                            title="عرض تفاصيل الطلب وتجميد الأسعار"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Send to Supplier Screen */}
                          {isDropship && (
                            <button
                              onClick={() => openSupplierModal(order)}
                              title="شاشة تحويل وتجهيز طلب المورد والرسائل"
                              className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Shipping Tracking */}
                          <button
                            onClick={() => openTrackingModal(order)}
                            title="إضافة وتحديث بوليصة الشحن والتتبع"
                            className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Status Change */}
                          <button
                            onClick={() => {
                              setStatusChangeOrder(order);
                              setTargetOrderStatus(order.order_status);
                            }}
                            title="تغيير حالة الطلب وتوثيق التايم لاين"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ORDER DETAILS MODAL (FULL SPECIFICATION WITH SNAPSHOTS & AUDIT LOGS)    */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">تفاصيل الطلب {selectedOrder.order_number}</h3>
                    <span className="bg-slate-800 text-slate-300 font-mono text-xs px-2 py-0.5 rounded">
                      {selectedOrder.order_id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    سجل مجمد وموثوق وفق معمارية الـ Snapshot والتسجيل المالي
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto">
              <button
                onClick={() => setActiveDetailsTab('overview')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeDetailsTab === 'overview'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> نظرة عامة والعميل
              </button>
              <button
                onClick={() => setActiveDetailsTab('items')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeDetailsTab === 'items'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" /> المنتجات والأسعار المجمدة ({getOrderItems(selectedOrder.order_id).length})
              </button>
              <button
                onClick={() => setActiveDetailsTab('supplier')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeDetailsTab === 'supplier'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Send className="w-3.5 h-3.5" /> المورد والتنفيذ
              </button>
              <button
                onClick={() => setActiveDetailsTab('shipping')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeDetailsTab === 'shipping'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Truck className="w-3.5 h-3.5" /> بوليصة الشحن والتتبع
              </button>
              <button
                onClick={() => setActiveDetailsTab('timeline')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeDetailsTab === 'timeline'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" /> التايم لاين (Order Timeline)
              </button>
              <button
                onClick={() => setActiveDetailsTab('audit')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeDetailsTab === 'audit'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> سجل التدقيق (Audit Log)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* TAB 1: OVERVIEW */}
              {activeDetailsTab === 'overview' && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 font-bold">الحالة الحالية للطلب:</span>
                      <span className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold">
                        {selectedOrder.order_status}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg font-bold">
                        تنفيذ: {selectedOrder.fulfillment_status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openSupplierModal(selectedOrder)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> تحويل للمورد
                      </button>
                      <button
                        onClick={() => openTrackingModal(selectedOrder)}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Truck className="w-3 h-3" /> بيانات الشحن
                      </button>
                    </div>
                  </div>

                  {/* Customer Card & Order Meta */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-blue-600" /> بيانات العميل
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{selectedOrder.customer_id}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">اسم العميل:</span>
                          <span className="font-bold text-slate-900">{selectedOrder.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">رقم الهاتف:</span>
                          <span dir="ltr" className="font-mono font-semibold text-slate-800">{selectedOrder.customer_phone || selectedOrder.phone || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">البريد الإلكتروني:</span>
                          <span dir="ltr" className="text-slate-700">{selectedOrder.customer_email || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">المدينة:</span>
                          <span className="font-semibold text-slate-800">{selectedOrder.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">عنوان التوصيل:</span>
                          <span className="text-slate-800 text-left max-w-[220px]">{selectedOrder.shipping_address || selectedOrder.address || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Financials */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-600" /> البيانات المالية والدفع
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">
                          {selectedOrder.payment_status === 'paid' ? 'تم الدفع' : 'معلق'}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">المجموع الفرعي:</span>
                          <span className="font-semibold text-slate-800">{selectedOrder.subtotal} ₪</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">رسوم الشحن:</span>
                          <span className="font-semibold text-slate-800">+{selectedOrder.shipping_cost} ₪</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">الخصم:</span>
                          <span className="font-semibold text-slate-800">-{selectedOrder.discount} ₪</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-100 text-sm">
                          <span className="font-bold text-slate-900">الإجمالي النهائي:</span>
                          <span className="font-black text-emerald-600">{selectedOrder.total} ₪</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-slate-500">طريقة الدفع:</span>
                          <span className="font-semibold text-slate-800">{selectedOrder.payment_method}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes Card */}
                  {selectedOrder.notes && (
                    <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80">
                      <span className="font-bold text-amber-900 block mb-1">ملاحظات العميل على الطلب:</span>
                      <p className="text-amber-800">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ITEMS & SNAPSHOTS */}
              {activeDetailsTab === 'items' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      <strong>قاعدة تجميد البيانات (Snapshot):</strong> أسماء المنتجات، أسعار التكلفة، وأسعار البيع مجمدة تاريخياً وقت الشراء ولن تتغير أبداً حتى لو تم تعديل سعر المنتج مستقبلاً.
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">المنتج (Snapshot)</th>
                          <th className="px-4 py-3">المورد (Snapshot)</th>
                          <th className="px-4 py-3">طريقة التوريد</th>
                          <th className="px-4 py-3">سعر الشراء (التكلفة)</th>
                          <th className="px-4 py-3">سعر البيع</th>
                          <th className="px-4 py-3">الكمية</th>
                          <th className="px-4 py-3">المجموع</th>
                          <th className="px-4 py-3">صافي الربح</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {getOrderItems(selectedOrder.order_id).map((item) => (
                          <tr key={item.order_item_id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{item.product_name_at_purchase}</div>
                              <div className="font-mono text-[10px] text-slate-400">{item.sku_at_purchase}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-800">{item.supplier_name_at_purchase || '-'}</div>
                              <div className="font-mono text-[10px] text-slate-400">{item.supplier_id_at_purchase}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.fulfillment_method_at_purchase === 'SUPPLIER_DROPSHIPPING'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {item.fulfillment_method_at_purchase === 'SUPPLIER_DROPSHIPPING' ? 'دروب شيبينغ' : 'مخزون ذاتي'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-600">{item.cost_price_at_purchase} ₪</td>
                            <td className="px-4 py-3 font-semibold text-slate-900">{item.selling_price_at_purchase} ₪</td>
                            <td className="px-4 py-3 font-bold text-slate-900">{item.quantity}</td>
                            <td className="px-4 py-3 font-bold text-slate-900">{item.subtotal} ₪</td>
                            <td className="px-4 py-3 font-bold text-emerald-600">+{item.profit} ₪</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: SUPPLIER & FULFILLMENT */}
              {activeDetailsTab === 'supplier' && (
                <div className="space-y-4">
                  {getOrderFulfillments(selectedOrder.order_id).length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                      <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="font-bold text-slate-700">هذا الطلب ينفذ من مخزون المتجر الذاتي (OWN_STOCK)</p>
                      <p className="text-xs text-slate-400 mt-1">تم خصم الكميات من المستودع مباشرة وتسجيل حركة المخزون بنجاح.</p>
                    </div>
                  ) : (
                    getOrderFulfillments(selectedOrder.order_id).map((ful) => {
                      const items = getOrderItems(selectedOrder.order_id);
                      const grossVal = items.reduce((s, i) => s + i.subtotal, 0);
                      const costVal = ful.supplier_cost;
                      const commVal = grossVal - costVal;
                      const stl = supplierSettlements.find(s => s.fulfillment_id === ful.fulfillment_id);

                      return (
                        <div key={ful.fulfillment_id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{ful.supplier_name_snapshot}</span>
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-[10px] font-bold">
                                  نموذج: SUPPLIER_DROPSHIPPING
                                </span>
                              </div>
                              <span className="text-slate-400 text-xs block mt-0.5">مسؤول التواصل: {ful.supplier_contact_snapshot || 'غير محدد'}</span>
                            </div>
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg font-bold text-xs">
                              {ful.status}
                            </span>
                          </div>

                          {/* Financials for Dropshipping */}
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <span className="text-slate-400 block text-[10px]">قيمة الطلب المحصلة:</span>
                              <span className="font-bold text-slate-900">{grossVal} ₪</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <span className="text-slate-400 block text-[10px]">تكلفة التوريد للمورد:</span>
                              <span className="font-bold text-amber-700">{costVal} ₪</span>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                              <span className="text-purple-600 block text-[10px]">عمولة المتجر (حق المتجر):</span>
                              <span className="font-bold text-purple-900 text-sm">+{commVal} ₪</span>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                              <span className="text-emerald-600 block text-[10px]">حالة التسوية للمتجر:</span>
                              <span className="font-bold text-emerald-800">
                                {ful.supplier_settlement_status === 'PAID' ? 'تم تحويل العمولة للكاش' : 'مستحقة (Receivable)'}
                              </span>
                            </div>
                          </div>

                          {/* Interactive Statuses & Controls */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                            {/* Contact Status */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">حالة التواصل مع المورد:</label>
                              <select
                                value={ful.supplier_comm_status || 'NOT_SENT'}
                                onChange={(e) => updateSupplierFulfillmentDetails(ful.fulfillment_id, { supplier_comm_status: e.target.value as any })}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                              >
                                <option value="NOT_SENT">لم يتم التراسل (NOT_SENT)</option>
                                <option value="SENT">تم إرسال الطلب (SENT)</option>
                                <option value="CONFIRMED">تأكيد المورد (CONFIRMED)</option>
                              </select>
                            </div>

                            {/* Collection Status */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">تحصيل المورد للمبلغ من العميل:</label>
                              <select
                                value={ful.supplier_collection_status || 'PENDING'}
                                onChange={(e) => updateSupplierFulfillmentDetails(ful.fulfillment_id, { supplier_collection_status: e.target.value as any })}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                              >
                                <option value="PENDING">بانتظار تحصيل المورد (PENDING)</option>
                                <option value="COLLECTED_BY_SUPPLIER">تم التحصيل بواسطة المورد (COLLECTED)</option>
                              </select>
                            </div>

                            {/* Return Responsibility */}
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">مسؤولية سياسة المرتجع:</label>
                              <select
                                value={ful.return_responsibility || 'SUPPLIER'}
                                onChange={(e) => updateSupplierFulfillmentDetails(ful.fulfillment_id, { return_responsibility: e.target.value as any })}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                              >
                                <option value="SUPPLIER">المورد يتحمل المرتجع (SUPPLIER)</option>
                                <option value="STORE">المتجر يتحمل المرتجع (STORE)</option>
                              </select>
                            </div>
                          </div>

                          {ful.supplier_notes && (
                            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                              <span className="text-[11px] font-bold text-purple-900 block mb-1">ملاحظات التوريد:</span>
                              <p className="text-purple-800">{ful.supplier_notes}</p>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                            {/* Record Settlement Button */}
                            {ful.supplier_settlement_status !== 'PAID' ? (
                              <button
                                onClick={() => recordSupplierSettlement(ful.fulfillment_id, commVal, 'BANK_TRANSFER', `STL-${selectedOrder.order_number}`, 'سداد عمولة دروب شيبينغ')}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
                              >
                                <DollarSign className="w-3.5 h-3.5" /> تسجيل تسوية العمولة (+{commVal} ₪ لكاش المتجر)
                              </button>
                            ) : (
                              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> تمت تسوية عمولة المتجر الكاملة بنجاح
                              </span>
                            )}

                            <button
                              onClick={() => openSupplierModal(selectedOrder)}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <Send className="w-3.5 h-3.5" /> فتح شاشة مراسلة المورد
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 4: SHIPPING & TRACKING */}
              {activeDetailsTab === 'shipping' && (
                <div className="space-y-4">
                  <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-sky-600" /> تفاصيل بوليصة الشحن والتوصيل
                      </h4>
                      <button
                        onClick={() => openTrackingModal(selectedOrder)}
                        className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg font-bold transition-colors cursor-pointer"
                      >
                        تعديل / إضافة بوليصة
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                        <span className="text-slate-400 text-[10px] block">شركة الشحن والتوصيل:</span>
                        <span className="font-bold text-slate-900">{selectedOrder.shipping_company || 'لم يتم التحديد بعد'}</span>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                        <span className="text-slate-400 text-[10px] block">رقم بوليصة التتبع (Tracking Number):</span>
                        <div className="flex items-center justify-between">
                          <span dir="ltr" className="font-mono font-bold text-slate-900">
                            {selectedOrder.tracking_number || 'غير متوفر'}
                          </span>
                          {selectedOrder.tracking_number && (
                            <button 
                              onClick={() => handleCopyMessage(selectedOrder.tracking_number!)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedOrder.tracking_url && (
                      <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-sky-700 font-bold block">رابط التتبع المباشر للعميل:</span>
                          <span dir="ltr" className="font-mono text-sky-900 truncate block max-w-md">{selectedOrder.tracking_url}</span>
                        </div>
                        <a
                          href={selectedOrder.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> فتح التتبع
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: ORDER TIMELINE */}
              {activeDetailsTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="border-r-2 border-blue-500 mr-3 pr-4 space-y-6">
                    {getOrderTimeline(selectedOrder.order_id).map((evt) => (
                      <div key={evt.event_id} className="relative group">
                        <div className="absolute -right-[23px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-slate-900">{evt.event_type}</span>
                            <span dir="ltr" className="font-mono text-slate-400">{evt.timestamp}</span>
                          </div>
                          <p className="text-slate-700">{evt.description}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">بواسطة: {evt.user_id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: AUDIT LOG */}
              {activeDetailsTab === 'audit' && (
                <div className="space-y-3">
                  {getOrderAuditLogs(selectedOrder.order_id).map((log) => (
                    <div key={log.log_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{log.action}</span>
                          <span className="text-slate-400 font-mono text-[10px]">({log.entity})</span>
                        </div>
                        <p className="text-slate-600 mt-1">{log.details}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <span className="text-[10px] text-slate-400 block">{log.date} {log.time}</span>
                        <span className="text-[11px] font-semibold text-slate-700">{log.user_name || log.user_id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUPPLIER ORDER SCREEN & MESSAGE GENERATOR MODAL (SPECIFICATIONS 10,11,12)*/}
      {/* ========================================================================= */}
      {supplierModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-purple-300" />
                <div>
                  <h3 className="font-bold text-base">شاشة تحويل الطلب إلى المورد</h3>
                  <p className="text-xs text-purple-200 mt-0.5">طلب رقم: #{supplierModalOrder.order_number}</p>
                </div>
              </div>
              <button onClick={() => setSupplierModalOrder(null)} className="text-purple-300 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Review Customer Data */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">بيانات تسليم العميل المضمنة:</span>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div><strong>الاسم:</strong> {supplierModalOrder.customer_name}</div>
                  <div><strong>الهاتف:</strong> <span dir="ltr">{supplierModalOrder.customer_phone || supplierModalOrder.phone}</span></div>
                  <div><strong>المدينة:</strong> {supplierModalOrder.city}</div>
                  <div><strong>العنوان:</strong> {supplierModalOrder.shipping_address || supplierModalOrder.address}</div>
                </div>
              </div>

              {/* Product Photos Preview & Quick Links */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    صور ومعاينة منتجات الطلب ({getOrderItems(supplierModalOrder.order_id).length}):
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">يمكنك نسخ رابط الصورة أو فتحها مباشرة لإرفاقها للمورد</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {getOrderItems(supplierModalOrder.order_id).map((item) => {
                    const prod = products.find(p => p.id === item.product_id || p.sku === item.sku_at_purchase);
                    const imageUrl = prod?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60';
                    return (
                      <div key={item.order_item_id} className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <img 
                          src={imageUrl} 
                          alt={item.product_name_at_purchase} 
                          className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0 bg-white"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-slate-800 text-xs truncate">{item.product_name_at_purchase}</h5>
                          <span className="text-[10px] text-slate-500 block">الكمية: {item.quantity} | SKU: {item.sku_at_purchase}</span>
                          <div className="flex items-center gap-2 mt-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(imageUrl);
                                setCopiedImageUrl(item.order_item_id);
                                setTimeout(() => setCopiedImageUrl(null), 2500);
                              }}
                              className="text-[10px] bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              {copiedImageUrl === item.order_item_id ? (
                                <span className="text-emerald-600 flex items-center gap-0.5"><Check className="w-3 h-3" /> تم نسخ الرابط!</span>
                              ) : (
                                <span className="flex items-center gap-0.5"><Copy className="w-3 h-3 text-slate-500" /> نسخ رابط الصورة</span>
                              )}
                            </button>
                            <a
                              href={imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-md transition-colors flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" /> فتح الصورة
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Generated Message Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800">نص الرسالة المولد تلقائياً للمورد (مضمن به رابط الصورة):</label>
                  <button
                    onClick={() => handleCopyMessage(generateSupplierMessage(supplierModalOrder))}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                  >
                    {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMessage ? 'تم نسخ النص ورابط الصورة!' : 'نسخ النص ورابط الصورة'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={generateSupplierMessage(supplierModalOrder)}
                  className="w-full p-3.5 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl border border-slate-700 focus:outline-none"
                />
              </div>

              {/* Direct Platform Links (No Paid API required) */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">قنوات الإرسال المباشرة المتاحة (واتساب / تليجرام / ماسنجر):</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(generateSupplierMessage(supplierModalOrder))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-xs text-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>إرسال عبر WhatsApp</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>

                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(
                      products.find(p => getOrderItems(supplierModalOrder.order_id)[0]?.product_id === p.id)?.image || 'https://elites-store.com'
                    )}&text=${encodeURIComponent(generateSupplierMessage(supplierModalOrder))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 p-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold transition-colors shadow-xs text-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>إرسال عبر Telegram</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>

                  <a
                    href={`https://m.me/?text=${encodeURIComponent(generateSupplierMessage(supplierModalOrder))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-xs text-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>إرسال Messenger</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">ملاحظات داخلية للمتابعة الإدارية:</label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="مثال: تم إرسال الرسالة للمورد أحمد وبانتظار بوليصة الشحن"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSupplierModalOrder(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmSendToSupplier}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> تأكيد إرسال الطلب للمورد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TRACKING & SHIPPING MODAL                                              */}
      {/* ========================================================================= */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-sky-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-300" />
                تحديث بوليصة الشحن والتتبع
              </h3>
              <button onClick={() => setTrackingModalOrder(null)} className="text-sky-300 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">شركة الشحن والتوصيل:</label>
                <input
                  type="text"
                  value={shippingCompany}
                  onChange={(e) => setShippingCompany(e.target.value)}
                  placeholder="أرامكس / ترو ساعي / DHL / سمسا"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رقم بوليصة الشحن (Tracking Number): *</label>
                <input
                  type="text"
                  required
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="مثال: TRK-98765432"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رابط التتبع المباشر (اختياري):</label>
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://track.aramex.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveTracking}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
              >
                حفظ البوليصة وتحديث الحالة لـ (SHIPPED)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. QUICK ORDER STATUS CHANGE MODAL                                        */}
      {/* ========================================================================= */}
      {statusChangeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                تغيير حالة الطلب {statusChangeOrder.order_number}
              </h3>
              <button onClick={() => setStatusChangeOrder(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اختر الحالة الجديدة للطلب:</label>
                <select
                  value={targetOrderStatus}
                  onChange={(e) => setTargetOrderStatus(e.target.value as OrderStatus)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="NEW">جديد (NEW)</option>
                  <option value="CONFIRMED">مؤكد (CONFIRMED)</option>
                  <option value="PROCESSING">قيد التجهيز (PROCESSING)</option>
                  <option value="READY_TO_SHIP">جاهز للتسليم لشركة الشحن (READY_TO_SHIP)</option>
                  <option value="SHIPPED">تم الشحن (SHIPPED)</option>
                  <option value="DELIVERED">تم التسليم بنجاح (DELIVERED)</option>
                  <option value="CANCELLED">ملغي (CANCELLED)</option>
                  <option value="RETURNED">مرتجع (RETURNED)</option>
                  <option value="REFUNDED">مسترد القيمة (REFUNDED)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ملاحظات تغيير الحالة (تضاف للتايم لاين):</label>
                <input
                  type="text"
                  value={statusChangeNotes}
                  onChange={(e) => setStatusChangeNotes(e.target.value)}
                  placeholder="سبب التعديل أو تفاصيل التحديث..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setStatusChangeOrder(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleQuickStatusChange}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
              >
                تأكيد التحديث
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. AUTOMATED TEST SCENARIOS RUNNER MODAL (SCENARIOS 1 & 2)                */}
      {/* ========================================================================= */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-purple-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Play className="w-5 h-5 text-purple-400 fill-purple-400" />
                <div>
                  <h3 className="font-bold text-base">منصة اختبار دورة الطلبات والتنفيذ الآلية</h3>
                  <p className="text-xs text-purple-300 mt-0.5">Test Scenarios 1 & 2 (Fulfillment, Snapshots, Inventory Movements, Logs)</p>
                </div>
              </div>
              <button onClick={() => setIsTestModalOpen(false)} className="text-purple-300 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  disabled={isRunningTest}
                  onClick={() => handleRunTests(1)}
                  className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50 text-right"
                >
                  <div className="flex items-center gap-1.5 mb-1 text-purple-700">
                    <Send className="w-3.5 h-3.5" />
                    <span>سيناريو 1: دروب شيبينغ</span>
                  </div>
                  <span className="text-[10px] text-purple-600 block">تكلفة 20 ₪، بيع 60 ₪، كمية 2</span>
                </button>

                <button
                  disabled={isRunningTest}
                  onClick={() => handleRunTests(2)}
                  className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50 text-right"
                >
                  <div className="flex items-center gap-1.5 mb-1 text-blue-700">
                    <Boxes className="w-3.5 h-3.5" />
                    <span>سيناريو 2: مخزون ذاتي</span>
                  </div>
                  <span className="text-[10px] text-blue-600 block">مخزون 10 &larr; طلب 2 &larr; مخزون 8</span>
                </button>

                <button
                  disabled={isRunningTest}
                  onClick={() => handleRunTests('both')}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50 text-center flex flex-col items-center justify-center shadow-md"
                >
                  <span className="text-sm">⚡ تشغيل الفحص الكامل</span>
                  <span className="text-[10px] text-emerald-100 mt-0.5">اختبار السيناريوهين معاً</span>
                </button>
              </div>

              {/* Execution Console Logs */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 font-mono text-[11px] min-h-[220px] max-h-[300px] overflow-y-auto space-y-1.5">
                {isRunningTest && (
                  <div className="flex items-center gap-2 text-amber-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جارٍ تشغيل الاختبارات الآلية والتحقق من الجداول وقواعد التجميد...</span>
                  </div>
                )}
                {testLogs.length === 0 && !isRunningTest && (
                  <div className="text-slate-500 py-12 text-center">
                    اضغط على أي من أزرار الاختبار بالأعلى لبدء التحقق الفوري وعرض النتائج هنا.
                  </div>
                )}
                {testLogs.map((l, idx) => (
                  <div key={idx} className={l.startsWith('❌') ? 'text-rose-400' : l.startsWith('✅') ? 'text-emerald-400' : l.startsWith('🎉') ? 'text-emerald-300 font-bold' : 'text-slate-300'}>
                    {l}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
