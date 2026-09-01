import React, { useState } from 'react';
import { Check, Edit2, Calculator, Tag, Package } from 'lucide-react';

export const PricingCalculatorPage = ({ products, onUpdateProducts }: { products: any[], onUpdateProducts: (updated: any[]) => void }) => {
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [globalMargin, setGlobalMargin] = useState('20');

  const toggleProduct = (id: string) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedProductIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedProductIds.size === products.length && products.length > 0) setSelectedProductIds(new Set());
    else setSelectedProductIds(new Set(products.map(p => p.id)));
  };

  const applyBatchPricing = () => {
    const newPrice = Number(globalMargin);
    if (isNaN(newPrice)) {
      alert("يرجى إدخال سعر صحيح");
      return;
    }
    
    // الحل: وضع القيمة المدخلة مباشرة كسعر للمنتج
    console.log("Applying batch price:", newPrice);
    const updatedProducts = products.map(p => {
      if (!selectedProductIds.has(p.id)) return p;

      console.log("Updating product:", p.name, "to new price:", newPrice);
      return { ...p, price: newPrice.toFixed(2) };
    });
    
    console.log("Updated products array:", updatedProducts);
    onUpdateProducts(updatedProducts);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">حاسبة الأسعار الجماعية</h2>
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex gap-4 items-center">
        <input 
          value={globalMargin}
          onChange={(e) => setGlobalMargin(e.target.value)}
          className="w-32 px-3 py-2 border rounded-lg"
          placeholder="نسبة الربح %"
        />
        <button onClick={applyBatchPricing} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">تطبيق على المحدد</button>
      </div>
      <table className="w-full bg-white rounded-xl border border-slate-200"><thead><tr className="text-right border-b border-slate-200"><th className="p-4"><input type="checkbox" onChange={toggleAll} checked={selectedProductIds.size === products.length && products.length > 0}/></th><th className="p-4">اسم المنتج</th><th className="p-4">سعر الجملة</th><th className="p-4">سعر البيع</th></tr></thead><tbody>{products.map(p => (<tr key={p.id} className="border-b border-slate-100"><td className="p-4"><input type="checkbox" checked={selectedProductIds.has(p.id)} onChange={() => toggleProduct(p.id)}/></td><td className="p-4">{p.name}</td><td className="p-4">{p.wholesalePrice}</td><td className="p-4">{p.price}</td></tr>))}</tbody></table>
    </div>
  );
};
