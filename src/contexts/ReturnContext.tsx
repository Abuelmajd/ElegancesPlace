import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ReturnRequest, ReturnStatus, RequestType, ReturnRequestItem } from '../types';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { useGoogleSheets } from './GoogleSheetsContext';

export interface ReturnContextType {
  returnRequests: ReturnRequest[];
  userReturnRequests: ReturnRequest[];
  createReturnRequest: (input: {
    order_id: string;
    order_number_snapshot: string;
    type: RequestType;
    items: ReturnRequestItem[];
    reason: string;
    notes?: string;
    photo_url?: string;
  }) => Promise<{ success: boolean; request?: ReturnRequest; message?: string }>;
  updateReturnRequestStatus: (requestId: string, status: ReturnStatus, adminNotes?: string) => Promise<boolean>;
  getReturnRequestById: (requestId: string) => ReturnRequest | undefined;
}

const SEED_RETURNS: ReturnRequest[] = [
  {
    request_id: 'ret_101',
    order_id: 'ord_101',
    order_number_snapshot: 'ORD-1001',
    customer_id: 'cust_1',
    customer_name_snapshot: 'سارة خالد المنصور',
    customer_phone_snapshot: '+970599112233',
    type: 'RETURN',
    items: [
      {
        order_item_id: 'item_101_1',
        product_id: 'p1',
        product_name: 'عطر العود الملكي الفاخر',
        quantity: 1,
        selling_price: 180
      }
    ],
    reason: 'المنتج ممتاز ولكن يفضل تبديله بحجم أكبر',
    notes: 'تم التواصل مع خدمة العملاء لطلب الاسترجاع',
    status: 'COMPLETED',
    admin_notes: 'تمت الموافقة وإعادة المبلغ للحساب السحابي',
    admin_handled_by: 'المدير العام',
    created_at: '2026-08-21T10:00:00.000Z',
    updated_at: '2026-08-22T14:30:00.000Z',
    sync_status: 'SYNCED'
  }
];

const ReturnContext = createContext<ReturnContextType | undefined>(undefined);

