import React, { useState } from 'react';
import { X, Star, ShoppingBag, Heart, Shield, CheckCircle2, MessageSquare, Truck, RefreshCw, Zap } from 'lucide-react';
import { StoreProduct } from '../contexts/ProductContext';
import { useAuth } from '../contexts/AuthContext';
import { useReviews } from '../contexts/ReviewContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useStoreManagement } from '../contexts/StoreContext';
import { SafeDriveImage } from '../components/common/SafeDriveImage';

interface ProductDetailsModalProps {
  product: StoreProduct;
  onClose: () => void;
  onAddToCart: (product: StoreProduct) => void;
  onDirectOrder?: (product: StoreProduct) => void;
  onOpenAuthModal: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ 
  product, 
  onClose, 
  onAddToCart, 
  onDirectOrder,
  onOpenAuthModal 
}) => {
  const { currentUser } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { getProductReviews, canCustomerReview, addReview } = useReviews();
  const { storeSettings } = useStoreManagement();

  const guaranteesConfig = storeSettings.product_guarantees || {
    enabled: true,
    title: 'ضمان النخبة والخدمة المتميزة',
    items: [
      { id: 'g_1', text: 'منتجات أصلية ومضمونة 100%', enabled: true, icon: 'check' },
      { id: 'g_2', text: 'إمكانية الاستبدال والاسترجاع خلال 3 أيام', enabled: true, icon: 'refresh' },
      { id: 'g_3', text: 'الدفع عند الاستلام متاح لكافة المدن', enabled: true, icon: 'truck' }
    ]
  };

  const activeGuarantees = (guaranteesConfig.items || []).filter(item => item.enabled);

  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const reviews = getProductReviews(product.id);
  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : product.rating;
  const reviewEligibility = canCustomerReview(product.id);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewEligibility.canReview) return;
    const targetOrderId = reviewEligibility.orderId || 'ord_direct';

    setIsSubmittingReview(true);
    setReviewError('');
    
    try {
      const success = await addReview(product.id, targetOrderId, rating, reviewTitle, reviewComment);
      if (success) {
        setReviewSuccess(true);
        setReviewTitle('');
        setReviewComment('');
        setRating(5);
      } else {
        setReviewError('حدث خطأ أثناء إرسال التقييم.');
      }
    } catch (err) {
      setReviewError('حدث خطأ أثناء إرسال التقييم.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      {/* Navigation Breadcrumbs & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-2 text-stone-500 text-xs sm:text-sm font-bold">
          <button 
            onClick={onClose} 
            className="hover:text-emerald-600 transition-colors cursor-pointer"
          >
            الرئيسية
          </button>
          <span className="text-stone-300">/</span>
          <span className="text-stone-500">{product.category}</span>
          <span className="text-stone-300">/</span>
          <span className="text-emerald-700 font-extrabold">{product.name}</span>
        </div>

        <button 
          onClick={onClose} 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border border-emerald-200/50"
        >
          <X className="w-4 h-4" /> العودة للتصفح في المتجر رئيسي
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden flex flex-col">
        {/* Top Section: Image and Core Details / Checkout Actions */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 sm:p-10 border-b border-stone-100">
          
          {/* Product Image Panel (Left on Desktop, Top on Mobile) */}
          <div className="md:col-span-6 flex flex-col justify-center">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-50 border border-stone-200 shadow-sm max-w-md mx-auto w-full">
              <SafeDriveImage src={product.image} alt={product.name} className="w-full h-full object-cover" />
              <button
                onClick={handleWishlistToggle}
                className="absolute top-4 left-4 p-3 rounded-full bg-white/90 backdrop-blur-md shadow-sm text-stone-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Product Purchasing Panel (Right on Desktop, Bottom on Mobile) */}
          <div className="md:col-span-6 space-y-5 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/40">{product.category}</span>
              <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {averageRating}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight">{product.name}</h1>
            
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-emerald-600">{product.price} ₪</span>
              {product.oldPrice && <span className="text-base text-stone-400 line-through">{product.oldPrice} ₪</span>}
            </div>

            <div className="p-4 bg-stone-50/50 rounded-2xl border border-stone-200 text-sm text-stone-600 leading-relaxed">
              {product.description || 'لا يوجد وصف متاح لهذا المنتج.'}
            </div>

            {/* Dynamic Action Buttons based on store_mode */}
            {product.stock <= 0 ? (
              <div className="w-full py-4 bg-stone-100 text-stone-500 rounded-xl text-center font-bold text-xs border border-stone-200">
                عذراً، هذا المنتج غير متوفر حالياً في المخزون
              </div>
            ) : (storeSettings.store_mode === 'AFFILIATE_BROKER' || !storeSettings.store_mode) ? (
              /* Affiliate / Direct Recommendation Only */
              <div className="space-y-2">
                <button 
                  onClick={() => { 
                    if (onDirectOrder) onDirectOrder(product); 
                    else { onAddToCart(product); }
                    onClose(); 
                  }}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Zap className="w-5 h-5 fill-amber-300 text-amber-300 animate-pulse" />
                  <span>طلب وتوصية فورية بنقرة واحدة (بدون سلة) ⚡</span>
                </button>
                <p className="text-[11px] text-stone-500 text-center">
                  ✓ إرسال مباشر وسريع للطلب وتأكيد المورد دون خطوات دفع معقدة
                </p>
              </div>
            ) : storeSettings.store_mode === 'DROPSHIPPING' ? (
              /* Dropshipping with Cart Only */
              <button 
                onClick={() => { onAddToCart(product); onClose(); }}
                className="w-full py-4 bg-stone-900 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5" /> أضف إلى سلة المشتريات
              </button>
            ) : (
              /* Hybrid Mode: Both buttons */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={() => { 
                    if (onDirectOrder) onDirectOrder(product); 
                    else { onAddToCart(product); }
                    onClose(); 
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300" /> طلب فوري مباشر
                </button>
                <button 
                  onClick={() => { onAddToCart(product); onClose(); }}
                  className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" /> إضافة للسلة
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Tabs, Guarantee Details and Reviews (Full Width with a max constraint for readability) */}
        <div className="flex flex-col bg-stone-50/20">
          <div className="flex border-b border-stone-200 bg-stone-50/40">
            <button 
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-4.5 text-xs sm:text-sm font-extrabold border-b-2 transition-colors cursor-pointer ${activeTab === 'details' ? 'border-emerald-500 text-emerald-700 bg-white shadow-3xs' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
            >
              تفاصيل إضافية والضمانات
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-4.5 text-xs sm:text-sm font-extrabold border-b-2 transition-colors flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'reviews' ? 'border-emerald-500 text-emerald-700 bg-white shadow-3xs' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
            >
              المراجعات والتقييمات <span className="bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full text-[10px] font-black">{reviews.length}</span>
            </button>
          </div>

          <div className="p-6 sm:p-10 max-w-4xl mx-auto w-full">
            {activeTab === 'details' ? (
              <div className="space-y-6">
                {guaranteesConfig.enabled !== false && activeGuarantees.length > 0 && (
                  <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-3xs">
                    <h3 className="font-bold text-stone-900 mb-4 flex items-center gap-2 border-b border-stone-100 pb-2">
                      <Shield className="w-5 h-5 text-emerald-600" /> {guaranteesConfig.title || 'ضمان النخبة'}
                    </h3>
                    <ul className="space-y-3 text-sm text-stone-600">
                      {activeGuarantees.map((item) => (
                        <li key={item.id} className="flex items-center gap-2.5">
                          {item.icon === 'truck' ? (
                            <Truck className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                          ) : item.icon === 'refresh' ? (
                            <RefreshCw className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                          )}
                          <span className="font-bold text-stone-800">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Reviews Summary */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white rounded-2xl border border-stone-200 shadow-3xs">
                  <div className="text-center sm:border-l sm:border-stone-100 sm:pl-8 min-w-[120px]">
                    <div className="text-5xl font-black text-stone-900">{averageRating}</div>
                    <div className="flex items-center gap-0.5 text-amber-400 my-1.5 justify-center">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-4 h-4 ${s <= Number(averageRating) ? 'fill-current' : 'text-stone-300'}`} />)}
                    </div>
                    <div className="text-xs text-stone-500 font-bold">{reviews.length} تقييمات للعملاء</div>
                  </div>
                  
                  <div className="flex-1 w-full space-y-1.5">
                    {[5, 4, 3, 2, 1].map(stars => {
                      const count = reviews.filter(r => r.rating === stars).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={stars} className="flex items-center gap-2 text-xs text-stone-600">
                          <span className="w-2 font-bold">{stars}</span>
                          <Star className="w-3 h-3 text-amber-400 fill-current shrink-0" />
                          <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="w-6 text-left text-stone-400 font-bold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add Review Form */}
                {reviewEligibility.canReview && !reviewSuccess ? (
                  <form onSubmit={submitReview} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-3xs space-y-4">
                    <h4 className="font-extrabold text-sm text-stone-900 border-b border-stone-100 pb-3">أضف تقييمك ومراجعتك للمنتج</h4>
                    {reviewError && <div className="p-2 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">{reviewError}</div>}
                    
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">التقييم العام بالنجوم</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} type="button" onClick={() => setRating(s)} className="p-1 cursor-pointer transition-transform hover:scale-110">
                            <Star className={`w-7 h-7 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">عنوان التقييم</label>
                      <input type="text" required value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-stone-50/30" placeholder="مثال: جودة ممتازة وسرعة في التوصيل" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">رأيك وملاحظاتك بالمنتج</label>
                      <textarea required value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-stone-50/30 resize-none" placeholder="شارك تجربتك مع هذا المنتج..."></textarea>
                    </div>
                    
                    <button type="submit" disabled={isSubmittingReview} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-3 rounded-xl transition-colors cursor-pointer shadow-xs">
                      {isSubmittingReview ? 'جاري الإرسال...' : 'إرسال التقييم'}
                    </button>
                  </form>
                ) : reviewSuccess ? (
                  <div className="p-5 bg-emerald-50 text-emerald-800 text-sm rounded-2xl border border-emerald-200 text-center flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <p className="font-bold">شكراً لتقييمك لمقترحاتنا!</p>
                    <p className="text-xs opacity-80">ستتم مراجعة تقييمك ونشره قريباً.</p>
                  </div>
                ) : reviewEligibility.reason && (
                  <div className="p-6 bg-stone-50 border border-stone-200 rounded-2xl text-center text-sm text-stone-600 space-y-3">
                    <p className="font-medium">{reviewEligibility.reason}</p>
                    {!currentUser && (
                      <button
                        onClick={onOpenAuthModal}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        تسجيل الدخول / إنشاء حساب كعميل
                      </button>
                    )}
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4 pt-4 border-t border-stone-200">
                  {reviews.length === 0 ? (
                    <div className="text-center text-stone-500 text-sm py-10">لا توجد تقييمات منشورة لهذا المنتج حتى الآن. كن أول من يقيمه!</div>
                  ) : (
                    reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(review => (
                      <div key={review.review_id} className="p-5 bg-white rounded-2xl border border-stone-200 shadow-3xs space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />)}
                            </div>
                            <h4 className="font-bold text-sm text-stone-900">{review.title}</h4>
                          </div>
                          <span className="text-[10px] text-stone-400 font-bold">{new Date(review.created_at).toLocaleDateString('ar-SA')}</span>
                        </div>
                        
                        <p className="text-sm text-stone-600 leading-relaxed">{review.comment}</p>
                        
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-100 text-xs text-stone-500">
                          <span className="font-bold text-stone-800">{review.customer_name_snapshot}</span>
                          <span className="text-stone-300">•</span>
                          <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5" /> مشتري موثق
                          </span>
                        </div>
                        
                        {review.admin_reply && (
                          <div className="mt-3 p-4 bg-stone-50 rounded-xl border border-stone-200 text-sm flex gap-3 relative">
                            <MessageSquare className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-stone-800 block mb-1">رد إدارة المتجر ({review.admin_reply_by})</span>
                              <p className="text-stone-600 leading-relaxed">{review.admin_reply}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
