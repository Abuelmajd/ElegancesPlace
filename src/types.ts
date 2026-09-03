//
// ElgancesPlace — V3 Type System
// Database schema: 40 canonical tables
//

// ============================================================
// COMMON / ENUMS
// ============================================================

export type UserRole =
  | 'Owner'
  | 'Manager'
  | 'Accountant'
  | 'Marketing'
  | 'Employee'
  | 'Customer';

export type RecordStatus =
  | 'active'
  | 'inactive'
  | 'draft'
  | 'archived';

export type ProductFulfillmentMethod =
  | 'OWN_STOCK'
  | 'SUPPLIER_DROPSHIPPING'
  | 'PRE_ORDER'
  | 'CUSTOM_ORDER';

export type FulfillmentMethod =
  | ProductFulfillmentMethod;

export type StockTracking =
  | boolean;

export type StoreMode =
  | 'DROPSHIPPING'
  | 'OWN_STOCK'
  | 'HYBRID'
  | 'AFFILIATE_BROKER';

export type MarketingMode =
  | 'ORGANIC_ONLY'
  | 'PAID_ADS'
  | 'MIXED';

export type CurrencyCode =
  | 'ILS'
  | 'JOD'
  | 'USD'
  | 'EUR'
  | string;

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CARD'
  | 'ONLINE'
  | 'OTHER'
  | string;

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'refunded'
  | 'partially_paid';

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
  | 'FAILED';

export type FulfillmentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'AWAITING_SUPPLIER'
  | 'SUPPLIER_CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type ReturnType =
  | 'RETURN'
  | 'EXCHANGE';

export type ReturnStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export type ReviewStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'HIDDEN';

export type NotificationPriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT';

export type TaxSystem =
  | 'NONE'
  | 'PALESTINIAN'
  | 'ISRAELI';

export type TaxType =
  | 'VAT'
  | 'SALES_TAX'
  | 'OTHER';

export type SalesChannelType =
  | 'WEBSITE'
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'WHATSAPP'
  | 'TELEGRAM'
  | 'TIKTOK'
  | 'PHONE'
  | 'PHYSICAL_STORE'
  | 'MANUAL';

export type DiscoveryStatus =
  | 'NEW'
  | 'REVIEWED'
  | 'IMPORTED'
  | 'REJECTED'
  | 'ARCHIVED';

export type InventoryMovementType =
  | 'SALE'
  | 'RESTOCK'
  | 'RETURN'
  | 'ADJUSTMENT'
  | 'DAMAGE'
  | 'PURCHASE'
  | 'LOSS'
  | 'MANUAL_ADJUST';

export type CommissionType =
  | 'PERCENTAGE'
  | 'FIXED'
  | 'PER_ORDER'
  | 'OTHER';


// ============================================================
// 1. PRODUCTS
// ============================================================

export interface Product {
  id?: string;
  product_id: string;
  sku: string;
  name: string;
  description?: string;

  category_id?: string;
  product_group_id?: string;

  cost_price: number;
  cost_currency?: CurrencyCode;

  selling_price: number;
  selling_currency?: CurrencyCode;

  old_price?: number;
  old_price_currency?: CurrencyCode;

  fulfillment_method?: ProductFulfillmentMethod;
  stock_tracking?: boolean;

  image_url?: string;
  drive_file_id?: string;

  rating?: number;
  badge?: string;

  status: 'active' | 'draft' | 'archived';

  created_at: string;
  updated_at: string;

  // Compatibility fields (camelCase)
  price?: number;
  oldPrice?: number;
  stock?: number;
  bestSeller?: boolean;
  newProduct?: boolean;
  images?: any;
  image?: string;
  image_data?: any;
  category?: string;
  categoryName?: string;
  supplier?: string;
  originalPrice?: number;
  costPrice?: number;
  fulfillmentType?: string;

  // Compatibility fields (snake_case from original interface)
  wholesale_price?: number;
  compare_at_price?: number;
  pricing_method?: PricingMethod;
  pricing_value?: number;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  brand?: string;
  weight?: number;
  featured?: boolean;
  new_product?: boolean;
  best_seller?: boolean;
  fulfillment_type?: string;
  seo_title?: string;
  seo_description?: string;
  slug?: string;
  supplier_id?: string;
}


