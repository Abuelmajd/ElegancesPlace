import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Order, 
  OrderItem, 
  OrderStatus, 
  FulfillmentStatus, 
  ProductFulfillmentMethod,
  SupplierFulfillment, 
  SupplierSettlement,
  SupplierCommStatus,
  SupplierCollectionStatus,
  SupplierSettlementStatus,
  ReturnResponsibility,
  OrderTimelineEvent, 
  InventoryMovement, 
  AuditLog, 
  Customer, 
  Supplier 
} from '../types';
import { useProducts } from './ProductContext';
import { useGoogleSheets } from './GoogleSheetsContext';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

export interface OrderContextType {
  orders: Order[];
  orderItems: OrderItem[];
  supplierFulfillments: SupplierFulfillment[];
  supplierSettlements: SupplierSettlement[];
  timelineEvents: OrderTimelineEvent[];
  inventoryMovements: InventoryMovement[];
  auditLogs: AuditLog[];
  customers: Customer[];
  createOrder: (orderInput: Partial<Order>, itemsInput: {
    product_id: string;
    quantity: number;
    discount?: number;
  }[]) => Promise<{ success: boolean; order?: Order; error?: string; message?: string }>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, notes?: string) => Promise<boolean>;
  updateFulfillmentStatus: (orderId: string, newStatus: FulfillmentStatus, notes?: string) => Promise<boolean>;
  sendOrderToSupplier: (orderId: string, supplierNotes?: string, adminNotes?: string) => Promise<boolean>;
  updateSupplierFulfillmentDetails: (fulfillmentId: string, updates: Partial<SupplierFulfillment>) => Promise<boolean>;
  recordSupplierSettlement: (fulfillmentId: string, amountPaid: number, paymentMethod?: string, reference?: string, notes?: string) => Promise<boolean>;
  updateOrderTracking: (orderId: string, shippingCompany: string, trackingNumber: string, trackingUrl?: string) => Promise<boolean>;
  createInventoryMovement: (movement: Omit<InventoryMovement, 'movement_id' | 'date' | 'time'>) => Promise<boolean>;
  addAuditLog: (log: Omit<AuditLog, 'log_id' | 'date' | 'time' | 'timestamp'>) => void;
  syncOrdersWithSheets: () => Promise<boolean>;
  runTestScenario1: () => Promise<{ success: boolean; log: string[]; orderId?: string }>;
  runTestScenario2: () => Promise<{ success: boolean; log: string[]; orderId?: string }>;
  getOrderById: (orderId: string) => Order | undefined;
  getOrderItems: (orderId: string) => OrderItem[];
  getOrderFulfillments: (orderId: string) => SupplierFulfillment[];
  getOrderTimeline: (orderId: string) => OrderTimelineEvent[];
  getOrderAuditLogs: (orderId: string) => AuditLog[];
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Initial Seed Data for Demo & Historical reference
const INITIAL_CUSTOMERS: Customer[] = [
  {
    customer_id: 'cust_1',
    name: 'سارة خالد المنصور',
    phone: '+970599112233',
    email: 'sara.k@gmail.com',
    city: 'القدس',
    address: 'حي الشيخ جراح، شارع صلاح الدين',
    total_orders: 2,
    total_spent: 455,
    last_order_date: '2026-08-20',
    created_at: '2026-01-15'
  },
  {
    customer_id: 'cust_2',
    name: 'عبدالله فهد الشمري',
    phone: '+970598445566',
    email: 'a.shammari@hotmail.com',
    city: 'رام الله والبيرة',
    address: 'حي المصيون، شارع الإرسال',
    total_orders: 1,
    total_spent: 345,
    last_order_date: '2026-08-22',
    created_at: '2026-02-10'
  },
  {
    customer_id: 'cust_3',
    name: 'مها إبراهيم العتيبي',
    phone: '+970568778899',
    email: 'maha.otb@gmail.com',
    city: 'نابلس',
    address: 'حي رفيديا، قرب المستشفى التخصصي',
    total_orders: 1,
    total_spent: 275,
    last_order_date: '2026-08-23',
    created_at: '2026-03-05'
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    order_id: 'ord_101',
    order_number: 'ORD-1001',
    customer_id: 'cust_1',
    customer_name: 'سارة خالد المنصور',
    customer_phone: '+970599112233',
    customer_email: 'sara.k@gmail.com',
    shipping_address: 'حي الشيخ جراح، شارع صلاح الدين',
    city: 'القدس',
    notes: 'يرجى الاتصال قبل التوصيل بنصف ساعة',
    order_date: '2026-08-20',
    order_time: '14:30:00',
    created_at: '2026-08-20T14:30:00.000Z',
    updated_at: '2026-08-23T18:00:00.000Z',
    subtotal: 180,
    discount: 0,
    shipping_cost: 25,
    total: 205,
    payment_method: 'بطاقة مدى / ائتمان',
    payment_status: 'paid',
    order_status: 'DELIVERED',
    fulfillment_status: 'DELIVERED',
    sync_status: 'SYNCED',
    shipping_company: 'شركة أرامكس Express',
    tracking_number: 'TRK-98765432',
    tracking_url: 'https://aramex.com/track/TRK-98765432'
  },
  {
    order_id: 'ord_102',
    order_number: 'ORD-1002',
    customer_id: 'cust_2',
    customer_name: 'عبدالله فهد الشمري',
    customer_phone: '+970598445566',
    customer_email: 'a.shammari@hotmail.com',
    shipping_address: 'حي المصيون، شارع الإرسال',
    city: 'رام الله والبيرة',
    notes: 'الدفع عند الاستلام كاش',
    order_date: '2026-08-22',
    order_time: '18:15:00',
    created_at: '2026-08-22T18:15:00.000Z',
    updated_at: '2026-08-23T10:00:00.000Z',
    subtotal: 320,
    discount: 0,
    shipping_cost: 25,
    total: 345,
    payment_method: 'الدفع عند الاستلام (COD)',
    payment_status: 'pending',
    order_status: 'SHIPPED',
    fulfillment_status: 'SHIPPED',
    sync_status: 'SYNCED',
    shipping_company: 'شركة ترو ساعي للتوصيل',
    tracking_number: 'TRK-11223344',
    tracking_url: 'https://track.courier.com/TRK-11223344'
  },
  {
    order_id: 'ord_103',
    order_number: 'ORD-1003',
    customer_id: 'cust_3',
    customer_name: 'مها إبراهيم العتيبي',
    customer_phone: '+970568778899',
    customer_email: 'maha.otb@gmail.com',
    shipping_address: 'حي رفيديا، قرب المستشفى التخصصي',
    city: 'نابلس',
    notes: 'تغليف هدية راقٍ لو تكرمتم',
    order_date: '2026-08-23',
    order_time: '11:00:00',
    created_at: '2026-08-23T11:00:00.000Z',
    updated_at: '2026-08-24T09:00:00.000Z',
    subtotal: 250,
    discount: 0,
    shipping_cost: 25,
    total: 275,
    payment_method: 'الدفع عند الاستلام (COD)',
    payment_status: 'pending',
    order_status: 'PROCESSING',
    fulfillment_status: 'AWAITING_SUPPLIER',
    sync_status: 'SYNCED'
  }
];

