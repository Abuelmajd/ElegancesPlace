import React, { useState } from 'react';
import { useStoreManagement } from '../../contexts/StoreContext';
import { HomepageSection, HomepageSectionType } from '../../types';
import { 
  GripVertical, Eye, EyeOff, Plus, Trash2, Edit3, Copy, 
  ArrowUp, ArrowDown, Sparkles, Layout, Check, X, Image as ImageIcon 
} from 'lucide-react';

const SECTION_TYPE_LABELS: Record<HomepageSectionType, string> = {
  hero_banner: 'اللافتة الرئيسية (Hero Banner)',
  featured_products: 'المنتجات المميزة (Featured Products)',
  featured_categories: 'الأقسام الرئيسية (Featured Categories)',
  new_arrivals: 'وصل حديثاً (New Arrivals)',
  best_sellers: 'الأكثر مبيعاً (Best Sellers)',
  special_offers: 'العروض الخاصة والفلاش سيل (Special Offers)',
  discount_banner: 'بانر خصم حصري (Discount Banner)',
  product_collection: 'مجموعة منتجات مخصصة (Product Collection)',
  category_collection: 'مجموعة أقسام مخصصة (Category Collection)',
  image_text: 'صورة مع نص تعريفي (Image + Text)',
  promotional_banner: 'بانر ترويجي (Promotional Banner)',
  testimonials: 'آراء وتقييمات العملاء (Testimonials)',
  reviews: 'مراجعات المنتجات (Reviews)',
  newsletter: 'النشرة البريدية (Newsletter)',
  social_links: 'روابط التواصل الاجتماعي (Social Links)',
  cta: 'دعوة لاتخاذ إجراء (Call To Action)',
  shipping_info: 'معلومات التوصيل والدفع (Shipping Info)',
  trust_benefits: 'مزايا التسوق وضمانات الجودة (Trust & Benefits)'
};

export const HomepageSectionManager: React.FC = () => {
  const { 
    draftHomepageSections, 
    updateDraftHomepageSections, 
    addHomepageSection, 
    toggleHomepageSection, 
    removeHomepageSection,
    reorderHomepageSections 
  } = useStoreManagement();

  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSectionType, setNewSectionType] = useState<HomepageSectionType>('featured_products');
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Move section Up/Down
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const list = [...draftHomepageSections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const reordered = list.map((sec, idx) => ({ ...sec, order: idx + 1 }));
    updateDraftHomepageSections(reordered);
  };

  // Duplicate Section
  const duplicateSection = (sec: HomepageSection) => {
    const duplicated: HomepageSection = {
      ...sec,
      id: 'sec_' + Date.now(),
      title: `${sec.title} (نسخة)`,
      order: draftHomepageSections.length + 1
    };
    updateDraftHomepageSections([...draftHomepageSections, duplicated]);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;
    const updated = draftHomepageSections.map(s => s.id === editingSection.id ? editingSection : s);
    updateDraftHomepageSections(updated);
    setEditingSection(null);
  };

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newSectionTitle.trim() || SECTION_TYPE_LABELS[newSectionType];
    addHomepageSection(newSectionType, title);
    setShowAddModal(false);
    setNewSectionTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layout className="w-5 h-5 text-emerald-600" />
            أداة تشكيل وبناء الصفحة الرئيسية (Homepage Builder)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إضافة، ترتيب بالسحب والإفلات، وإدارة الأقسام والبنرات في الواجهة الرئيسية للمتجر.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" /> إضافة قسم جديد
        </button>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        {draftHomepageSections.map((sec, idx) => (
          <div
            key={sec.id}
            className={`p-4 bg-white rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
              !sec.visible ? 'opacity-60 border-slate-200 bg-slate-50' : 'border-slate-200 hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1 text-slate-400">
                <button 
                  onClick={() => moveSection(idx, 'up')} 
                  disabled={idx === 0}
                  className="p-1 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => moveSection(idx, 'down')} 
                  disabled={idx === draftHomepageSections.length - 1}
                  className="p-1 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-extrabold text-xs">
                {sec.order}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">{sec.title}</h3>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                    {SECTION_TYPE_LABELS[sec.type] || sec.type}
                  </span>
                </div>
                {sec.subtitle && (
                  <p className="text-xs text-slate-500 truncate max-w-md mt-0.5">{sec.subtitle}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => toggleHomepageSection(sec.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  sec.visible ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {sec.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {sec.visible ? 'مميّز وظاهر' : 'مخفي'}
              </button>

              <button
                onClick={() => setEditingSection(sec)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="تعديل تفاصيل القسم"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => duplicateSection(sec)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="تكرار القسم"
              >
                <Copy className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (confirm(`هل أنت تأكد من حذف قسم "${sec.title}"؟`)) {
                    removeHomepageSection(sec.id);
                  }
                }}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="حذف القسم"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: Add Section Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">إضافة قسم جديد للصفحة الرئيسية</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">نوع القسم (Section Type):</label>
                <select
                  value={newSectionType}
                  onChange={(e) => setNewSectionType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  {(Object.keys(SECTION_TYPE_LABELS) as HomepageSectionType[]).map((type) => (
                    <option key={type} value={type}>{SECTION_TYPE_LABELS[type]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان القسم (اختياري):</label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="مثال: تشكيلة الصيف الحصرية"
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                >
                  إضافة القسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">تعديل تفاصيل القسم</h3>
              <button onClick={() => setEditingSection(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان القسم الرئيسي:</label>
                <input
                  type="text"
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">العنوان الفرعي الوصفي:</label>
                <input
                  type="text"
                  value={editingSection.subtitle || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, subtitle: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رابط صورة البانر (URL):</label>
                <input
                  type="text"
                  value={editingSection.image || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">نص الزر (Button Text):</label>
                  <input
                    type="text"
                    value={editingSection.buttonText || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, buttonText: e.target.value })}
                    placeholder="تسوق الآن"
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رابط الزر (Button Link):</label>
                  <input
                    type="text"
                    value={editingSection.buttonLink || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, buttonLink: e.target.value })}
                    placeholder="#products"
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">نمط تخطيط العرض (Layout):</label>
                <select
                  value={editingSection.layout || 'grid'}
                  onChange={(e) => setEditingSection({ ...editingSection, layout: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="grid">شبكي متعدد الأعمدة (Grid)</option>
                  <option value="carousel">شريط أفقي متحرك (Carousel)</option>
                  <option value="full">عرض كاملي بعرض الشاشة (Full Width)</option>
                  <option value="contained">محتوى ملموم ومحاذى (Contained)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                >
                  حفظ التغيرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