// ============================================================
// 2. PRODUCT VARIANTS
// ============================================================

export interface ProductVariant {
  id: string;
  variant_id: string;
  product_id: string;

  sku?: string;
  barcode?: string;
  variant_name?: string;

  /**
   * JSON string or serialized attributes object.
   * Example: {"color":"Black","size":"L"}
   */
  attributes?: string;

  cost_price: number;
  cost_currency: CurrencyCode;

  selling_price: number;
  selling_currency: CurrencyCode;

  old_price?: number;
  old_price_currency?: CurrencyCode;

  status: RecordStatus;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 3. PRODUCT GROUPS
// ============================================================

export interface ProductGroup {
  id: string;
  group_id: string;

  name: string;
  description?: string;

  category_id?: string;

  status: RecordStatus;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 4. CATEGORIES
// ============================================================

export interface Category {
  id: string;
  category_id: string;

  name: string;
  title?: string;
  subtitle?: string;

  slug: string;

  image_url?: string;
  icon?: string;

  display_mode?: string;
  sort_order: number;

  status: RecordStatus;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 5. PRODUCT SOURCES
// ============================================================

export interface ProductSource {
  id: string;
  source_id: string;

  product_id: string;
  variant_id?: string;

  supplier_id: string;

  supplier_sku?: string;

  cost_price: number;
  cost_currency: CurrencyCode;

  supplier_stock?: number;
  minimum_order_quantity?: number;

  fulfillment_method: ProductFulfillmentMethod;

  is_preferred: boolean;

  status: RecordStatus;

  notes?: string;
  supplier_shipping_policy?: string;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 6. PRODUCT IMAGES
// ============================================================

export interface ProductImage {
  id: string;
  image_id: string;

  product_id: string;
  variant_id?: string;

  drive_file_id?: string;
  image_url?: string;

  is_primary: boolean;
  sort_order: number;

  file_name?: string;
  mime_type?: string;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 7. PRICE HISTORY
// ============================================================

export interface PriceHistory {
  id: string;
  price_history_id: string;

  product_id: string;
  variant_id?: string;

  old_cost_price?: number;
  new_cost_price?: number;

  old_selling_price?: number;
  new_selling_price?: number;

  reason?: string;
  changed_by?: string;

  created_at: string;
}


// ============================================================
// 8. SUPPLIERS
// ============================================================

export interface Supplier {
  id?: string;
  supplier_id: string;

  name: string;
  company_name?: string;

  phone: string;

  whatsapp?: string;
  telegram?: string;
  facebook?: string;
  instagram?: string;
  website?: string;

  preferred_platform?: string;

  email?: string;

  city?: string;
  address?: string;

  notes?: string;

  status: RecordStatus;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 9. SUPPLIER CHANNELS
// ============================================================

export interface SupplierChannel {
  id: string;
  channel_id: string;

  supplier_id: string;

  channel_type: string;
  name?: string;

  url?: string;
  username?: string;

  is_active: boolean;

  last_checked_at?: string;
  last_item_detected_at?: string;

  monitoring_enabled: boolean;

  notes?: string;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 10. SUPPLIER PRODUCT DISCOVERIES
// ============================================================

export interface SupplierProductDiscovery {
  id: string;
  discovery_id: string;

  supplier_id: string;
  channel_id?: string;

  external_product_id?: string;

  product_name: string;
  description?: string;

  source_url?: string;
  image_url?: string;

  detected_price?: number;
  detected_currency?: CurrencyCode;

  detected_at?: string;

  status: DiscoveryStatus;
  selected: boolean;

  reviewed_at?: string;

  imported_product_id?: string;
  imported_at?: string;

  notes?: string;

  created_at: string;
}


// ============================================================
// 11. SUPPLIER SHIPPING RATES
// ============================================================

export interface SupplierShippingRate {
  id: string;
  supplier_shipping_rate_id: string;

  supplier_id: string;
  zone_id: string;

  shipping_cost: number;
  currency: CurrencyCode;

