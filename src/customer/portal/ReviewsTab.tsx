import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useReviews } from '../../contexts/ReviewContext';
import { useOrders } from '../../contexts/OrderContext';
import { useProducts } from '../../contexts/ProductContext';
import { Star, MessageSquare, CheckCircle2, Clock, Plus, ShieldCheck, ThumbsUp } from 'lucide-react';

export const ReviewsTab: React.FC = () => {
  const { currentUser } = useAuth();
  const { reviews, addReview } = useReviews();
  const { orders, getOrderItems } = useOrders();
  const { products } = useProducts();

  const [writeReviewModalOpen, setWriteReviewModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Customer reviews
  const currentUserId = currentUser?.user_id || (currentUser as any)?.id;
  const currentEmail = currentUser?.email?.toLowerCase();

  const myReviews = reviews.filter(r => 
    currentUser && (
      r.customer_id === currentUserId || 
      (currentEmail && (r as any).customer_email?.toLowerCase() === currentEmail)
    )
  );

  // Delivered orders for review submission
  const deliveredOrders = orders.filter(o => {
    if (!currentUser) return false;
    const isMine = (o.customer_id === currentUserId) || 
      (currentUser.phone && o.customer_phone === currentUser.phone) ||
      (currentEmail && o.customer_email?.toLowerCase() === currentEmail);
    const s = o.order_status?.toUpperCase() || '';
    return isMine && (s === 'DELIVERED' || s === 'SETTLED' || s === 'COLLECTED_BY_SUPPLIER');
  });

  // Collect unique products from delivered orders
  const deliverdProducts: { product_id: string; product_name: string; order_id: string }[] = [];
  deliveredOrders.forEach(o => {
    const items = getOrderItems(o.order_id);
    items.forEach(itm => {
      deliverdProducts.push({
        product_id: itm.product_id,
        product_name: itm.product_name_at_purchase || itm.product_name || 'منتج',
        order_id: o.order_id
      });
    });
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('يرجى اختيار المنتج المراد تقييمه.');
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    const res = await addReview({
      product_id: selectedProductId,
      order_id: selectedOrderId || 'ord_direct',
      rating,
      title,
      comment
    });

    setSubmitting(false);

    if (res) {
      setSuccessMsg('تم تقديم تقييمك ونشره بنجاح!');
      setTimeout(() => {
        setWriteReviewModalOpen(false);
        setTitle('');
        setComment('');
        setSuccessMsg('');
        setSelectedProductId('');
        setSelectedOrderId('');
      }, 1500);
    } else {
      alert('تعذر تقديم التقييم.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> تقييماتي ومراجعات المنتجات
          </h3>
          <p className="text-xs text-stone-500 mt-1">شارك تجاربك مع المشتريات واعرض المراجعات الخاصة بك</p>
        </div>

        <button
          onClick={() => setWriteReviewModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> إضافة تقييم جديد
        </button>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {myReviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-stone-200 text-center space-y-3">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <Star className="w-8 h-8 fill-amber-500" />
            </div>
            <h4 className="font-bold text-stone-800 text-base">لم تقم بإضافة أية تقييمات بعد</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">يمكنك تقييم المنتجات التي قمت بشرائها واستلامها لإفادة متسوقي النخبة الآخرين.</p>
          </div>
        ) : (
          myReviews.map(rev => (
            <div key={rev.review_id} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`}
                    />
                  ))}
                </div>

                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${rev.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : rev.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                  {rev.status === 'APPROVED' ? 'مقبول ومنشور' : rev.status === 'REJECTED' ? 'غير مقبول' : 'قيد المراجعة'}
                </span>
              </div>

              <div>
                <h5 className="font-bold text-stone-900 text-sm">{rev.title}</h5>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">{rev.comment}</p>
                <p className="text-[10px] text-stone-400 mt-2">التاريخ: {new Date(rev.created_at).toLocaleDateString('ar-SA')}</p>
              </div>

              {/* Admin reply if exists */}
              {rev.admin_reply && (
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs space-y-1">
                  <span className="font-bold text-stone-800 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> رد إدارة المتجر:
                  </span>
                  <p className="text-stone-600 pr-5">{rev.admin_reply}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Write Review Modal */}
      {writeReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200 my-8">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> إضافة تقييم لمنتج مشتريات
              </h3>
              <button onClick={() => setWriteReviewModalOpen(false)} className="text-stone-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {successMsg}
                </div>
              )}

              {/* Select Product */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">اختر المنتج المراد تقييمه:</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setSelectedProductId(pid);
                    const match = deliverdProducts.find(dp => dp.product_id === pid);
                    if (match) setSelectedOrderId(match.order_id);
                    else setSelectedOrderId('ord_direct');
                  }}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white cursor-pointer"
                >
                  <option value="">-- اختر المنتج من القائمة --</option>
                  {deliverdProducts.length > 0 && (
                    <optgroup label="منتجاتك المستلمة (مشتري موثق)">
                      {deliverdProducts.map((dp, idx) => (
                        <option key={`deliv_${idx}`} value={dp.product_id}>✓ {dp.product_name}</option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="كافة منتجات المتجر">
                    {products.map((p) => (
                      <option key={`prod_${p.id}`} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Rating stars */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">التقييم بالنجوم:</label>
                <div className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200 justify-center">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 cursor-pointer transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-7 h-7 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">عنوان التقييم:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="مثال: منتج ممتاز وخامة راقية جداً"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">نص المراجعة والتجربة:</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  rows={3}
                  placeholder="اكتب انطباعك الكامل عن المنتج وسرعة التوصيل والتغليف..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWriteReviewModalOpen(false)}
                  className="bg-stone-100 text-stone-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-stone-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedProductId}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'جاري النشر...' : 'نشر التقييم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