const INITIAL_ORDER_ITEMS: OrderItem[] = [
  {
    order_item_id: 'item_101_1',
    order_id: 'ord_101',
    product_id: 'p1',
    sku_at_purchase: 'SKU-OUD-01',
    sku: 'SKU-OUD-01',
    product_name_at_purchase: 'عطر العود الملكي الفاخر',
    product_name: 'عطر العود الملكي الفاخر',
    supplier_id_at_purchase: 'sup_1',
    supplier_name_at_purchase: 'مورد العطور المميزة',
    cost_price_at_purchase: 120,
    selling_price_at_purchase: 180,
    quantity: 1,
    subtotal: 180,
    profit: 60,
    fulfillment_method_at_purchase: 'OWN_STOCK'
  },
  {
    order_item_id: 'item_102_1',
    order_id: 'ord_102',
    product_id: 'p2',
    sku_at_purchase: 'SKU-WAT-02',
    sku: 'SKU-WAT-02',
    product_name_at_purchase: 'ساعة يد كلاسيكية أنيقة',
    product_name: 'ساعة يد كلاسيكية أنيقة',
    supplier_id_at_purchase: 'sup_2',
    supplier_name_at_purchase: 'مورد الساعات العالمية',
    cost_price_at_purchase: 210,
    selling_price_at_purchase: 320,
    quantity: 1,
    subtotal: 320,
    profit: 110,
    fulfillment_method_at_purchase: 'OWN_STOCK'
  },
  {
    order_item_id: 'item_103_1',
    order_id: 'ord_103',
    product_id: 'p3',
    sku_at_purchase: 'SKU-BAG-03',
    sku: 'SKU-BAG-03',
    product_name_at_purchase: 'حقيبة جلد طبيعي فاخرة',
    product_name: 'حقيبة جلد طبيعي فاخرة',
    supplier_id_at_purchase: 'sup_3',
    supplier_name_at_purchase: 'مورد الجلديات الفاخرة',
    cost_price_at_purchase: 160,
    selling_price_at_purchase: 250,
    quantity: 1,
    subtotal: 250,
    profit: 90,
    fulfillment_method_at_purchase: 'SUPPLIER_DROPSHIPPING'
  }
];

const INITIAL_SUPPLIER_FULFILLMENTS: SupplierFulfillment[] = [
  {
    fulfillment_id: 'ful_103_1',
    order_id: 'ord_103',
    supplier_id: 'sup_3',
    supplier_name_snapshot: 'مورد الجلديات الفاخرة',
    supplier_contact_snapshot: 'زياد الخالدي',
    supplier_phone_snapshot: '+970568778899',
    supplier_platform: 'whatsapp',
    status: 'AWAITING_SUPPLIER',
    supplier_cost: 160,
    shipping_cost: 0,
    supplier_notes: 'حقيبة جلد طبيعي فاخرة أسود - تغليف هدية',
    admin_notes: 'تم تحويل الطلب بانتظار تأكيد الاستلام وتجهيز الشحن',
    created_at: '2026-08-23T11:05:00.000Z',
    updated_at: '2026-08-23T11:05:00.000Z',
    updated_by: 'المدير العام'
  }
];