  status: RecordStatus;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 12. SUPPLIER TRANSACTIONS
// ============================================================

export interface SupplierTransaction {
  id: string;
  transaction_id: string;

  supplier_id: string;

  order_id?: string;
  order_item_id?: string;

  type: string;

  amount: number;
  currency: CurrencyCode;

  amount_base: number;
  base_currency: CurrencyCode;

  exchange_rate?: number;

  reference?: string;

  status: string;

  transaction_date: string;

  notes?: string;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 13. WAREHOUSES
// ============================================================

export interface Warehouse {
  id: string;
  warehouse_id: string;

  name: string;

  location?: string;
  address?: string;
  phone?: string;

  manager_name?: string;

  status: RecordStatus;
}


// ============================================================
// 14. INVENTORY
// ============================================================

export interface Inventory {
  id: string;
  inventory_id: string;

  product_id: string;
  variant_id?: string;

  warehouse_id: string;

  sku?: string;

  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;

  reorder_level?: number;

  warehouse_location?: string;

  last_update: string;
}


// ============================================================
// 15. INVENTORY MOVEMENTS
// ============================================================

export interface InventoryMovement {
  id?: string;
  movement_id: string;

  product_id: string;
  variant_id?: string;

  warehouse_id?: string;

  sku?: string;

  movement_type: InventoryMovementType;

  quantity: number;

  quantity_before?: number;
  quantity_after?: number;

  reference_type?: string;
  reference_id?: string;

  reason?: string;

  created_by?: string;
  created_at: string;

  // Compatibility fields
  order_id?: string;
  date?: string;
  time?: string;
  after_quantity?: number;
  before_quantity?: number;
  timestamp?: number | string;
  user_id?: string;
  notes?: string;
}


// ============================================================
// 16. CUSTOMERS
// ============================================================

export interface Customer {
  id?: string;
  customer_id: string;

  name: string;
  phone: string;

  email?: string;

  city?: string;
  address?: string;

  notes?: string;

  total_orders: number;
  total_spent: number;

  last_order_date?: string;

  created_at: string;
  updated_at?: string;
}


// ============================================================
// 17. ORDERS
// ============================================================

export interface Order {
  id?: string;
  order_id: string;
  order_number: string;

  customer_id?: string;

  customer_name: string;
  customer_phone: string;
  customer_email?: string;

  shipping_address: string;
  city: string;

  shipping_zone_id?: string;

  notes?: string;

  sales_channel?: SalesChannelType;

  order_date: string;
  order_time: string;

  subtotal: number;
  discount_amount?: number;
  shipping_cost: number;
  total: number;

  currency?: CurrencyCode;
  base_currency?: CurrencyCode;

  subtotal_base?: number;
  discount_amount_base?: number;
  shipping_cost_base?: number;
  total_base?: number;

  exchange_rate?: number;
  exchange_rate_date?: string;

  payment_method: PaymentMethod;
  payment_status: PaymentStatus;

  order_status: OrderStatus;
  fulfillment_status: FulfillmentStatus;

  created_at: string;
  updated_at: string;

  // Compatibility fields
  discount?: number;
  phone?: string;
  address?: string;
  shipping_company?: string;
  tracking_number?: string;
  tracking_url?: string;
  sync_status?: 'SYNCED' | 'PENDING' | 'FAILED';
  items?: any[];
}


// ============================================================
// 18. ORDER ITEMS
// ============================================================

export interface OrderItem {
  id: string;
  item_id: string;

  order_id: string;

  product_id: string;
  variant_id?: string;

  source_id?: string;
  supplier_id?: string;

  supplier_sku?: string;

  product_name: string;
  sku?: string;

  quantity: number;

  cost_price: number;
  cost_currency: CurrencyCode;
  cost_price_base: number;
  cost_exchange_rate: number;

  supplier_shipping_cost?: number;
  supplier_shipping_currency?: CurrencyCode;
  supplier_shipping_cost_base?: number;
  supplier_shipping_exchange_rate?: number;

  selling_price: number;
  selling_currency: CurrencyCode;
  selling_price_base: number;
  selling_exchange_rate: number;

