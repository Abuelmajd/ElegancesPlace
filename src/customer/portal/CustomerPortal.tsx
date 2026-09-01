import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrders } from '../../contexts/OrderContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useReturnRequests } from '../../contexts/ReturnContext';
import { useStoreManagement } from '../../contexts/StoreContext';

import { ProfileTab } from './ProfileTab';
import { MyOrdersTab } from './MyOrdersTab';
import { OrderTrackingTab } from './OrderTrackingTab';
import { ReturnsTab } from './ReturnsTab';
import { WishlistTab } from './WishlistTab';
import { ReviewsTab } from './ReviewsTab';
import { NotificationsTab } from './NotificationsTab';
import { AccountSettingsTab } from './AccountSettingsTab';
import { PolicyModal } from '../components/PolicyModal';

import { User, Package, Truck, ArrowRightLeft, Heart, Star, Bell, Settings, LogOut, ShoppingBag, ShieldCheck, ArrowRight, BookOpen } from 'lucide-react';

interface CustomerPortalProps {
  onBackToStore?: () => void;
  defaultTab?: 'profile' | 'orders' | 'tracking' | 'returns' | 'wishlist' | 'reviews' | 'notifications' | 'settings';
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ onBackToStore, defaultTab = 'orders' }) => {
  const { currentUser, logout } = useAuth();
  const { orders } = useOrders();
  const { wishlistItems } = useWishlist();
  const { unreadCount } = useNotifications();
  const { userReturnRequests } = useReturnRequests();
  const { storeSettings } = useStoreManagement();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'tracking' | 'returns' | 'wishlist' | 'reviews' | 'notifications' | 'settings'>(defaultTab);
  const [activePolicy, setActivePolicy] = useState<{ title: string; content: string } | null>(null);

  // Filter orders for current user
  const myOrders = orders.filter(o => {
    if (!currentUser) return false;
    return (
      (o.customer_id && o.customer_id === currentUser.user_id) ||
      (o.customer_phone && currentUser.phone && o.customer_phone === currentUser.phone)
    );
  });

  const activeOrdersCount = myOrders.filter(o => {
    const s = (o.order_status || '').toUpperCase();
    return s === 'NEW' || s === 'CONFIRMED' || s === 'PROCESSING' || s === 'SHIPPED';
  }).length;

  const deliveredOrdersCount = myOrders.filter(o => (o.order_status || '').toUpperCase() === 'DELIVERED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" dir="rtl">
      {/* Back to store bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToStore}
          className="text-stone-600 hover:text-stone-900 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-2xs"
        >
          <ArrowRight className="w-4 h-4 text-emerald-600" /> العودة للتسوق في المتجر
        </button>

        <div className="text-xs text-stone-500 font-medium hidden sm:flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> بوابة خدمة العميل الذاتية (Customer Self-Service)
        </div>
      </div>

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div 
          onClick={() => setActiveTab('orders')} 
          className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium block">إجمالي طلباتي</span>
            <span className="text-xl font-extrabold text-stone-900">{myOrders.length}</span>
          </div>
        </div>

        {/* Active Shipments */}
        <div 
          onClick={() => setActiveTab('tracking')} 
          className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs hover:border-blue-300 transition-all cursor-pointer flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium block">شحنات نشطة</span>
            <span className="text-xl font-extrabold text-blue-900">{activeOrdersCount}</span>
          </div>
        </div>

        {/* Wishlist */}
        <div 
          onClick={() => setActiveTab('wishlist')} 
          className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs hover:border-rose-300 transition-all cursor-pointer flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <Heart className="w-6 h-6 fill-rose-500" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium block">المفضلة</span>
            <span className="text-xl font-extrabold text-stone-900">{wishlistItems.length}</span>
          </div>
        </div>

        {/* Unread Notifications */}
        <div 
          onClick={() => setActiveTab('notifications')} 
          className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs hover:border-amber-300 transition-all cursor-pointer flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0 relative">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium block">إشعارات جديدة</span>
            <span className="text-xl font-extrabold text-stone-900">{unreadCount}</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Navigation Sidebar & Tab View Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-2xs space-y-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-right px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between ${activeTab === 'orders' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-100'}`}
            >
              <span className="flex items-center gap-2.5">
                <Package className="w-4 h-4" /> طلباتي ومشترياتي
              </span>
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded-md font-mono">{myOrders.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('tracking')}
              className={`w-full text-right px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between ${activeTab === 'tracking' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-100'}`}
            >
              <span className="flex items-center gap-2.5">
                <Truck className="w-4 h-4" /> تتبع الشحنات
              </span>
            </button>

            <button
              onClick={() => setActiveTab('returns')}
              className={`w-full text-right px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between ${activeTab === 'returns' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-100'}`}
            >
              <span className="flex items-center gap-2.5">
                <ArrowRightLeft className="w-4 h-4" /> الإرجاع والاستبدال
              </span>
              {userReturnRequests.length > 0 && (
                <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-md font-bold">{userReturnRequests.length}</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full text-right px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between ${activeTab === 'wishlist' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-100'}`}
            >
              <span className="flex items-center gap-2.5">
                <Heart className="w-4 h-4" /> قائمة المفضلة
              </span>
              <span className="bg-stone-100 text-stone-700 text-[10px] px-2 py-0.5 rounded-md font-bold">{wishlistItems.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full text-right px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between ${activeTab === 'reviews' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-100'}`}
            >
              <span className="flex items-center gap-2.5">
                <Star className="w-4 h-4" /> تقييماتي ومراجعاتي
              </span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-right px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between ${activeTab === 'notifications' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-100'}`}
            >
              <span className="flex items-center gap-2.5">
                <Bell className="w-4 h-4" /> الإشعارات والتنبيهات
              </span>
              {unreadCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{unreadCount}</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-right px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between ${activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-100'}`}
            >
              <span className="flex items-center gap-2.5">
                <User className="w-4 h-4" /> الملف الشخصي
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-right px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between ${activeTab === 'settings' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-100'}`}
            >
              <span className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" /> إعدادات الحساب والأمان
              </span>
            </button>
          </div>
          {/* Logout button */}
          <button
            onClick={logout}
            className="w-full text-right px-4 py-3 rounded-2xl font-bold text-xs text-red-600 hover:bg-red-50 border border-stone-200 transition-colors cursor-pointer flex items-center gap-2.5 bg-white"
          >
            <LogOut className="w-4 h-4" /> تسجيل الخروج من الحساب
          </button>

          {/* Policies Section */}
          <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-2xs space-y-1 mt-4">
            <p className="px-4 text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">سياسات المتجر</p>
            <button onClick={() => setActivePolicy({ title: 'سياسة الشحن', content: storeSettings.shipping_policy || '' })} className="w-full text-right px-4 py-3 rounded-xl font-bold text-xs text-stone-700 hover:bg-stone-100 cursor-pointer flex items-center gap-2.5">
              <BookOpen className="w-4 h-4" /> سياسة الشحن
            </button>
            <button onClick={() => setActivePolicy({ title: 'سياسة الاستبدال', content: storeSettings.exchange_policy || '' })} className="w-full text-right px-4 py-3 rounded-xl font-bold text-xs text-stone-700 hover:bg-stone-100 cursor-pointer flex items-center gap-2.5">
              <BookOpen className="w-4 h-4" /> سياسة الاستبدال
            </button>
            <button onClick={() => setActivePolicy({ title: 'سياسة الإلغاء', content: storeSettings.cancellation_policy || '' })} className="w-full text-right px-4 py-3 rounded-xl font-bold text-xs text-stone-700 hover:bg-stone-100 cursor-pointer flex items-center gap-2.5">
              <BookOpen className="w-4 h-4" /> سياسة الإلغاء
            </button>
          </div>
        </div>

        {/* Tab View Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'orders' && <MyOrdersTab />}
          {activeTab === 'tracking' && <OrderTrackingTab />}
          {activeTab === 'returns' && <ReturnsTab />}
          {activeTab === 'wishlist' && <WishlistTab />}
          {activeTab === 'reviews' && <ReviewsTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'settings' && <AccountSettingsTab />}

          {activePolicy !== null && (
            <PolicyModal 
              isOpen={true}
              onClose={() => setActivePolicy(null)}
              title={activePolicy.title}
              content={activePolicy.content}
            />
          )}
        </div>
      </div>
    </div>
  );
};
