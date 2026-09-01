export type UserRole = 'Owner' | 'Manager' | 'Accountant' | 'Marketing' | 'Employee' | 'Customer';

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
}

export interface Customer {
  customer_id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  notes?: string;
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
  created_at: string;
}

export interface Supplier {
  supplier_id: string;
  name: string;
  company_name: string;
  phone: string;
  whatsapp?: string;
  telegram?: string;
  facebook?: string;
  instagram?: string;
  website?: string;
  preferred_platform?: 'whatsapp' | 'telegram' | 'facebook' | 'instagram' | 'phone' | 'website' | 'other';
  email: string;
  city: string;
  address: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Category {
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  status: 'active' | 'inactive';
}

export interface ProductImage {
  image_id: string;
  product_id: string;
  drive_file_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  priceAdjustment: number;
}

export type FulfillmentType = 'internal' | 'supplier' | 'mixed';
export type ProductFulfillmentMethod = 'OWN_STOCK' | 'SUPPLIER_DROPSHIPPING';
export type PricingMethod = 'manual' | 'multiplier' | 'percentage' | 'fixed';

export interface Product {
  product_id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  category_id: string;
  supplier_id: string;
  sku: string;
  barcode?: string;
  wholesale_price: number;
  cost_price: number;
  selling_price: number;
  compare_at_price?: number;
  pricing_method: PricingMethod;
  pricing_value?: number;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  stock_quantity: number;
  low_stock_threshold: number;
  brand?: string;
  weight?: number;
  status: 'active' | 'draft' | 'archived';
  featured: boolean;
  new_product: boolean;
  best_seller: boolean;
  fulfillment_type: FulfillmentType;
  fulfillment_method?: ProductFulfillmentMethod;
  seo_title?: string;
  seo_description?: string;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  supplier?: Supplier;
  category?: Category;
}

export type SupplierCommStatus = 'NOT_SENT' | 'SENT' | 'CONTACTED' | 'CONFIRMED' | 'DECLINED' | 'FAILED';
export type SupplierCollectionStatus = 'PENDING' | 'COLLECTED' | 'FAILED' | 'UNKNOWN';
export type SupplierSettlementStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'DISPUTED' | 'CANCELLED';
export type ReturnResponsibility = 'SUPPLIER' | 'STORE' | 'UNKNOWN';

export type OrderStatus = 
  | 'NEW' 
  | 'ORDER_CONFIRMED'
  | 'SENT_TO_SUPPLIER'
  | 'SUPPLIER_CONFIRMED'
  | 'CUSTOMER_CONTACTED'
  | 'PREPARING'
  | 'CONFIRMED' 
  | 'PROCESSING' 
  | 'READY_TO_SHIP' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'COLLECTED_BY_SUPPLIER'
  | 'SUPPLIER_SETTLEMENT_PENDING'
  | 'SETTLED'
  | 'CANCELLED' 
  | 'RETURN_REQUESTED'
  | 'RETURNED' 
  | 'REFUNDED'
  | 'FAILED'
  | 'new'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'partially_paid';

export type FulfillmentStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'AWAITING_SUPPLIER'
  | 'SUPPLIER_CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'
  | 'pending'
  | 'sent_to_supplier'
  | 'rejected'
  | 'unavailable';

export interface OrderItem {
  order_item_id: string;
  order_id: string;
  product_id: string;
  sku_at_purchase: string;
  sku?: string;
  product_name_at_purchase: string;
  product_name?: string;
  supplier_id_at_purchase: string;
  supplier_name_at_purchase?: string;
  cost_price_at_purchase: number;
  selling_price_at_purchase: number;
  store_margin_at_purchase?: number;
  quantity: number;
  discount_at_purchase?: number;
  subtotal: number;
  fulfillment_method_at_purchase: ProductFulfillmentMethod;
  fulfillment_type?: FulfillmentType;
  profit: number;
}

export interface Order {
  order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: string;
  city: string;
  notes?: string;
  order_date: string;
  order_time: string;
  created_at: string;
  updated_at: string;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  total: number;
  payment_method: string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  fulfillment_status: FulfillmentStatus;
  sync_status: 'PENDING' | 'SYNCED' | 'FAILED';
  shipping_company?: string;
  tracking_number?: string;
  tracking_url?: string;
  items?: OrderItem[];
  phone?: string;
  address?: string;
}

export interface SupplierFulfillment {
  fulfillment_id: string;
  order_id: string;
  supplier_id: string;
  supplier_name_snapshot: string;
  supplier_contact_snapshot?: string;
  supplier_phone_snapshot?: string;
  supplier_platform?: string;
  fulfillment_mode?: ProductFulfillmentMethod;
  status: FulfillmentStatus;
  supplier_cost: number;
  supplier_cost_at_order?: number;
  selling_price_at_order?: number;
  store_margin_at_order?: number;
  shipping_cost: number;
  shipping_company?: string;
  tracking_number?: string;
  tracking_url?: string;
  supplier_notes?: string;
  admin_notes?: string;
  supplier_comm_status?: SupplierCommStatus;
  supplier_collection_status?: SupplierCollectionStatus;
  supplier_settlement_status?: SupplierSettlementStatus;
  sent_at?: string;
  confirmed_at?: string;
  contacted_at?: string;
  collected_at?: string;
  collected_amount?: number;
  collection_method?: 'cash' | 'card' | 'other';
  return_responsibility?: ReturnResponsibility;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface SupplierSettlement {
  settlement_id: string;
  supplier_id: string;
  supplier_name_snapshot?: string;
  order_id: string;
  fulfillment_id: string;
  gross_order_value: number;
  supplier_amount: number;
  store_commission: number;
  amount_due_to_store: number;
  amount_paid_to_store: number;
  remaining_amount: number;
  settlement_status: SupplierSettlementStatus;
  settlement_date?: string;
  payment_method?: AccountingPaymentMethod;
  reference?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  sync_status?: 'SYNCED' | 'PENDING' | 'FAILED';
}

export type TimelineEventType =
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'PROCESSING_STARTED'
  | 'SUPPLIER_CONTACTED'
  | 'SUPPLIER_CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'REFUNDED';

export interface OrderTimelineEvent {
  event_id: string;
  order_id: string;
  event_type: TimelineEventType;
  timestamp: string;
  user_id: string;
  description: string;
}

export interface FulfillmentItem {
  fulfillment_item_id: string;
  fulfillment_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  supplier_cost: number;
}

export interface Fulfillment {
  fulfillment_id: string;
  order_id: string;
  supplier_id: string;
  status: FulfillmentStatus;
  total_supplier_cost: number;
  tracking_number?: string;
  notes?: string;
  sent_at?: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  items?: FulfillmentItem[];
  supplier?: Supplier;
}

export type InventoryMovementType = 'SALE' | 'RESTOCK' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE' | 'purchase' | 'sale' | 'loss' | 'manual_adjust';

export interface InventoryMovement {
  movement_id: string;
  product_id: string;
  order_id?: string;
  quantity: number;
  previous_quantity?: number;
  before_quantity?: number;
  new_quantity?: number;
  after_quantity?: number;
  movement_type: InventoryMovementType;
  reference_id?: string;
  user_id: string;
  date: string;
  time: string;
  timestamp?: string;
  notes?: string;
}

export interface PriceHistory {
  history_id: string;
  product_id: string;
  old_price: number;
  new_price: number;
  changed_by: string;
  changed_at: string;
  reason: string;
}

export type ExpenseCategory =
  | 'OPERATING'
  | 'MARKETING'
  | 'SHIPPING'
  | 'PACKAGING'
  | 'PLATFORM'
  | 'TRANSPORT'
  | 'PHONE'
  | 'ADVERTISING'
  | 'OFFICE'
  | 'OTHER'
  | string;

export type AccountingPaymentMethod =
  | 'CASH_ON_DELIVERY'
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CARD'
  | 'OTHER'
  | string;

export interface Expense {
  expense_id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: string;
  time: string;
  supplier_id?: string;
  invoice_number?: string;
  reference?: string;
  payment_method: AccountingPaymentMethod;
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  sync_status?: 'SYNCED' | 'PENDING' | 'FAILED';
}

export interface Payment {
  payment_id: string;
  order_id: string;
  customer_id: string;
  customer_name_snapshot?: string;
  amount: number;
  payment_method: AccountingPaymentMethod;
  payment_status: PaymentStatus;
  date: string;
  time: string;
  reference?: string;
  created_by?: string;
  created_at?: string;
  sync_status?: 'SYNCED' | 'PENDING' | 'FAILED';
}

export interface SupplierPayment {
  supplier_payment_id: string;
  payment_id?: string;
  supplier_id: string;
  supplier_name_snapshot?: string;
  amount: number;
  payment_method: AccountingPaymentMethod;
  payment_date?: string;
  reference_no?: string;
  reference?: string;
  date: string;
  notes?: string;
  created_by?: string;
  created_at?: string;
  sync_status?: 'SYNCED' | 'PENDING' | 'FAILED';
}

export type CashFlowType =
  | 'SALE'
  | 'CUSTOMER_PAYMENT'
  | 'SUPPLIER_PAYMENT'
  | 'EXPENSE'
  | 'REFUND'
  | 'SHIPPING_PAYMENT'
  | 'OTHER_INCOME'
  | 'OTHER_EXPENSE'
  | string;

export interface CashFlow {
  cash_flow_id: string;
  cashflow_id?: string;
  type: CashFlowType;
  category?: string;
  amount: number;
  direction: 'IN' | 'OUT' | 'income' | 'expense';
  reference_type?: 'ORDER' | 'EXPENSE' | 'SUPPLIER_PAYMENT' | 'REFUND' | 'MANUAL' | string;
  reference_id?: string;
  date: string;
  time: string;
  description: string;
  created_by?: string;
  created_at?: string;
  sync_status?: 'SYNCED' | 'PENDING' | 'FAILED';
}

export interface Refund {
  refund_id: string;
  order_id: string;
  order_number_snapshot?: string;
  customer_id: string;
  customer_name_snapshot?: string;
  amount: number;
  reason: string;
  refund_method: AccountingPaymentMethod;
  refund_status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  created_at: string;
  created_by: string;
  sync_status?: 'SYNCED' | 'PENDING' | 'FAILED';
}

export interface OpeningBalance {
  balance_id: string;
  period_key: string;
  amount: number;
  notes?: string;
  updated_at: string;
}

export interface Coupon {
  coupon_id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_spend?: number;
  usage_limit?: number;
  used_count: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive';
}

export interface AuditLog {
  log_id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity: string;
  entity_id?: string;
  date: string;
  time: string;
  details: string;
}

export interface ProductGuaranteeItem {
  id: string;
  text: string;
  enabled: boolean;
  icon?: string;
}

export interface ProductGuaranteesConfig {
  enabled: boolean;
  title: string;
  items: ProductGuaranteeItem[];
}

export interface StoreSettings {
  store_name: string;
  store_slogan?: string;
  store_mode?: 'DROPSHIPPING' | 'AFFILIATE_BROKER' | 'HYBRID';
  logo_url: string;
  mobile_logo_url?: string;
  favicon_url?: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  currency: string;
  timezone?: string;
  language?: string;
  status?: 'open' | 'closed' | 'maintenance';
  maintenance_message?: string;
  shipping_flat_rate: number;
  free_shipping_threshold?: number;
  return_policy: string;
  shipping_policy: string;
  exchange_policy: string;
  cancellation_policy: string;
  warranty_policy: string;
  privacy_policy: string;
  terms: string;
  hero_banner_url?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_bg_color?: string;
  hero_bg_image?: string;
  product_guarantees?: ProductGuaranteesConfig;
  social_links: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    whatsapp?: string;
    telegram?: string;
    youtube?: string;
    website?: string;
  };
  seo?: {
    meta_title: string;
    meta_description: string;
    keywords: string;
    og_image_url?: string;
  };
}

// ==========================================
// STORE MANAGEMENT, THEMES & CUSTOMIZATION
// ==========================================

export type ThemePresetName = 'Elegant' | 'Luxury' | 'Minimal' | 'Modern' | 'Fashion' | 'Classic' | 'Dark Luxury';

export interface ThemeSettings {
  preset: ThemePresetName;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  headerColor: string;
  footerColor: string;
  heroBgColor?: string;
  heroBgImage?: string;
  cardStyle: 'flat' | 'bordered' | 'shadow' | 'glass';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadows: 'none' | 'sm' | 'md' | 'lg';
  fontSize: 'sm' | 'base' | 'lg';
  headingStyle: 'serif' | 'sans' | 'bold' | 'minimal';
  productCardStyle: 'classic' | 'modern' | 'minimal' | 'compact';
  navigationStyle: 'top' | 'centered' | 'minimal';
}

export type HomepageSectionType =
  | 'hero_banner'
  | 'featured_products'
  | 'featured_categories'
  | 'new_arrivals'
  | 'best_sellers'
  | 'special_offers'
  | 'discount_banner'
  | 'product_collection'
  | 'category_collection'
  | 'image_text'
  | 'promotional_banner'
  | 'testimonials'
  | 'reviews'
  | 'newsletter'
  | 'social_links'
  | 'cta'
  | 'shipping_info'
  | 'trust_benefits';

export interface HomepageSection {
  id: string;
  type: HomepageSectionType;
  title: string;
  subtitle?: string;
  visible: boolean;
  order: number;
  image?: string;
  buttonText?: string;
  buttonLink?: string;
  background?: string;
  layout?: 'full' | 'contained' | 'grid' | 'carousel';
  targetCategoryId?: string;
  targetProductIds?: string[];
  customText?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  link: string;
  enabled: boolean;
  order: number;
  targetCategorySlug?: string;
}

export interface AnnouncementBarConfig {
  enabled: boolean;
  text: string;
  backgroundColor: string;
  textColor: string;
  link?: string;
  startDate?: string;
  endDate?: string;
}

export interface FooterConfig {
  logoUrl?: string;
  aboutText: string;
  phone: string;
  whatsapp: string;
  email: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  telegram?: string;
  youtube?: string;
  quickLinks: MenuItem[];
  showPaymentIcons: boolean;
  showShippingInfo: boolean;
  copyrightText: string;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  drive_file_id?: string;
  size_kb?: number;
  type: string;
  created_at: string;
  used_in?: string[];
}

export type OfferType = 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping' | 'flash_sale';

export interface Offer {
  id: string;
  title: string;
  description?: string;
  type: OfferType;
  value: number;
  target_type: 'all' | 'products' | 'categories';
  target_ids?: string[];
  min_order_amount?: number;
  max_discount_amount?: number;
  start_date: string;
  end_date: string;
  active: boolean;
  is_flash_sale?: boolean;
  created_at: string;
}

// ==========================================
// NOTIFICATIONS & ALERTING DATA MODELS
// ==========================================
export type NotificationType =
  | 'NEW_ORDER'
  | 'ORDER_CONFIRMED'
  | 'ORDER_PROCESSING'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'ORDER_RETURNED'
  | 'SUPPLIER_ORDER_PENDING'
  | 'SUPPLIER_CONFIRMED'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'SUPPLIER_PAYMENT_DUE'
  | 'SUPPLIER_PAYMENT_OVERDUE'
  | 'REFUND_REQUEST'
  | 'REFUND_COMPLETED'
  | 'NEW_CUSTOMER'
  | 'SYSTEM_ALERT'
  | 'SYNC_ERROR'
  | 'SYNC_SUCCESS'
  | 'NEW_REVIEW'
  | 'REVIEW_APPROVED'
  | 'REVIEW_REJECTED'
  | 'REVIEW_REPLY';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type NotificationEntityType =
  | 'ORDER'
  | 'PRODUCT'
  | 'SUPPLIER'
  | 'EXPENSE'
  | 'PAYMENT'
  | 'REFUND'
  | 'CUSTOMER'
  | 'INVENTORY'
  | 'SYSTEM'
  | 'REVIEW';

export interface AppNotification {
  notification_id: string;
  recipient_user_id: string; // 'all', 'admin', or specific user_id
  recipient_role?: UserRole | 'ALL' | 'ADMIN_ROLES';
  type: NotificationType;
  title: string;
  message: string;
  entity_type: NotificationEntityType;
  entity_id?: string;
  priority: NotificationPriority;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  expires_at?: string;
  action_url?: string;
  metadata?: Record<string, any>;
  sync_status: 'SYNCED' | 'PENDING' | 'FAILED';
  event_key?: string; // Deterministic event key to prevent duplicate notifications
}

export interface NotificationPreferences {
  enableSound: boolean;
  enableBrowserNotifications: boolean;
  categories: {
    newOrders: boolean;
    orderUpdates: boolean;
    lowStock: boolean;
    supplierAlerts: boolean;
    financeAlerts: boolean;
    systemAlerts: boolean;
  };
}


// ==========================================
// REVIEWS & WISHLIST MODELS
// ==========================================
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';

export interface Review {
  review_id: string;
  product_id: string;
  customer_id: string;
  customer_name_snapshot: string;
  order_id: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  status: ReviewStatus;
  admin_reply?: string;
  admin_reply_by?: string;
  admin_reply_at?: string;
  created_at: string;
  updated_at: string;
  sync_status: 'SYNCED' | 'PENDING' | 'FAILED';
}

export interface WishlistItem {
  wishlist_id: string;
  customer_id: string;
  product_id: string;
  created_at: string;
  sync_status: 'SYNCED' | 'PENDING' | 'FAILED';
}

// ==========================================
// RETURNS & EXCHANGES MODELS
// ==========================================
export type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export type RequestType = 'RETURN' | 'EXCHANGE';

export interface ReturnRequestItem {
  order_item_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  selling_price: number;
}

export interface ReturnRequest {
  request_id: string;
  order_id: string;
  order_number_snapshot: string;
  customer_id: string;
  customer_name_snapshot: string;
  customer_phone_snapshot?: string;
  type: RequestType;
  items: ReturnRequestItem[];
  reason: string;
  notes?: string;
  photo_url?: string;
  status: ReturnStatus;
  admin_notes?: string;
  admin_handled_by?: string;
  created_at: string;
  updated_at: string;
  sync_status: 'SYNCED' | 'PENDING' | 'FAILED';
}