  profit: number;
  profit_currency: CurrencyCode;
  profit_base: number;

  fulfillment_method: ProductFulfillmentMethod;

  created_at: string;

  // Compatibility fields
  order_item_id?: string;
  sku_at_purchase?: string;
  product_name_at_purchase?: string;
  supplier_id_at_purchase?: string;
  supplier_name_at_purchase?: string;
  cost_price_at_purchase?: number;
  selling_price_at_purchase?: number;
  fulfillment_method_at_purchase?: string;
  subtotal?: number;
  discount_at_purchase?: number;
}


// ============================================================
// 19. FULFILLMENTS
// ============================================================

export interface Fulfillment {
  id: string;
  fulfillment_id: string;

  order_id: string;

  supplier_id?: string;
  warehouse_id?: string;

  fulfillment_method: ProductFulfillmentMethod;

  status: FulfillmentStatus;

  supplier_cost: number;
  supplier_cost_currency: CurrencyCode;
  supplier_cost_base: number;
  supplier_exchange_rate: number;

  shipping_cost: number;
  shipping_currency: CurrencyCode;
  shipping_cost_base: number;
  shipping_exchange_rate: number;

  tracking_number?: string;
  tracking_url?: string;

  shipping_company?: string;

  consolidation_method?: string;

  notes?: string;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 20. RETURNS
// ============================================================

export interface ReturnRecord {
  id: string;
  return_id: string;

  order_id: string;
  order_item_id: string;

  customer_id: string;

  product_id: string;
  variant_id?: string;

  quantity: number;

  return_type: ReturnType;

  reason?: string;

  status: ReturnStatus;

  refund_amount?: number;
  refund_currency?: CurrencyCode;
  refund_amount_base?: number;
  refund_exchange_rate?: number;

  replacement_product_id?: string;

  notes?: string;

  requested_at?: string;
  processed_at?: string;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 21. SHIPPING ZONES
// ============================================================

export interface ShippingZone {
  id: string;
  zone_id: string;

  name: string;

  customer_shipping_cost: number;
  currency: CurrencyCode;

  status: RecordStatus;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 22. SHIPPING
// ============================================================

export interface Shipping {
  id: string;
  shipping_id: string;

  order_id: string;
  fulfillment_id?: string;

  shipping_company?: string;
  shipping_method?: string;

  shipping_cost: number;
  currency: CurrencyCode;

  shipping_cost_base: number;
  base_currency: CurrencyCode;

  exchange_rate: number;

  tracking_number?: string;
  tracking_url?: string;

  shipping_status?: string;

  shipped_at?: string;
  delivered_at?: string;

  notes?: string;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 23. PAYMENTS
// ============================================================

export interface Payment {
  id?: string;
  payment_id: string;

  order_id?: string;
  customer_id?: string;

  customer_name?: string;

  amount: number;
  currency?: CurrencyCode;

  amount_base?: number;
  base_currency?: CurrencyCode;

  exchange_rate?: number;

  payment_method: PaymentMethod;
  payment_status: PaymentStatus;

  payment_date?: string;
  payment_time?: string;

  reference?: string;

  created_by?: string;

  created_at: string;
  updated_at?: string;

  // Compatibility fields
  customer_name_snapshot?: string;
  sync_status?: 'SYNCED' | 'PENDING' | 'FAILED';
  date?: string;
  time?: string;
}


// ============================================================
// 24. COMMISSIONS
// ============================================================

export interface Commission {
  id: string;
  commission_id: string;

  order_id: string;
  order_item_id?: string;

  supplier_id?: string;
  product_id?: string;

  commission_type: CommissionType;

  commission_value: number;

  commission_amount: number;
  currency: CurrencyCode;

  commission_amount_base: number;
  base_currency: CurrencyCode;

  exchange_rate: number;

  status: string;

  due_date?: string;
  paid_date?: string;

  payment_id?: string;

  notes?: string;

  created_at: string;
}


// ============================================================
// 25. EXPENSES
// ============================================================

export interface Expense {
  id?: string;
  expense_id: string;

  category: string;

  amount: number;
  currency?: CurrencyCode;

