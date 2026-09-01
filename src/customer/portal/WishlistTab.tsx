import React from 'react';
import { useWishlist } from '../../contexts/WishlistContext';
import { useProducts } from '../../contexts/ProductContext';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { SafeDriveImage } from '../../components/common/SafeDriveImage';

export const WishlistTab: React.FC = () => {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { products } = useProducts();

  const savedProducts = wishlistItems.map(item => {
    const prod = products.find(p => p.id === item.product_id || p.product_id === item.product_id);
    return { item, prod };
  }).filter((res): res is { item: typeof res.item; prod: NonNullable<typeof res.prod> } => res.prod !== undefined);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> قائمة مفضلاتي ({savedProducts.length})
          </h3>
          <p className="text-xs text-stone-500 mt-1">المنتجات التي قمت بحفظها للرجوع إليها أو شرائها لاحقاً</p>
        </div>
      </div>

      {savedProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-stone-200 text-center space-y-3">
          <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-stone-800 text-base">قائمة المفضلة فارغة حالياً</h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">تصفح منتجات المتجر واضغط على أيقونة القلب على أي منتج ليتم حفظه هنا تلقائياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {savedProducts.map(({ item, prod }) => {
            if (!prod) return null;
            const primaryImg = (prod as any).image || ((prod as any).images && (prod as any).images.length > 0 ? (prod as any).images[0].image_url : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600');
            const displayPrice = Number((prod as any).selling_price ?? prod.price ?? 0);
            const oldPrice = (prod as any).compare_at_price ?? prod.oldPrice;

            return (
              <div key={item.wishlist_id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="relative h-48 bg-stone-100 overflow-hidden group">
                    <SafeDriveImage
                      src={primaryImg}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={() => removeFromWishlist(prod.product_id || prod.id)}
                      title="إزالة من المفضلة"
                      className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow-xs hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-stone-900 text-sm line-clamp-2">{prod.name}</h4>
                    <p className="text-xs text-stone-500 line-clamp-1">{prod.description}</p>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="font-extrabold text-emerald-700 text-base">{displayPrice.toLocaleString()} ₪</span>
                      {oldPrice && (
                        <span className="text-xs text-stone-400 line-through">{Number(oldPrice).toLocaleString()} ₪</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={() => {
                      alert(`تمت إضافة "${prod.name}" إلى سلة المشتريات!`);
                    }}
                    className="w-full bg-stone-900 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" /> إضافة إلى السلة
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
