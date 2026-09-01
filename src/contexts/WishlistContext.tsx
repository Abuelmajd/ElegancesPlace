import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WishlistItem } from '../types';
import { useAuth } from './AuthContext';
import { useGoogleSheets } from './GoogleSheetsContext';

export interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => boolean;
  clearWishlist: () => boolean;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { syncNow } = useGoogleSheets();

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => {
    const saved = localStorage.getItem('elites_wishlists');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('elites_wishlists', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const addToWishlist = useCallback((productId: string) => {
    if (!currentUser) return false;
    
    setWishlistItems(prev => {
      if (prev.some(w => w.customer_id === currentUser.id && w.product_id === productId)) {
        return prev;
      }
      
      const newItem: WishlistItem = {
        wishlist_id: 'wish_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        customer_id: currentUser.id,
        product_id: productId,
        created_at: new Date().toISOString(),
        sync_status: 'PENDING'
      };
      
      return [newItem, ...prev];
    });

    setTimeout(syncNow, 1000);
    return true;
  }, [currentUser, syncNow]);

  const removeFromWishlist = useCallback((productId: string) => {
    if (!currentUser) return false;

    setWishlistItems(prev => prev.filter(w => !(w.customer_id === currentUser.id && w.product_id === productId)));
    setTimeout(syncNow, 1000);
    return true;
  }, [currentUser, syncNow]);

  const clearWishlist = useCallback(() => {
    if (!currentUser) return false;

    setWishlistItems(prev => prev.filter(w => w.customer_id !== currentUser.id));
    setTimeout(syncNow, 1000);
    return true;
  }, [currentUser, syncNow]);

  const isInWishlist = useCallback((productId: string) => {
    if (!currentUser) return false;
    return wishlistItems.some(w => w.customer_id === currentUser.id && w.product_id === productId);
  }, [currentUser, wishlistItems]);

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
      isInWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
