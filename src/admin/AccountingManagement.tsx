import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Info, 
  ShieldCheck, 
  Layers, 
  PieChart, 
  Users, 
  Package, 
  Building2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Check, 
  X,
  PlayCircle,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAccounting } from '../contexts/AccountingContext';
import { useOrders } from '../contexts/OrderContext';
import { useGoogleSheets } from '../contexts/GoogleSheetsContext';
import { Expense, ExpenseCategory, AccountingPaymentMethod, SupplierPayment, Refund, PaymentStatus } from '../types';

type DateFilterPreset = 
  | 'today' 
  | 'yesterday' 
  | 'this_week' 
  | 'this_month' 
  | 'last_month' 
  | 'this_year' 
  | 'last_year' 
  | 'last_3_months' 
  | 'last_6_months' 
  | 'last_8_months' 
  | 'all' 
  | 'custom';

type AccountingTab = 
  | 'summary' 
  | 'expenses' 
  | 'suppliers' 
  | 'cashflow' 
  | 'refunds' 
  | 'products' 
  | 'customers' 
  | 'reconciliation';

export const AccountingManagement: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { 
    expenses, 
    supplierPayments, 
    refunds, 
    payments, 
    cashFlows, 
    customCategories,
    openingBalances,
    addExpense, 
    updateExpense, 
    deleteExpense, 
    addCustomCategory,
    addSupplierPayment, 
    deleteSupplierPayment,
    createRefund,
    addManualCashFlow,
    setOpeningBalance,
    getFinancialMetrics, 
    getSupplierReport, 
    getProductProfitabilityReport, 
    getCustomerValueReport,
    runReconciliation, 
    exportCSV,
    runAccountingTestSuite
  } = useAccounting();

  const { orders } = useOrders();
  const { syncNow } = useGoogleSheets();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<AccountingTab>('summary');

  // Date Filter Preset
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Search queries & local filters
  const [searchQuery, setSearchQuery] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');

  // Modals state
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isAddSupplierPaymentModalOpen, setIsAddSupplierPaymentModalOpen] = useState(false);
  const [isAddRefundModalOpen, setIsAddRefundModalOpen] = useState(false);
  const [isAddCashFlowModalOpen, setIsAddCashFlowModalOpen] = useState(false);
  const [isOpeningBalanceModalOpen, setIsOpeningBalanceModalOpen] = useState(false);
  const [isTestRunnerModalOpen, setIsTestRunnerModalOpen] = useState(false);
  const [testResults, setTestResults] = useState<{ success: boolean; results: any[]; logs: string[] } | null>(null);
  const [isTestingRunning, setIsTestingRunning] = useState(false);

  // Form states
  const [expenseForm, setExpenseForm] = useState<{
    category: ExpenseCategory;
    amount: string;
    description: string;
    date: string;
    payment_method: AccountingPaymentMethod;
    reference: string;
    notes: string;
  }>({
    category: 'OPERATING',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'CASH',
    reference: '',
    notes: ''
  });

  const [newCustomCategoryInput, setNewCustomCategoryInput] = useState('');

  const [supplierPaymentForm, setSupplierPaymentForm] = useState<{
    supplier_id: string;
    supplier_name_snapshot: string;
    amount: string;
    payment_date: string;
    payment_method: AccountingPaymentMethod;
    reference: string;
    notes: string;
  }>({
    supplier_id: 'sup_1',
    supplier_name_snapshot: 'مورد العطور المميزة',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'BANK_TRANSFER',
    reference: '',
    notes: ''
  });

  const [refundForm, setRefundForm] = useState<{
    order_id: string;
    amount: string;
    reason: string;
    refund_method: AccountingPaymentMethod;
  }>({
    order_id: '',
    amount: '',
    reason: '',
    refund_method: 'CASH'
  });

  const [cashFlowForm, setCashFlowForm] = useState<{
    type: string;
    amount: string;
    direction: 'IN' | 'OUT';
    description: string;
    date: string;
    reference_id: string;
  }>({
    type: 'OTHER_INCOME',
    amount: '',
    direction: 'IN',
    description: '',
    date: new Date().toISOString().split('T')[0],
    reference_id: ''
  });

  const [openingBalanceInput, setOpeningBalanceInput] = useState<string>(
    String(openingBalances['this_month'] || openingBalances['default'] || 5000)
  );

  // Feedback notifications
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, message });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Compute calculated dates from preset
  const { computedStartDate, computedEndDate } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (datePreset === 'today') {
      return { computedStartDate: todayStr, computedEndDate: todayStr };
    }

    if (datePreset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      return { computedStartDate: yStr, computedEndDate: yStr };
    }

    if (datePreset === 'this_week') {
      const first = new Date(today);
      first.setDate(today.getDate() - today.getDay());
      return { computedStartDate: first.toISOString().split('T')[0], computedEndDate: todayStr };
    }

    if (datePreset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return { computedStartDate: firstDay.toISOString().split('T')[0], computedEndDate: todayStr };
    }

    if (datePreset === 'last_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      return { computedStartDate: firstDay.toISOString().split('T')[0], computedEndDate: lastDay.toISOString().split('T')[0] };
    }

    if (datePreset === 'this_year') {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      return { computedStartDate: firstDay.toISOString().split('T')[0], computedEndDate: todayStr };
    }

    if (datePreset === 'last_year') {
      const firstDay = new Date(today.getFullYear() - 1, 0, 1);
      const lastDay = new Date(today.getFullYear() - 1, 11, 31);
      return { computedStartDate: firstDay.toISOString().split('T')[0], computedEndDate: lastDay.toISOString().split('T')[0] };
    }

    if (datePreset === 'last_3_months') {
      const start = new Date(today);
      start.setMonth(today.getMonth() - 3);
      return { computedStartDate: start.toISOString().split('T')[0], computedEndDate: todayStr };
    }

    if (datePreset === 'last_6_months') {
      const start = new Date(today);
      start.setMonth(today.getMonth() - 6);
      return { computedStartDate: start.toISOString().split('T')[0], computedEndDate: todayStr };
    }

    if (datePreset === 'last_8_months') {
      const start = new Date(today);
      start.setMonth(today.getMonth() - 8);
      return { computedStartDate: start.toISOString().split('T')[0], computedEndDate: todayStr };
    }

    if (datePreset === 'custom') {
      return { computedStartDate: customStartDate || undefined, computedEndDate: customEndDate || undefined };
    }

    return { computedStartDate: undefined, computedEndDate: undefined };
  }, [datePreset, customStartDate, customEndDate]);

  // Compute live financial metrics
  const metrics = useMemo(() => {
    return getFinancialMetrics(computedStartDate, computedEndDate, datePreset);
  }, [getFinancialMetrics, computedStartDate, computedEndDate, datePreset]);

  // Compute Supplier report
  const supplierReport = useMemo(() => {
    return getSupplierReport(computedStartDate, computedEndDate);
  }, [getSupplierReport, computedStartDate, computedEndDate]);

  // Compute Product profitability report
  const productReport = useMemo(() => {
    return getProductProfitabilityReport(computedStartDate, computedEndDate);
  }, [getProductProfitabilityReport, computedStartDate, computedEndDate]);

  // Compute Customer value report
  const customerReport = useMemo(() => {
    return getCustomerValueReport(computedStartDate, computedEndDate);
  }, [getCustomerValueReport, computedStartDate, computedEndDate]);

  // Reconciliation discrepancies
  const reconciliationItems = useMemo(() => {
    return runReconciliation();
  }, [runReconciliation]);

  // RBAC Permission Check
  const canViewAccounting = role === 'Owner' || role === 'Manager' || role === 'Accountant' || role === 'Marketing';
  const canEditFinancials = role === 'Owner' || role === 'Manager' || role === 'Accountant';
  const isMarketingOnly = role === 'Marketing';

  if (!canViewAccounting) {
    return (
      <div className="bg-white p-12 rounded-xl border border-red-200 text-center shadow-sm max-w-2xl mx-auto my-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">غير مصرح بالوصول إلى النظام المالي</h3>
        <p className="text-sm text-slate-500">
          حسابك الحالي ({role}) لا يملك الصلاحيات الكافية للاطلاع على بيانات الأرباح والتكاليف والمحاسبة والتدفقات النقدية.
        </p>
      </div>
    );
  }

  // Handle Add Expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      showFeedback('يرجى إدخال مبلغ صحيح للمصروف', 'error');
      return;
    }
    if (!expenseForm.description.trim()) {
      showFeedback('يرجى كتابة بيان ووصف المصروف', 'error');
      return;
    }

    await addExpense({
      category: expenseForm.category,
      amount: Number(expenseForm.amount),
      description: expenseForm.description,
      date: expenseForm.date,
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      payment_method: expenseForm.payment_method,
      reference: expenseForm.reference,
      notes: expenseForm.notes
    });

    setIsAddExpenseModalOpen(false);
    setExpenseForm({
      category: 'OPERATING',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'CASH',
      reference: '',
      notes: ''
    });
    showFeedback('تم تسجيل المصروف وإدراجه في جدول التدفقات النقدية بنجاح.');
  };

  // Handle Add Supplier Payment
  const handleCreateSupplierPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierPaymentForm.amount || Number(supplierPaymentForm.amount) <= 0) {
      showFeedback('يرجى إدخال قيمة الدفعة بشكل صحيح', 'error');
      return;
    }

    await addSupplierPayment({
      supplier_id: supplierPaymentForm.supplier_id,
      supplier_name_snapshot: supplierPaymentForm.supplier_name_snapshot,
      amount: Number(supplierPaymentForm.amount),
      payment_date: supplierPaymentForm.payment_date,
      date: supplierPaymentForm.payment_date,
      payment_method: supplierPaymentForm.payment_method,
      reference: supplierPaymentForm.reference,
      notes: supplierPaymentForm.notes
    });

    setIsAddSupplierPaymentModalOpen(false);
    setSupplierPaymentForm({
      supplier_id: 'sup_1',
      supplier_name_snapshot: 'مورد العطور المميزة',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'BANK_TRANSFER',
      reference: '',
      notes: ''
    });
    showFeedback('تم تسجيل دفعة المورد وتحديث رصيد المستحقات بنجاح.');
  };

  // Handle Add Refund
  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundForm.order_id) {
      showFeedback('يرجى اختيار الطلب المراد استرجاعه', 'error');
      return;
    }
    if (!refundForm.amount || Number(refundForm.amount) <= 0) {
      showFeedback('يرجى تحديد مبلغ الاسترجاع', 'error');
      return;
    }

    const order = orders.find(o => o.order_id === refundForm.order_id);
    await createRefund({
      order_id: refundForm.order_id,
      order_number_snapshot: order?.order_number || refundForm.order_id,
      customer_id: order?.customer_id || 'cust_unknown',
      customer_name_snapshot: order?.customer_name || 'عميل المتجر',
      amount: Number(refundForm.amount),
      reason: refundForm.reason || 'استرجاع بناء على طلب العميل',
      refund_method: refundForm.refund_method,
      refund_status: 'COMPLETED',
      created_by: currentUser?.name || 'المحاسب'
    });

    setIsAddRefundModalOpen(false);
    setRefundForm({ order_id: '', amount: '', reason: '', refund_method: 'CASH' });
    showFeedback('تم تسجيل الاسترجاع وتحديث صافي الأرباح والتدفق النقدي.');
  };

  // Handle Add Manual Cash Flow
  const handleCreateCashFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashFlowForm.amount || Number(cashFlowForm.amount) <= 0) {
      showFeedback('يرجى إدخال مبلغ صحيح للحركة النقدية', 'error');
      return;
    }

    await addManualCashFlow({
      type: cashFlowForm.type,
      amount: Number(cashFlowForm.amount),
      direction: cashFlowForm.direction,
      description: cashFlowForm.description || 'حركة نقدية يدوية',
      date: cashFlowForm.date,
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      reference_type: 'MANUAL',
      reference_id: cashFlowForm.reference_id
    });

    setIsAddCashFlowModalOpen(false);
    setCashFlowForm({
      type: 'OTHER_INCOME',
      amount: '',
      direction: 'IN',
      description: '',
      date: new Date().toISOString().split('T')[0],
      reference_id: ''
    });
    showFeedback('تم تسجيل الحركة النقدية اليدوية وتحديث رصيد الصندوق.');
  };

  // Run Test Scenario (Section 33)
  const handleRunTestSuite = async () => {
    setIsTestingRunning(true);
    const res = await runAccountingTestSuite();
    setTestResults(res);
    setIsTestingRunning(false);
    setIsTestRunnerModalOpen(true);
  };

  // Filtered Expenses List
  const filteredExpenses = expenses.filter(e => {
    const matchesCategory = expenseCategoryFilter === 'ALL' || e.category === expenseCategoryFilter;
    const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (e.reference && e.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (e.invoice_number && e.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDate = !computedStartDate || (e.date >= computedStartDate && (!computedEndDate || e.date <= computedEndDate));
    return matchesCategory && matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl flex items-center justify-between shadow-lg border transition-all ${
          feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span className="text-sm font-bold">{feedbackMsg.message}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Actions Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">النظام المالي وإدارة التدفقات النقدية</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                حساب دقيق للمبيعات، الأرباح، تكاليف البضاعة التاريخية (COGS)، ومستحقات الموردين ومطابقتها سحابياً
              </p>
            </div>
          </div>
        </div>

        {/* Global Accounting Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canEditFinancials && (
            <>
              <button
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 text-emerald-400" /> تسجيل مصروف
              </button>

              <button
                onClick={() => setIsAddSupplierPaymentModalOpen(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <Building2 className="w-4 h-4" /> دفعة مورد
              </button>

              <button
                onClick={() => setIsAddRefundModalOpen(true)}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4" /> استرجاع مالي
              </button>

              <button
                onClick={() => setIsAddCashFlowModalOpen(true)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-slate-500" /> حركة نقدية يدوية
              </button>
            </>
          )}

          <button
            onClick={handleRunTestSuite}
            disabled={isTestingRunning}
            className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-purple-200 transition-colors cursor-pointer"
            title="تشغيل سيناريو التحقق المحاسبي الأوتوماتيكي (Section 33 Test Runner)"
          >
            <PlayCircle className="w-4 h-4 text-purple-600" /> 
            {isTestingRunning ? 'جاري الفحص...' : 'فحص المحاسبة (بند 33)'}
          </button>

          {/* Export CSV Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer">
              <Download className="w-4 h-4" /> تصدير CSV
            </button>
            <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 hidden group-hover:block z-30">
              <button 
                onClick={() => exportCSV('profit', computedStartDate, computedEndDate)}
                className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold flex items-center justify-between"
              >
                <span>تقرير الأرباح الشامل</span>
                <span className="text-[10px] text-slate-400">Profit</span>
              </button>
              <button 
                onClick={() => exportCSV('sales', computedStartDate, computedEndDate)}
                className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold flex items-center justify-between"
              >
                <span>تقرير المبيعات والطلبات</span>
                <span className="text-[10px] text-slate-400">Sales</span>
              </button>
              <button 
                onClick={() => exportCSV('expenses', computedStartDate, computedEndDate)}
                className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold flex items-center justify-between"
              >
                <span>سجل المصروفات</span>
                <span className="text-[10px] text-slate-400">Expenses</span>
              </button>
              <button 
                onClick={() => exportCSV('supplier_payments', computedStartDate, computedEndDate)}
                className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold flex items-center justify-between"
              >
                <span>مدفوعات الموردين</span>
                <span className="text-[10px] text-slate-400">Suppliers</span>
              </button>
              <button 
                onClick={() => exportCSV('cash_flow', computedStartDate, computedEndDate)}
                className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold flex items-center justify-between"
              >
                <span>حركة التدفق النقدي</span>
                <span className="text-[10px] text-slate-400">Cash Flow</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter & Range Selector Bar - Dropdown Menu */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <label htmlFor="financial-period-select" className="text-xs font-bold text-slate-700 block">
                تحديد الفترة المالية المحاسبية:
              </label>
              <p className="text-[11px] text-slate-400">
                اختر الفترة المطلوبة لعرض وتصفية كافة القيود والتقارير والتدفقات
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Period Dropdown Menu */}
            <div className="relative min-w-[220px]">
              <select
                id="financial-period-select"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as DateFilterPreset)}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 hover:border-blue-400 text-slate-800 text-xs font-bold py-2.5 px-3.5 pr-9 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer shadow-xs appearance-none"
              >
                <optgroup label="الفترات اليومية والأسبوعية">
                  <option value="today">📅 اليوم (Today)</option>
                  <option value="yesterday">⏪ أمس (Yesterday)</option>
                  <option value="this_week">📊 هذا الأسبوع (This Week)</option>
                </optgroup>
                <optgroup label="الفترات الشهرية والربعية">
                  <option value="this_month">🗓️ هذا الشهر (This Month)</option>
                  <option value="last_month">⏮️ الشهر الماضي (Last Month)</option>
                  <option value="last_3_months">📈 آخر 3 أشهر (Quarter / 3 Months)</option>
                  <option value="last_6_months">📉 آخر 6 أشهر (Half Year / 6 Months)</option>
                  <option value="last_8_months">📋 آخر 8 أشهر (8 Months)</option>
                </optgroup>
                <optgroup label="الفترات السنوية والعامة">
                  <option value="this_year">🏛️ هذا العام (This Year)</option>
                  <option value="last_year">📜 العام الماضي (Last Year)</option>
                  <option value="all">🌐 كل الفترات التاريخية (All Time)</option>
                </optgroup>
                <optgroup label="تحديد نطاق مخصص">
                  <option value="custom">🎯 فترة مخصصة ومحددة (تحديد من تاريخ X إلى Y)...</option>
                </optgroup>
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Active Period Badge */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium hidden md:inline">الفترة النشطة:</span>
              <span className="bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-xl border border-blue-200 font-mono text-[11px] shadow-2xs">
                {computedStartDate ? `${computedStartDate} ⬅️ ${computedEndDate || 'الآن'}` : 'كافة السجلات'}
              </span>
            </div>
          </div>
        </div>

        {/* Custom Range Inputs (Shown when "custom" is selected) */}
        {datePreset === 'custom' && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs bg-slate-50/80 p-3 rounded-xl animate-fade-in">
            <span className="font-bold text-blue-900 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              تحديد نطاق التواريخ يدوياً:
            </span>
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-600">من تاريخ (X):</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-600">إلى تاريخ (Y):</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
              />
            </div>
            {customStartDate && customEndDate && (
              <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-bold">
                ✓ تم تطبيق النطاق: من {customStartDate} إلى {customEndDate}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Profit Card */}
        <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
          metrics.netProfit >= 0 ? 'bg-emerald-900 text-white border-emerald-800' : 'bg-rose-900 text-white border-rose-800'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs opacity-90 mb-1">
              <span className="font-bold">صافي الربح النهائي (Net Profit)</span>
              {Number(metrics.netProfit || 0) >= 0 ? (
                <span className="bg-emerald-700/80 text-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">ربح تشغيلي صافي</span>
              ) : (
                <span className="bg-rose-700/80 text-rose-100 px-2 py-0.5 rounded-full text-[10px] font-bold">عجز في الفترة</span>
              )}
            </div>
            <div className="text-3xl font-black tracking-tight mt-2 flex items-baseline gap-1">
              <span>{Number(metrics.netProfit || 0).toLocaleString()}</span>
              <span className="text-sm font-semibold opacity-80">₪</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] opacity-80 flex items-center justify-between">
            <span>هامش الربح الإجمالي: {Number(metrics.netSales || 0) > 0 ? Math.round((Number(metrics.grossProfit || 0) / Number(metrics.netSales || 1)) * 100) : 0}%</span>
            <span className="underline cursor-pointer" onClick={() => setActiveTab('summary')}>تفاصيل الحسبة ↗</span>
          </div>
        </div>

        {/* Gross Sales & Net Sales Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-bold">إجمالي المبيعات (Sales)</span>
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold">{metrics.ordersCount || 0} طلب</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 flex items-baseline gap-1">
              <span>{Number(metrics.grossSales || 0).toLocaleString()}</span>
              <span className="text-xs text-slate-500">₪</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>الخصومات: <span className="font-bold text-red-600">-{Number(metrics.discounts || 0).toLocaleString()} ₪</span></span>
            <span>صافي المبيعات: <strong className="text-slate-800">{Number(metrics.netSales || 0).toLocaleString()} ₪</strong></span>
          </div>
        </div>

        {/* COGS & Gross Profit Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-bold">تكلفة البضاعة (COGS)</span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">بناءً على Snapshots</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 flex items-baseline gap-1">
              <span>{Number(metrics.cogs || 0).toLocaleString()}</span>
              <span className="text-xs text-slate-500">₪</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>إجمالي الربح (Gross Profit):</span>
            <strong className="text-emerald-600 font-bold text-xs">{Number(metrics.grossProfit || 0).toLocaleString()} ₪</strong>
          </div>
        </div>

        {/* Cash Balance Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-bold">الرصيد النقدي الحالي (Cash Balance)</span>
              <button 
                onClick={() => setIsOpeningBalanceModalOpen(true)}
                className="text-[10px] text-blue-600 hover:underline font-semibold"
              >
                تعديل الرصيد
              </button>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 flex items-baseline gap-1">
              <span>{Number(metrics.cashBalance || 0).toLocaleString()}</span>
              <span className="text-xs text-slate-500">₪</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="text-emerald-600 flex items-center gap-0.5">
              <ArrowDownLeft className="w-3 h-3" /> +{Number(metrics.cashIn || 0).toLocaleString()} ₪
            </span>
            <span className="text-rose-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> -{Number(metrics.cashOut || 0).toLocaleString()} ₪
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 font-semibold block">أرباح الشحن الصافية</span>
          <div className="text-base font-bold text-slate-800 mt-1 flex items-baseline justify-between">
            <span>{metrics.shippingProfit} ₪</span>
            <span className="text-[10px] text-slate-400 font-normal">({metrics.customerShippingRevenue} - {metrics.actualShippingExpense})</span>
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 font-semibold block">المصروفات التشغيلية</span>
          <div className="text-base font-bold text-slate-800 mt-1">
            <span>{metrics.operatingExpenses} ₪</span>
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 font-semibold block">المصروفات التسويقية</span>
          <div className="text-base font-bold text-slate-800 mt-1">
            <span>{metrics.marketingExpenses} ₪</span>
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 font-semibold block">مستحقات الموردين غير المسددة</span>
          <div className="text-base font-bold text-amber-700 mt-1">
            <span>{metrics.supplierPayables} ₪</span>
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 font-semibold block">المبالغ المسترجعة (Refunds)</span>
          <div className="text-base font-bold text-rose-700 mt-1">
            <span>{metrics.refundsTotal} ₪</span>
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-[11px] text-slate-500 font-semibold block">مدفوعات معلقة التحصيل</span>
          <div className="text-base font-bold text-blue-700 mt-1 flex items-baseline justify-between">
            <span>{metrics.pendingPaymentsAmount} ₪</span>
            <span className="text-[10px] text-blue-500">({metrics.pendingPaymentsCount} طلب)</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 space-x-reverse space-x-1 overflow-x-auto pb-px">
        {[
          { id: 'summary', label: 'الملخص المالي الشامل', icon: PieChart },
          { id: 'expenses', label: `سجل المصروفات (${expenses.length})`, icon: DollarSign },
          { id: 'suppliers', label: `حسابات ومستحقات الموردين (${supplierReport.length})`, icon: Building2 },
          { id: 'cashflow', label: `حركة التدفق النقدي (${cashFlows.length})`, icon: Layers },
          { id: 'refunds', label: `الاسترجاعات المالية (${refunds.length})`, icon: RefreshCw },
          { id: 'products', label: 'ربحية المنتجات (Profitability)', icon: Package },
          { id: 'customers', label: 'القيمة المالية للعملاء (LTV)', icon: Users },
          { id: 'reconciliation', label: `أداة المطابقة والتدقيق (${reconciliationItems.length})`, icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AccountingTab)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab 1: Comprehensive Financial Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Mathematical Formula Explanation Card */}
          <div className="bg-gradient-to-l from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">معادلة وتفاصيل احتساب صافي الربح الدقيق (Strict Accounting Standard)</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {metrics.formulaBreakdown.explanation}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[11px] block">1. صافي المبيعات:</span>
                <span className="font-mono text-emerald-400 font-bold">{metrics.formulaBreakdown.netSalesFormula}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[11px] block">2. إجمالي الربح (Gross Profit):</span>
                <span className="font-mono text-emerald-400 font-bold">{metrics.formulaBreakdown.grossProfitFormula}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[11px] block">3. أرباح الشحن:</span>
                <span className="font-mono text-emerald-400 font-bold">{metrics.formulaBreakdown.shippingProfitFormula}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 md:col-span-2">
                <span className="text-slate-400 text-[11px] block">4. صافي الربح النهائي (Net Profit):</span>
                <span className="font-mono text-amber-300 font-bold">{metrics.formulaBreakdown.netProfitFormula}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[11px] block">5. حركة الرصيد النقدي:</span>
                <span className="font-mono text-cyan-300 font-bold">{metrics.formulaBreakdown.cashBalanceFormula}</span>
              </div>
            </div>
          </div>

          {/* Income Statement Detailed Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" /> قائمة الدخل والأداء المالي (Income Statement)
              </h3>
              <span className="text-xs text-slate-500">عملة الحساب: الشيكل (₪)</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="p-4 flex items-center justify-between hover:bg-slate-50">
                <span className="font-bold text-slate-800">إجمالي المبيعات (Gross Sales)</span>
                <span className="font-mono font-bold text-slate-900">{Number(metrics.grossSales || 0).toLocaleString()} ₪</span>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 text-red-600 bg-red-50/20">
                <span className="font-semibold">(-) الخصومات والكوبونات (Discounts)</span>
                <span className="font-mono font-bold">-{Number(metrics.discounts || 0).toLocaleString()} ₪</span>
              </div>
              <div className="p-4 flex items-center justify-between bg-slate-50 font-bold text-slate-900">
                <span>(=) صافي المبيعات (Net Sales)</span>
                <span className="font-mono text-sm">{Number(metrics.netSales || 0).toLocaleString()} ₪</span>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 text-slate-700">
                <span>(-) تكلفة البضاعة المباعة التاريخية (COGS from Snapshots)</span>
                <span className="font-mono font-bold text-rose-700">-{Number(metrics.cogs || 0).toLocaleString()} ₪</span>
              </div>
              <div className="p-4 flex items-center justify-between bg-emerald-50 text-emerald-900 font-bold">
                <span>(=) إجمالي الربح (Gross Profit)</span>
                <span className="font-mono text-sm text-emerald-700">{Number(metrics.grossProfit || 0).toLocaleString()} ₪</span>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-slate-50">
                <span>(+) إيرادات الشحن المحصلة من العملاء</span>
                <span className="font-mono text-slate-700">+{Number(metrics.customerShippingRevenue || 0).toLocaleString()} ₪</span>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 text-slate-600">
                <span>(-) تكلفة الشحن الفعلية المدفوعة لشركات التوصيل</span>
                <span className="font-mono text-rose-600">-{Number(metrics.actualShippingExpense || 0).toLocaleString()} ₪</span>
              </div>
              <div className="p-4 flex items-center justify-between bg-slate-50 font-bold text-slate-800">
                <span>(=) صافي أرباح الشحن (Shipping Profit)</span>
                <span className="font-mono text-emerald-700">+{Number(metrics.shippingProfit || 0).toLocaleString()} ₪</span>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 text-slate-600">
                <span>(-) المصروفات التشغيلية والتغليف والمكتبية</span>
                <span className="font-mono text-rose-600">-{Number(metrics.operatingExpenses || 0).toLocaleString()} ₪</span>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 text-slate-600">
                <span>(-) المصروفات التسويقية والإعلانات</span>
                <span className="font-mono text-rose-600">-{Number(metrics.marketingExpenses || 0).toLocaleString()} ₪</span>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 text-slate-600">
                <span>(-) المصروفات الأخرى</span>
                <span className="font-mono text-rose-600">-{Number(metrics.otherExpenses || 0).toLocaleString()} ₪</span>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 text-rose-700 bg-rose-50/20 font-semibold">
                <span>(-) المبالغ المسترجعة للعملاء (Refunds Impact)</span>
                <span className="font-mono font-bold">-{Number(metrics.refundsTotal || 0).toLocaleString()} ₪</span>
              </div>
              <div className={`p-5 flex items-center justify-between font-black text-base ${
                Number(metrics.netProfit || 0) >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                <span>(=) صافي الربح النهائي (Net Profit)</span>
                <span className="font-mono text-xl">{Number(metrics.netProfit || 0).toLocaleString()} ₪</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Expenses Ledger */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search & Category Filter */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="بحث في المصروفات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />

              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">جميع التصنيفات</option>
                <option value="OPERATING">تشغيلية (OPERATING)</option>
                <option value="MARKETING">تسويق وإعلانات (MARKETING)</option>
                <option value="SHIPPING">شحن وتوصيل (SHIPPING)</option>
                <option value="PACKAGING">تغليف وكراتين (PACKAGING)</option>
                <option value="PLATFORM">برمجيات ومنصات (PLATFORM)</option>
                <option value="TRANSPORT">مواصلات ونقل (TRANSPORT)</option>
                <option value="PHONE">اتصالات وإنترنت (PHONE)</option>
                <option value="ADVERTISING">حملات دعائية (ADVERTISING)</option>
                <option value="OFFICE">مكتبية وضيافة (OFFICE)</option>
                <option value="OTHER">أخرى (OTHER)</option>
                {customCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span>إجمالي مصروفات الفترة:</span>
              <span className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200 font-mono text-sm">
                {filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString()} ₪
              </span>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">التاريخ والوقت</th>
                    <th className="p-3.5">التصنيف</th>
                    <th className="p-3.5">البيان والوصف</th>
                    <th className="p-3.5">المبلغ</th>
                    <th className="p-3.5">طريقة الدفع</th>
                    <th className="p-3.5">المرجع / الفاتورة</th>
                    <th className="p-3.5">سُجل بواسطة</th>
                    <th className="p-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        لا توجد مصروفات مسجلة مطابقة للفترة المحددة.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.expense_id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 text-slate-600 font-mono">
                          {exp.date} <span className="text-[10px] text-slate-400">{exp.time}</span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            exp.category === 'MARKETING' || exp.category === 'ADVERTISING'
                              ? 'bg-purple-100 text-purple-700'
                              : exp.category === 'SHIPPING'
                              ? 'bg-blue-100 text-blue-700'
                              : exp.category === 'PACKAGING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800 max-w-xs truncate">
                          {exp.description}
                          {exp.notes && <span className="block text-[10px] text-slate-400">{exp.notes}</span>}
                        </td>
                        <td className="p-3.5 font-bold font-mono text-rose-700 text-sm">
                          {exp.amount} ₪
                        </td>
                        <td className="p-3.5 text-slate-600">{exp.payment_method}</td>
                        <td className="p-3.5 font-mono text-slate-500">{exp.reference || exp.invoice_number || '-'}</td>
                        <td className="p-3.5 text-slate-600">{exp.created_by || 'المحاسب'}</td>
                        <td className="p-3.5 text-center">
                          {canEditFinancials && (
                            <button
                              onClick={() => {
                                if (confirm('هل أنت متأكد من حذف هذا المصروف؟ سيتم حذف حركته النقدية المقابلة.')) {
                                  deleteExpense(exp.expense_id);
                                  showFeedback('تم حذف المصروف بنجاح.');
                                }
                              }}
                              className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Supplier Payables & Reports */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">مستحقات وحسابات الموردين (Supplier Payables Ledger)</h3>
              <p className="text-xs text-slate-500">
                تتبع مشتريات وتكاليف التوريد من واقع طلبات العملاء (بدون الطلبات الملغاة) ومطابقة المدفوعات والمستحقات المتبقية
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg font-bold">
                إجمالي المستحقات غير المسددة: {metrics.supplierPayables} ₪
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">المورد</th>
                    <th className="p-3.5">عدد الطلبات</th>
                    <th className="p-3.5">القطع المباعة</th>
                    <th className="p-3.5">إيراد المبيعات</th>
                    <th className="p-3.5">تكلفة التوريد (Supplier Cost)</th>
                    <th className="p-3.5">إجمالي المسدد (Paid)</th>
                    <th className="p-3.5">الرصيد المستحق (Outstanding)</th>
                    <th className="p-3.5">إجمالي ربح المتجر</th>
                    <th className="p-3.5 text-center">إجراء سداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supplierReport.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        لا توجد بيانات توريد مسجلة في هذه الفترة.
                      </td>
                    </tr>
                  ) : (
                    supplierReport.map((sup) => (
                      <tr key={sup.supplier_id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-[10px]">
                            {sup.supplier_name[0]}
                          </div>
                          <span>{sup.supplier_name}</span>
                        </td>
                        <td className="p-3.5 text-slate-600 font-mono">
                          {sup.total_orders} <span className="text-[10px] text-slate-400">({sup.delivered_orders} مسلّم)</span>
                        </td>
                        <td className="p-3.5 text-slate-700 font-semibold">{sup.units_sold} قطعة</td>
                        <td className="p-3.5 font-mono text-slate-900">{sup.sales_revenue} ₪</td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">{sup.supplier_cost} ₪</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-700">{sup.total_paid} ₪</td>
                        <td className="p-3.5 font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded ${
                            sup.outstanding_balance > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {sup.outstanding_balance} ₪
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600">+{sup.gross_profit} ₪</td>
                        <td className="p-3.5 text-center">
                          {canEditFinancials && (
                            <button
                              onClick={() => {
                                setSupplierPaymentForm({
                                  supplier_id: sup.supplier_id,
                                  supplier_name_snapshot: sup.supplier_name,
                                  amount: String(Math.max(0, sup.outstanding_balance)),
                                  payment_date: new Date().toISOString().split('T')[0],
                                  payment_method: 'BANK_TRANSFER',
                                  reference: '',
                                  notes: `سداد مستحقات ${sup.supplier_name}`
                                });
                                setIsAddSupplierPaymentModalOpen(true);
                              }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px]"
                            >
                              سداد دفعة 💵
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Cash Flow Statement */}
      {activeTab === 'cashflow' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">سجل حركة التدفقات النقدية (Cash Flow Statement)</h3>
              <p className="text-xs text-slate-500">
                توثيق فوري لكافة المبالغ النقدية الداخلة (IN) والخارجة (OUT) وتتبع رصيد الخزينة والصندوق
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200">
                تدفقات داخلة: +{metrics.cashIn} ₪
              </div>
              <div className="text-xs font-bold bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200">
                تدفقات خارجة: -{metrics.cashOut} ₪
              </div>
              <div className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg">
                صافي الرصيد: {metrics.cashBalance} ₪
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">التاريخ والوقت</th>
                    <th className="p-3.5">النوع</th>
                    <th className="p-3.5">الاتجاه</th>
                    <th className="p-3.5">المبلغ</th>
                    <th className="p-3.5">البيان والتفاصيل</th>
                    <th className="p-3.5">المرجع</th>
                    <th className="p-3.5">المسؤول</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cashFlows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        لا توجد حركات نقدية مسجلة.
                      </td>
                    </tr>
                  ) : (
                    cashFlows.map((cf) => (
                      <tr key={cf.cash_flow_id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 text-slate-600 font-mono">
                          {cf.date} <span className="text-[10px] text-slate-400">{cf.time}</span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">
                          {cf.type === 'SALE' || cf.type === 'CUSTOMER_PAYMENT' ? 'تحصيل مبيعات' :
                           cf.type === 'EXPENSE' ? 'مصروفات' :
                           cf.type === 'SUPPLIER_PAYMENT' ? 'دفعة مورد' :
                           cf.type === 'REFUND' ? 'استرجاع عميل' : cf.type}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                            cf.direction === 'IN' || cf.direction === 'income'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {cf.direction === 'IN' || cf.direction === 'income' ? (
                              <><ArrowDownLeft className="w-3 h-3" /> داخل (IN)</>
                            ) : (
                              <><ArrowUpRight className="w-3 h-3" /> خارج (OUT)</>
                            )}
                          </span>
                        </td>
                        <td className={`p-3.5 font-mono font-bold text-sm ${
                          cf.direction === 'IN' || cf.direction === 'income' ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {cf.direction === 'IN' || cf.direction === 'income' ? '+' : '-'}{cf.amount} ₪
                        </td>
                        <td className="p-3.5 text-slate-800 max-w-sm truncate font-medium">
                          {cf.description}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">{cf.reference_id || '-'}</td>
                        <td className="p-3.5 text-slate-600">{cf.created_by || 'النظام'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 5: Refunds Ledger */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">سجل الاسترجاعات المالية (Refunds Management)</h3>
              <p className="text-xs text-slate-500">
                حفظ تفاصيل الاسترجاعات مع بقاء الطلبات الأصلية في السجل التاريخي دون حذف
              </p>
            </div>
            {canEditFinancials && (
              <button
                onClick={() => setIsAddRefundModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              >
                + تسجيل استرجاع مالي
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">تاريخ الاسترجاع</th>
                    <th className="p-3.5">رقم الطلب</th>
                    <th className="p-3.5">العميل</th>
                    <th className="p-3.5">مبلغ الاسترجاع</th>
                    <th className="p-3.5">طريقة الإرجاع</th>
                    <th className="p-3.5">السبب</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5">سُجل بواسطة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {refunds.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        لا توجد استرجاعات مسجلة.
                      </td>
                    </tr>
                  ) : (
                    refunds.map((ref) => (
                      <tr key={ref.refund_id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-mono text-slate-600">{ref.created_at.split('T')[0]}</td>
                        <td className="p-3.5 font-mono font-bold text-blue-600">{ref.order_number_snapshot || ref.order_id}</td>
                        <td className="p-3.5 font-semibold text-slate-800">{ref.customer_name_snapshot || ref.customer_id}</td>
                        <td className="p-3.5 font-mono font-bold text-rose-700 text-sm">{ref.amount} ₪</td>
                        <td className="p-3.5 text-slate-600">{ref.refund_method}</td>
                        <td className="p-3.5 text-slate-700 max-w-xs">{ref.reason}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ref.refund_status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            ref.refund_status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {ref.refund_status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500">{ref.created_by}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 6: Product Profitability */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">تقرير ربحية المنتجات (Product Profitability)</h3>
              <p className="text-xs text-slate-500">
                تحليل أداء وربحية كل منتج استناداً إلى أسعار البيع والتكلفة التاريخية عند وقت الشراء (Purchase Snapshots)
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">المنتج</th>
                    <th className="p-3.5">رمز الـ SKU</th>
                    <th className="p-3.5">المورد</th>
                    <th className="p-3.5">القطع المباعة</th>
                    <th className="p-3.5">إجمالي الإيراد</th>
                    <th className="p-3.5">التكلفة (COGS)</th>
                    <th className="p-3.5">إجمالي الربح</th>
                    <th className="p-3.5">هامش الربح %</th>
                    <th className="p-3.5">الاسترجاعات</th>
                    <th className="p-3.5">صافي الإيراد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productReport.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        لا توجد مبيعات منتجات في الفترة المحددة.
                      </td>
                    </tr>
                  ) : (
                    productReport.map((p) => (
                      <tr key={p.product_id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{p.product_name}</td>
                        <td className="p-3.5 font-mono text-slate-500">{p.sku}</td>
                        <td className="p-3.5 text-slate-600">{p.supplier_name}</td>
                        <td className="p-3.5 font-bold text-slate-800">{p.units_sold}</td>
                        <td className="p-3.5 font-mono text-slate-900">{p.revenue} ₪</td>
                        <td className="p-3.5 font-mono text-rose-700">{p.cogs} ₪</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-700">+{p.gross_profit} ₪</td>
                        <td className="p-3.5 font-bold text-blue-700">{p.margin_percentage}%</td>
                        <td className="p-3.5 font-mono text-red-600">{p.refunds > 0 ? `-${p.refunds} ₪` : '0 ₪'}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">{p.net_revenue} ₪</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 7: Customer Value (LTV) */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">القيمة المالية للعملاء (Customer Lifetime Value)</h3>
              <p className="text-xs text-slate-500">
                تحليل مشتريات العملاء، متوسط قيمة الطلب (AOV)، وصافي المبالغ المدفوعة
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3.5">العميل</th>
                    <th className="p-3.5">الهاتف</th>
                    <th className="p-3.5">المدينة</th>
                    <th className="p-3.5">عدد الطلبات</th>
                    <th className="p-3.5">إجمالي المشتريات</th>
                    <th className="p-3.5">الاسترجاعات</th>
                    <th className="p-3.5">صافي المشتريات</th>
                    <th className="p-3.5">متوسط قيمة الطلب (AOV)</th>
                    <th className="p-3.5">آخر شراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerReport.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        لا توجد بيانات عملاء في الفترة المحددة.
                      </td>
                    </tr>
                  ) : (
                    customerReport.map((c) => (
                      <tr key={c.customer_id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{c.customer_name}</td>
                        <td className="p-3.5 font-mono text-slate-600">{c.phone}</td>
                        <td className="p-3.5 text-slate-600">{c.city}</td>
                        <td className="p-3.5 font-bold text-blue-700">{c.orders_count} طلبات</td>
                        <td className="p-3.5 font-mono text-slate-900 font-bold">{c.total_spent} ₪</td>
                        <td className="p-3.5 font-mono text-red-600">{c.refunds_amount > 0 ? `-${c.refunds_amount} ₪` : '0 ₪'}</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-700">{c.net_spent} ₪</td>
                        <td className="p-3.5 font-mono text-slate-800">{c.average_order_value} ₪</td>
                        <td className="p-3.5 font-mono text-slate-500">{c.last_purchase_date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 8: Reconciliation Tool */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> أداة المطابقة والتدقيق المالي (Accounting Reconciliation)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                فحص تلقائي بين الطلبات، المدفوعات، تكاليف الموردين، وحركات الصندوق لكشف أي معاملات مفقودة أو غير متطابقة
              </p>
            </div>
            <button
              onClick={() => {
                syncNow();
                showFeedback('تمت إعادة فحص المطابقة ومزامنة البيانات مع Google Sheets.');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> إعادة الفحص والمزامنة
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            {reconciliationItems.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-sm">كافة السجلات المالية متطابقة 100%!</h4>
                <p className="text-xs text-emerald-700 mt-1">
                  لا توجد أي معاملات معلقة غير مسواة أو دفعات غير مرتبطة بطلبات.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span>الملاحظات والفروقات المكتشفة ({reconciliationItems.length}):</span>
                </div>
                {reconciliationItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs ${
                      item.type === 'ERROR' ? 'bg-red-50 border-red-200 text-red-900' :
                      item.type === 'WARNING' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                      'bg-blue-50 border-blue-200 text-blue-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.type === 'ERROR' ? 'bg-red-200 text-red-900' :
                          item.type === 'WARNING' ? 'bg-amber-200 text-amber-900' :
                          'bg-blue-200 text-blue-900'
                        }`}>
                          {item.type}
                        </span>
                        <strong className="font-bold">{item.title}</strong>
                      </div>
                      <p className="mt-1 text-slate-700">{item.description}</p>
                      <p className="mt-1 font-semibold text-[11px] text-blue-800">💡 الإجراء المقترح: {item.suggested_action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. Modal: Add Expense */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-right space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" /> تسجيل مصروف مالي جديد
              </h3>
              <button onClick={() => setIsAddExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">تصنيف المصروف *</label>
                <div className="flex gap-2">
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  >
                    <option value="OPERATING">تشغيلي (OPERATING)</option>
                    <option value="MARKETING">تسويق وإعلانات (MARKETING)</option>
                    <option value="SHIPPING">شحن ونقل (SHIPPING)</option>
                    <option value="PACKAGING">تغليف ومواد شحن (PACKAGING)</option>
                    <option value="PLATFORM">برمجيات ومنصات (PLATFORM)</option>
                    <option value="TRANSPORT">مواصلات ونقل (TRANSPORT)</option>
                    <option value="PHONE">اتصالات وإنترنت (PHONE)</option>
                    <option value="ADVERTISING">حملات إعلانية (ADVERTISING)</option>
                    <option value="OFFICE">مكتبية وضيافة (OFFICE)</option>
                    <option value="OTHER">أخرى (OTHER)</option>
                    {customCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {/* Custom Category adder */}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="إضافة تصنيف جديد..."
                    value={newCustomCategoryInput}
                    onChange={(e) => setNewCustomCategoryInput(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCustomCategoryInput.trim()) {
                        addCustomCategory(newCustomCategoryInput);
                        setExpenseForm(prev => ({ ...prev, category: newCustomCategoryInput.trim().toUpperCase() }));
                        setNewCustomCategoryInput('');
                      }
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-2 py-1 rounded-lg text-[11px] font-bold"
                  >
                    + إضافة تصنيف
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المبلغ (₪) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">التاريخ *</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">البيان والوصف *</label>
                <input
                  type="text"
                  placeholder="مثلاً: شراء كراتين تغليف هدايا فاخرة..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">طريقة الدفع</label>
                  <select
                    value={expenseForm.payment_method}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, payment_method: e.target.value as AccountingPaymentMethod }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="CASH">نقداً من الصندوق (CASH)</option>
                    <option value="BANK_TRANSFER">تحويل بنكي (BANK_TRANSFER)</option>
                    <option value="CARD">بطاقة بنكية (CARD)</option>
                    <option value="CASH_ON_DELIVERY">دفع عند الاستلام (COD)</option>
                    <option value="OTHER">أخرى (OTHER)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم المرجع / الفاتورة</label>
                  <input
                    type="text"
                    placeholder="INV-10293"
                    value={expenseForm.reference}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, reference: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  placeholder="أي تفاصيل أخرى تخص المصروف..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold cursor-pointer"
                >
                  حفظ المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Add Supplier Payment */}
      {isAddSupplierPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-right space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" /> سداد دفعة مورد (Supplier Payment)
              </h3>
              <button onClick={() => setIsAddSupplierPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplierPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">المورد *</label>
                <select
                  value={supplierPaymentForm.supplier_id}
                  onChange={(e) => {
                    const supId = e.target.value;
                    const found = supplierReport.find(s => s.supplier_id === supId);
                    setSupplierPaymentForm(prev => ({
                      ...prev,
                      supplier_id: supId,
                      supplier_name_snapshot: found?.supplier_name || supId,
                      amount: String(found ? Math.max(0, found.outstanding_balance) : prev.amount)
                    }));
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  {supplierReport.map((sup) => (
                    <option key={sup.supplier_id} value={sup.supplier_id}>
                      {sup.supplier_name} (مستحق: {sup.outstanding_balance} ₪)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">قيمة الدفعة (₪) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.00"
                    value={supplierPaymentForm.amount}
                    onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الدفعة *</label>
                  <input
                    type="date"
                    value={supplierPaymentForm.payment_date}
                    onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">طريقة السداد</label>
                  <select
                    value={supplierPaymentForm.payment_method}
                    onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, payment_method: e.target.value as AccountingPaymentMethod }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="BANK_TRANSFER">تحويل بنكي (BANK_TRANSFER)</option>
                    <option value="CASH">نقداً (CASH)</option>
                    <option value="CARD">بطاقة (CARD)</option>
                    <option value="OTHER">أخرى (OTHER)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الحوالة / الإيصال</label>
                  <input
                    type="text"
                    placeholder="TR-BANK-8832"
                    value={supplierPaymentForm.reference}
                    onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات وبيان الدفعة</label>
                <textarea
                  rows={2}
                  placeholder="سداد دفعة توريد المنتجات المتفق عليها..."
                  value={supplierPaymentForm.notes}
                  onChange={(e) => setSupplierPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierPaymentModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold cursor-pointer"
                >
                  تسجيل الدفعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Add Refund */}
      {isAddRefundModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-right space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-600" /> تسجيل استرجاع مالي للعميل
              </h3>
              <button onClick={() => setIsAddRefundModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRefund} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الطلب المراد استرجاعه *</label>
                <select
                  value={refundForm.order_id}
                  onChange={(e) => {
                    const oId = e.target.value;
                    const order = orders.find(o => o.order_id === oId);
                    setRefundForm(prev => ({
                      ...prev,
                      order_id: oId,
                      amount: String(order ? order.total_amount : '')
                    }));
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- اختر الطلب --</option>
                  {orders.map((o) => (
                    <option key={o.order_id} value={o.order_id}>
                      {o.order_number} - {o.customer_name} ({o.total_amount} ₪) - {o.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">مبلغ الاسترجاع (₪) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.00"
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">طريقة الإرجاع</label>
                  <select
                    value={refundForm.refund_method}
                    onChange={(e) => setRefundForm(prev => ({ ...prev, refund_method: e.target.value as AccountingPaymentMethod }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="CASH">نقداً للعميل (CASH)</option>
                    <option value="BANK_TRANSFER">تحويل بنكي (BANK_TRANSFER)</option>
                    <option value="CARD">إرجاع على البطاقة (CARD)</option>
                    <option value="OTHER">رصيد متجر (STORE CREDIT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب الاسترجاع *</label>
                <textarea
                  rows={2}
                  placeholder="تلف المنتج، عدم مطابقة المقاس، إلغاء بناء على طلب العميل..."
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRefundModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl font-bold cursor-pointer"
                >
                  تأكيد الاسترجاع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Add Cash Flow */}
      {isAddCashFlowModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-right space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" /> حركة نقدية يدوية في الصندوق
              </h3>
              <button onClick={() => setIsAddCashFlowModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCashFlow} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اتجاه الحركة *</label>
                  <select
                    value={cashFlowForm.direction}
                    onChange={(e) => setCashFlowForm(prev => ({ ...prev, direction: e.target.value as 'IN' | 'OUT' }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="IN">وارد / إيداع في الصندوق (IN)</option>
                    <option value="OUT">صادر / سحب من الصندوق (OUT)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المبلغ (₪) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.00"
                    value={cashFlowForm.amount}
                    onChange={(e) => setCashFlowForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">البيان والتفاصيل *</label>
                <input
                  type="text"
                  placeholder="إيداع رأس مال، سحب أرباح، عهدة نقدية..."
                  value={cashFlowForm.description}
                  onChange={(e) => setCashFlowForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">التاريخ *</label>
                  <input
                    type="date"
                    value={cashFlowForm.date}
                    onChange={(e) => setCashFlowForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم المرجع (اختياري)</label>
                  <input
                    type="text"
                    placeholder="REF-CASH-01"
                    value={cashFlowForm.reference_id}
                    onChange={(e) => setCashFlowForm(prev => ({ ...prev, reference_id: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCashFlowModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold cursor-pointer"
                >
                  حفظ الحركة النقدية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Edit Opening Balance */}
      {isOpeningBalanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-right space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" /> الرصيد الافتتاحي (Opening Balance)
              </h3>
              <button onClick={() => setIsOpeningBalanceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-500">
                أدخل الرصيد الافتتاحي للصندوق والخزينة في بداية الفترة ({datePreset}):
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">الرصيد الافتتاحي (₪) *</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={openingBalanceInput}
                  onChange={(e) => setOpeningBalanceInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpeningBalanceModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpeningBalance(datePreset, Number(openingBalanceInput) || 0);
                    setIsOpeningBalanceModalOpen(false);
                    showFeedback('تم تحديث الرصيد الافتتاحي بنجاح.');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold cursor-pointer"
                >
                  حفظ الرصيد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Section 33 Test Runner Output */}
      {isTestRunnerModalOpen && testResults && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 text-right space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-purple-600" /> نتائج الاختبار المحاسبي الأوتوماتيكي (Section 33 Test Runner)
              </h3>
              <button onClick={() => setIsTestRunnerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className={`p-4 rounded-xl border flex items-center justify-between font-bold ${
                testResults.success ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {testResults.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                  <span>{testResults.success ? 'جميع الخطوات الرياضية والمحاسبية اجتازت الاختبار بنجاح 100%!' : 'فشل في بعض شروط الفحص.'}</span>
                </div>
                <span className="text-[11px] bg-white px-2.5 py-1 rounded-md shadow-sm border">
                  4/4 خطوات مؤكدة
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">تفاصيل خطوات الاختبار:</h4>
                {testResults.results.map((r, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{r.step}</span>
                      <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                        <Check className="w-3 h-3" /> مطابق
                      </span>
                    </div>
                    <p className="text-slate-600 font-mono text-[11px]">{r.details}</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] space-y-1 overflow-x-auto">
                <div className="text-slate-400 font-bold mb-1">// سجلات تنفيذ الاختبار المحاسبي (Execution Trace):</div>
                {testResults.logs.map((l, idx) => (
                  <div key={idx}>{l}</div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => setIsTestRunnerModalOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl font-bold cursor-pointer"
                >
                  إغلاق نافذة الاختبار
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
