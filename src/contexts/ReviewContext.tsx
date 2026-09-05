import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Review, ReviewStatus } from '../types';
import { useAuth } from './AuthContext';
import { useGoogleSheets } from './GoogleSheetsContext';
import { useNotifications } from './NotificationContext';
import { useOrders } from './OrderContext';

export interface ReviewContextType {
  reviews: Review[];
  addReview: (productId: string, orderId: string, rating: number, title: string, comment: string) => Promise<boolean>;
  updateReviewStatus: (reviewId: string, status: ReviewStatus) => boolean;
  replyToReview: (reviewId: string, reply: string) => boolean;
  deleteReview: (reviewId: string) => boolean;
  canCustomerReview: (productId: string) => { canReview: boolean; orderId?: string; reason?: string };
  getProductReviews: (productId: string) => Review[];
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const ReviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, role } = useAuth();
  const { syncNow } = useGoogleSheets();
  const { notifyNewReview, notifyReviewStatusChange, notifyReviewReply } = useNotifications();
  const { orders } = useOrders();

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('elites_reviews');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      {
        review_id: 'rev_1',
        product_id: 'prod_1',
        customer_id: 'cust_1',
        customer_name_snapshot: 'سارة خالد',
        order_id: 'ORD-2026-1001',
        rating: 5,
        title: 'عطر ممتاز',
        comment: 'عطر فخم جداً ورائحته تدوم طويلاً، شكراً ElegancesPlace!',
        status: 'APPROVED',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        sync_status: 'SYNCED'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('elites_reviews', JSON.stringify(reviews));
  }, [reviews]);

  const canCustomerReview = useCallback((productId: string) => {
    if (!currentUser) {
      return { canReview: false, reason: 'يجب تسجيل الدخول كعميل لتقييم المنتج' };
    }

    const userRoleStr = (role || currentUser.role || '').toUpperCase();
    const isCustomerRole = userRoleStr === 'CUSTOMER' || userRoleStr === 'OWNER' || userRoleStr === 'MANAGER';
    if (!isCustomerRole) {
      return { canReview: false, reason: 'يجب تسجيل الدخول كعميل لتقييم المنتج' };
    }

    const currentUserId = currentUser.user_id || (currentUser as any).id;
    const currentEmail = currentUser.email?.toLowerCase();
    const currentPhone = currentUser.phone;

    // Filter customer orders
    const customerOrders = orders.filter(o => 
      (currentUserId && o.customer_id === currentUserId) ||
      (currentEmail && o.customer_email?.toLowerCase() === currentEmail) ||
      (currentPhone && o.customer_phone === currentPhone)
    );

    const isDelivered = (status?: string) => {
      if (!status) return false;
      const s = status.toUpperCase();
      return s === 'DELIVERED' || s === 'SETTLED' || s === 'COLLECTED_BY_SUPPLIER';
    };

    // 1. Has user already reviewed this product?
    const existingReview = reviews.find(r => 
      (r.customer_id === currentUserId || (currentEmail && (r as any).customer_email?.toLowerCase() === currentEmail)) && 
      r.product_id === productId
    );

    if (existingReview) {
      return { canReview: false, reason: 'لقد قمت بتقييم هذا المنتج مسبقاً' };
    }

    // 2. Check for delivered order with this product
    const validOrder = customerOrders.find(o => 
      isDelivered(o.order_status) && 
      o.items && o.items.some(item => item.product_id === productId)
    );

    if (validOrder) {
      return { canReview: true, orderId: validOrder.order_id };
    }

    // 3. Has user ordered this product but order is not delivered yet?
    const undeliveredOrder = customerOrders.find(o => 
      !isDelivered(o.order_status) && 
      o.items && o.items.some(item => item.product_id === productId)
    );

    if (undeliveredOrder) {
      return { canReview: false, reason: 'يجب استلام الطلب أولاً قبل إضافة التقييم' };
    }

    // 4. Logged in customer evaluating product
    return { canReview: true, orderId: 'ord_direct' };
  }, [currentUser, role, orders, reviews]);

  const getProductReviews = useCallback((productId: string) => {
    return reviews.filter(r => r.product_id === productId && r.status === 'APPROVED');
  }, [reviews]);

  const addReview = async (
    productIdOrObj: any, 
    orderIdArg?: string, 
    ratingArg?: number, 
    titleArg?: string, 
    commentArg?: string
  ) => {
    if (!currentUser) return false;

    let productId = '';
    let orderId = 'ord_direct';
    let rating = 5;
    let title = '';
    let comment = '';

    if (typeof productIdOrObj === 'object' && productIdOrObj !== null) {
      productId = productIdOrObj.product_id || productIdOrObj.productId || '';
      orderId = productIdOrObj.order_id || productIdOrObj.orderId || 'ord_direct';
      rating = Number(productIdOrObj.rating) || 5;
      title = productIdOrObj.title || '';
      comment = productIdOrObj.comment || '';
    } else {
      productId = String(productIdOrObj || '');
      orderId = orderIdArg || 'ord_direct';
      rating = Number(ratingArg) || 5;
      title = titleArg || '';
      comment = commentArg || '';
    }

    const currentUserId = currentUser.user_id || (currentUser as any).id || 'usr_cust_01';

    const newReview: Review = {
      review_id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      product_id: productId,
      customer_id: currentUserId,
      customer_name_snapshot: currentUser.name || 'عميل النخبة',
      order_id: orderId,
      rating,
      title,
      comment,
      status: 'APPROVED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: 'PENDING'
    };

    setReviews(prev => [newReview, ...prev]);
    
    // Notify admin
    notifyNewReview(newReview).catch(console.error);
    
    setTimeout(() => {
      syncNow();
    }, 1000);

    return true;
  };

  const updateReviewStatus = (reviewId: string, status: ReviewStatus) => {
    setReviews(prev => prev.map(r => {
      if (r.review_id === reviewId) {
        const updated = { ...r, status, updated_at: new Date().toISOString(), sync_status: 'PENDING' as const };
        
        // Notification
        if (status === 'APPROVED') notifyReviewStatusChange(updated, 'APPROVED').catch(console.error);
        else if (status === 'REJECTED') notifyReviewStatusChange(updated, 'REJECTED').catch(console.error);
        
        return updated;
      }
      return r;
    }));
    
    setTimeout(syncNow, 1000);
    return true;
  };

  const replyToReview = (reviewId: string, reply: string) => {
    if (!currentUser) return false;

    setReviews(prev => prev.map(r => {
      if (r.review_id === reviewId) {
        const updated = { 
          ...r, 
          admin_reply: reply, 
          admin_reply_by: currentUser.name, 
          admin_reply_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sync_status: 'PENDING' as const 
        };
        
        notifyReviewReply(updated).catch(console.error);
        return updated;
      }
      return r;
    }));

    setTimeout(syncNow, 1000);
    return true;
  };

  const deleteReview = (reviewId: string) => {
    setReviews(prev => prev.filter(r => r.review_id !== reviewId));
    setTimeout(syncNow, 1000);
    return true;
  };

  return (
    <ReviewContext.Provider value={{
      reviews,
      addReview,
      updateReviewStatus,
      replyToReview,
      deleteReview,
      canCustomerReview,
      getProductReviews
    }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }
  return context;
};
