import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreManagement } from '../../contexts/StoreContext';
import { ShoppingCart, Heart, User, Shield, LogOut, Settings, Layers, Menu, X, Store, Megaphone, ChevronDown, Tag, PhoneCall, Sparkles, Zap } from 'lucide-react';
import { UserRole } from '../../types';
import { NotificationBell } from './NotificationBell';

interface NavbarProps {
  currentView: 'store' | 'admin' | 'setup' | 'customer_portal';
  setCurrentView: (view: 'store' | 'admin' | 'setup' | 'customer_portal') => void;
  onOpenAuthModal: () => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  Owner: 'المالك والمدير العام',
  Manager: 'مدير النظام',
  Accountant: 'المحاسب المالي',
  Marketing: 'مسؤول التسويق',
  Employee: 'موظف التجهيز',
  Customer: 'عميل المتجر'
};

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, onOpenAuthModal }) => {
  const { currentUser, logout, role, loginAsDemo } = useAuth();
  const { storeSettings, announcementBar } = useStoreManagement();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Reset logoError if logo_url changes
  React.useEffect(() => {
    setLogoError(false);
  }, [storeSettings.logo_url]);

  const storeName = storeSettings.store_name || 'ElegancesPlace';
  const logoInitial = storeName.trim().charAt(0) || 'ن';

  const isAdminRole = role && role !== 'Customer';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs" dir="rtl">
      {/* Dynamic Announcement Bar if enabled */}
      {announcementBar?.enabled && (
        <div 
          className="text-xs py-2 px-4 text-center flex items-center justify-center gap-2 font-bold shadow-inner transition-colors"
          style={{ 
            backgroundColor: announcementBar.backgroundColor || '#059669', 
            color: announcementBar.textColor || '#ffffff' 
          }}
        >
          <Megaphone className="w-3.5 h-3.5 animate-bounce shrink-0" />
          <span>{announcementBar.text || 'أهلاً بكم في متجرنا الإلكتروني!'}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Right Side: Logo & Brand */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentView('store')}
              className="flex items-center gap-3 text-right group cursor-pointer"
            >
              {storeSettings.logo_url && !logoError ? (
                <div className="w-10 h-10 rounded-xl border border-stone-200 bg-white p-0.5 shadow-md flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                  <img 
                    src={storeSettings.logo_url} 
                    alt={storeName}
                    className="w-full h-full object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoError(true)}
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-stone-900 to-emerald-800 text-white flex items-center justify-center font-black text-xl shadow-md group-hover:bg-emerald-700 transition-colors shrink-0">
                  {logoInitial}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg sm:text-xl text-stone-900 tracking-tight block leading-tight">
                    {storeName}
                  </span>
                  {isAdminRole && (
                    <span className={`hidden sm:inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${
                      storeSettings.store_mode === 'DROPSHIPPING'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : storeSettings.store_mode === 'HYBRID'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {storeSettings.store_mode === 'DROPSHIPPING' ? (
                        <><ShoppingCart className="w-2.5 h-2.5" /> دروب شيبنج</>
                      ) : storeSettings.store_mode === 'HYBRID' ? (
                        <><Layers className="w-2.5 h-2.5" /> وضع هجين</>
                      ) : (
                        <><Zap className="w-2.5 h-2.5 fill-current" /> بيع بالعمولة</>
                      )}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-stone-500 font-medium tracking-wider block">
                  {storeSettings.store_slogan || 'منصة التجارة الإلكترونية الفاخرة'}
                </span>
              </div>
            </button>
          </div>

          {/* Center Navigation Links (Clean & Standard for Customers) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button 
              onClick={() => setCurrentView('store')}
              className={`px-3 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'store' 
                  ? 'bg-emerald-50 text-emerald-700 font-extrabold shadow-2xs' 
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Store className="w-4 h-4 text-emerald-600" /> الرئيسية
            </button>

            <a 
              href="#products"
              onClick={() => { if (currentView !== 'store') setCurrentView('store'); }}
              className="px-3 py-2 rounded-xl font-semibold text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Tag className="w-4 h-4 text-stone-400" /> الكتالوج والمنتجات
            </a>

            <a 
              href="#offers"
              onClick={() => { if (currentView !== 'store') setCurrentView('store'); }}
              className="px-3 py-2 rounded-xl font-semibold text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-500" /> العروض والخصومات
            </a>

            {/* Admin Dashboard Button - Visually Distinct and ONLY shown to Admin / Owner / Staff */}
            {isAdminRole && (
              <button 
                onClick={() => setCurrentView('admin')}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  currentView === 'admin' 
                    ? 'bg-stone-900 text-white shadow-md' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-300" /> لوحة التحكم الإدارية
              </button>
            )}
          </nav>

          {/* Left Side: User Profile & Actions */}
          <div className="hidden md:flex items-center gap-3">
            <NotificationBell />

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 pl-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-stone-800 block leading-tight max-w-[110px] truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 block">
                      {ROLE_LABELS[currentUser.role] || currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {/* User Profile Dropdown Menu */}
                {userMenuOpen && (
                  <div 
                    className="absolute left-0 mt-2 w-56 bg-white rounded-2xl border border-stone-200 shadow-xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-2"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 mb-1">
                      <p className="text-xs font-bold text-stone-900">{currentUser.name}</p>
                      <p className="text-[10px] text-stone-500 font-mono truncate">{currentUser.email}</p>
                      <span className="mt-1 inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                        {ROLE_LABELS[currentUser.role]}
                      </span>
                    </div>

                    <button
                      onClick={() => setCurrentView('customer_portal')}
                      className="w-full text-right px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-stone-500" /> حسابي وطلباتي
                    </button>

                    {isAdminRole && (
                      <button
                        onClick={() => setCurrentView('admin')}
                        className="w-full text-right px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-emerald-600" /> لوحة التحكم الإدارية
                      </button>
                    )}

                    <div className="border-t border-stone-100 pt-1">
                      <button
                        onClick={() => logout()}
                        className="w-full text-right px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2.5 rounded-xl font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <User className="w-4 h-4" /> تسجيل الدخول
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-700 hover:bg-stone-100 rounded-xl cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-4 pt-2 pb-4 space-y-2 animate-in fade-in">
          <button
            onClick={() => { setCurrentView('store'); setMobileMenuOpen(false); }}
            className="w-full text-right px-3 py-2.5 rounded-xl font-bold text-xs text-stone-800 hover:bg-stone-100 flex items-center gap-2"
          >
            <Store className="w-4 h-4 text-emerald-600" /> واجهة المتجر
          </button>

          {currentUser && (
            <button
              onClick={() => { setCurrentView('customer_portal'); setMobileMenuOpen(false); }}
              className="w-full text-right px-3 py-2.5 rounded-xl font-bold text-xs text-stone-800 hover:bg-stone-100 flex items-center gap-2"
            >
              <User className="w-4 h-4 text-stone-600" /> حسابي وطلباتي
            </button>
          )}

          {isAdminRole && (
            <button
              onClick={() => { setCurrentView('admin'); setMobileMenuOpen(false); }}
              className="w-full text-right px-3 py-2.5 rounded-xl font-bold text-xs bg-stone-900 text-white flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-amber-300" /> لوحة التحكم الإدارية ({ROLE_LABELS[role]})
            </button>
          )}

          {currentUser ? (
            <button
              onClick={() => { logout(); setMobileMenuOpen(false); }}
              className="w-full text-right px-3 py-2.5 rounded-xl font-bold text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> تسجيل الخروج
            </button>
          ) : (
            <button
              onClick={() => { onOpenAuthModal(); setMobileMenuOpen(false); }}
              className="w-full text-right px-3 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" /> تسجيل الدخول
            </button>
          )}
        </div>
      )}
    </header>
  );
};