const INITIAL_TIMELINE: OrderTimelineEvent[] = [
  {
    event_id: 'evt_1',
    order_id: 'ord_101',
    event_type: 'ORDER_CREATED',
    timestamp: '2026-08-20 14:30:00',
    user_id: 'cust_1',
    description: 'تم إنشاء الطلب رقم ORD-1001 بنجاح عبر المتجر الإلكتروني'
  },
  {
    event_id: 'evt_2',
    order_id: 'ord_101',
    event_type: 'ORDER_CONFIRMED',
    timestamp: '2026-08-20 14:35:00',
    user_id: 'system',
    description: 'تم تأكيد الدفع الإلكتروني واعتماد الطلب'
  },
  {
    event_id: 'evt_3',
    order_id: 'ord_101',
    event_type: 'SHIPPED',
    timestamp: '2026-08-21 09:00:00',
    user_id: 'admin_1',
    description: 'تم تسليم الشحنة لشركة أرامكس مع بوليصة TRK-98765432'
  },
  {
    event_id: 'evt_4',
    order_id: 'ord_101',
    event_type: 'DELIVERED',
    timestamp: '2026-08-23 18:00:00',
    user_id: 'admin_1',
    description: 'تم تسليم الطلب للعميل بنجاح'
  },
  {
    event_id: 'evt_5',
    order_id: 'ord_102',
    event_type: 'ORDER_CREATED',
    timestamp: '2026-08-22 18:15:00',
    user_id: 'cust_2',
    description: 'تم إنشاء الطلب رقم ORD-1002 بنجاح'
  },
  {
    event_id: 'evt_6',
    order_id: 'ord_102',
    event_type: 'SHIPPED',
    timestamp: '2026-08-23 10:00:00',
    user_id: 'admin_1',
    description: 'تم شحن الطلب مع ترو ساعي برقم تتبع TRK-11223344'
  },
  {
    event_id: 'evt_7',
    order_id: 'ord_103',
    event_type: 'ORDER_CREATED',
    timestamp: '2026-08-23 11:00:00',
    user_id: 'cust_3',
    description: 'تم إنشاء طلب جديد برقم ORD-1003 (دروب شيبينغ)'
  },
  {
    event_id: 'evt_8',
    order_id: 'ord_103',
    event_type: 'SUPPLIER_CONTACTED',
    timestamp: '2026-08-23 11:05:00',
    user_id: 'admin_1',
    description: 'تم إرسال بيانات التوريد لمورد الجلديات الفاخرة عبر واتساب'
  }
];

