import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package, 
  Download, 
  Calendar, 
  Filter, 
  Layers, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Award,
  CreditCard,
  Truck
} from 'lucide-react';
import { useAccounting } from '../contexts/AccountingContext';
import { useOrders } from '../contexts/OrderContext';
import { useProducts } from '../contexts/ProductContext';

type ReportTimeRange = 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'all';

export const ExecutiveReportsManagement: React.FC = () => {
  const { 
    expenses, 
    supplierPayments, 
    refunds, 
    getFinancialMetrics, 
    getProductProfitabilityReport, 
    getCustomerValueReport,
    exportCSV 
  } = useAccounting();

  const { orders } = useOrders();
  const { products } = useProducts();

  const [timeRange, setTimeRange] = useState<ReportTimeRange>('this_month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter orders by time range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      if (order.status === 'cancelled') return false;

      switch (timeRange) {
        case 'today':
          return orderDate.toDateString() === now.toDateString();
        case 'this_week': {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return orderDate >= weekAgo;
        }
        case 'this_month':
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        case 'last_month': {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          return orderDate >= lastMonth && orderDate <= lastMonthEnd;
        }
        case 'this_year':
          return orderDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }, [orders, timeRange]);

  // Compute key KPIs
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  }, [filteredOrders]);

  const totalOrdersCount = filteredOrders.length;
  const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Compute expenses in range
  const totalExpenses = useMemo(() => {
    const now = new Date();
    return expenses.reduce((sum, exp) => {
      const expDate = new Date(exp.date);
      let inRange = true;
      if (timeRange === 'this_month') {
        inRange = expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      } else if (timeRange === 'this_year') {
        inRange = expDate.getFullYear() === now.getFullYear();
      }
      return sum + (inRange ? exp.amount : 0);
    }, 0);
  }, [expenses, timeRange]);

  const netProfit = totalRevenue - totalExpenses;
  const profitMarginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Product profitability report
  const productProfitability = useMemo(() => {
    return getProductProfitabilityReport();
  }, [getProductProfitabilityReport]);

  // Top Customer Value report
  const customerValues = useMemo(() => {
    return getCustomerValueReport();
  }, [getCustomerValueReport]);

  // Sales by Status
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // Export Executive Summary CSV
  const handleExportExecutiveReport = () => {
    const reportData = filteredOrders.map(o => ({
      'رقم الطلب': o.order_id,
      'تاريخ الطلب': new Date(o.created_at).toLocaleDateString('ar-SA'),
      'اسم العميل': o.customer_name,
      'الهاتف': o.phone,
      'المدينة': o.city || 'غير محدد',
      'إجمالي المبلغ': o.total_amount,
      'حالة الطلب': o.status,
      'طريقة الدفع': o.payment_method || 'عند الاستلام'
    }));

    exportCSV(reportData, `Executive_Sales_Report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-stone-900 to-slate-800 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-700">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold mb-2">
            <Sparkles className="w-4 h-4" /> مركز التقارير الشاملة والتحليلات التنفيذية
          </div>
          <h2 className="text-2xl font-black text-white">تقارير الأداء والمبيعات الشاملة</h2>
          <p className="text-stone-300 text-xs mt-1">
            تحليل دقيق لكافة مؤشرات الأداء الحيوية، الربحية، المبيعات، ومعدلات نمو المتجر.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter Dropdown */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
            <Calendar className="w-4 h-4 text-emerald-400 mr-2" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as ReportTimeRange)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer border-0"
            >
              <option value="today" className="text-slate-900">اليوم</option>
              <option value="this_week" className="text-slate-900">هذا الأسبوع</option>
              <option value="this_month" className="text-slate-900">هذا الشهر</option>
              <option value="last_month" className="text-slate-900">الشهر الماضي</option>
              <option value="this_year" className="text-slate-900">هذه السنة</option>
              <option value="all" className="text-slate-900">كافة الأوقات</option>
            </select>
          </div>

          <button
            onClick={handleExportExecutiveReport}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> تصدير تقرير (CSV)
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي المبيعات والإيرادات</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{Number(totalRevenue || 0).toLocaleString()} ر.س</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-bold block flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> {filteredOrders.length} طلب مكتمل ومؤكد
          </span>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">صافي الأرباح المقدرة</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{Number(netProfit || 0).toLocaleString()} ر.س</span>
          </div>
          <span className="text-[11px] text-blue-600 font-bold block">
            هامش ربح إجمالي {profitMarginPercent}%
          </span>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">متوسط قيمة السلة (AOV)</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{Number(averageOrderValue || 0).toFixed(0)} ر.س</span>
          </div>
          <span className="text-[11px] text-purple-600 font-bold block">
            لكل طلب تم تنفيذه
          </span>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">المصروفات التشغيلية</span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{Number(totalExpenses || 0).toLocaleString()} ر.س</span>
          </div>
          <span className="text-[11px] text-rose-600 font-bold block">
            مسجلة في النظام المالي
          </span>
        </div>

      </div>

      {/* Main Content Grid: Top Products Profitability & Orders Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Top Products Profitability Table (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> تقرير المنتجات الأكثر مبيعاً ورابحية
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">تحليل المبيعات، الهامش الربحي، والكميات المباعة</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
              إجمالي المنتجات: {products.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3">اسم المنتج</th>
                  <th className="p-3">الكميات المباعة</th>
                  <th className="p-3">إجمالي المبيعات</th>
                  <th className="p-3">إجمالي الأرباح</th>
                  <th className="p-3">نسبة الربح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {productProfitability.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 font-bold">
                      لا توجد بيانات مبيعات كافية للفترة المحددة
                    </td>
                  </tr>
                ) : (
                  productProfitability.slice(0, 7).map((prod, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {prod.product_name}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">{prod.total_quantity_sold || 0} قطعة</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{Number(prod.total_revenue || 0).toLocaleString()} ر.س</td>
                      <td className="p-3 font-mono font-bold text-emerald-600">+{Number(prod.total_profit || 0).toLocaleString()} ر.س</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                          {Number(prod.profit_margin || 0).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Order Status Breakdown & Customer Value (1 col) */}
        <div className="space-y-6">
          
          {/* Order Status Distribution */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" /> توزيع حالات الطلبات
            </h3>

            <div className="space-y-3 pt-1">
              {[
                { label: 'مكتمل ومسلم', key: 'delivered', color: 'bg-emerald-500', count: statusBreakdown['delivered'] || 0 },
                { label: 'قيد المعالجة', key: 'processing', color: 'bg-blue-500', count: statusBreakdown['processing'] || 0 },
                { label: 'قيد الشحن والتوصيل', key: 'shipped', color: 'bg-amber-500', count: statusBreakdown['shipped'] || 0 },
                { label: 'طلب جديد (معلق)', key: 'pending', color: 'bg-purple-500', count: statusBreakdown['pending'] || 0 },
                { label: 'ملغي', key: 'cancelled', color: 'bg-rose-500', count: statusBreakdown['cancelled'] || 0 },
              ].map(st => {
                const percentage = orders.length > 0 ? ((st.count / orders.length) * 100).toFixed(0) : '0';
                return (
                  <div key={st.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>{st.label}</span>
                      <span className="font-mono text-slate-900">{st.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${st.color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Customer Values */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" /> كبار العملاء الأكفأ (LTV)
            </h3>

            <div className="space-y-2.5">
              {customerValues.slice(0, 4).map((cust, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{cust.customer_name}</span>
                    <span className="text-[10px] text-slate-500 block">{cust.order_count} طلبات شراء</span>
                  </div>
                  <span className="font-mono font-black text-xs text-emerald-600">
                    {Number(cust.total_spent || 0).toLocaleString()} ر.س
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
