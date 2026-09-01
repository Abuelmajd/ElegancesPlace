import React, { useState, useEffect } from 'react';
import { 
  Calculator, DollarSign, TrendingUp, Sparkles, Percent, Truck, 
  Megaphone, Receipt, Check, Info, ArrowRight, HelpCircle, ShieldCheck, 
  RefreshCw, Scale, ChevronDown, ChevronUp, PieChart
} from 'lucide-react';

export interface PricingCalculatorResult {
  wholesaleCost: number;
  shippingCost: number;
  adCost: number;
  taxAndFeesCost: number;
  totalCostPerUnit: number;
  calculatedPrice: number;
  calculatedOriginalPrice: number;
  netProfitPerUnit: number;
  netMarginPercent: number;
  roiPercent: number;
}

interface SmartPricingCalculatorProps {
  initialCost?: number;
  initialSellingPrice?: number;
  onApplyPrices?: (price: number, originalPrice: number, costPrice: number) => void;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const SmartPricingCalculator: React.FC<SmartPricingCalculatorProps> = ({
  initialCost = 50,
  initialSellingPrice = 120,
  onApplyPrices,
  onClose,
  isEmbedded = false
}) => {
  // Inputs
  const [wholesaleCost, setWholesaleCost] = useState<number>(initialCost || 50);
  const [shippingCost, setShippingCost] = useState<number>(10);
  const [adCost, setAdCost] = useState<number>(15);
  const [taxFeesPercent, setTaxFeesPercent] = useState<number>(5);

  // Strategy & Parameters
  const [strategy, setStrategy] = useState<'target_margin' | 'markup_percent' | 'fixed_profit' | 'ecom_3x'>('target_margin');
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(35); // 35% target gross margin
  const [markupPercent, setMarkupPercent] = useState<number>(60); // 60% markup over costs
  const [fixedProfit, setFixedProfit] = useState<number>(40); // 40 NIS profit
  const [suggestedDiscount, setSuggestedDiscount] = useState<number>(20); // 20% fake discount for originalPrice
  const [usePsychologicalPricing, setUsePsychologicalPricing] = useState<boolean>(true); // .99 rounding

  // Educational Explanations Accordion
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Calculations
  const baseLandedCost = Number(wholesaleCost || 0) + Number(shippingCost || 0) + Number(adCost || 0);
  const taxFeesAmountPerUnit = baseLandedCost * (Number(taxFeesPercent || 0) / 100);
  const totalCostPerUnit = baseLandedCost + taxFeesAmountPerUnit;

  let rawSellingPrice = totalCostPerUnit;

  if (strategy === 'target_margin') {
    // Formula: Price = TotalCost / (1 - TargetMargin%)
    const marginDecimal = Math.min(Math.max(Number(targetMarginPercent || 0), 1), 90) / 100;
    rawSellingPrice = totalCostPerUnit / (1 - marginDecimal);
  } else if (strategy === 'markup_percent') {
    // Formula: Price = TotalCost * (1 + Markup%)
    rawSellingPrice = totalCostPerUnit * (1 + Number(markupPercent || 0) / 100);
  } else if (strategy === 'fixed_profit') {
    // Formula: Price = TotalCost + FixedProfit
    rawSellingPrice = totalCostPerUnit + Number(fixedProfit || 0);
  } else if (strategy === 'ecom_3x') {
    // Formula: Price = (Wholesale + Shipping) * 3
    const baseCogs = Number(wholesaleCost || 0) + Number(shippingCost || 0);
    rawSellingPrice = baseCogs * 3;
  }

  // Psychological Pricing Formatting (e.g. 99, 95, or nearest clean integer)
  let finalCalculatedPrice = Math.round(rawSellingPrice);
  if (usePsychologicalPricing && finalCalculatedPrice > 10) {
    // Round to nearest integer ending in 9 (e.g. 119, 129, 99)
    const roundedTens = Math.floor(finalCalculatedPrice / 10) * 10;
    finalCalculatedPrice = roundedTens + 9;
    if (finalCalculatedPrice < rawSellingPrice) {
      finalCalculatedPrice += 10;
    }
  }

  // Ensure price doesn't drop below total cost
  if (finalCalculatedPrice <= totalCostPerUnit) {
    finalCalculatedPrice = Math.ceil(totalCostPerUnit + 10);
  }

  // Calculate Suggested Original Price (Strikethrough price)
  const discountDecimal = Math.min(Math.max(Number(suggestedDiscount || 0), 0), 80) / 100;
  let rawOriginalPrice = discountDecimal > 0 ? finalCalculatedPrice / (1 - discountDecimal) : finalCalculatedPrice * 1.25;
  let finalOriginalPrice = Math.round(rawOriginalPrice);
  if (usePsychologicalPricing && finalOriginalPrice > 10) {
    finalOriginalPrice = Math.floor(finalOriginalPrice / 10) * 10 + 9;
    if (finalOriginalPrice <= finalCalculatedPrice) {
      finalOriginalPrice = finalCalculatedPrice + 20;
    }
  }

  // Net Profit & Margins
  const netProfit = finalCalculatedPrice - totalCostPerUnit;
  const netMarginPercent = finalCalculatedPrice > 0 ? (netProfit / finalCalculatedPrice) * 100 : 0;
  const roiPercent = totalCostPerUnit > 0 ? (netProfit / totalCostPerUnit) * 100 : 0;

  const handleApply = () => {
    if (onApplyPrices) {
      onApplyPrices(finalCalculatedPrice, finalOriginalPrice, totalCostPerUnit);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-right ${isEmbedded ? 'p-4 sm:p-6' : 'max-w-4xl w-full mx-auto p-5 sm:p-6'}`} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              حاسبة تسعير التجارة الإلكترونية الذكية
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                خوارزمية الربح المستهدف 📈
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              احسب سعر البيع النهائي بدقة بناءً على التكاليف الحقيقية، التسويق، والضرائب مع ضمان تحقيق هامش ربح مستهدف.
            </p>
          </div>
        </div>

        {onClose && (
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Main Column: Cost Breakdown Inputs & Strategy Selector */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Cost Inputs */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-slate-600" /> 1. تفكيك تكاليف القطعة الواحدة (Cost Breakdown per Unit)
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  سعر الشراء / الجملة (₪)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={wholesaleCost}
                    onChange={(e) => setWholesaleCost(Number(e.target.value))}
                    placeholder="مثال: 50"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute left-3 top-2.5 text-[11px] font-bold text-slate-400">₪</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  الشحن والجمارك للقطعة (₪)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Number(e.target.value))}
                    placeholder="مثال: 10"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute left-3 top-2.5 text-[11px] font-bold text-slate-400">₪</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                  تكلفة الإعلانات المقدرة/زبون (₪)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={adCost}
                    onChange={(e) => setAdCost(Number(e.target.value))}
                    placeholder="مثال: 15"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute left-3 top-2.5 text-[11px] font-bold text-slate-400">₪</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-purple-600" />
                  الضرائب ورسوم بوابة الدفع (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={taxFeesPercent}
                    onChange={(e) => setTaxFeesPercent(Number(e.target.value))}
                    placeholder="مثال: 5"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute left-3 top-2.5 text-[11px] font-bold text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Total Landed Cost Banner */}
            <div className="flex items-center justify-between p-3 bg-slate-200/60 rounded-xl text-xs">
              <span className="font-bold text-slate-700">إجمالي التكلفة التشغيلية الحقيقية لكل قطعة:</span>
              <span className="font-extrabold text-slate-900 text-sm bg-white px-3 py-1 rounded-lg border border-slate-300 shadow-xs">
                {totalCostPerUnit.toFixed(2)} ₪
              </span>
            </div>
          </div>

          {/* Section 2: Strategy Selector */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> 2. اختر استراتيجية وقاعدة التسعير
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setStrategy('target_margin')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  strategy === 'target_margin'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs">📈 الهامش المستهدف (Gross Margin %)</span>
                  {strategy === 'target_margin' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </div>
                <span className="text-[10px] text-slate-500 font-normal">
                  معادلة التجارة الإلكترونية العالمية (Cost / (1 - Margin%))
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('markup_percent')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  strategy === 'markup_percent'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs">➕ إضافة نسبة ربح فوق التكلفة (Markup)</span>
                  {strategy === 'markup_percent' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </div>
                <span className="text-[10px] text-slate-500 font-normal">
                  إضافة نسبة مئوية مضافة مباشرة فوق إجمالي التكلفة
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('fixed_profit')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  strategy === 'fixed_profit'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs">💰 ربح نقدي ثابت (Fixed Profit)</span>
                  {strategy === 'fixed_profit' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </div>
                <span className="text-[10px] text-slate-500 font-normal">
                  تحديد مبلغ ربح صافي ثابت بالـ ₪ يضاف للتكلفة
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('ecom_3x')}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  strategy === 'ecom_3x'
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs">🚀 قاعدة الـ 3X المتبعة للمتاجر</span>
                  {strategy === 'ecom_3x' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </div>
                <span className="text-[10px] text-slate-500 font-normal">
                  ضرب (سعر المنتج + الشحن) في 3 لتغطية الإعلانات والأرباح
                </span>
              </button>
            </div>

            {/* Strategy Input Variable Field */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
              {strategy === 'target_margin' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-emerald-950">
                      نسبة هامش الربح المستهدف من سعر البيع (%):
                    </label>
                    <span className="font-extrabold text-emerald-700 text-xs">{targetMarginPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="1"
                    value={targetMarginPercent}
                    onChange={(e) => setTargetMarginPercent(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium pt-0.5">
                    <span>10% (هامش منخفض)</span>
                    <span>35% (موصى به للمتاجر)</span>
                    <span>70% (هامش مرتفع)</span>
                  </div>
                </div>
              )}

              {strategy === 'markup_percent' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-emerald-950">
                      نسبة الزيادة المضافة فوق التكلفة (Markup %):
                    </label>
                    <span className="font-extrabold text-emerald-700 text-xs">{markupPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={markupPercent}
                    onChange={(e) => setMarkupPercent(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium pt-0.5">
                    <span>20% (زيادة ضئيلة)</span>
                    <span>60% (متوسط المتاجر)</span>
                    <span>200% (علامات تجارية فاخرة)</span>
                  </div>
                </div>
              )}

              {strategy === 'fixed_profit' && (
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">
                    مبلغ الربح الصافي المطلوب لكل قطعة (₪):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={fixedProfit}
                    onChange={(e) => setFixedProfit(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-extrabold text-emerald-900 text-xs"
                  />
                </div>
              )}

              {strategy === 'ecom_3x' && (
                <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                  قاعدة التجارة الإلكترونية الثلاثية تقوم بتلقائياً بضرب التكلفة الأساسية للسلعة والشحن في 3 (33% لتكلفة البضاعة، 33% للتسويق والتشغيل، و33% صافي أرباح لك).
                </p>
              )}
            </div>
          </div>

          {/* Section 3: Psychological Pricing & Discount Settings */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 flex items-center justify-between">
              <span>🧠 تحسينات التسعير النفسي وعروض الخصم</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={usePsychologicalPricing}
                  onChange={(e) => setUsePsychologicalPricing(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </h4>

            <p className="text-[11px] text-slate-500">
              تقريب الأسعار التلقائي لأرقام ذكية جذابة للزبائن (مثل 99 ₪ أو 149 ₪ بدلاً من أرقام عشوائية مثل 96.4 ₪).
            </p>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-3">
              <label className="font-bold text-slate-700 text-[11px] shrink-0">
                نسبة الخصم المعروضة (لإظهار السعر القديم المشطوب):
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="70"
                  value={suggestedDiscount}
                  onChange={(e) => setSuggestedDiscount(Number(e.target.value))}
                  className="w-16 p-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-800 text-xs"
                />
                <span className="font-bold text-slate-600">% خصم</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Output Results Card & Action Buttons */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-stone-900 text-white rounded-2xl p-5 shadow-2xl space-y-5 border border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> النتيجة والتوصية المالية
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                LIVE
              </span>
            </div>

            {/* Calculated Prices Display */}
            <div className="space-y-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <div>
                <span className="text-[11px] text-slate-400 font-bold block mb-1">
                  سعر البيع المقترح النهائي للزبون:
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                    {finalCalculatedPrice}
                  </span>
                  <span className="text-lg font-bold text-emerald-300">₪</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">السعر القديم المقترح (المشطوب):</span>
                <span className="font-extrabold text-amber-400 line-through text-sm">
                  {finalOriginalPrice} ₪
                </span>
              </div>
            </div>

            {/* Profit Metrics Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold block">صافي الربح للقطعة:</span>
                <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">
                  +{netProfit.toFixed(1)} ₪
                </span>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-bold block">هامش الربح الصافي:</span>
                <span className="text-base font-extrabold text-teal-300 mt-0.5 block">
                  {netMarginPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Detailed Financial Breakdown */}
            <div className="space-y-1.5 text-[11px] text-slate-300 pt-1 border-t border-slate-700/80">
              <div className="flex justify-between">
                <span className="text-slate-400">سعر شراء البضاعة:</span>
                <span className="font-bold">{wholesaleCost} ₪</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">الشحن واللوجستيات:</span>
                <span className="font-bold">{shippingCost} ₪</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">تكلفة الإعلانات والتسويق المقدرة:</span>
                <span className="font-bold">{adCost} ₪</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">الضرائب ورسوم الدفع:</span>
                <span className="font-bold">{taxFeesAmountPerUnit.toFixed(1)} ₪</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-700/50 font-bold text-white">
                <span>إجمالي التكلفة الحقيقية:</span>
                <span className="text-amber-300">{totalCostPerUnit.toFixed(1)} ₪</span>
              </div>
            </div>

            {/* Apply Button */}
            {onApplyPrices && (
              <button
                type="button"
                onClick={handleApply}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                تطبيق السعر المحسوب ({finalCalculatedPrice} ₪) على استمارة المنتج
              </button>
            )}
          </div>

          {/* Toggle Guide Accordion */}
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl font-bold text-xs flex items-center justify-between cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              أفضل القواعد والنماذج العالمية لتسعير التجارة الإلكترونية
            </span>
            {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Educational Guide Drawer / Box */}
      {showGuide && (
        <div className="mt-6 p-5 bg-slate-50 border border-blue-200 rounded-2xl text-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h4 className="font-extrabold text-sm text-slate-900">
              دليل قواعد التسعير الاحترافية المعتمدة عالمياً في التجارة الإلكترونية
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-700 leading-relaxed">
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <h5 className="font-bold text-blue-900 text-xs flex items-center gap-1">
                📌 1. صيغة الهامش المستهدف (Target Gross Margin Formula)
              </h5>
              <p className="text-[11px] text-slate-600">
                هي الصيغة الأكثر دقة واحترافية والمستخدمة لدى كبرى شركات التجارة الإلكترونية.
              </p>
              <div className="p-2 bg-slate-100 rounded-lg font-mono text-[10px] text-slate-800 dir-ltr text-left">
                Selling Price = Total Landed Cost / (1 - Desired Margin %)
              </div>
              <p className="text-[10px] text-slate-500">
                مثال: إذا كانت تكلفة المنتج الإجمالية 60 ₪ وتريد هامش ربح 40%، فإن سعر البيع الصحيح ليس 84 ₪، بل هو: 60 / (1 - 0.40) = <strong>100 ₪</strong>.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <h5 className="font-bold text-emerald-900 text-xs flex items-center gap-1">
                🚀 2. قاعدة الـ 3X للتجارة الإلكترونية (The 3X E-Commerce Rule)
              </h5>
              <p className="text-[11px] text-slate-600">
                قاعدة سريعة ومعتمدة لدى متاجر الدروب شيبينغ والتجزئة السريعة:
              </p>
              <div className="p-2 bg-slate-100 rounded-lg font-mono text-[10px] text-slate-800 dir-ltr text-left">
                Selling Price = (Wholesale Cost + Shipping) × 3
              </div>
              <p className="text-[10px] text-slate-500">
                تقسم هذه القاعدة سعر البيع لثلاثة أجزاء متساوية: 33% لـ (تكلفة الشراء واللوجستيات)، 33% لـ (ميزانية الإعلانات والتسويق)، و33% لـ (صافي أرباح المتجر).
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <h5 className="font-bold text-amber-900 text-xs flex items-center gap-1">
                🧠 3. استراتيجية التسعير النفسي (Psychological Charm Pricing)
              </h5>
              <p className="text-[11px] text-slate-600">
                إنهاء الأسعار بالرقم 9 (مثل 99 ₪ أو 199 ₪) يزيد معدل التحويل (Conversion Rate) بنسبة تصل إلى 24% بحسب دراسات سلوك المستهلك.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <h5 className="font-bold text-purple-900 text-xs flex items-center gap-1">
                💡 4. الخصم الوهمي المقتطع (Anchor Pricing)
              </h5>
              <p className="text-[11px] text-slate-600">
                إظهار سعر أعلى مشطوب (مثل <span className="line-through">149 ₪</span>) بجانب سعر البيع الحالي (119 ₪) يعطي انطباعاً كبيراً بقيمة الصفقة لدى العميل ويحفز الشراء الفوري.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