  amount_base?: number;
  base_currency?: CurrencyCode;

  exchange_rate?: number;

  description?: string;

  expense_date?: string;
  expense_time?: string;

  supplier_id?: string;

  invoice_number?: string;

  payment_method?: PaymentMethod;

  reference?: string;

  notes?: string;

  created_by?: string;

  created_at: string;

  // Compatibility fields
  date?: string;
  time?: string;
  updated_at?: string;
  sync_status?: 'SYNCED' | 'PENDING' | 'FAILED';
}


// ============================================================
// 26. ACCOUNTING ENTRIES
// ============================================================

export interface AccountingEntry {
  id: string;
  entry_id: string;

  entry_type: string;

  reference_type?: string;
  reference_id?: string;

  description?: string;

  debit: number;
  credit: number;
  amount: number;

  currency: CurrencyCode;

  debit_base: number;
  credit_base: number;
  amount_base: number;

  base_currency: CurrencyCode;

  exchange_rate: number;

  entry_date: string;

  created_by?: string;

  created_at: string;
}


// ============================================================
// 27. TAX PROFILES
// ============================================================

export interface TaxProfile {
  id: string;
  tax_profile_id: string;

  name: string;

  country: string;

  tax_system: TaxSystem;
  tax_type: TaxType;

  rate: number;

  is_inclusive: boolean;

  status: RecordStatus;

  effective_from?: string;
  effective_to?: string;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 28. SALES CHANNELS
// ============================================================

export interface SalesChannel {
  id: string;
  channel_id: string;

  name: string;

  channel_type: SalesChannelType;

  platform?: string;

  account_name?: string;
  account_id?: string;

  page_id?: string;
  username?: string;

  url?: string;

  status: RecordStatus;

  publishing_enabled: boolean;
  messaging_enabled: boolean;
  orders_enabled: boolean;

  organic_enabled: boolean;
  paid_ads_enabled: boolean;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 29. PRODUCT CHANNEL LISTINGS
// ============================================================

export interface ProductChannelListing {
  id: string;
  listing_id: string;

  product_id: string;
  channel_id: string;

  external_product_id?: string;
  external_url?: string;

  channel_title?: string;
  channel_description?: string;

  channel_price?: number;
  channel_currency?: CurrencyCode;

  channel_status?: string;

  published_at?: string;
  updated_at?: string;

  last_sync_at?: string;

  sync_status?: string;
  error_message?: string;
}


// ============================================================
// 30. CUSTOMER MESSAGES
// ============================================================

export interface CustomerMessage {
  id: string;
  message_id: string;

  customer_id?: string;
  guest_id?: string;

  channel_id?: string;

  external_message_id?: string;

  order_id?: string;
  product_id?: string;

  subject?: string;
  message: string;

  admin_reply?: string;

  status: string;

  message_type?: string;
  priority?: NotificationPriority;

  customer_read: boolean;
  admin_read: boolean;

  created_at: string;
  replied_at?: string;
  updated_at: string;
}


// ============================================================
// 31. USERS
// ============================================================

export interface User {
  id: string;
  user_id: string;

  name: string;

  email?: string;
  phone?: string;

  role: UserRole;

  status: RecordStatus;

  last_login_at?: string;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 32. NOTIFICATIONS
// ============================================================

export interface Notification {
  id: string;
  notification_id: string;

  user_id?: string;
  customer_id?: string;

  type: string;

  title: string;
  message: string;

  reference_type?: string;
  reference_id?: string;

  is_read: boolean;

  created_at: string;
}


// ============================================================
// 33. ACTIVITY LOG
// ============================================================

export interface ActivityLog {
  id: string;
  activity_id: string;

  user_id?: string;

  action: string;

  entity_type: string;
  entity_id?: string;

  old_value?: string;
  new_value?: string;

  description?: string;

  created_at: string;
}


// ============================================================
// 34. STORE SETTINGS
// ============================================================

export interface StoreSettings {
  id: string;

  store_name: string;

  store_mode: StoreMode;

  default_fulfillment_method: ProductFulfillmentMethod;

  base_currency: CurrencyCode;

