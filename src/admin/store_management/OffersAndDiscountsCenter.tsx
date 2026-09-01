import React, { useState } from 'react';
import { useStoreManagement } from '../../contexts/StoreContext';
import { useProducts } from '../../contexts/ProductContext';
import { Offer, OfferType, Coupon } from '../../types';
import { 
  Tag, Percent, Zap, Gift, Truck, Plus, Trash2, Edit3, Check, 
  X, AlertTriangle, Clock, Calendar, Sparkles, ShieldAlert, ArrowRight
} from 'lucide-react';

export const OffersAndDiscountsCenter: React.FC = () => {
  const { offers, addOffer, updateOffer, deleteOffer, toggleOffer, coupons, addCoupon, updateCoupon, deleteCoupon } = useStoreManagement();
  const { products } = useProducts();

  const [activeTab, setActiveTab] = useState<'offers' | 'flash_sales' | 'coupons'>('offers');
  const [showOfferWizard, setShowOfferWizard] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);

  // Offer Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerType, setOfferType] = useState<OfferType>('percentage');
  const [offerValue, setOfferValue] = useState<number>(20);
  const [targetType, setTargetType] = useState<'all' | 'products' | 'categories'>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
  const [isFlashSale, setIsFlashSale] = useState(false);

  // Coupon Form State
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscountType, setCouponDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponValue, setCouponValue] = useState<number>(15);
  const [couponMinSpend, setCouponMinSpend] = useState<number>(100);
  const [couponLimit, setCouponLimit] = useState<number>(100);

  // Handle Create Offer
  const handleCreateOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle.trim()) return;

    // Safety check: warning if discount is higher than 80%
    if (offerType === 'percentage' && offerValue > 85) {
      if (!confirm('⚠️ تحذير أمان: قيمة الخصم عالية جداً (> 85%). هل أنت متأكد من التفعيل؟')) return;
    }

    addOffer({
      title: offerTitle,
      description: offerDescription,
      type: offerType,
      value: Number(offerValue),
      target_type: targetType,
      target_ids: selectedProductIds,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      active: true,
      is_flash_sale: isFlashSale
    });

    resetWizard();
  };

  const resetWizard = () => {
    setShowOfferWizard(false);
    setWizardStep(1);
    setOfferTitle('');
    setOfferDescription('');
    setOfferType('percentage');
    setOfferValue(20);
    setTargetType('all');
    setSelectedProductIds([]);
    setIsFlashSale(false);
  };

  // Handle Create Coupon
  const handleCreateCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    addCoupon({
      code: couponCode.trim().toUpperCase(),
      discount_type: couponDiscountType,
      discount_value: Number(couponValue),
      min_spend: Number(couponMinSpend),
      usage_limit: Number(couponLimit),
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000 * 30).toISOString(),
      status: 'active'
    });

    setShowCouponModal(false);
    setCouponCode('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            مركز العروض والخصومات والكوبونات (Offers & Discounts Center)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة عروض الفلاش سيل، التخفيضات المحدودة بوقت، وكوبونات الخصم الحصرية.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setIsFlashSale(true);
              setShowOfferWizard(true);
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Zap className="w-4 h-4" /> فلاش سيل ⚡
          </button>
          <button
            onClick={() => {
              setIsFlashSale(false);
              setShowOfferWizard(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> عرض خصم جديد
          </button>
          <button
            onClick={() => setShowCouponModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Gift className="w-4 h-4" /> إضافة كوبون
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold w-fit">
        <button
          onClick={() => setActiveTab('offers')}
          className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'offers' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
          }`}
        >
          العروض العامة ({offers.filter(o => !o.is_flash_sale).length})
        </button>
        <button
          onClick={() => setActiveTab('flash_sales')}
          className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'flash_sales' ? 'bg-white text-amber-800 shadow-xs font-black' : 'text-slate-600'
          }`}
        >
          عروض الفلاش السريعة ⚡ ({offers.filter(o => o.is_flash_sale).length})
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
            activeTab === 'coupons' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          كوبونات الخصم ({coupons.length})
        </button>
      </div>

      {/* TAB 1 & 2: Offers & Flash Sales */}
      {(activeTab === 'offers' || activeTab === 'flash_sales') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers
            .filter(o => activeTab === 'flash_sales' ? o.is_flash_sale : !o.is_flash_sale)
            .map(offer => (
              <div 
                key={offer.id} 
                className={`p-5 rounded-2xl border bg-white shadow-xs space-y-3 flex flex-col justify-between ${
                  offer.is_flash_sale ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      offer.is_flash_sale ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {offer.is_flash_sale ? 'فلاش سيل ⚡' : 'خصم ترويجي'}
                    </span>
                    <button
                      onClick={() => toggleOffer(offer.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        offer.active ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {offer.active ? 'مفّعل' : 'مُعطّل'}
                    </button>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{offer.title}</h3>
                  {offer.description && <p className="text-xs text-slate-500">{offer.description}</p>}

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-600">قيمة الخصم:</span>
                      <span className="text-emerald-700 font-extrabold">
                        {offer.type === 'percentage' ? `${offer.value}%` : `${offer.value} ₪`}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>ينتهي بتاريخ:</span>
                      <span>{new Date(offer.end_date).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      if (confirm(`حذف العرض "${offer.title}"؟`)) deleteOffer(offer.id);
                    }}
                    className="text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    حذف العرض
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* TAB 3: Coupons */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map(coupon => (
            <div key={coupon.coupon_id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-slate-900 text-amber-400 font-mono font-extrabold rounded-lg text-xs tracking-wider">
                  {coupon.code}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  coupon.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {coupon.status === 'active' ? 'نشط' : 'غير نشط'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-600">قيمة الخصم:</span>
                  <span className="text-emerald-700 font-extrabold">
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value} ₪`}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>الحد الأدنى للطلب:</span>
                  <span>{coupon.min_spend || 0} ₪</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>مرات الاستخدام:</span>
                  <span>{coupon.used_count} / {coupon.usage_limit || '∞'}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t">
                <button
                  onClick={() => deleteCoupon(coupon.coupon_id)}
                  className="text-xs text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg font-bold cursor-pointer"
                >
                  حذف الكوبون
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OFFER WIZARD MODAL */}
      {showOfferWizard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                {isFlashSale ? 'معالج إنشاء فلاش سيل ⚡' : 'معالج إنشاء عرض خصم جديد'}
              </h3>
              <button onClick={resetWizard} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOfferSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان العرض الترويجي:</label>
                <input
                  type="text"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder="مثال: خصم 20% بمناسبة الموسم"
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">نوع الخصم:</label>
                  <select
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed_amount">مبلغ ثابت (₪)</option>
                    <option value="free_shipping">توصيل مجاني</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">قيمة الخصم:</label>
                  <input
                    type="number"
                    value={offerValue}
                    onChange={(e) => setOfferValue(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">تاريخ البدء:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">تاريخ الانتهاء:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={resetWizard}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                >
                  تفعيل وتفعيل العرض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUPON MODAL */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">إنشاء كوبون خصم جديد</h3>
              <button onClick={() => setShowCouponModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCouponSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">كود الكوبون (Coupon Code):</label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="ELITE2026"
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono uppercase font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">نوع الخصم:</label>
                  <select
                    value={couponDiscountType}
                    onChange={(e) => setCouponDiscountType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (₪)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">قيمة الخصم:</label>
                  <input
                    type="number"
                    value={couponValue}
                    onChange={(e) => setCouponValue(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الحد الأدنى للشراء (₪):</label>
                  <input
                    type="number"
                    value={couponMinSpend}
                    onChange={(e) => setCouponMinSpend(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">عدد مرات الاستخدام المسموحة:</label>
                  <input
                    type="number"
                    value={couponLimit}
                    onChange={(e) => setCouponLimit(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800"
                >
                  حفظ وتفعيل الكوبون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
