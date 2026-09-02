import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProductProvider } from './contexts/ProductContext';
import { GoogleSheetsProvider } from './contexts/GoogleSheetsContext';
import { OrderProvider } from './contexts/OrderContext';
import { AccountingProvider } from './contexts/AccountingContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ReviewProvider } from './contexts/ReviewContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ReturnProvider } from './contexts/ReturnContext';
import { StoreProvider } from './contexts/StoreContext';
import { CategoryProvider } from './contexts/CategoryContext';

import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { StorefrontHome } from './customer/StorefrontHome';
import { CustomerPortal } from './customer/portal/CustomerPortal';
import { AdminDashboard } from './admin/AdminDashboard';
import { Phase1SetupView } from './components/admin/Phase1SetupView';
import { AuthModal } from './components/common/AuthModal';

function MainApp() {
  const [currentView, setCurrentView] = useState<'store' | 'admin' | 'setup' | 'customer_portal'>('store');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { role } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans" dir="rtl">
      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onOpenAuthModal={() => setAuthModalOpen(true)} 
      />

      <main className="flex-1">
        {currentView === 'store' && (
          <StorefrontHome 
            onOpenAuthModal={() => setAuthModalOpen(true)} 
            onOpenPortal={() => setCurrentView('customer_portal')}
          />
        )}

        {currentView === 'customer_portal' && (
          <CustomerPortal 
            onBackToStore={() => setCurrentView('store')} 
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard />
        )}

        {currentView === 'setup' && (
          <Phase1SetupView />
        )}
      </main>

      <Footer />

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <GoogleSheetsProvider>
          <ProductProvider>
            <OrderProvider>
              <AccountingProvider>
                <WishlistProvider>
                  <ReviewProvider>
                    <ReturnProvider>
                      <StoreProvider>
                        <CategoryProvider>
                          <MainApp />
                        </CategoryProvider>
                      </StoreProvider>
                    </ReturnProvider>
                  </ReviewProvider>
                </WishlistProvider>
              </AccountingProvider>
            </OrderProvider>
          </ProductProvider>
        </GoogleSheetsProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

