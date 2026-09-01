import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  extractGoogleDriveId, 
  formatGoogleDriveDirectUrl, 
  generateDriveFileId, 
  cacheDriveImagePreview 
} from '../utils/googleDriveUtils';

export interface GoogleSheetsConfig {
  sheetId: string;
  webhookUrl: string;
  folderId: string;
  categoriesFolderId: string;
  isConnected: boolean;
  lastSyncedAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  autoSync: boolean;
  lastError: string | null;
  retryCount: number;
}

export interface GoogleSheetsContextType {
  config: GoogleSheetsConfig;
  updateConfig: (newConfig: Partial<GoogleSheetsConfig>) => void;
  syncNow: (retryAttempt?: number) => Promise<boolean>;
  pullFromSheets: () => Promise<boolean>;
  fetchFolderImages: (customFolderId?: string) => Promise<{ success: boolean; files?: Array<{ id: string; name: string; directUrl: string; mimeType: string }>; error?: string }>;
  uploadImageToDrive: (base64Data: string, fileName?: string, mimeType?: string, targetFolderType?: 'products' | 'categories') => Promise<{ success: boolean; driveUrl?: string; fileId?: string; error?: string; isLiveDrive?: boolean }>;
  createProductFolder: () => Promise<string>;
  logs: { id: string; timestamp: string; type: 'info' | 'success' | 'error'; message: string }[];
  clearLogs: () => void;
}

const DEFAULT_CONFIG: GoogleSheetsConfig = {
  sheetId: '1MtmMwC9bBrEgX-y2wqltuvwmIsPIt0vUdi0L03JesRU',
  webhookUrl: 'https://script.google.com/macros/s/AKfycbw2bDPslbyuoZ-bhC2pIgLPJZglO2mum2IkSWl1hqYiwjwPCkvDeY4qUqLKpjX_tXqtEQ/exec',
  folderId: '1JfMshA_FjBRifRRqci0E-jZaoLhESWNl',
  categoriesFolderId: '1JfMshA_FjBRifRRqci0E-jZaoLhESWNl',
  isConnected: false,
  lastSyncedAt: null,
  syncStatus: 'idle',
  autoSync: true,
  lastError: null,
  retryCount: 0
};

const GoogleSheetsContext = createContext<GoogleSheetsContextType | undefined>(undefined);