export const ReturnProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { createNotification } = useNotifications();
  const { syncNow } = useGoogleSheets();

  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>(() => {
    const saved = localStorage.getItem('elites_return_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return SEED_RETURNS;
  });

  useEffect(() => {
    localStorage.setItem('elites_return_requests', JSON.stringify(returnRequests));
  }, [returnRequests]);

  // Create Return Request
  const createReturnRequest = useCallback(async (input: {
    order_id: string;
    order_number_snapshot: string;
    type: RequestType;
    items: ReturnRequestItem[];
    reason: string;
    notes?: string;
    photo_url?: string;
  }): Promise<{ success: boolean; request?: ReturnRequest; message?: string }> => {
    if (!currentUser) {
      return { success: false, message: 'يرجى تسجيل الدخول أولاً لإرسال طلب الإرجاع أو الاستبدال.' };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, message: 'يرجى تحديد عنصر واحد على الأقل للإرجاع أو الاستبدال.' };
    }

    if (!input.reason.trim()) {
      return { success: false, message: 'يرجى كتابة سبب طلب الإرجاع أو الاستبدال.' };
    }

    const now = new Date();
    const requestId = `ret_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newRequest: ReturnRequest = {
      request_id: requestId,
      order_id: input.order_id,
      order_number_snapshot: input.order_number_snapshot,
      customer_id: currentUser.user_id,
      customer_name_snapshot: currentUser.name || 'عميل المتجر',
      customer_phone_snapshot: currentUser.phone || '',
      type: input.type,
      items: input.items,
      reason: input.reason,
      notes: input.notes || '',
      photo_url: input.photo_url || '',
      status: 'PENDING',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      sync_status: 'PENDING'
    };

    setReturnRequests(prev => [newRequest, ...prev]);

    // Send alert to admin
    const typeText = input.type === 'RETURN' ? 'إرجاع' : 'استبدال';
    await createNotification({
      recipient_user_id: 'all',
      recipient_role: 'ADMIN_ROLES',
      type: 'REFUND_REQUEST',
      title: `طلب ${typeText} جديد #${input.order_number_snapshot}`,
      message: `قدم العميل ${currentUser.name} طلب ${typeText} للطلب #${input.order_number_snapshot}. السبب: ${input.reason}`,
      entity_type: 'ORDER',
      entity_id: input.order_id,
      priority: 'HIGH',
      action_url: 'returns',
      metadata: { request_id: requestId, order_id: input.order_id, type: input.type }
    });

    // Trigger sync
    syncNow();

    return {
      success: true,
      request: newRequest,
      message: `تم تقديم طلب ${typeText} بنجاح! سيتم مراجعته من قبل إدارة المتجر وموافاتك بالتحديثات.`
    };
  }, [currentUser, createNotification, syncNow]);

  // Update Status
  const updateReturnRequestStatus = useCallback(async (requestId: string, status: ReturnStatus, adminNotes = ''): Promise<boolean> => {
    const req = returnRequests.find(r => r.request_id === requestId);
    if (!req) return false;

    const now = new Date();
    setReturnRequests(prev => prev.map(r => r.request_id === requestId ? {
      ...r,
      status: status,
      admin_notes: adminNotes || r.admin_notes,
      admin_handled_by: currentUser?.name || 'المدير',
      updated_at: now.toISOString(),
      sync_status: 'PENDING'
    } : r));

    // Notify customer
    let titleText = `تحديث طلب الإرجاع للطلب #${req.order_number_snapshot}`;
    let msgText = `تغيرت حالة طلبك إلى: ${status}`;

    if (status === 'APPROVED') {
      titleText = `تمت الموافقة على طلب ${req.type === 'RETURN' ? 'الإرجاع' : 'الاستبدال'}!`;
      msgText = `وافقت إدارة المتجر على طلبك للطلب #${req.order_number_snapshot}. ${adminNotes ? `ملاحظات: ${adminNotes}` : ''}`;
    } else if (status === 'REJECTED') {
      titleText = `تحديث بخصوص طلب ${req.type === 'RETURN' ? 'الإرجاع' : 'الاستبدال'}`;
      msgText = `عذراً، تعذر قبول طلب ${req.type === 'RETURN' ? 'الإرجاع' : 'الاستبدال'} للطلب #${req.order_number_snapshot}. ${adminNotes ? `السبب: ${adminNotes}` : ''}`;
    } else if (status === 'COMPLETED') {
      titleText = `مكتمل: تم إتمام ${req.type === 'RETURN' ? 'الإرجاع' : 'الاستبدال'} بنجاح`;
      msgText = `تم إتمام عملية ${req.type === 'RETURN' ? 'الإرجاع وإعادة المبلغ' : 'الاستبدال'} للطلب #${req.order_number_snapshot}.`;
    }

    await createNotification({
      recipient_user_id: req.customer_id,
      recipient_role: 'Customer',
      type: 'ORDER_RETURNED',
      title: titleText,
      message: msgText,
      entity_type: 'ORDER',
      entity_id: req.order_id,
      priority: 'NORMAL',
      action_url: 'customer_orders'
    });

    syncNow();
    return true;
  }, [returnRequests, currentUser, createNotification, syncNow]);

  const getReturnRequestById = useCallback((requestId: string) => {
    return returnRequests.find(r => r.request_id === requestId);
  }, [returnRequests]);

  const userReturnRequests = returnRequests.filter(r => currentUser && r.customer_id === currentUser.user_id);

  return (
    <ReturnContext.Provider value={{
      returnRequests,
      userReturnRequests,
      createReturnRequest,
      updateReturnRequestStatus,
      getReturnRequestById
    }}>
      {children}
    </ReturnContext.Provider>
  );
};

export const useReturnRequests = () => {
  const context = useContext(ReturnContext);
  if (!context) {
    throw new Error('useReturnRequests must be used within a ReturnProvider');
  }
  return context;
};