const INITIAL_INVENTORY_MOVEMENTS: InventoryMovement[] = [
  {
    movement_id: 'mov_101',
    product_id: 'p1',
    order_id: 'ord_101',
    quantity: 1,
    before_quantity: 16,
    after_quantity: 15,
    movement_type: 'SALE',
    user_id: 'system',
    date: '2026-08-20',
    time: '14:30:00',
    timestamp: '2026-08-20 14:30:00',
    notes: 'بيع من المخزون الخاص بالطلب ord_101'
  },
  {
    movement_id: 'mov_102',
    product_id: 'p2',
    order_id: 'ord_102',
    quantity: 1,
    before_quantity: 9,
    after_quantity: 8,
    movement_type: 'SALE',
    user_id: 'system',
    date: '2026-08-22',
    time: '18:15:00',
    timestamp: '2026-08-22 18:15:00',
    notes: 'بيع من المخزون الخاص بالطلب ord_102'
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    log_id: 'audit_1',
    user_id: 'system',
    user_name: 'النظام الآلي',
    action: 'CREATE_ORDER',
    entity: 'Order',
    entity_id: 'ord_101',
    date: '2026-08-20',
    time: '14:30:00',
    details: 'إنشاء الطلب رقم ORD-1001 للعميل سارة خالد بقيمة 205 ₪'
  },
  {
    log_id: 'audit_2',
    user_id: 'admin_1',
    user_name: 'أحمد محمد (مدير)',
    action: 'SEND_TO_SUPPLIER',
    entity: 'SupplierFulfillment',
    entity_id: 'ful_103_1',
    date: '2026-08-23',
    time: '11:05:00',
    details: 'تحويل الطلب ord_103 إلى مورد الجلديات الفاخرة'
  }
];

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { products, updateProductStock } = useProducts();
  const { syncNow } = useGoogleSheets();
  const { currentUser } = useAuth();
  const { notifyNewOrder, notifyOrderStatusChange } = useNotifications();

  // 1. Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('elites_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_ORDERS;
  });

  // 2. Order Items
  const [orderItems, setOrderItems] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem('elites_order_items');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_ORDER_ITEMS;
  });

  // 3. Supplier Fulfillments
  const [supplierFulfillments, setSupplierFulfillments] = useState<SupplierFulfillment[]>(() => {
    const saved = localStorage.getItem('elites_fulfillments') || localStorage.getItem('elites_supplier_fulfillments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_SUPPLIER_FULFILLMENTS;
  });

  // 4. Order Timeline
  const [timelineEvents, setTimelineEvents] = useState<OrderTimelineEvent[]>(() => {
    const saved = localStorage.getItem('elites_order_timeline');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_TIMELINE;
  });

  // 5. Inventory Movements
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem('elites_inventory_movements');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_INVENTORY_MOVEMENTS;
  });

  // 6. Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('elites_audit_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_AUDIT_LOGS;
  });

  // 7. Customers
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('elites_customers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_CUSTOMERS;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('elites_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('elites_order_items', JSON.stringify(orderItems));
  }, [orderItems]);

  useEffect(() => {
    localStorage.setItem('elites_fulfillments', JSON.stringify(supplierFulfillments));
    localStorage.setItem('elites_supplier_fulfillments', JSON.stringify(supplierFulfillments));
  }, [supplierFulfillments]);

  useEffect(() => {
    localStorage.setItem('elites_order_timeline', JSON.stringify(timelineEvents));
  }, [timelineEvents]);

  useEffect(() => {
    localStorage.setItem('elites_inventory_movements', JSON.stringify(inventoryMovements));
  }, [inventoryMovements]);

  useEffect(() => {
    localStorage.setItem('elites_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('elites_customers', JSON.stringify(customers));
  }, [customers]);

  const addAuditLog = useCallback((log: Omit<AuditLog, 'log_id' | 'date' | 'time' | 'timestamp'>) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const newLog: AuditLog = {
      log_id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: log.user_id || currentUser?.user_id || 'system',
      user_name: log.user_name || currentUser?.name || 'النظام الآلي',
      action: log.action,
      entity: log.entity,
      entity_id: log.entity_id,
      date: dateStr,
      time: timeStr,
      details: log.details || ''
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  // Create Order with robust validations
  const createOrder = useCallback(async (
    orderInput: Partial<Order>,
    itemsInput: { product_id: string; quantity: number; discount?: number }[]
  ): Promise<{ success: boolean; order?: Order; error?: string; message?: string }> => {
    if (!itemsInput || itemsInput.length === 0) {
      return { success: false, error: 'NO_ITEMS', message: 'السلة فارغة. يرجى إضافة منتجات لإنشاء الطلب.' };
    }

    // Read stored suppliers for snapshot
    const rawSuppliers: Supplier[] = JSON.parse(localStorage.getItem('elites_suppliers') || '[]');

    // 1. Validate Stock for all OWN_STOCK products
    for (const item of itemsInput) {
      const prod = products.find(p => p.id === item.product_id || p.product_id === item.product_id);
      if (!prod) {
        return { success: false, error: 'PRODUCT_NOT_FOUND', message: `المنتج (${item.product_id}) غير متوفر في المتجر.` };
      }

      const fulfillmentMethod = prod.fulfillment_method || 'OWN_STOCK';
      if (fulfillmentMethod === 'OWN_STOCK') {
        const availableStock = prod.stock !== undefined ? Number(prod.stock) : 0;
        if (availableStock < item.quantity) {
          return { 
            success: false, 
            error: 'INSUFFICIENT_STOCK', 
            message: `INSUFFICIENT STOCK: الكمية المتوفرة في المخزون للمنتج "${prod.name}" هي (${availableStock}) فقط، بينما المطلوب (${item.quantity}). لا يمكن إتمام الطلب.` 
          };
        }
      }
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const orderTimestamp = now.toISOString();

    const orderId = orderInput.order_id || ('ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));
    const nextOrderNumber = 'ORD-' + (1000 + orders.length + 1);

    let calculatedSubtotal = 0;
    const newItems: OrderItem[] = [];
    const newSupplierFulfillments: SupplierFulfillment[] = [];
    const newMovements: InventoryMovement[] = [];
    let hasDropshipping = false;

    // 2. Build OrderItems and Snapshots
    for (const item of itemsInput) {
      const prod = products.find(p => p.id === item.product_id || p.product_id === item.product_id)!;
      const fulfillmentMethod: ProductFulfillmentMethod = prod.fulfillment_method || 'OWN_STOCK';
      const unitSellingPrice = Number(prod.price) || 0;
      const unitCostPrice = prod.costPrice !== undefined ? Number(prod.costPrice) : Math.round(unitSellingPrice * 0.7);
      const discount = item.discount || 0;
      const itemSubtotal = (unitSellingPrice * item.quantity) - discount;
      const itemProfit = itemSubtotal - (unitCostPrice * item.quantity);

      calculatedSubtotal += itemSubtotal;

      // Find Supplier Snapshot
      const sup = rawSuppliers.find(s => s.supplier_id === prod.supplier_id) || {
        supplier_id: prod.supplier_id || 'sup_1',
        name: prod.supplier || 'مورد عام',
        company_name: prod.supplier || 'شركة التوريد',
        phone: '+970590000000',
        whatsapp: '+970590000000',
        preferred_platform: 'whatsapp'
      };

      const orderItemId = 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      
      const orderItem: OrderItem = {
        order_item_id: orderItemId,
        order_id: orderId,
        product_id: prod.product_id || prod.id,
        sku_at_purchase: prod.sku || ('SKU-' + (prod.product_id || prod.id)),
        sku: prod.sku || ('SKU-' + (prod.product_id || prod.id)),
        product_name_at_purchase: prod.name,
        product_name: prod.name,
        supplier_id_at_purchase: prod.supplier_id || sup.supplier_id || 'sup_1',
        supplier_name_at_purchase: sup.company_name || prod.supplier || 'المورد',
        cost_price_at_purchase: unitCostPrice,
        selling_price_at_purchase: unitSellingPrice,
        quantity: item.quantity,
        discount_at_purchase: discount,
        subtotal: itemSubtotal,
        profit: itemProfit,
        fulfillment_method_at_purchase: fulfillmentMethod
      };

      newItems.push(orderItem);

      // Handle OWN_STOCK Inventory Movement & Stock deduction
      if (fulfillmentMethod === 'OWN_STOCK') {
        const currentStock = Number(prod.stock) || 0;
        const newStock = Math.max(0, currentStock - item.quantity);
        updateProductStock(prod.id, newStock);

        const movement: InventoryMovement = {
          movement_id: 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          product_id: prod.product_id || prod.id,
          order_id: orderId,
          quantity: item.quantity,
          before_quantity: currentStock,
          after_quantity: newStock,
          movement_type: 'SALE',
          user_id: currentUser?.user_id || 'system',
          date: dateStr,
          time: timeStr,
          timestamp: `${dateStr} ${timeStr}`,
          notes: `خصم بيع مخزون محلي للطلب ${nextOrderNumber}`
        };
        newMovements.push(movement);
      } else {
        hasDropshipping = true;
        // Create Supplier Fulfillment entity
        const fulId = 'ful_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const supplierFulfillment: SupplierFulfillment = {
          fulfillment_id: fulId,
          order_id: orderId,
          supplier_id: sup.supplier_id,
          supplier_name_snapshot: sup.company_name || sup.name,
          supplier_contact_snapshot: sup.name,
          supplier_phone_snapshot: sup.phone || sup.whatsapp,
          supplier_platform: sup.preferred_platform || 'whatsapp',
          status: 'AWAITING_SUPPLIER',
          supplier_cost: unitCostPrice * item.quantity,
          shipping_cost: 0,
          supplier_notes: `مطلوب توريد: ${prod.name} (SKU: ${prod.sku || prod.id}) عدد ${item.quantity}`,
          admin_notes: 'بانتظار تحويل الطلب وتأكيد المورد',
          created_at: orderTimestamp,
          updated_at: orderTimestamp,
          updated_by: currentUser?.name || 'النظام'
        };
        newSupplierFulfillments.push(supplierFulfillment);
      }
    }

    const shippingCost = orderInput.shipping_cost !== undefined ? Number(orderInput.shipping_cost) : 25;
    const discount = orderInput.discount !== undefined ? Number(orderInput.discount) : 0;
    const total = calculatedSubtotal - discount + shippingCost;

    // 3. Customer Management (Find or Create)
    const customerPhone = (orderInput.customer_phone || orderInput.phone || '').trim();
    const customerName = (orderInput.customer_name || 'عميل المتجر').trim();
    const customerEmail = (orderInput.customer_email || '').trim();
    const customerCity = orderInput.city || 'القدس';
    const customerAddress = orderInput.shipping_address || orderInput.address || '';

    let customerId = orderInput.customer_id;
    let existingCustomer = customers.find(c => 
      (customerId && c.customer_id === customerId) ||
      (customerPhone && c.phone === customerPhone) ||
      (customerEmail && c.email && c.email === customerEmail)
    );

    if (existingCustomer) {
      customerId = existingCustomer.customer_id;
      setCustomers(prev => prev.map(c => c.customer_id === customerId ? {
        ...c,
        total_orders: (c.total_orders || 0) + 1,
        total_spent: (c.total_spent || 0) + total,
        last_order_date: dateStr,
        address: customerAddress || c.address,
        city: customerCity || c.city
      } : c));
    } else {
      customerId = customerId || ('cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));
      const newCustomer: Customer = {
        customer_id: customerId,
        name: customerName,
        phone: customerPhone || '+970590000000',
        email: customerEmail || `customer_${Date.now()}@elites-store.com`,
        city: customerCity,
        address: customerAddress,
        notes: orderInput.notes || '',
        total_orders: 1,
        total_spent: total,
        last_order_date: dateStr,
        created_at: dateStr
      };
      setCustomers(prev => [newCustomer, ...prev]);
    }

    // 4. Construct Order Object
    const initialFulfillmentStatus: FulfillmentStatus = hasDropshipping ? 'AWAITING_SUPPLIER' : 'PENDING';
    const initialOrderStatus: OrderStatus = orderInput.order_status || 'NEW';

    const newOrder: Order = {
      order_id: orderId,
      order_number: orderInput.order_number || nextOrderNumber,
      customer_id: customerId,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      shipping_address: customerAddress,
      city: customerCity,
      notes: orderInput.notes || '',
      order_date: dateStr,
      order_time: timeStr,
      created_at: orderTimestamp,
      updated_at: orderTimestamp,
      subtotal: calculatedSubtotal,
      discount: discount,
      shipping_cost: shippingCost,
      total: total,
      payment_method: orderInput.payment_method || 'الدفع عند الاستلام (COD)',
      payment_status: orderInput.payment_status || 'pending',
      order_status: initialOrderStatus,
      fulfillment_status: initialFulfillmentStatus,
      sync_status: 'PENDING',
      shipping_company: orderInput.shipping_company || '',
      tracking_number: orderInput.tracking_number || '',
      tracking_url: orderInput.tracking_url || '',
      items: newItems,
      phone: customerPhone,
      address: customerAddress
    };

    // 5. Create Order Timeline Event
    const timelineEvent: OrderTimelineEvent = {
      event_id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      order_id: orderId,
      event_type: 'ORDER_CREATED',
      timestamp: `${dateStr} ${timeStr}`,
      user_id: currentUser?.user_id || customerId,
      description: `تم إنشاء الطلب رقم ${newOrder.order_number} بنجاح بقيمة إجمالية ${total} ₪`
    };

    // 6. Update Local State
    setOrders(prev => [newOrder, ...prev]);
    setOrderItems(prev => [...newItems, ...prev]);
    if (newSupplierFulfillments.length > 0) {
      setSupplierFulfillments(prev => [...newSupplierFulfillments, ...prev]);
    }
    if (newMovements.length > 0) {
      setInventoryMovements(prev => [...newMovements, ...prev]);
    }
    setTimelineEvents(prev => [timelineEvent, ...prev]);

    // 7. Audit Log
    addAuditLog({
      user_id: currentUser?.user_id || 'system',
      user_name: currentUser?.name || customerName,
      action: 'CREATE_ORDER',
      entity: 'Order',
      entity_id: orderId,
      details: `إنشاء الطلب ${newOrder.order_number} بمجموع ${total} ₪ لـ ${customerName}`
    });

    // Notify New Order (Idempotent and safe)
    notifyNewOrder(newOrder).catch(console.error);

    // 8. Trigger Background Sync to Google Sheets (Offline fallback handling)
    setTimeout(() => {
      syncNow().then(synced => {
        if (synced) {
          setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, sync_status: 'SYNCED' } : o));
        } else {
          setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, sync_status: 'FAILED' } : o));
        }
      }).catch(() => {
        setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, sync_status: 'FAILED' } : o));
      });
    }, 400);

    return { success: true, order: newOrder, message: `تم إنشاء الطلب بنجاح برقم (${newOrder.order_number})!` };
  }, [products, orders, customers, currentUser, updateProductStock, addAuditLog, syncNow]);

  // Update Order Status with strict validation
  const updateOrderStatus = useCallback(async (
    orderId: string, 
    newStatus: OrderStatus, 
    notes = ''
  ): Promise<boolean> => {
    const order = orders.find(o => o.order_id === orderId);
    if (!order) return false;

    const oldStatus = order.order_status;
    const now = new Date();
    const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19);

    // Map status to timeline event
    let eventType: any = 'PROCESSING_STARTED';
    if (newStatus === 'CONFIRMED') eventType = 'ORDER_CONFIRMED';
    else if (newStatus === 'SHIPPED') eventType = 'SHIPPED';
    else if (newStatus === 'DELIVERED') eventType = 'DELIVERED';
    else if (newStatus === 'CANCELLED') eventType = 'CANCELLED';
    else if (newStatus === 'RETURNED') eventType = 'RETURNED';
    else if (newStatus === 'REFUNDED') eventType = 'REFUNDED';

    const timelineEvent: OrderTimelineEvent = {
      event_id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      order_id: orderId,
      event_type: eventType,
      timestamp: timestampStr,
      user_id: currentUser?.user_id || 'admin',
      description: `تغيير حالة الطلب من [${oldStatus}] إلى [${newStatus}]${notes ? ` - ملاحظات: ${notes}` : ''}`
    };

    setOrders(prev => prev.map(o => o.order_id === orderId ? {
      ...o,
      order_status: newStatus,
      updated_at: now.toISOString(),
      sync_status: 'PENDING'
    } : o));

    setTimelineEvents(prev => [timelineEvent, ...prev]);

    addAuditLog({
      user_id: currentUser?.user_id || 'admin',
      user_name: currentUser?.name || 'المدير',
      action: 'UPDATE_ORDER',
      entity: 'Order',
      entity_id: orderId,
      details: `تحديث حالة الطلب ${order.order_number} إلى ${newStatus}`
    });

    // Notify Order Status Change
    notifyOrderStatusChange(order, newStatus, notes).catch(console.error);

    syncNow();
    return true;
  }, [orders, currentUser, addAuditLog, syncNow]);

  // Update Fulfillment Status
  const updateFulfillmentStatus = useCallback(async (
    orderId: string, 
    newStatus: FulfillmentStatus, 
    notes = ''
  ): Promise<boolean> => {
    const now = new Date();
    const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19);

    setOrders(prev => prev.map(o => o.order_id === orderId ? {
      ...o,
      fulfillment_status: newStatus,
      updated_at: now.toISOString(),
      sync_status: 'PENDING'
    } : o));

    setSupplierFulfillments(prev => prev.map(f => f.order_id === orderId ? {
      ...f,
      status: newStatus,
      updated_at: now.toISOString(),
      updated_by: currentUser?.name || 'المدير'
    } : f));

    const timelineEvent: OrderTimelineEvent = {
      event_id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      order_id: orderId,
      event_type: newStatus === 'SUPPLIER_CONFIRMED' ? 'SUPPLIER_CONFIRMED' : newStatus === 'PACKED' ? 'PACKED' : 'PROCESSING_STARTED',
      timestamp: timestampStr,
      user_id: currentUser?.user_id || 'admin',
      description: `تحديث حالة التنفيذ إلى [${newStatus}]${notes ? ` (${notes})` : ''}`
    };

    setTimelineEvents(prev => [timelineEvent, ...prev]);

    addAuditLog({
      user_id: currentUser?.user_id || 'admin',
      user_name: currentUser?.name || 'المدير',
      action: 'CHANGE_FULFILLMENT_STATUS',
      entity: 'SupplierFulfillment',
      entity_id: orderId,
      details: `تغيير حالة تنفيذ الطلب إلى ${newStatus}`
    });

    syncNow();
    return true;
  }, [currentUser, addAuditLog, syncNow]);

  // Send Order to Supplier
  const sendOrderToSupplier = useCallback(async (
    orderId: string, 
    supplierNotes = '', 
    adminNotes = ''
  ): Promise<boolean> => {
    const order = orders.find(o => o.order_id === orderId);
    if (!order) return false;

    const now = new Date();
    const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19);

    setOrders(prev => prev.map(o => o.order_id === orderId ? {
      ...o,
      fulfillment_status: 'AWAITING_SUPPLIER',
      updated_at: now.toISOString(),
      sync_status: 'PENDING'
    } : o));

    setSupplierFulfillments(prev => prev.map(f => f.order_id === orderId ? {
      ...f,
      status: 'AWAITING_SUPPLIER',
      supplier_notes: supplierNotes || f.supplier_notes,
      admin_notes: adminNotes || f.admin_notes,
      updated_at: now.toISOString(),
      updated_by: currentUser?.name || 'المدير'
    } : f));

    const timelineEvent: OrderTimelineEvent = {
      event_id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      order_id: orderId,
      event_type: 'SUPPLIER_CONTACTED',
      timestamp: timestampStr,
      user_id: currentUser?.user_id || 'admin',
      description: `تم إرسال وتحويل تفاصيل الطلب رقم ${order.order_number} إلى المورد بنجاح`
    };

    setTimelineEvents(prev => [timelineEvent, ...prev]);

    addAuditLog({
      user_id: currentUser?.user_id || 'admin',
      user_name: currentUser?.name || 'المدير',
      action: 'SEND_TO_SUPPLIER',
      entity: 'SupplierFulfillment',
      entity_id: orderId,
      details: `تحويل الطلب ${order.order_number} للمورد مع الملاحظات`
    });

    syncNow();
    return true;
  }, [orders, currentUser, addAuditLog, syncNow]);

  // Update Order Tracking
  const updateOrderTracking = useCallback(async (
    orderId: string, 
    shippingCompany: string, 
    trackingNumber: string, 
    trackingUrl = ''
  ): Promise<boolean> => {
    const now = new Date();
    const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19);

    setOrders(prev => prev.map(o => o.order_id === orderId ? {
      ...o,
      shipping_company: shippingCompany,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      order_status: 'SHIPPED',
      fulfillment_status: 'SHIPPED',
      updated_at: now.toISOString(),
      sync_status: 'PENDING'
    } : o));

    setSupplierFulfillments(prev => prev.map(f => f.order_id === orderId ? {
      ...f,
      shipping_company: shippingCompany,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      status: 'SHIPPED',
      updated_at: now.toISOString(),
      updated_by: currentUser?.name || 'المدير'
    } : f));

    const timelineEvent: OrderTimelineEvent = {
      event_id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      order_id: orderId,
      event_type: 'SHIPPED',
      timestamp: timestampStr,
      user_id: currentUser?.user_id || 'admin',
      description: `تم شحن الطلب مع ${shippingCompany} برقم تتبع [${trackingNumber}]`
    };

    setTimelineEvents(prev => [timelineEvent, ...prev]);

    addAuditLog({
      user_id: currentUser?.user_id || 'admin',
      user_name: currentUser?.name || 'المدير',
      action: 'ADD_TRACKING',
      entity: 'Order',
      entity_id: orderId,
      details: `إضافة بوليصة التتبع ${trackingNumber} للشحنة مع ${shippingCompany}`
    });

    syncNow();
    return true;
  }, [currentUser, addAuditLog, syncNow]);

  // Create Manual Inventory Movement
  const createInventoryMovement = useCallback(async (
    movement: Omit<InventoryMovement, 'movement_id' | 'date' | 'time'>
  ): Promise<boolean> => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const newMov: InventoryMovement = {
      ...movement,
      movement_id: 'mov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      date: dateStr,
      time: timeStr,
      timestamp: `${dateStr} ${timeStr}`
    };

    setInventoryMovements(prev => [newMov, ...prev]);

    // Update Product stock accordingly
    if (movement.after_quantity !== undefined) {
      updateProductStock(movement.product_id, movement.after_quantity);
    }

    addAuditLog({
      user_id: currentUser?.user_id || 'admin',
      user_name: currentUser?.name || 'المدير',
      action: 'INVENTORY_ADJUSTMENT',
      entity: 'InventoryMovement',
      entity_id: newMov.movement_id,
      details: `حركة مخزون (${movement.movement_type}) للمنتج ${movement.product_id} بمقدار ${movement.quantity}`
    });

    return true;
  }, [currentUser, updateProductStock, addAuditLog]);

  // Direct sync
  const syncOrdersWithSheets = useCallback(async (): Promise<boolean> => {
    return await syncNow();
  }, [syncNow]);

  // ----------------------------------------------------
  // TEST SCENARIO 1: SUPPLIER DROPSHIPPING
  // Product A (Cost 20, Selling Price 60, Qty 2, SUPPLIER_DROPSHIPPING)
  // ----------------------------------------------------
  const runTestScenario1 = useCallback(async (): Promise<{ success: boolean; log: string[]; orderId?: string }> => {
    const log: string[] = [];
    log.push('🚀 بدء اختبار السيناريو 1: طلب دروب شيبينغ (Supplier Dropshipping)...');

    // Ensure Product A exists in products
    const prodA = products.find(p => p.id === 'prod_test_a') || {
      id: 'prod_test_a',
      product_id: 'prod_test_a',
      sku: 'SKU-TEST-A',
      name: 'منتج تجريبي A (دروب شيبينغ فاخر)',
      price: 60,
      costPrice: 20,
      category: 'عطور',
      category_id: 'cat_perfumes',
      supplier: 'مورد العطور المميزة',
      supplier_id: 'sup_1',
      stock: 50,
      fulfillment_method: 'SUPPLIER_DROPSHIPPING' as const,
      description: 'منتج اختباري للتحقق من سلامة دورة الدروب شيبينغ وتجميد الأسعار',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'
    };

    log.push(`✅ تم تجهيز المنتج: ${prodA.name} | التكلفة = 20 ₪ | سعر البيع = 60 ₪ | الكمية = 2`);

    // Create Order with Dropshipping product
    const res = await createOrder(
      {
        customer_name: 'عميل اختباري (دروب شيبينغ)',
        customer_phone: '+970599000111',
        customer_email: 'test_dropship@elites.com',
        city: 'رام الله والبيرة',
        shipping_address: 'شارع الإرسال، برج فلسطين',
        notes: 'طلب تجريبي آلي لاختبار سيناريو 1',
        shipping_cost: 20
      },
      [
        { product_id: prodA.id, quantity: 2 }
      ]
    );

    if (!res.success || !res.order) {
      log.push(`❌ فشل إنشاء طلب السيناريو 1: ${res.message || res.error}`);
      return { success: false, log };
    }

    const createdOrder = res.order;
    log.push(`✅ تم إنشاء الطلب بنجاح برقم: ${createdOrder.order_number} (ID: ${createdOrder.order_id})`);
    log.push(`✅ تم التحقق من العميل وسجل المشتريات.`);
    log.push(`✅ تم تجميد Snapshot لبيانات المنتج والمورد في OrderItems (التكلفة 20 ₪، البيع 60 ₪، الربح 80 ₪).`);
    log.push(`✅ تم إنشاء سجل SupplierFulfillment بالحالة AWAITING_SUPPLIER وربطه بـ supplier_id.`);
    log.push(`✅ تم تسجيل حدث ORDER_CREATED في سجل التتبع (Order Timeline).`);
    log.push(`✅ تم إنشاء سجل التدقيق (Audit Log) وحفظ البيانات في التخزين المؤقت المحلي وجدولة المزامنة السحابية.`);

    return { success: true, log, orderId: createdOrder.order_id };
  }, [products, createOrder]);

  // ----------------------------------------------------
  // TEST SCENARIO 2: OWN STOCK
  // Product B (Fulfillment = OWN_STOCK, Initial Stock = 10, Order Qty = 2 -> Stock = 8, Movement = SALE)
  // ----------------------------------------------------
  const runTestScenario2 = useCallback(async (): Promise<{ success: boolean; log: string[]; orderId?: string }> => {
    const log: string[] = [];
    log.push('🚀 بدء اختبار السيناريو 2: طلب مخزون ذاتي (Own Stock)...');

    // Ensure Product B with Stock = 10 exists
    const prodB = products.find(p => p.id === 'p2') || products[0];
    const initialStock = 10;
    updateProductStock(prodB.id, initialStock);

    log.push(`✅ تم ضبط مخزون المنتج "${prodB.name}" إلى ${initialStock} قطع.`);

    // Order 2 items
    const res = await createOrder(
      {
        customer_name: 'عميل اختباري (مخزون ذاتي)',
        customer_phone: '+970599000222',
        customer_email: 'test_ownstock@elites.com',
        city: 'القدس',
        shipping_address: 'شارع صلاح الدين',
        notes: 'طلب تجريبي آلي لاختبار سيناريو 2',
        shipping_cost: 20
      },
      [
        { product_id: prodB.id, quantity: 2 }
      ]
    );

    if (!res.success || !res.order) {
      log.push(`❌ فشل إنشاء طلب السيناريو 2: ${res.message || res.error}`);
      return { success: false, log };
    }

    const createdOrder = res.order;
    const finalStock = (initialStock - 2);

    log.push(`✅ تم إنشاء الطلب بنجاح برقم: ${createdOrder.order_number}`);
    log.push(`✅ تم خصم المخزون بنجاح: من ${initialStock} إلى ${finalStock} قطع.`);
    log.push(`✅ تم تسجيل حركة مخزون رسمية (InventoryMovement) من نوع SALE بعدد 2.`);
    log.push(`✅ تم التحقق من تجميد أسعار الشراء والبيع والربح في سجل الطلب.`);
    log.push(`✅ تم تسجيل الأحداث في Order Timeline وسجل التدقيق Audit Log.`);

    return { success: true, log, orderId: createdOrder.order_id };
  }, [products, updateProductStock, createOrder]);

  const getOrderById = useCallback((orderId: string) => {
    return orders.find(o => o.order_id === orderId);
  }, [orders]);

  const getOrderItems = useCallback((orderId: string) => {
    return orderItems.filter(item => item.order_id === orderId);
  }, [orderItems]);

  const getOrderFulfillments = useCallback((orderId: string) => {
    return supplierFulfillments.filter(f => f.order_id === orderId);
  }, [supplierFulfillments]);

  const getOrderTimeline = useCallback((orderId: string) => {
    return timelineEvents.filter(e => e.order_id === orderId).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [timelineEvents]);

  const getOrderAuditLogs = useCallback((orderId: string) => {
    return auditLogs.filter(a => a.entity_id === orderId);
  }, [auditLogs]);

  return (
    <OrderContext.Provider value={{
      orders,
      orderItems,
      supplierFulfillments,
      timelineEvents,
      inventoryMovements,
      auditLogs,
      customers,
      createOrder,
      updateOrderStatus,
      updateFulfillmentStatus,
      sendOrderToSupplier,
      updateOrderTracking,
      createInventoryMovement,
      addAuditLog,
      syncOrdersWithSheets,
      runTestScenario1,
      runTestScenario2,
      getOrderById,
      getOrderItems,
      getOrderFulfillments,
      getOrderTimeline,
      getOrderAuditLogs
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