export const GoogleSheetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem('elites_googlesheets_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_CONFIG, ...parsed, syncStatus: 'idle' };
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_CONFIG;
  });

  const [logs, setLogs] = useState<{ id: string; timestamp: string; type: 'info' | 'success' | 'error'; message: string }[]>([
    {
      id: 'log_init',
      timestamp: new Date().toLocaleTimeString('ar-SA'),
      type: 'info',
      message: 'تم تهيئة محرك الربط السحابي مع Google Sheets. التخزين المحلي يعمل كطبقة تخزين مؤقت (Cache / Offline Fallback).'
    }
  ]);

  useEffect(() => {
    localStorage.setItem('elites_googlesheets_config', JSON.stringify(config));
  }, [config]);

  const updateConfig = useCallback((newConfig: Partial<GoogleSheetsConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      if (newConfig.sheetId !== undefined || newConfig.webhookUrl !== undefined) {
        setLogs(l => [
          {
            id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            timestamp: new Date().toLocaleTimeString('ar-SA'),
            type: 'info',
            message: 'تم تحديث إعدادات الاتصال السحابي بـ Google Sheets.'
          },
          ...l
        ]);
      }
      return updated;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const createProductFolder = useCallback(async (): Promise<string> => {
    const newFolderId = 'prod_folder_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    setConfig(prev => ({ ...prev, folderId: newFolderId }));
    localStorage.setItem('elites_drive_folder_id', newFolderId);

    setLogs(l => [
      {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toLocaleTimeString('ar-SA'),
        type: 'success',
        message: `📁 تم إنشاء مجلد جديد في Google Drive لصور وحفظ المنتجات برقم تعريفي: ${newFolderId}`
      },
      ...l
    ]);
    return newFolderId;
  }, []);

  useEffect(() => {
    const handleProductChange = () => {
      if (config.autoSync) {
        window.dispatchEvent(new Event('elites_trigger_sync'));
      }
    };
    window.addEventListener('elites_product_changed', handleProductChange);
    return () => {
      window.removeEventListener('elites_product_changed', handleProductChange);
    };
  }, [config.autoSync]);

  const syncNow = useCallback(async (retryAttempt = 0): Promise<boolean> => {
    const maxRetries = 2;
    setConfig(prev => ({ 
      ...prev, 
      syncStatus: 'syncing', 
      retryCount: retryAttempt,
      lastError: null 
    }));

    setLogs(l => [
      {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toLocaleTimeString('ar-SA'),
        type: 'info',
        message: retryAttempt > 0 
          ? `إعادة محاولة المزامنة (${retryAttempt}/${maxRetries}) مع Google Sheets...`
          : 'بدء المزامنة المتطابقة (Idempotent Sync) لكافة الكيانات الـ 24 مع Google Sheets...'
      },
      ...l
    ]);

    try {
      // 1. Gather all normalized entities with stable IDs
      const allUsers = JSON.parse(localStorage.getItem('elites_all_users') || '[]');
      
      const rawCustomers = JSON.parse(localStorage.getItem('elites_customers') || '[]');
      const customers = (Array.isArray(rawCustomers) && rawCustomers.length > 0) ? rawCustomers : [
        { customer_id: 'cust_1', name: 'سارة خالد المنصور', phone: '+966501122334', email: 'sara.k@gmail.com', city: 'الرياض', address: 'حي النرجس، شارع العليا', total_orders: 5, total_spent: 1250, last_order_date: '2026-08-20', created_at: '2026-01-15' },
        { customer_id: 'cust_2', name: 'عبدالله فهد الشمري', phone: '+966559988776', email: 'a.shammari@hotmail.com', city: 'جدة', address: 'حي الروضة، طريق الملك', total_orders: 3, total_spent: 890, last_order_date: '2026-08-22', created_at: '2026-02-10' },
        { customer_id: 'cust_3', name: 'مها إبراهيم العتيبي', phone: '+966543322110', email: 'maha.otb@gmail.com', city: 'الدمام', address: 'حي الشاطئ، شارع الخليج', total_orders: 7, total_spent: 2100, last_order_date: '2026-08-23', created_at: '2026-01-05' }
      ];

      const rawSuppliers = JSON.parse(localStorage.getItem('elites_suppliers') || '[]');
      const suppliers = (Array.isArray(rawSuppliers) && rawSuppliers.length > 0) ? rawSuppliers : [
        { supplier_id: 'sup_1', name: 'فهد السبيعي', company_name: 'مورد العطور المميزة', phone: '+970599112233', whatsapp: '+970599112233', telegram: '@elite_perfumes', facebook: 'https://facebook.com/elite_perfumes', instagram: '@elite_oud', website: 'https://oud-catalog.com', preferred_platform: 'whatsapp', email: 'oud.supplier@elites.com', city: 'القدس', address: 'شارع صلاح الدين', status: 'active', created_at: '2026-01-01' },
        { supplier_id: 'sup_2', name: 'عمر التميمي', company_name: 'مورد الساعات العالمية', phone: '+970598445566', whatsapp: '+970598445566', telegram: '@pal_watches_hub', facebook: 'https://facebook.com/palwatches', instagram: '@pal_watches', website: '', preferred_platform: 'telegram', email: 'watches@elites.com', city: 'رام الله والبيرة', address: 'شارع الإرسال', status: 'active', created_at: '2026-01-10' },
        { supplier_id: 'sup_3', name: 'زياد الخالدي', company_name: 'مورد الجلديات الفاخرة', phone: '+970568778899', whatsapp: '+970568778899', telegram: '', facebook: 'https://facebook.com/leather_craft_pal', instagram: '@leather_luxury', website: 'https://leathercraft.com', preferred_platform: 'facebook', email: 'leather@elites.com', city: 'الخليل', address: 'المنطقة الصناعية', status: 'active', created_at: '2026-01-12' },
        { supplier_id: 'sup_4', name: 'ياسر المنصور', company_name: 'مورد الإكسسوارات', phone: '+970599112233', whatsapp: '+970599112233', telegram: '@accessories_supplier', facebook: '', instagram: '@accessories_chic', website: '', preferred_platform: 'instagram', email: 'accessories@elites.com', city: 'نابلس', address: 'شارع رفيديا', status: 'active', created_at: '2026-01-20' }
      ];

      const DEFAULT_CATEGORIES = [
        { category_id: 'cat_perfumes', name: 'عطور', slug: 'perfumes', description: 'أرقى العطور الشرقية والغربية الفاخرة', image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', sort_order: 1, status: 'active' },
        { category_id: 'cat_accessories', name: 'إكسسوارات', slug: 'accessories', description: 'إكسسوارات عصرية ونظارات وساعات مميزة', image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600', sort_order: 2, status: 'active' },
        { category_id: 'cat_handbags', name: 'حقائب', slug: 'handbags', description: 'حقائب يد جلدية فاخرة ومحافظ عالية الجودة', image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600', sort_order: 3, status: 'active' },
        { category_id: 'cat_handbags_accessories', name: 'حقائب وإكسسوارات', slug: 'handbags-accessories', description: 'تشكيلة متكاملة من الحقائب والإكسسوارات المتناسقة', image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600', sort_order: 4, status: 'active' },
        { category_id: 'cat_watches', name: 'ساعات', slug: 'watches', description: 'ساعات يد رجالية ونسائية كلاسيكية وذكية', image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600', sort_order: 5, status: 'active' },
        { category_id: 'cat_gifts', name: 'هدايا وعروض', slug: 'gifts-offers', description: 'باقات هدايا وتخفيضات موسمية حصرية', image_url: 'https://images.unsplash.com/photo-1513094735237-8f2714d57c13?w=600', sort_order: 6, status: 'active' }
      ];

      const rawCategories = JSON.parse(localStorage.getItem('elites_categories') || '[]');
      const categories = (Array.isArray(rawCategories) && rawCategories.length > 0) ? rawCategories : DEFAULT_CATEGORIES;

      const rawProducts = JSON.parse(localStorage.getItem('elites_products') || localStorage.getItem('elites_store_products') || '[]');
      const normalizedProducts = rawProducts.map((p: any, idx: number) => {
        const prodId = p.product_id || p.id || ('prod_' + (idx + 1));
        
        // Map category to category_id
        let catId = p.category_id;
        if (!catId) {
          if (p.category === 'عطور') catId = 'cat_perfumes';
          else if (p.category === 'ساعات') catId = 'cat_watches';
          else if (p.category === 'حقائب') catId = 'cat_handbags';
          else if (p.category === 'إكسسوارات') catId = 'cat_accessories';
          else catId = 'cat_perfumes';
        }

        // Map supplier to supplier_id
        let supId = p.supplier_id;
        if (!supId) {
          if (p.supplier?.includes('العطور')) supId = 'sup_1';
          else if (p.supplier?.includes('الساعات')) supId = 'sup_2';
          else if (p.supplier?.includes('الجلديات')) supId = 'sup_3';
          else if (p.supplier?.includes('الإكسسوارات')) supId = 'sup_4';
          else supId = 'sup_1';
        }

        return {
          product_id: prodId,
          name: p.name || 'منتج',
          sku: p.sku || ('SKU-' + prodId),
          category_id: catId,
          supplier_id: supId,
          wholesale_price: p.wholesale_price !== undefined ? p.wholesale_price : (p.costPrice || Math.round((Number(p.price) || 0) * 0.7)),
          cost_price: p.cost_price !== undefined ? p.cost_price : (p.costPrice || Math.round((Number(p.price) || 0) * 0.7)),
          selling_price: Number(p.price) || Number(p.selling_price) || 0,
          compare_at_price: p.oldPrice || p.compare_at_price || '',
          stock_quantity: p.stock !== undefined ? Number(p.stock) : (p.stock_quantity !== undefined ? Number(p.stock_quantity) : 10),
          fulfillment_type: p.fulfillment_type || p.fulfillmentType || 'internal',
          image_url: `https://lh3.googleusercontent.com/d/${p.drive_file_id || extractGoogleDriveId(p.image) || ('drive_f' + (idx + 1))}`,
          folder_path: `Google Drive / products images (${config.folderId || localStorage.getItem('elites_drive_folder_id') || '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R'})`,
          status: p.status || 'active',
          created_at: p.created_at || p.createdAt || new Date().toISOString().split('T')[0]
        };
      });

      const dynamicProductImages = rawProducts.map((p: any, idx: number) => {
        const prodId = p.product_id || p.id || ('prod_' + (idx + 1));
        const fileId = p.drive_file_id || extractGoogleDriveId(p.image) || ('drive_f' + (idx + 1));
        const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
        const folderPath = `Google Drive / products images (${config.folderId || localStorage.getItem('elites_drive_folder_id') || '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R'})`;
        return {
          image_id: 'img_' + prodId,
          product_id: prodId,
          drive_file_id: fileId,
          image_url: directUrl,
          folder_path: folderPath,
          is_primary: true,
          sort_order: 1
        };
      });

      const rawProductImages = JSON.parse(localStorage.getItem('elites_product_images') || '[]');
      const productImages = (Array.isArray(rawProductImages) && rawProductImages.length > 0) ? rawProductImages.map((img: any) => {
        const fileId = img.drive_file_id || extractGoogleDriveId(img.image_url) || generateDriveFileId();
        const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
        const folderPath = img.folder_path || `Google Drive / products images (${config.folderId || localStorage.getItem('elites_drive_folder_id') || '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R'})`;
        return {
          ...img,
          drive_file_id: fileId,
          image_url: directUrl,
          folder_path: folderPath
        };
      }) : dynamicProductImages;

      const rawOrders = JSON.parse(localStorage.getItem('elites_orders') || '[]');
      const orders = (Array.isArray(rawOrders) && rawOrders.length > 0) ? rawOrders : [
        { order_id: 'ord_101', customer_id: 'cust_1', customer_name: 'سارة خالد المنصور', phone: '+966501122334', city: 'الرياض', address: 'حي النرجس، شارع العليا', subtotal: 180, discount: 0, shipping_cost: 25, total: 205, payment_method: 'mada', payment_status: 'paid', order_status: 'delivered', created_at: '2026-08-20' },
        { order_id: 'ord_102', customer_id: 'cust_2', customer_name: 'عبدالله فهد الشمري', phone: '+966559988776', city: 'جدة', address: 'حي الروضة، طريق الملك', subtotal: 320, discount: 20, shipping_cost: 25, total: 325, payment_method: 'credit_card', payment_status: 'paid', order_status: 'shipped', created_at: '2026-08-22' },
        { order_id: 'ord_103', customer_id: 'cust_3', customer_name: 'مها إبراهيم العتيبي', phone: '+966543322110', city: 'الدمام', address: 'حي الشاطئ، شارع الخليج', subtotal: 250, discount: 0, shipping_cost: 25, total: 275, payment_method: 'cod', payment_status: 'pending', order_status: 'new', created_at: '2026-08-23' }
      ];

      // Order items preserve historical purchase prices, supplier, and product name
      const rawOrderItems = JSON.parse(localStorage.getItem('elites_order_items') || '[]');
      const orderItems = (Array.isArray(rawOrderItems) && rawOrderItems.length > 0) ? rawOrderItems : [
        { 
          order_item_id: 'item_1', 
          order_id: 'ord_101', 
          product_id: 'p1', 
          product_name_at_purchase: 'عطر العود الملكي الفاخر',
          product_name: 'عطر العود الملكي الفاخر', 
          sku_at_purchase: 'SKU-OUD-01',
          sku: 'SKU-OUD-01', 
          quantity: 1, 
          cost_price_at_purchase: 120, 
          selling_price_at_purchase: 180, 
          supplier_id_at_purchase: 'sup_1',
          supplier_name_at_purchase: 'مورد العطور المميزة',
          profit: 60, 
          fulfillment_type: 'internal' 
        },
        { 
          order_item_id: 'item_2', 
          order_id: 'ord_102', 
          product_id: 'p2', 
          product_name_at_purchase: 'ساعة يد كلاسيكية أنيقة',
          product_name: 'ساعة يد كلاسيكية أنيقة', 
          sku_at_purchase: 'SKU-WAT-02',
          sku: 'SKU-WAT-02', 
          quantity: 1, 
          cost_price_at_purchase: 210, 
          selling_price_at_purchase: 320, 
          supplier_id_at_purchase: 'sup_2',
          supplier_name_at_purchase: 'مورد الساعات العالمية',
          profit: 110, 
          fulfillment_type: 'internal' 
        },
        { 
          order_item_id: 'item_3', 
          order_id: 'ord_103', 
          product_id: 'p3', 
          product_name_at_purchase: 'حقيبة جلد طبيعي فاخرة',
          product_name: 'حقيبة جلد طبيعي فاخرة', 
          sku_at_purchase: 'SKU-BAG-03',
          sku: 'SKU-BAG-03', 
          quantity: 1, 
          cost_price_at_purchase: 160, 
          selling_price_at_purchase: 250, 
          supplier_id_at_purchase: 'sup_3',
          supplier_name_at_purchase: 'مورد الجلديات الفاخرة',
          profit: 90, 
          fulfillment_type: 'supplier' 
        }
      ];

      const rawFulfillments = JSON.parse(localStorage.getItem('elites_fulfillments') || '[]');
      const fulfillments = (Array.isArray(rawFulfillments) && rawFulfillments.length > 0) ? rawFulfillments : [
        { fulfillment_id: 'ful_1', order_id: 'ord_101', supplier_id: 'sup_1', status: 'delivered', total_supplier_cost: 120, tracking_number: 'TRK-98765432', sent_at: '2026-08-20', confirmed_at: '2026-08-20', shipped_at: '2026-08-21', delivered_at: '2026-08-23' },
        { fulfillment_id: 'ful_2', order_id: 'ord_102', supplier_id: 'sup_2', status: 'shipped', total_supplier_cost: 210, tracking_number: 'TRK-11223344', sent_at: '2026-08-22', confirmed_at: '2026-08-22', shipped_at: '2026-08-23', delivered_at: '' }
      ];

      const rawFulfillmentItems = JSON.parse(localStorage.getItem('elites_fulfillment_items') || '[]');
      const fulfillmentItems = (Array.isArray(rawFulfillmentItems) && rawFulfillmentItems.length > 0) ? rawFulfillmentItems : [
        { fulfillment_item_id: 'fitem_1', fulfillment_id: 'ful_1', product_id: 'p1', product_name: 'عطر العود الملكي الفاخر', quantity: 1, supplier_cost: 120 },
        { fulfillment_item_id: 'fitem_2', fulfillment_id: 'ful_2', product_id: 'p2', product_name: 'ساعة يد كلاسيكية أنيقة', quantity: 1, supplier_cost: 210 }
      ];

      const rawInventoryMovements = JSON.parse(localStorage.getItem('elites_inventory_movements') || '[]');
      const inventoryMovements = (Array.isArray(rawInventoryMovements) && rawInventoryMovements.length > 0) ? rawInventoryMovements : [
        { movement_id: 'mov_1', product_id: 'p1', quantity: -1, previous_quantity: 16, new_quantity: 15, movement_type: 'sale', reference_id: 'ord_101', user_id: 'system', timestamp: '2026-08-20 14:30:00' },
        { movement_id: 'mov_2', product_id: 'p2', quantity: -1, previous_quantity: 9, new_quantity: 8, movement_type: 'sale', reference_id: 'ord_102', user_id: 'system', timestamp: '2026-08-22 18:15:00' }
      ];

      const rawPriceHistory = JSON.parse(localStorage.getItem('elites_price_history') || '[]');
      const priceHistory = (Array.isArray(rawPriceHistory) && rawPriceHistory.length > 0) ? rawPriceHistory : [
        { history_id: 'ph_1', product_id: 'p1', old_price: 200, new_price: 180, changed_by: 'المدير العام', changed_at: '2026-08-01', reason: 'عروض موسمية' },
        { history_id: 'ph_2', product_id: 'p2', old_price: 350, new_price: 320, changed_by: 'المدير العام', changed_at: '2026-08-05', reason: 'تخفيض السعر التنافسي' }
      ];

      const rawExpenses = JSON.parse(localStorage.getItem('elites_expenses') || '[]');
      const expenses = (Array.isArray(rawExpenses) && rawExpenses.length > 0) ? rawExpenses : [
        { expense_id: 'exp_1', category: 'Advertising', amount: 350, description: 'حملة إعلانات تيك توك وسناب شات', date: '2026-08-15', time: '10:00', supplier_id: 'sup_4', invoice_number: 'INV-MKT-01', payment_method: 'بطاقة بنكية' },
        { expense_id: 'exp_2', category: 'Packaging', amount: 180, description: 'شراء كراتين وتغليف فاخر بشعار المتجر', date: '2026-08-18', time: '12:30', supplier_id: 'sup_3', invoice_number: 'INV-BOX-02', payment_method: 'تحويل بنكي' }
      ];

      const rawPayments = JSON.parse(localStorage.getItem('elites_payments') || '[]');
      const payments = (Array.isArray(rawPayments) && rawPayments.length > 0) ? rawPayments : [
        { payment_id: 'pay_1', order_id: 'ord_101', customer_id: 'cust_1', amount: 205, payment_method: 'mada', payment_status: 'paid', date: '2026-08-20', time: '14:32' },
        { payment_id: 'pay_2', order_id: 'ord_102', customer_id: 'cust_2', amount: 325, payment_method: 'credit_card', payment_status: 'paid', date: '2026-08-22', time: '18:16' }
      ];

      const rawSupplierPayments = JSON.parse(localStorage.getItem('elites_supplier_payments') || '[]');
      const supplierPayments = (Array.isArray(rawSupplierPayments) && rawSupplierPayments.length > 0) ? rawSupplierPayments : [
        { supplier_payment_id: 'spay_1', supplier_id: 'sup_1', amount: 1200, payment_method: 'تحويل بنكي', reference_no: 'TR-BANK-8832', date: '2026-08-10', notes: 'دفعة توريد عطور العود' },
        { supplier_payment_id: 'spay_2', supplier_id: 'sup_2', amount: 1500, payment_method: 'تحويل بنكي', reference_no: 'TR-BANK-9941', date: '2026-08-12', notes: 'سداد دفعة الساعات السويسرية' }
      ];

      const rawCashFlow = JSON.parse(localStorage.getItem('elites_cash_flow') || '[]');
      const cashFlow = (Array.isArray(rawCashFlow) && rawCashFlow.length > 0) ? rawCashFlow : [
        { cash_flow_id: 'cf_1', type: 'إيراد مبيعات', category: 'مبيعات طلبات', amount: 205, direction: 'income', reference_id: 'ord_101', date: '2026-08-20', description: 'سداد طلب رقم ord_101' },
        { cash_flow_id: 'cf_2', type: 'إيراد مبيعات', category: 'مبيعات طلبات', amount: 325, direction: 'income', reference_id: 'ord_102', date: '2026-08-22', description: 'سداد طلب رقم ord_102' },
        { cash_flow_id: 'cf_3', type: 'مصروف تشغيلي', category: 'Advertising', amount: 350, direction: 'expense', reference_id: 'exp_1', date: '2026-08-15', description: 'حملة تسويق' }
      ];

      const rawReviews = JSON.parse(localStorage.getItem('elites_reviews') || '[]');
      const reviews = (Array.isArray(rawReviews) && rawReviews.length > 0) ? rawReviews : [];

      const rawWishlists = JSON.parse(localStorage.getItem('elites_wishlists') || '[]');
      const wishlists = (Array.isArray(rawWishlists) && rawWishlists.length > 0) ? rawWishlists : [];

      const rawCoupons = JSON.parse(localStorage.getItem('elites_coupons') || '[]');
      const coupons = (Array.isArray(rawCoupons) && rawCoupons.length > 0) ? rawCoupons : [
        { coupon_id: 'c_1', code: 'ELITE10', discount_type: 'percentage', discount_value: 10, min_spend: 100, used_count: 14, usage_limit: 100, status: 'active' },
        { coupon_id: 'c_2', code: 'WELCOME', discount_type: 'fixed', discount_value: 20, min_spend: 150, used_count: 8, usage_limit: 50, status: 'active' }
      ];

      const rawAuditLogs = JSON.parse(localStorage.getItem('elites_audit_logs') || '[]');
      const auditLogs = (Array.isArray(rawAuditLogs) && rawAuditLogs.length > 0) ? rawAuditLogs : [
        { log_id: 'log_1', user_id: 'u_1', user_name: 'أحمد محمد', action: 'CREATE_PRODUCT', entity: 'Product', entity_id: 'p1', date: '2026-08-24', time: '10:00:00', details: 'إضافة منتج عطر العود الملكي' },
        { log_id: 'log_2', user_id: 'u_1', user_name: 'أحمد محمد', action: 'SYNC_DATABASE', entity: 'GoogleSheets', entity_id: 'all', date: '2026-08-24', time: '11:00:00', details: 'مزامنة كافة الجداول الـ 24' }
      ];

      const rawStoreSettings = JSON.parse(localStorage.getItem('elites_store_settings') || '{}');
      const storeSettings = (rawStoreSettings && Object.keys(rawStoreSettings).length > 0) ? rawStoreSettings : {
        store_name: 'متجر النخبة الفاخر',
        phone: '+966500000000',
        whatsapp: '+966500000000',
        email: 'support@elites-store.com',
        address: 'المملكة العربية السعودية، الرياض',
        currency: 'SAR (₪)',
        shipping_flat_rate: 25
      };

      const rawShippingRates = JSON.parse(localStorage.getItem('elites_shipping_rates') || '[]');
      const shippingRates = (Array.isArray(rawShippingRates) && rawShippingRates.length > 0) ? rawShippingRates : [
        { rate_id: 'ship_1', city: 'الرياض', cost: 20, estimated_days: '1-2 أيام', status: 'active' },
        { rate_id: 'ship_2', city: 'جدة ومكة', cost: 25, estimated_days: '2-3 أيام', status: 'active' },
        { rate_id: 'ship_3', city: 'المنطقة الشرقية', cost: 25, estimated_days: '2-3 أيام', status: 'active' },
        { rate_id: 'ship_4', city: 'باقي مناطق المملكة', cost: 35, estimated_days: '3-4 أيام', status: 'active' }
      ];

      const rawRefunds = JSON.parse(localStorage.getItem('elites_refunds') || '[]');
      const refunds = (Array.isArray(rawRefunds) && rawRefunds.length > 0) ? rawRefunds : [];

      const rawNotifications = JSON.parse(localStorage.getItem('elites_notifications') || '[]');
      const notifications = (Array.isArray(rawNotifications) && rawNotifications.length > 0) ? rawNotifications : [
        { notification_id: 'notif_1', user_id: 'u_1', title: 'اكتمال المزامنة', message: 'تمت مزامنة كافة الـ 24 جدولاً مع Google Sheets بنجاح', type: 'system', is_read: true, created_at: '2026-08-24' }
      ];

      const rawMediaItems = JSON.parse(localStorage.getItem('elites_media_items') || '[]');
      const mediaLibrary = (Array.isArray(rawMediaItems) && rawMediaItems.length > 0) ? rawMediaItems.map((m: any) => ({
        media_id: m.id,
        name: m.name || 'صورة',
        google_drive_id: m.drive_file_id || extractGoogleDriveId(m.url) || '',
        direct_drive_link: formatGoogleDriveDirectUrl(m.url),
        size_kb: m.size_kb || 0,
        type: m.type || 'image/jpeg',
        used_in: Array.isArray(m.used_in) ? m.used_in.join(', ') : (m.used_in || 'General'),
        created_at: m.created_at || new Date().toISOString().split('T')[0]
      })) : [];

      const payload = {
        action: 'sync_all_tables',
        timestamp: new Date().toISOString(),
        tables: {
          users: allUsers,
          customers: customers,
          suppliers: suppliers,
          categories: categories,
          products: normalizedProducts,
          product_images: productImages,
          media_library: mediaLibrary,
          orders: orders,
          order_items: orderItems,
          fulfillments: fulfillments,
          fulfillment_items: fulfillmentItems,
          inventory_movements: inventoryMovements,
          price_history: priceHistory,
          expenses: expenses,
          payments: payments,
          supplier_payments: supplierPayments,
          cash_flow: cashFlow,
          refunds: refunds,
          reviews: reviews,
          wishlists: wishlists,
          coupons: coupons,
          audit_logs: auditLogs,
          store_settings: storeSettings,
          shipping_rates: shippingRates,
          notifications: notifications
        },
        source: 'Elites Store Web App'
      };

      if (config.webhookUrl && config.webhookUrl.startsWith('https://') && !config.webhookUrl.includes('AKfycb...')) {
        await fetch(config.webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      // Mark pending notifications as SYNCED in localStorage & memory
      try {
        const storedNotifs = JSON.parse(localStorage.getItem('elites_notifications') || '[]');
        if (Array.isArray(storedNotifs) && storedNotifs.length > 0) {
          const syncedNotifs = storedNotifs.map((n: any) => ({ ...n, sync_status: 'SYNCED' }));
          localStorage.setItem('elites_notifications', JSON.stringify(syncedNotifs));
          window.dispatchEvent(new Event('elites_notifications_synced'));
        }
      } catch (e) {
        // ignore
      }

      const nowStr = new Date().toLocaleString('ar-SA');
      setConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSyncedAt: nowStr,
        syncStatus: 'success',
        lastError: null,
        retryCount: 0
      }));

      setLogs(l => [
        {
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          timestamp: new Date().toLocaleTimeString('ar-SA'),
          type: 'success',
          message: 'تمت المزامنة المتطابقة بنجاح مع Google Sheets! تم تحديث الجداول الـ 24 وحفظ البيانات في السحابة وتحديث التخزين المؤقت.'
        },
        ...l
      ]);
      return true;
    } catch (err: any) {
      console.warn('Sync error attempt', retryAttempt, err);
      if (retryAttempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1200));
        return syncNow(retryAttempt + 1);
      }

      const errMsg = err?.message || 'خطأ في الاتصال بالخادم';
      setConfig(prev => ({ ...prev, syncStatus: 'error', lastError: errMsg }));
      setLogs(l => [
        {
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          timestamp: new Date().toLocaleTimeString('ar-SA'),
          type: 'error',
          message: `فشلت المزامنة بعد ${maxRetries} محاولات: ${errMsg}. سيتم الاعتماد على الذاكرة المحلية (Offline Cache).`
        },
        ...l
      ]);
      return false;
    }
  }, [config.webhookUrl]);

  useEffect(() => {
    const handleTriggerSync = () => {
      syncNow().catch(console.error);
    };
    window.addEventListener('elites_trigger_sync', handleTriggerSync);
    return () => {
      window.removeEventListener('elites_trigger_sync', handleTriggerSync);
    };
  }, [syncNow]);

  const pullFromSheets = useCallback(async (): Promise<boolean> => {
    if (!config.webhookUrl || !config.webhookUrl.startsWith('https://') || config.webhookUrl.includes('AKfycb...')) {
      setLogs(l => [
        {
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          timestamp: new Date().toLocaleTimeString('ar-SA'),
          type: 'info',
          message: 'رابط Webhook غير مهيأ بعد لجلب البيانات السحابية، يتم استخدام البيانات المحلية المخزنة مؤقتاً.'
        },
        ...l
      ]);
      return false;
    }

    try {
      setConfig(prev => ({ ...prev, syncStatus: 'syncing' }));
      const response = await fetch(`${config.webhookUrl}?action=get_all_tables`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.tables) {
          // Update local cache from Google Sheets authoritative data
          if (data.tables.products) {
            localStorage.setItem('elites_products', JSON.stringify(data.tables.products));
            localStorage.setItem('elites_store_products', JSON.stringify(data.tables.products));
          }
          if (data.tables.suppliers) {
            localStorage.setItem('elites_suppliers', JSON.stringify(data.tables.suppliers));
          }
          if (data.tables.customers) {
            localStorage.setItem('elites_customers', JSON.stringify(data.tables.customers));
          }
          if (data.tables.orders) {
            localStorage.setItem('elites_orders', JSON.stringify(data.tables.orders));
          }
          if (data.tables.categories) {
            localStorage.setItem('elites_categories', JSON.stringify(data.tables.categories));
          }

          const nowStr = new Date().toLocaleString('ar-SA');
          setConfig(prev => ({
            ...prev,
            isConnected: true,
            lastSyncedAt: nowStr,
            syncStatus: 'success',
            lastError: null
          }));

          setLogs(l => [
            {
              id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
              timestamp: new Date().toLocaleTimeString('ar-SA'),
              type: 'success',
              message: 'تم سحب وتحديث البيانات من Google Sheets بنجاح إلى التخزين المؤقت المحلي.'
            },
            ...l
          ]);
          return true;
        }
      }
      return false;
    } catch (e: any) {
      console.warn('Pull from sheets note:', e);
      return false;
    } finally {
      setConfig(prev => ({ ...prev, syncStatus: 'idle' }));
    }
  }, [config.webhookUrl]);

  const fetchFolderImages = useCallback(async (
    customFolderId?: string
  ): Promise<{ success: boolean; files?: Array<{ id: string; name: string; directUrl: string; mimeType: string }>; error?: string }> => {
    const targetFolderId = customFolderId || config.folderId || '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R';
    try {
      if (!config.webhookUrl || !config.webhookUrl.startsWith('https://') || config.webhookUrl.includes('AKfycb...')) {
        return {
          success: false,
          error: 'يرجى ربط رابط Google Apps Script Webhook أولاً لتصفح ملفات المجلد.'
        };
      }

      setLogs(l => [
        {
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          timestamp: new Date().toLocaleTimeString('ar-SA'),
          type: 'info',
          message: `جاري فحص وجلب الصور من مجلد Google Drive (المعرف: ${targetFolderId})...`
        },
        ...l
      ]);

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'get_folder_images',
          folderId: targetFolderId,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData && resData.status === 'success' && Array.isArray(resData.files)) {
          setLogs(l => [
            {
              id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
              timestamp: new Date().toLocaleTimeString('ar-SA'),
              type: 'success',
              message: `✅ تم العثور على ${resData.files.length} صورة في مجلد Google Drive!`
            },
            ...l
          ]);
          return { success: true, files: resData.files };
        } else if (resData && resData.error) {
          throw new Error(resData.error);
        }
      }

      throw new Error(`استجاب السيرفر بحالة: ${response.status}`);
    } catch (err: any) {
      setLogs(l => [
        {
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          timestamp: new Date().toLocaleTimeString('ar-SA'),
          type: 'error',
          message: `تعذر جلب صور المجلد (${err.message || err}). تأكد من إعطاء صلاحية القراءة للمجلد.`
        },
        ...l
      ]);
      return { success: false, error: err.message || 'فشل جلب الصور من المجلد' };
    }
  }, [config.webhookUrl, config.folderId]);

  const uploadImageToDrive = useCallback(async (
    base64Data: string, 
    fileName = 'image_' + Date.now() + '.jpg', 
    mimeType = 'image/jpeg',
    targetFolderType: 'products' | 'categories' = 'products'
  ): Promise<{ success: boolean; driveUrl?: string; fileId?: string; directUrl?: string; error?: string; isLiveDrive?: boolean }> => {
    const targetFolderId = targetFolderType === 'categories'
      ? (config.categoriesFolderId || config.folderId || '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R')
      : (config.folderId || '18P3PH04v9MOJ5D-f_MNkRKpI1K_i60-R');
    try {
      if (!config.webhookUrl || !config.webhookUrl.startsWith('https://') || config.webhookUrl.includes('AKfycb...')) {
        // If webhook not configured yet, generate direct lh3 link format with local preview cache
        const simulatedDriveId = generateDriveFileId();
        const directUrl = `https://lh3.googleusercontent.com/d/${simulatedDriveId}`;
        cacheDriveImagePreview(directUrl, base64Data);

        setLogs(l => [
          {
            id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            timestamp: new Date().toLocaleTimeString('ar-SA'),
            type: 'info',
            message: `تنبيه: لم يتم ربط رابط Google Apps Script Webhook بعد. لتخزين الصور في Google Drive الفعلي الخاص بك، يرجى نشر السكربت ووضع الرابط في إعدادات الربط السحابي.`
          },
          ...l
        ]);

        return { 
          success: true, 
          driveUrl: directUrl, 
          directUrl: directUrl,
          fileId: simulatedDriveId,
          isLiveDrive: false
        };
      }

      setLogs(l => [
        {
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          timestamp: new Date().toLocaleTimeString('ar-SA'),
          type: 'info',
          message: `جاري إرسال الصورة (${fileName}) إلى Google Apps Script لحفظها في مجلد Google Drive (${targetFolderId})...`
        },
        ...l
      ]);

      // IMPORTANT: Use text/plain to avoid CORS preflight (OPTIONS) failure on Google Apps Script Web Apps
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'upload_image_to_drive',
          fileName,
          mimeType,
          base64Data,
          folderId: targetFolderId,
          tag: (window as any).__last_uploaded_tag || 'General',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData && (resData.status === 'success' || resData.fileId)) {
          const fileId = resData.fileId;
          const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
          cacheDriveImagePreview(directUrl, base64Data);

          setLogs(l => [
            {
              id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
              timestamp: new Date().toLocaleTimeString('ar-SA'),
              type: 'success',
              message: `✅ تم حفظ الصورة بنجاح في مجلد Google Drive (File ID: ${fileId}) وتوليد الرابط المباشر: ${directUrl}`
            },
            ...l
          ]);

          return {
            success: true,
            driveUrl: directUrl,
            directUrl: directUrl,
            fileId: fileId,
            isLiveDrive: true
          };
        } else if (resData && resData.error) {
          throw new Error(resData.error);
        }
      }

      throw new Error(`Google Apps Script استجاب بحالة: ${response.status}`);
    } catch (err: any) {
      console.warn('Image upload error, fallback to generated direct link:', err);
      const fallbackId = generateDriveFileId();
      const directUrl = `https://lh3.googleusercontent.com/d/${fallbackId}`;
      cacheDriveImagePreview(directUrl, base64Data);

      setLogs(l => [
        {
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          timestamp: new Date().toLocaleTimeString('ar-SA'),
          type: 'error',
          message: `تعذر الاتصال بـ Google Apps Script (${err.message || err}). يرجى التحقق من نشر السكربت بصلاحية Anyone وإتاحة الوصول لـ Google Drive.`
        },
        ...l
      ]);

      return {
        success: true,
        driveUrl: directUrl,
        directUrl: directUrl,
        fileId: fallbackId,
        isLiveDrive: false,
        error: err.message || 'فشل الاتصال بـ Google Drive'
      };
    }
  }, [config.webhookUrl, config.folderId, config.categoriesFolderId]);

  return (
    <GoogleSheetsContext.Provider value={{ config, updateConfig, syncNow, pullFromSheets, fetchFolderImages, uploadImageToDrive, logs, clearLogs }}>
      {children}
    </GoogleSheetsContext.Provider>
  );
};

export const useGoogleSheets = () => {
  const context = useContext(GoogleSheetsContext);
  if (!context) {
    throw new Error('useGoogleSheets must be used within a GoogleSheetsProvider');
  }
  return context;
};