  shipping_flat_rate: number;
  shipping_flat_rate_currency: CurrencyCode;

  tax_enabled: boolean;
  active_tax_profile_id?: string;

  vat_enabled: boolean;
  vat_rate: number;

  tax_registration_number?: string;
  taxpayer_type?: string;

  tax_included_in_prices: boolean;

  allow_guest_checkout: boolean;
  allow_cash_payment: boolean;
  allow_online_payment: boolean;

  allow_store_sales: boolean;
  allow_phone_orders: boolean;
  allow_whatsapp_orders: boolean;

  default_pricing_method?: string;

  default_markup_percentage?: number;

  default_markup_amount?: number;
  default_markup_currency?: CurrencyCode;

  marketing_mode: MarketingMode;

  logo_url?: string;

  store_description?: string;
  store_slogan?: string;
  description?: string;
  currency?: string;
  timezone?: string;
  language?: string;

  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;

  theme?: string;

  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;

  font_family?: string;

  border_radius?: string;
  button_style?: string;
  header_style?: string;
  product_card_style?: string;

  status?: string;
  maintenance_message?: string;
  free_shipping_threshold?: number;
  return_policy?: string;
  shipping_policy?: string;
  exchange_policy?: string;
  cancellation_policy?: string;
  warranty_policy?: string;
  privacy_policy?: string;
  terms?: string;
  hero_banner_url?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_bg_color?: string;
  hero_bg_image?: string;
  product_guarantees?: any;
  social_links?: Record<string, string>;
  seo?: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string;
  };

  updated_at: string;
}


// ============================================================
// 35. DISCOUNTS
// ============================================================

export interface Discount {
  id: string;
  discount_id: string;

  code?: string;

  title: string;
  description?: string;

  discount_type: string;

  value: number;
  currency?: CurrencyCode;

  minimum_order_amount?: number;
  maximum_discount_amount?: number;

  applicable_to?: string;

  product_id?: string;
  category_id?: string;

  usage_limit?: number;
  usage_count: number;

  start_date?: string;
  end_date?: string;

  status: RecordStatus;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 36. REVIEWS
// ============================================================

export interface Review {
  id?: string;
  review_id: string;

  product_id: string;
  variant_id?: string;

  customer_id: string;
  customer_name?: string;

  order_id?: string;

  rating: number;

  title?: string;
  comment?: string;

  status: ReviewStatus;

  created_at: string;
  updated_at: string;

  sync_status?: 'SYNCED' | 'PENDING' | 'FAILED';

  // Compatibility fields
  customer_name_snapshot?: string;
  admin_reply?: string;
  admin_reply_by?: string;
  admin_reply_at?: string;
}


// ============================================================
// 37. WISHLISTS
// ============================================================

export interface Wishlist {
  id: string;
  wishlist_id: string;

  customer_id: string;

  product_id: string;
  variant_id?: string;

  created_at: string;
}


// ============================================================
// 38. MEDIA
// ============================================================

export interface Media {
  id: string;
  media_id: string;

  file_name?: string;
  file_type?: string;
  mime_type?: string;

  drive_file_id?: string;
  file_url?: string;

  entity_type?: string;
  entity_id?: string;

  is_primary: boolean;

  created_at: string;
}


// ============================================================
// 39. CURRENCIES
// ============================================================

export interface Currency {
  id: string;
  currency_id: string;

  code: CurrencyCode;
  name: string;
  symbol: string;

  decimal_places: number;

  is_default: boolean;
  is_active: boolean;

  created_at: string;
  updated_at: string;
}


// ============================================================
// 40. EXCHANGE RATES
// ============================================================

export interface ExchangeRate {
  id: string;
  exchange_rate_id: string;

  from_currency: CurrencyCode;
  to_currency: CurrencyCode;

  rate: number;

  effective_date: string;

  source?: string;

  status: RecordStatus;

