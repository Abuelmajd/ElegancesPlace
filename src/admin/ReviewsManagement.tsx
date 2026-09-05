import React, { useState } from 'react';
import { useReviews } from '../contexts/ReviewContext';
import { useProducts } from '../contexts/ProductContext';
import { Star, Search, CheckCircle2, XCircle, EyeOff, MessageSquare, Trash2, Filter } from 'lucide-react';
import { ReviewStatus } from '../types';

export const ReviewsManagement: React.FC = () => {
  const { reviews, updateReviewStatus, replyToReview, deleteReview } = useReviews();
  const { products } = useProducts();

  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const filteredReviews = reviews.filter(r => {
    if (activeTab !== 'ALL' && r.status !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const p = products.find(prod => prod.id === r.product_id);
      return (
        String(r.title || '').toLowerCase().includes(q) ||
        String(r.comment || '').toLowerCase().includes(q) ||
        String(r.customer_name_snapshot || '').toLowerCase().includes(q) ||
        String(p?.name || '').toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleStatusChange = (reviewId: string, status: ReviewStatus) => {
    updateReviewStatus(reviewId, status);
  };

  const handleReplySubmit = (reviewId: string) => {
    if (replyText[reviewId]) {
      replyToReview(reviewId, replyText[reviewId]);
      setActiveReplyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-stone-800">إدارة التقييمات والمراجعات</h2>
          <p className="text-xs text-stone-500 mt-1">راجع تقييمات العملاء وقم بالرد عليها أو إدارتها</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row gap-4 justify-between bg-stone-50">
          <div className="flex bg-stone-200 p-1 rounded-lg overflow-x-auto">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-xs font-bold rounded-md whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
              >
                {tab === 'ALL' ? 'الكل' : tab === 'PENDING' ? 'قيد المراجعة' : tab === 'APPROVED' ? 'مقبول' : tab === 'REJECTED' ? 'مرفوض' : 'مخفي'}
                <span className="ml-2 bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full text-[10px]">
                  {tab === 'ALL' ? reviews.length : reviews.filter(r => r.status === tab).length}
                </span>
              </button>
            ))}
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="ابحث في المراجعات..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Reviews List */}
        <div className="divide-y divide-stone-100">
          {filteredReviews.length === 0 ? (
            <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center space-y-3">
              <Star className="w-12 h-12 text-stone-300" />
              <p className="font-bold text-sm">لا توجد مراجعات تطابق البحث</p>
            </div>
          ) : (
            filteredReviews.map(review => {
              const product = products.find(p => p.id === review.product_id);
              return (
                <div key={review.review_id} className="p-5 hover:bg-stone-50 transition-colors">
                  <div className="flex flex-col md:flex-row gap-5">
                    {/* Review Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                            review.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                            review.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                            review.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                            'bg-stone-200 text-stone-700'
                          }`}>
                            {review.status === 'APPROVED' ? 'مقبول' : review.status === 'PENDING' ? 'قيد المراجعة' : review.status === 'REJECTED' ? 'مرفوض' : 'مخفي'}
                          </span>
                          <span className="text-xs text-stone-500 font-mono">{new Date(review.created_at).toLocaleString('ar-SA')}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />)}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-stone-900 text-sm">{review.title}</h3>
                        <p className="text-sm text-stone-600 mt-1 leading-relaxed">{review.comment}</p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-stone-500 bg-white p-2 rounded-lg border border-stone-100 inline-flex">
                        <span className="font-bold text-stone-800">{review.customer_name_snapshot}</span>
                        <span className="text-stone-300">|</span>
                        <span>طلب: <span className="font-mono">{review.order_id}</span></span>
                        {product && (
                          <>
                            <span className="text-stone-300">|</span>
                            <span className="text-emerald-700 font-bold truncate max-w-[150px]">{product.name}</span>
                          </>
                        )}
                      </div>

                      {review.admin_reply && (
                        <div className="bg-stone-100 p-3 rounded-lg border border-stone-200 text-sm mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-stone-800 text-xs flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> رد المتجر ({review.admin_reply_by})</span>
                            <span className="text-[10px] text-stone-500">{new Date(review.admin_reply_at!).toLocaleDateString('ar-SA')}</span>
                          </div>
                          <p className="text-stone-700 text-xs">{review.admin_reply}</p>
                        </div>
                      )}

                      {activeReplyId === review.review_id && !review.admin_reply && (
                        <div className="mt-3 bg-white p-3 border border-emerald-200 rounded-lg shadow-sm flex gap-2 items-start">
                          <textarea 
                            value={replyText[review.review_id] || ''}
                            onChange={(e) => setReplyText({ ...replyText, [review.review_id]: e.target.value })}
                            placeholder="اكتب ردك على العميل هنا..."
                            className="flex-1 text-sm border border-stone-300 rounded p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[60px]"
                          />
                          <div className="flex flex-col gap-2">
                            <button onClick={() => handleReplySubmit(review.review_id)} className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-emerald-700">إرسال</button>
                            <button onClick={() => setActiveReplyId(null)} className="bg-stone-200 text-stone-700 text-xs font-bold px-3 py-1.5 rounded hover:bg-stone-300">إلغاء</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row md:flex-col gap-2 items-center justify-center md:items-stretch md:justify-start pt-3 md:pt-0 border-t md:border-t-0 md:border-r border-stone-100 md:pr-5 min-w-[140px]">
                      {review.status !== 'APPROVED' && (
                        <button onClick={() => handleStatusChange(review.review_id, 'APPROVED')} className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors flex-1">
                          <CheckCircle2 className="w-4 h-4" /> قبول
                        </button>
                      )}
                      
                      {review.status !== 'REJECTED' && (
                        <button onClick={() => handleStatusChange(review.review_id, 'REJECTED')} className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors flex-1">
                          <XCircle className="w-4 h-4" /> رفض
                        </button>
                      )}

                      {review.status !== 'HIDDEN' && (
                        <button onClick={() => handleStatusChange(review.review_id, 'HIDDEN')} className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg transition-colors flex-1">
                          <EyeOff className="w-4 h-4" /> إخفاء
                        </button>
                      )}

                      {!review.admin_reply && (
                        <button onClick={() => setActiveReplyId(review.review_id)} className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors flex-1">
                          <MessageSquare className="w-4 h-4" /> رد
                        </button>
                      )}
                      
                      <button onClick={() => { if(confirm('هل أنت متأكد من حذف هذه المراجعة؟')) deleteReview(review.review_id); }} className="flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mt-auto">
                        <Trash2 className="w-4 h-4" /> حذف
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
