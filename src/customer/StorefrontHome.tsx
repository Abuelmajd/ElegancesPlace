import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, Search, Sparkles, Shield, Star, ArrowRight, CheckCircle2, 
  Heart, Plus, Minus, Trash2, X, Clock, Truck, Package, Phone, MapPin, 
  Check, AlertCircle, Eye, ChevronRight, Zap, MessageCircle, Layers, ShoppingCart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProducts, StoreProduct } from '../contexts/ProductContext';
import { useOrders } from '../contexts/OrderContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useReviews } from '../contexts/ReviewContext';
import { useStoreManagement } from '../contexts/StoreContext';
import { useCategories } from '../contexts/CategoryContext';
import { ProductDetailsModal } from './ProductDetailsModal';
import { SafeDriveImage } from '../components/common/SafeDriveImage';

interface StorefrontHomeProps {
  onOpenAuthModal: () => void;
  onOpenPortal?: () => void;
}

interface CartItem {
  product: StoreProduct;
  quantity: number;
}

const PALESTINIAN_CITIES = [
  'القدس', 'رام الله والبيرة', 'غزة', 'نابلس', 'الخليل', 'جنين', 'طولكرم',
  'قلقيلية', 'بيت لحم', 'أريحا', 'سلفيت', 'طوباس', 'يافا', 'حيفا', 'عكا',
  'الناصرة', 'اللد', 'الرملة', 'بئر السبع', 'طبريا', 'صفد', 'بيسان',
  'أم الفحم', 'الطيبة', 'باقة الغربية', 'شفاعمرو', 'سخنين', 'طمرة', 'رهط', 'كفر قاسم'
];