  created_at: string;
  updated_at: string;
}


// ============================================================
// RELATION / VIEW MODELS
// هذه ليست جداول Google Sheets.
// ============================================================

export interface ProductWithRelations extends Omit<Product, 'category'> {
  categoryDetails?: Category;
  variants?: ProductVariant[];
  sources?: ProductSource[];
  images?: ProductImage[];
}

export interface ProductSourceWithSupplier extends ProductSource {
  supplier?: Supplier;
}

export interface OrderWithItems extends Order {
  items?: OrderItem[];
}

export interface FulfillmentWithSupplier extends Fulfillment {
  supplier?: Supplier;
}

export interface OrderWithRelations extends Order {
  items?: OrderItem[];
  fulfillments?: Fulfillment[];
  shipping?: Shipping[];
  payments?: Payment[];
}


// ============================================================
// FRONTEND / UI TYPES
// ليست جداول V3
// ============================================================

export type ThemePresetName =
  | 'Elegant'
  | 'Luxury'
  | 'Minimal'
  | 'Modern'
  | 'Fashion'
  | 'Classic'
  | 'Dark Luxury';

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

  borderRadius:
    | 'none'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | 'full';

  shadows:
    | 'none'
    | 'sm'
    | 'md'
    | 'lg';

  fontSize:
    | 'sm'
    | 'base'
    | 'lg';

  headingStyle:
    | 'serif'
    | 'sans'
    | 'bold'
    | 'minimal';

  productCardStyle:
    | 'classic'
    | 'modern'
    | 'minimal'
    | 'compact';

  navigationStyle:
    | 'top'
    | 'centered'
    | 'minimal';
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

  layout?:
    | 'full'
    | 'contained'
    | 'grid'
    | 'carousel';

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


// ============================================================
// NOTIFICATION UI
// ============================================================

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

export interface AppNotification {
  notification_id: string;

  recipient_user_id: string;

  recipient_role?: UserRole | 'ALL' | 'ADMIN_ROLES';

  type: NotificationType;

  title: string;
  message: string;

  entity_type?: string;
  entity_id?: string;

  priority: NotificationPriority;

  is_read: boolean;

  created_at: string;

  read_at?: string;
  expires_at?: string;

  action_url?: string;

  metadata?: Record<string, unknown>;

  sync_status: 'SYNCED' | 'PENDING' | 'FAILED';

  event_key?: string;
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


// ============================================================
// RETURN / EXCHANGE UI
// ليست جدول V3 مباشرًا
// ============================================================

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

  type: ReturnType;

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


// ============================================================
// PRICING UI
// ============================================================

export type PricingMethod =
  | 'manual'
  | 'multiplier'
  | 'percentage'
  | 'fixed';

export type OfferType =
  | 'percentage'
  | 'fixed_amount'
  | 'buy_x_get_y'
  | 'free_shipping'
  | 'flash_sale';

export interface Offer {
  id: string;

  title: string;
  description?: string;

  type: OfferType;

  value: number;

  target_type:
    | 'all'
    | 'products'
    | 'categories';

  target_ids?: string[];

  min_order_amount?: number;
  max_discount_amount?: number;

  start_date: string;
  end_date: string;

  active: boolean;
  is_flash_sale?: boolean;

  created_at: string;
}


// ============================================================
// BACKWARD COMPATIBILITY TYPES (V3 Migration)
// ============================================================

export type SupplierCommStatus = 'NOT_SENT' | 'SENT' | 'CONTACTED' | 'CONFIRMED' | 'DECLINED' | 'FAILED';
export type SupplierCollectionStatus = 'PENDING' | 'COLLECTED' | 'FAILED' | 'UNKNOWN';
export type SupplierSettlementStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'DISPUTED' | 'CANCELLED';
export type ReturnResponsibility = 'SUPPLIER' | 'STORE' | 'UNKNOWN';
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
export type AccountingPaymentMethod = PaymentMethod | string;
export type RequestType = ReturnType;

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

export interface OrderTimelineEvent {
  event_id: string;
  order_id: string;
  event_type: TimelineEventType;
  timestamp: string;
  user_id: string;
  description: string;
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

export interface WishlistItem {
  wishlist_id: string;
  customer_id: string;
  product_id: string;
  created_at: string;
  sync_status?: 'SYNCED' | 'PENDING' | 'FAILED';
}

export type ExpenseCategory = string;
export type CashFlowType = string;

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