export const StorefrontHome: React.FC<StorefrontHomeProps> = ({ onOpenAuthModal, onOpenPortal }) => {
  const { currentUser } = useAuth();
  const { products } = useProducts();
  const { createOrder, orders } = useOrders();
  const { addToWishlist, removeFromWishlist, isInWishlist, wishlistItems } = useWishlist();
  const { storeSettings, themeSettings, updateStoreSettings } = useStoreManagement();
  const { activeCategories } = useCategories();

  // Dynamic Hero Configuration
  const heroImage = storeSettings.hero_banner_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80";
  const heroTitle = storeSettings.hero_title || "تسوق أرقى المنتجات بأفضل الأسعار والجودة العالية";
  const heroSubtitle = storeSettings.hero_subtitle || "";
  const heroBgColor = storeSettings.hero_bg_color || themeSettings.heroBgColor || '#1c1917';
  const heroBgImage = storeSettings.hero_bg_image || themeSettings.heroBgImage;

  const storeMode = storeSettings.store_mode || 'AFFILIATE_BROKER';

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);

  // Direct Single-Product Order & Recommendation State (Affiliate Mode)
  const [directOrderProduct, setDirectOrderProduct] = useState<StoreProduct | null>(null);
  const [directOrderQuantity, setDirectOrderQuantity] = useState(1);
  const [directOrderName, setDirectOrderName] = useState(currentUser?.name || '');
  const [directOrderPhone, setDirectOrderPhone] = useState('');
  const [directOrderCity, setDirectOrderCity] = useState(currentUser?.city || 'القدس');
  const [citySearchInput, setCitySearchInput] = useState(currentUser?.city || 'القدس');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [directOrderAddress, setDirectOrderAddress] = useState(currentUser?.address || '');
  const [directOrderNotes, setDirectOrderNotes] = useState('');
  const [isSubmittingDirectOrder, setIsSubmittingDirectOrder] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Checkout Form State
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerCity, setCustomerCity] = useState(currentUser?.city || 'رام الله والبيرة');
  const [customerAddress, setCustomerAddress] = useState(currentUser?.address || '');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'card'>('cash_on_delivery');
  
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);
  const [orderErrorMessage, setOrderErrorMessage] = useState<string | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);

  const filteredCities = citySearchInput.trim() === ''
    ? PALESTINIAN_CITIES
    : PALESTINIAN_CITIES.filter(city => 
        city.toLowerCase().includes(citySearchInput.toLowerCase())
      );

  const validatePalestinianPhone = (phone: string): { isValid: boolean; error?: string } => {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      return { isValid: false, error: 'رقم الهاتف مطلوب لتأكيد وتوصيل طلبك 📱' };
    }
    // Allow only digits and optional leading plus sign
    if (!/^\+?[0-9]+$/.test(cleanPhone)) {
      return { isValid: false, error: 'يجب أن يحتوي رقم الهاتف على أرقام فقط بدون حروف أو رموز خاصة 🚫' };
    }
    
    // Check local format: 059 / 056 (starts with 059 or 056)
    if (cleanPhone.startsWith('059') || cleanPhone.startsWith('056')) {
      if (cleanPhone.length !== 10) {
        return { isValid: false, error: 'رقم الهاتف الفلسطيني المحلي يجب أن يتكون من 10 خانات ويبدأ بـ 059 أو 056 (مثال: 0599123456) 🇵🇸' };
      }
      return { isValid: true };
    }

    // International starting with +970 or +972
    if (cleanPhone.startsWith('+970') || cleanPhone.startsWith('+972')) {
      const withoutPlus = cleanPhone.slice(1);
      if (withoutPlus.length !== 12) {
        return { isValid: false, error: 'الرقم الدولي الفلسطيني يجب أن يتكون من 13 خانة تبدأ بـ +970 أو +972 (مثال: +970599123456) 🇵🇸' };
      }
      return { isValid: true };
    }

    // Without plus: 970 or 972
    if (cleanPhone.startsWith('970') || cleanPhone.startsWith('972')) {
      if (cleanPhone.length !== 12) {
        return { isValid: false, error: 'الرقم الدولي يجب أن يتكون من 12 خانة تبدأ بـ 970 أو 972 (مثال: 970599123456) 🇵🇸' };
      }
      return { isValid: true };
    }

    return { isValid: false, error: 'يرجى إدخال رقم هاتف فلسطيني صحيح يبدأ بـ (059 أو 056) أو بالمقدمة الدولية (+970 أو +972) 🇵🇸' };
  };

  // Direct Single-Product Quick Order & Recommendation Submission
  const handleDirectOrderSubmit = async (e?: React.FormEvent, viaWhatsApp = false) => {
    if (e) e.preventDefault();
    if (!directOrderProduct) return;
    
    const phoneValidation = validatePalestinianPhone(directOrderPhone);
    if (!phoneValidation.isValid) {
      alert(phoneValidation.error);
      return;
    }
    
    setIsSubmittingDirectOrder(true);

    const orderInput = {
      customer_id: currentUser?.user_id || `direct_${Date.now()}`,
      customer_name: directOrderName.trim() || currentUser?.name || 'عميل طلب فوري',
      customer_phone: directOrderPhone.trim(),
      customer_email: currentUser?.email || `${directOrderPhone.replace(/[^0-9]/g, '') || Date.now()}@guest.elites.ps`,
      shipping_city: directOrderCity,
      shipping_address: directOrderAddress.trim() || 'طلب مباشر',
      payment_method: 'cash_on_delivery' as const,
      customer_notes: directOrderNotes ? `[طلب وتوصية فورية] ${directOrderNotes}` : '[طلب مباشر سريع بنظام العمولة]',
      shipping_cost: 0
    };

    const itemsInput = [{
      product_id: directOrderProduct.id,
      quantity: directOrderQuantity || 1,
      discount: 0
    }];

    const res = await createOrder(orderInput, itemsInput);
    setIsSubmittingDirectOrder(false);

    if (res.success && res.order) {
      setCreatedOrderNumber(res.order.order_number);
      setOrderSuccessMessage(`تم تسجيل وتأكيد طلبك وتوصيتك بنجاح! رقم الطلب: ${res.order.order_number}`);

      if (viaWhatsApp) {
        const storePhone = (storeSettings.whatsapp || storeSettings.phone || '970599000000').replace(/[^0-9]/g, '');
        const text = `مرحباً متجر النخبة، أود تأكيد الطلب المباشر للمنتج التالي:
📦 المنتج: ${directOrderProduct.name}
💰 السعر: ${directOrderProduct.price} ₪ (الكمية: ${directOrderQuantity || 1})
👤 اسم العميل: ${directOrderName || 'زبون النخبة'}
📱 الهاتف: ${directOrderPhone}
📍 المدينة والعنوان: ${directOrderCity} - ${directOrderAddress || 'حسب التنسيق'}
🔖 رقم الطلب بالنظام: ${res.order.order_number}
📝 ملاحظات: ${directOrderNotes || 'لا توجد'}`;
        window.open(`https://wa.me/${storePhone}?text=${encodeURIComponent(text)}`, '_blank');
      }

      setDirectOrderProduct(null);
      setDirectOrderNotes('');
    } else {
      setOrderErrorMessage(res.error || 'حدث خطأ أثناء تسجيل الطلب المباشر');
    }
  };

  // Cart operations
  const handleWishlistToggle = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }
    
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  };

  const addToCart = (product: StoreProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesCategory = selectedCategory === 'all';
    if (!matchesCategory) {
      const targetCat = selectedCategory.trim().toLowerCase();
      const prodCat = (p.category || '').trim().toLowerCase();
      matchesCategory = prodCat === targetCat || 
                        prodCat.includes(targetCat) || 
                        targetCat.includes(prodCat) ||
                        (p.category_id && p.category_id.toLowerCase() === targetCat);
    }
    return matchesSearch && matchesCategory;
  });

  // Customer's own orders (filtered strictly by current user email or phone if logged in)
  const myOrders = currentUser
    ? orders.filter((o) => o.customer_email === currentUser.email || o.customer_id === currentUser.user_id)
    : [];

  // Handle Checkout submission
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setOrderErrorMessage('يرجى ملء جميع الحقول المطلوبة (الاسم، الهاتف، العنوان)');
      return;
    }

    const phoneValidation = validatePalestinianPhone(customerPhone);
    if (!phoneValidation.isValid) {
      setOrderErrorMessage(phoneValidation.error || 'رقم الهاتف غير صحيح');
      return;
    }

    setIsSubmittingOrder(true);
    setOrderErrorMessage(null);

    const itemsInput = cart.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      discount: 0
    }));

    const orderInput = {
      customer_id: currentUser?.user_id || `guest_${Date.now()}`,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || `${customerPhone}@guest.elites.ps`,
      shipping_city: customerCity,
      shipping_address: customerAddress,
      payment_method: paymentMethod,
      customer_notes: customerNotes,
      shipping_cost: 0
    };

    const res = await createOrder(orderInput, itemsInput);
    setIsSubmittingOrder(false);

    if (res.success && res.order) {
      setCreatedOrderNumber(res.order.order_number);
      setOrderSuccessMessage(`تم إنشاء طلبك بنجاح برقم: ${res.order.order_number}`);
      setCart([]);
      setIsCheckoutOpen(false);
    } else {
      setOrderErrorMessage(res.error || 'حدث خطأ أثناء إتمام الطلب');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16 relative" dir="rtl">
      {/* Store Mode Switcher Bar (Visible ONLY for Store Owner / Manager, completely hidden from public and customers) */}
      {(currentUser?.role === 'Owner' || currentUser?.role === 'Manager') && (
        <div className="bg-stone-900 text-stone-200 border-b border-stone-800 px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-md border border-amber-500/30">
                🔒 خاص بالمالك فقط (مخفي عن العامة)
              </span>
              <span className="text-[11px] text-stone-300 font-medium">نمط عمل وتشغيل المتجر:</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                storeMode === 'AFFILIATE_BROKER' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : storeMode === 'DROPSHIPPING'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}>
                {storeMode === 'AFFILIATE_BROKER' && <><Zap className="w-3 h-3 text-amber-300 fill-amber-300 animate-pulse" /> وساطة وتسويق بالعمولة (طلب وتوصية سريعة بدون سلة)</>}
                {storeMode === 'DROPSHIPPING' && <><ShoppingCart className="w-3 h-3 text-blue-300" /> دروب شيبنج وتجارة كاملة (سلة مشتريات ودفع)</>}
                {storeMode === 'HYBRID' && <><Layers className="w-3 h-3 text-purple-300" /> الوضع الهجين (طلب فوري وسلة متاحة)</>}
              </span>
            </div>

            {/* Mode Switch Pills for instant switching */}
            <div className="flex items-center gap-1 bg-stone-800/80 p-1 rounded-xl border border-stone-700/60">
              <button
                onClick={() => updateStoreSettings({ store_mode: 'AFFILIATE_BROKER' })}
                className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 ${
                  storeMode === 'AFFILIATE_BROKER'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="تفعيل نمط البيع بالعمولة: بدون سلة ولا بوابات دفع"
              >
                <Zap className="w-2.5 h-2.5" /> البيع بالعمولة (بدون سلة)
              </button>
              <button
                onClick={() => updateStoreSettings({ store_mode: 'DROPSHIPPING' })}
                className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 ${
                  storeMode === 'DROPSHIPPING'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="تفعيل نمط الدروب شيبنج: سلة مشتريات ودفع كامل"
              >
                <ShoppingCart className="w-2.5 h-2.5" /> دروب شيبنج (سلة)
              </button>
              <button
                onClick={() => updateStoreSettings({ store_mode: 'HYBRID' })}
                className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 ${
                  storeMode === 'HYBRID'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="تفعيل النمط الهجين: جمع بين الشراء الفوري والسلة"
              >
                <Layers className="w-2.5 h-2.5" /> هجين
              </button>
            </div>
          </div>
        </div>
      )}

      {directOrderProduct ? (
        <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-300" dir="rtl">
          {/* Navigation Breadcrumbs & Back Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-stone-200 pb-5">
            <div className="flex items-center gap-2 text-stone-500 text-xs sm:text-sm font-bold">
              <button 
                onClick={() => setDirectOrderProduct(null)} 
                className="hover:text-emerald-600 transition-colors cursor-pointer"
              >
                الرئيسية
              </button>
              <span className="text-stone-300">/</span>
              <span className="text-stone-500">طلب وتوصية فورية</span>
              <span className="text-stone-300">/</span>
              <span className="text-emerald-700 font-extrabold">{directOrderProduct.name}</span>
            </div>

            <button 
              onClick={() => setDirectOrderProduct(null)} 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border border-emerald-200/50"
            >
              <X className="w-4 h-4" /> العودة للتصفح في المتجر
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
            {/* Product info and total */}
            <div className="md:col-span-5 p-6 sm:p-8 bg-stone-50 border-b md:border-b-0 md:border-l border-stone-100 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-stone-200/60">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <Zap className="w-5 h-5 fill-emerald-600 text-emerald-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-stone-900">طلب وتوصية فورية بنقرة واحدة</h3>
                    <p className="text-[11px] text-stone-500">نظام الوساطة والتسويق بالعمولة (بدون سلة مشتريات)</p>
                  </div>
                </div>

                <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-sm max-w-sm mx-auto w-full">
                  <SafeDriveImage 
                    src={directOrderProduct.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"} 
                    alt={directOrderProduct.name} 
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
                    {directOrderProduct.category}
                  </span>
                  <h4 className="font-black text-stone-900 text-lg leading-tight">{directOrderProduct.name}</h4>
                  <p className="text-xs text-stone-500 leading-relaxed">{directOrderProduct.description}</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-200/60 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500">السعر الفردي:</span>
                  <span className="text-base font-extrabold text-stone-950">{directOrderProduct.price} ₪</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500">الكمية المطلوبة:</span>
                  <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl p-1 shadow-2xs">
                    <button 
                      type="button"
                      onClick={() => setDirectOrderQuantity(Math.max(1, directOrderQuantity - 1))}
                      className="text-stone-500 hover:text-stone-800 font-black px-2.5 py-1 cursor-pointer transition-colors"
                    >
                      -
                    </button>
                    <span className="text-sm font-black text-stone-900 min-w-6 text-center">{directOrderQuantity}</span>
                    <button 
                      type="button"
                      onClick={() => setDirectOrderQuantity(directOrderQuantity + 1)}
                      className="text-stone-500 hover:text-stone-800 font-black px-2.5 py-1 cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <span className="font-black text-emerald-900 text-xs">المجموع المطلوب للدفع عند الاستلام:</span>
                  <span className="text-xl font-black text-emerald-700">
                    {directOrderProduct.price * directOrderQuantity} ₪
                  </span>
                </div>
              </div>
            </div>

            {/* Form details */}
            <div className="md:col-span-7 p-6 sm:p-8 space-y-6">
              <h4 className="font-extrabold text-sm text-stone-800 border-b border-stone-100 pb-3">يرجى تعبئة بيانات استلام الطلب وتأكيده</h4>
              
              <form onSubmit={(e) => handleDirectOrderSubmit(e, false)} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">الاسم الكامل (أو اسم المشتري): *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: أحمد عبد الله"
                    value={directOrderName}
                    onChange={(e) => setDirectOrderName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-emerald-500 text-sm bg-stone-50/50 transition-all focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">رقم الهاتف / الواتساب: *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="0599123456"
                      value={directOrderPhone}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^\d+]/g, '');
                        if (val.includes('+')) {
                          val = '+' + val.replace(/\+/g, '');
                        }
                        setDirectOrderPhone(val);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-emerald-500 text-sm bg-stone-50/50 transition-all focus:bg-white"
                    />
                  </div>

                  <div className="relative">
                    <label className="font-bold text-stone-700 block mb-1">المدينة / المحافظة: *</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        placeholder="ابحث عن مدينتك أو اخترها"
                        value={citySearchInput}
                        onChange={(e) => {
                          setCitySearchInput(e.target.value);
                          setDirectOrderCity(e.target.value);
                          setShowCitySuggestions(true);
                        }}
                        onFocus={() => setShowCitySuggestions(true)}
                        onBlur={() => {
                          setTimeout(() => setShowCitySuggestions(false), 200);
                        }}
                        className="w-full px-4 py-3 pr-10 rounded-xl border border-stone-200 focus:outline-emerald-500 text-sm bg-stone-50/50 transition-all focus:bg-white"
                      />
                      <MapPin className="w-5 h-5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {showCitySuggestions && filteredCities.length > 0 && (
                      <div className="absolute z-50 w-full bg-white border border-stone-200 shadow-xl rounded-xl mt-1 overflow-y-auto max-h-56 animate-in fade-in slide-in-from-top-1 duration-150">
                        {filteredCities.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => {
                              setCitySearchInput(city);
                              setDirectOrderCity(city);
                              setShowCitySuggestions(false);
                            }}
                            className="w-full text-right px-4 py-3 text-sm hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer border-b border-stone-50 last:border-0 font-medium flex items-center justify-between"
                          >
                            <span>{city}</span>
                            <span className="text-[10px] text-stone-400 font-bold">فلسطين 🇵🇸</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {showCitySuggestions && filteredCities.length === 0 && (
                      <div className="absolute z-50 w-full bg-white border border-stone-200 shadow-xl rounded-xl mt-1 p-4 text-center text-xs text-stone-500 font-medium animate-in fade-in duration-150">
                        مدينة غير معرفة، سيتم تسجيلها كما كتبتها ✍️
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">العنوان أو الحي للتوصيل:</label>
                  <input 
                    type="text" 
                    placeholder="الشارع / رقم العمارة / تفاصيل الموقع"
                    value={directOrderAddress}
                    onChange={(e) => setDirectOrderAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-emerald-500 text-sm bg-stone-50/50 transition-all focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">ملاحظات التوصية أو الطلب (اختياري):</label>
                  <textarea 
                    rows={3}
                    placeholder="أي تفاصيل خاصة بالمقاس، اللون، أو وقت الاستلام المفضل..."
                    value={directOrderNotes}
                    onChange={(e) => setDirectOrderNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-emerald-500 text-sm bg-stone-50/50 transition-all focus:bg-white resize-none"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="space-y-2 pt-2">
                  <button 
                    type="submit"
                    disabled={isSubmittingDirectOrder}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:shadow-lg"
                  >
                    {isSubmittingDirectOrder ? (
                      'جاري تسجيل وتثبيت الطلب...'
                    ) : (
                      <><Check className="w-5 h-5 stroke-[3]" /> تأكيد وتثبيت الطلب بالنظام فوراً ⚡</>
                    )}
                  </button>


                </div>

              </form>
            </div>
          </div>
        </div>
      ) : !selectedProduct ? (
        <>
          {/* Hero Section with Interactive Animations */}
          <section 
            className="relative text-white py-24 px-4 overflow-hidden transition-all duration-300"
        style={{
          backgroundColor: heroBgColor,
          backgroundImage: heroBgImage ? `linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url(${heroBgImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Animated Background Light Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.25, 0.45, 0.25]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.15, 0.35, 0.15]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          
          {/* Hero Content Left */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} /> 
              <span>منصة التجارة الإلكترونية الفاخرة</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight whitespace-pre-line text-transparent bg-clip-text bg-gradient-to-l from-white via-stone-100 to-stone-300">
              {heroTitle}
            </h1>

            {heroSubtitle ? (
              <p className="text-stone-300 text-base sm:text-lg leading-relaxed max-w-lg font-medium">
                {heroSubtitle}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <motion.a
                whileHover={{ scale: 1.05, boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                href="#products"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-7 py-3.5 rounded-2xl shadow-xl transition-all flex items-center gap-2.5 cursor-pointer text-sm"
              >
                تصفح المنتجات <ArrowRight className="w-4 h-4 rotate-180 transition-transform group-hover:-translate-x-1" />
              </motion.a>

              {currentUser ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onOpenPortal ? onOpenPortal() : setIsMyOrdersOpen(true)}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-6 py-3.5 rounded-2xl transition-all flex items-center gap-2 cursor-pointer text-sm backdrop-blur-xs"
                >
                  <Package className="w-4 h-4 text-emerald-400" /> حسابي وطلباتي ({myOrders.length})
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onOpenAuthModal}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-6 py-3.5 rounded-2xl transition-all cursor-pointer text-sm backdrop-blur-xs"
                >
                  تسجيل حساب جديد
                </motion.button>
              )}
            </div>

            {/* Quick Benefits Badges */}
            <div className="pt-4 flex flex-wrap gap-4 text-xs font-bold text-stone-300 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-400" /> توصيل لكافة المدن
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" /> دفع آمن عند الاستلام
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> منتجات أصيلة 100%
              </div>
            </div>
          </motion.div>

          {/* Hero Visual Right with Motion */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative space-y-4"
          >
            {/* Main Interactive Hero Image Container */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border border-white/20 aspect-video md:aspect-square bg-stone-900 group cursor-pointer"
            >
              <img
                src={heroImage}
                alt={storeSettings.store_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80";
                }}
              />
              {/* Subtle hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

              {/* Inset Top Badge */}
              <div className="absolute top-4 right-4 z-20 bg-white/10 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold flex items-center gap-1.5">
                <span className="text-amber-400">⭐</span> <span>أفضل جودة وخدمة</span>
              </div>

              {/* Inset Bottom Card */}
              <div className="absolute bottom-4 right-4 left-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-400 font-bold block">تسوق بثقة وأمان</span>
                  <span className="text-sm font-extrabold block">{storeSettings.store_name}</span>
                </div>
                <span className="px-3 py-1.5 bg-emerald-600 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1">
                  توصيل سريع ⚡
                </span>
              </div>
            </motion.div>

            {/* Bottom Floating Highlights Bar */}
            <div className="grid grid-cols-2 gap-3 z-20">
              <div className="bg-white/10 backdrop-blur-md text-white p-3 rounded-2xl border border-white/15 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                  ⭐
                </div>
                <div>
                  <span className="text-xs font-extrabold block text-white">منتجات فاخرة</span>
                  <span className="text-[10px] text-stone-300 font-medium">أعلى تقييمات العملاء</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md text-white p-3 rounded-2xl border border-white/15 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                  ⚡
                </div>
                <div>
                  <span className="text-xs font-extrabold block text-white">شحن مباشر</span>
                  <span className="text-[10px] text-stone-300 font-medium">كافة المناطق والمدن</span>
                </div>
              </div>
            </div>

          </motion.div>

        </div>
      </section>

      {/* Floating Wishlist Button */}
      {wishlistItems.length > 0 && (
        <button
          onClick={() => {
            if (!currentUser) onOpenAuthModal();
            else setIsWishlistOpen(true);
          }}
          className="fixed bottom-24 left-6 z-40 bg-white hover:bg-rose-50 text-rose-500 p-4 rounded-2xl shadow-xl border border-rose-100 transition-all flex items-center gap-3 cursor-pointer group"
          title="عرض المفضلة"
        >
          <div className="relative">
            <Heart className="w-6 h-6 fill-rose-500 text-rose-500 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {wishlistItems.filter(w => w.customer_id === currentUser?.id).length}
            </span>
          </div>
        </button>
      )}

      {/* Floating Cart Button (Only rendered if storeMode is not AFFILIATE_BROKER) */}
      {storeMode !== 'AFFILIATE_BROKER' && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 left-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl shadow-2xl transition-all flex items-center gap-3 cursor-pointer group"
          title="عرض سلة المشتريات"
        >
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-stone-900 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-emerald-600">
                {cartItemsCount}
              </span>
            )}
          </div>
          <span className="font-bold text-sm hidden sm:inline">
            السلة ({cartTotal} ₪)
          </span>
        </button>
      )}





      {/* Order Success Toast / Modal */}
      {orderSuccessMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-emerald-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-2">تم تأكيد الطلب بنجاح!</h3>
            <p className="text-sm text-stone-600 mb-4">{orderSuccessMessage}</p>
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 mb-6 text-xs text-stone-700 text-right space-y-1">
              <div><strong>رقم الطلب:</strong> <span className="font-mono text-emerald-700 font-bold">{createdOrderNumber}</span></div>
              <div><strong>طريقة الدفع:</strong> {paymentMethod === 'cash_on_delivery' ? 'الدفع عند الاستلام' : 'بطاقة ائتمان'}</div>
              <div><strong>المدينة:</strong> {customerCity}</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setOrderSuccessMessage(null);
                  setIsMyOrdersOpen(true);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                تتبع الطلب
              </button>
              <button
                onClick={() => setOrderSuccessMessage(null)}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                متابعة التسوق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 -mt-8 relative z-20 mb-12">
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-stone-200 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <h2 className="text-sm sm:text-base font-black text-stone-900">
                تصفح أقسام وتصنيفات المتجر (Store Categories)
              </h2>
            </div>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>عرض جميع الأقسام</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {activeCategories.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              const hasImage = cat.display_mode === 'image' && Boolean(cat.image_url);

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? 'all' : cat.name)}
                  className={`group relative rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/50 shadow-md scale-[1.02]'
                      : 'border-stone-200/80 hover:border-emerald-300 bg-white hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {/* Photo or Icon Display */}
                  {hasImage ? (
                    <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-stone-100">
                      <img
                        src={cat.image_url}
                        alt={cat.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      
                      {/* Top Right Symbol Badge */}
                      <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs text-stone-900 flex items-center justify-center text-xs shadow-xs">
                        {cat.icon || '💎'}
                      </div>

                      {/* Content Overlay */}
                      <div className="absolute bottom-2 inset-x-2 text-right text-white">
                        <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1 drop-shadow-xs">
                          {cat.title}
                        </h3>
                        <p className="text-[10px] text-stone-200 line-clamp-1 opacity-90">
                          {cat.subtitle}
                        </p>
                      </div>

                      {/* Selected Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 left-2 bg-emerald-500 text-white p-1 rounded-full shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center flex flex-col items-center justify-center min-h-[120px] bg-stone-50/60 hover:bg-emerald-50/30 transition-colors">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2 transition-transform duration-300 group-hover:scale-110 shadow-2xs ${
                        isSelected ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-700 border border-stone-200'
                      }`}>
                        {cat.icon || '💎'}
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-stone-800 line-clamp-1">
                        {cat.title}
                      </h3>
                      <p className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                        {cat.subtitle}
                      </p>
                    </div>
                  )}

                  {/* Active bottom bar */}
                  <div className={`h-1 w-full transition-colors ${isSelected ? 'bg-emerald-500' : 'bg-transparent group-hover:bg-emerald-200'}`} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-stone-900">المنتجات المميزة (Featured Products)</h2>
            <p className="text-sm text-stone-500">مجموعة منتقاة بعناية لترضي ذوقكم الرفيع مع توفير فوري</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتج..."
                className="pr-9 pl-4 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-64"
              />
            </div>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-700 px-3 py-2 rounded-xl transition-colors font-medium cursor-pointer"
              >
                إلغاء التصفية
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => (
            <div 
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col cursor-pointer"
            >
              <div className="relative aspect-square overflow-hidden bg-stone-100">
                <SafeDriveImage
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full font-medium">
                  {p.badge}
                </span>
                <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                  {p.fulfillment_method === 'OWN_STOCK' ? 'مخزون فوري' : 'شحن مورد'}
                </span>
                <button
                  onClick={(e) => handleWishlistToggle(e, p.id)}
                  className="absolute top-3 left-3 p-2 rounded-full bg-white/80 backdrop-blur-xs hover:bg-white text-stone-400 hover:text-rose-500 transition-all active:scale-95 shadow-sm"
                >
                  <Heart className={`w-4 h-4 ${isInWishlist(p.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-xs text-stone-500 font-medium">{p.category}</span>
                  <h3 className="font-bold text-stone-900 text-base mt-1 mb-2 line-clamp-1">{p.name}</h3>
                  <div className="flex items-center gap-1 text-amber-500 text-xs mb-3">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold text-stone-700">{p.rating}</span>
                    <span className="text-stone-400 text-[11px] mr-2">
                      (المتبقي: {p.stock} قطعة)
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-extrabold text-emerald-700">{p.price} ₪</span>
                    {p.oldPrice && (
                      <span className="text-xs text-stone-400 line-through mr-2">{p.oldPrice} ₪</span>
                    )}
                  </div>
                  {/* Action Button: Adapts directly to storeMode */}
                  {storeMode === 'AFFILIATE_BROKER' ? (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setDirectOrderProduct(p);
                        setDirectOrderQuantity(1);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> طلب وتوصية ⚡
                    </button>
                  ) : storeMode === 'DROPSHIPPING' ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                      className="bg-stone-900 group-hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> أضف للسلة
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setDirectOrderProduct(p);
                          setDirectOrderQuantity(1);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1"
                        title="طلب فوري مباشر"
                      >
                        <Zap className="w-3 h-3 fill-amber-300 text-amber-300" /> طلب فوري
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                        className="bg-stone-900 hover:bg-stone-800 text-white p-2 rounded-xl transition-colors cursor-pointer shadow-xs"
                        title="إضافة للسلة"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
        </>
      ) : (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          onDirectOrder={(p) => {
            setDirectOrderProduct(p);
            setDirectOrderQuantity(1);
          }}
          onOpenAuthModal={onOpenAuthModal}
        />
      )}

      {/* Wishlist Drawer Modal */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h3 className="font-bold text-stone-900 text-base">المفضلة ({wishlistItems.filter(w => w.customer_id === currentUser?.id).length})</h3>
              </div>
              <button 
                onClick={() => setIsWishlistOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {wishlistItems.filter(w => w.customer_id === currentUser?.id).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 text-center space-y-3">
                  <Heart className="w-16 h-16 stroke-1 text-stone-300" />
                  <p className="text-sm font-semibold">المفضلة فارغة</p>
                  <button
                    onClick={() => setIsWishlistOpen(false)}
                    className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    اكتشف المنتجات وأضف ما يعجبك
                  </button>
                </div>
              ) : (
                wishlistItems
                  .filter(w => w.customer_id === currentUser?.id)
                  .map((item) => {
                    const p = products.find(p => p.id === item.product_id);
                    if (!p) {
                      return (
                        <div key={item.wishlist_id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 opacity-50">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-stone-900 truncate">منتج غير متوفر</h4>
                          </div>
                          <button onClick={() => removeFromWishlist(item.product_id)} className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div key={item.wishlist_id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <SafeDriveImage 
                          src={p.image} 
                          alt={p.name} 
                          className="w-16 h-16 rounded-lg object-cover bg-white border border-stone-200 shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-stone-900 truncate">{p.name}</h4>
                          <div className="text-emerald-700 font-extrabold text-xs mt-0.5">
                            {p.price} ₪
                          </div>
                          {p.stock > 0 ? (
                            <button
                              onClick={() => {
                                addToCart(p);
                                removeFromWishlist(p.id);
                              }}
                              className="mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 transition-colors"
                            >
                              نقل إلى السلة
                            </button>
                          ) : (
                            <span className="mt-2 inline-block text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">
                              غير متوفر حالياً
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromWishlist(p.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-stone-900 text-base">سلة المشتريات ({cartItemsCount})</h3>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 text-center space-y-3">
                  <ShoppingBag className="w-16 h-16 stroke-1 text-stone-300" />
                  <p className="text-sm font-semibold">سلة المشتريات فارغة</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
                  >
                    تصفح المنتجات وأضف ما يعجبك
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <SafeDriveImage 
                      src={item.product.image} 
                      alt={item.product.name} 
                      className="w-16 h-16 rounded-lg object-cover bg-white border border-stone-200 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-stone-900 truncate">{item.product.name}</h4>
                      <div className="text-emerald-700 font-extrabold text-xs mt-0.5">
                        {item.product.price} ₪
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded bg-white border border-stone-300 flex items-center justify-center text-xs hover:bg-stone-100 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-mono px-1">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded bg-white border border-stone-300 flex items-center justify-center text-xs hover:bg-stone-100 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-600 font-medium">المجموع الكلي:</span>
                  <span className="text-xl font-extrabold text-emerald-700 font-mono">{cartTotal} ₪</span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>متابعة الشراء وإتمام الطلب</span>
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Form Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 my-8">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-4">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" /> إتمام الطلب وتحديد بيانات التوصيل
              </h3>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderErrorMessage && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{orderErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="أدخل اسمك الكريم"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">رقم الهاتف (واتساب) *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^\d+]/g, '');
                      if (val.includes('+')) {
                        val = '+' + val.replace(/\+/g, '');
                      }
                      setCustomerPhone(val);
                    }}
                    placeholder="+970 / 059..."
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">المدينة / المنطقة *</label>
                  <select
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {PALESTINIAN_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">العنوان التفصيلي (الشارع، المعلم القريب) *</label>
                <input
                  type="text"
                  required
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="مثال: شارع الإرسال، بجانب برج فلسطين"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">طريقة الدفع</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash_on_delivery')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${paymentMethod === 'cash_on_delivery' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-stone-50 border-stone-200 text-stone-600'}`}
                  >
                    <span>💵 الدفع عند الاستلام</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${paymentMethod === 'card' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-stone-50 border-stone-200 text-stone-600'}`}
                  >
                    <span>💳 بطاقة بنكية / فيزا</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ملاحظات إضافية (اختياري)</label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="أوقات التوصيل المفضلة، أو أي ملاحظات أخرى..."
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-stone-100 rounded-xl flex items-center justify-between text-xs font-bold">
                <span>إجمالي الطلب:</span>
                <span className="text-base text-emerald-700 font-mono">{cartTotal} ₪</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingOrder ? 'جاري تثبيت الطلب والمخزون...' : 'تأكيد وإرسال الطلب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer "My Orders" Tracker Modal */}
      {isMyOrdersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-stone-900 text-base">سجل وتتبع طلباتي</h3>
              </div>
              <button 
                onClick={() => setIsMyOrdersOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {myOrders.length === 0 ? (
                <div className="text-center py-12 text-stone-500 space-y-2">
                  <Package className="w-12 h-12 mx-auto text-stone-300 stroke-1" />
                  <p className="text-sm font-semibold">لا توجد طلبات سابقة مسجلة لهذا الحساب حالياً.</p>
                </div>
              ) : (
                myOrders.map((ord) => (
                  <div key={ord.order_id} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-stone-900 text-sm">{ord.order_number}</span>
                        <span className="text-[11px] text-stone-500 block">{ord.created_at.split('T')[0]}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        ord.order_status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                        ord.order_status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                        ord.order_status === 'PROCESSING' ? 'bg-amber-100 text-amber-800' :
                        ord.order_status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {ord.order_status === 'DELIVERED' ? 'تم التسليم بنجاح' :
                         ord.order_status === 'SHIPPED' ? 'تم الشحن وهو في الطريق' :
                         ord.order_status === 'PROCESSING' ? 'قيد التجهيز والتنفيذ' :
                         ord.order_status === 'CANCELLED' ? 'ملغي' : 'طلب جديد'}
                      </span>
                    </div>

                    <div className="text-xs text-stone-700 border-t border-stone-200 pt-2 flex items-center justify-between">
                      <span>الوجهة: {ord.city} - {ord.shipping_address}</span>
                      <span className="font-bold text-emerald-700 font-mono text-sm">{ord.total} ₪</span>
                    </div>

                    {/* Order Items */}
                    <div className="mt-2 pt-2 border-t border-stone-200 space-y-2">
                      {ord.items && ord.items.map(item => {
                        const isDelivered = ord.order_status === 'DELIVERED';
                        const p = products.find(prod => prod.id === item.product_id);
                        return (
                          <div key={item.product_id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-stone-100 shadow-sm">
                            <div className="flex items-center gap-3">
                              {p && <SafeDriveImage src={p.image} alt={p.name} className="w-10 h-10 rounded-md object-cover" />}
                              <div>
                                <p className="text-xs font-bold text-stone-800">{item.product_name_at_purchase}</p>
                                <p className="text-[10px] text-stone-500">{item.quantity} × {item.selling_price_at_purchase} ₪</p>
                              </div>
                            </div>
                            {isDelivered && p && (
                              <button 
                                onClick={() => setSelectedProduct(p)}
                                className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 cursor-pointer"
                              >
                                قيّم المنتج
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {ord.tracking_number && (
                      <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-blue-700" />
                          <span>الشحن: <strong>{ord.shipping_company || 'شركة التوصيل'}</strong></span>
                        </div>
                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-blue-200">
                          {ord.tracking_number}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 text-center">
              <button
                onClick={() => setIsMyOrdersOpen(false)}
                className="px-6 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
