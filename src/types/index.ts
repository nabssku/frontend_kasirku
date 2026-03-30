// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ─── Tenant ───────────────────────────────────────────────────────────────────
export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  status: 'active' | 'inactive' | 'suspended';
  trial_ends_at?: string;
  subscription_ends_at?: string;
  created_at: string;
  updated_at: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  tenant_id: string;
  outlet_id?: string;
  name: string;
  email: string;
  image?: string | null;
  is_active: boolean;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  roles?: Role[];
  outlet?: Outlet;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
}

export interface AuthResponse {
  token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export type UserRole = 'owner' | 'admin' | 'cashier' | 'kitchen' | 'super_admin';

export interface ReceiptSettings {
  store_name: string;
  font_size: 'small' | 'medium' | 'large';
  alignment: 'left' | 'center';
  header_text?: string;
  footer_text?: string;
  logo_url?: string;
  logo_width?: number;
  paper_width?: number;
}

// ─── Outlet ───────────────────────────────────────────────────────────────────
export interface Outlet {
  id: string;
  tenant_id: string;
  name: string;
  business_type: 'fnb' | 'retail';
  address?: string;
  phone?: string;
  email?: string;
  tax_rate: number;
  service_charge: number;
  is_active: boolean;
  receipt_settings?: ReceiptSettings;
  google_review_link?: string;
  created_at: string;
  updated_at: string;
}

// ─── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  category_id: string;
  outlet_id?: string;
  name: string;
  sku?: string;
  description?: string;
  price: number;
  cost_price?: number;
  stock: number;
  min_stock: number;
  image?: string | null;
  is_active: boolean;
  has_recipe?: boolean;
  prep_time?: number;
  is_low_stock?: boolean;
  category?: Category;
  modifier_groups?: ModifierGroup[];
}

// ─── Modifier ─────────────────────────────────────────────────────────────────
export interface Modifier {
  id: string;
  modifier_group_id: string;
  name: string;
  price: number;
  is_available: boolean;
  sort_order: number;
}

export interface ModifierGroup {
  id: string;
  tenant_id: string;
  name: string;
  required: boolean;
  min_select: number;
  max_select: number;
  sort_order: number;
  modifiers: Modifier[];
}

// ─── Ingredient & Recipe ──────────────────────────────────────────────────────
export interface Ingredient {
  id: string;
  tenant_id: string;
  outlet_id?: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  current_stock: number;
  min_stock: number;
  created_at: string;
}

export interface RecipeItem {
  id: string;
  ingredient_id: string;
  quantity: number;
  ingredient?: Ingredient;
}

export interface Recipe {
  id: string;
  product_id: string;
  yield: number;
  items: RecipeItem[];
}

export interface StockMovement {
  id: string;
  ingredient_id: string;
  type: 'in' | 'out' | 'adjustment' | 'waste';
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  notes?: string;
  created_at: string;
}

// ─── Restaurant Table ─────────────────────────────────────────────────────────
export interface RestaurantTable {
  id: string;
  tenant_id: string;
  outlet_id: string;
  name: string;
  capacity?: number;
  floor?: string;
  status: 'available' | 'occupied' | 'reserved' | 'dirty';
  sort_order: number;
}

// ─── Kitchen Order ────────────────────────────────────────────────────────────
export interface KitchenOrderItem {
  id: string;
  product_name: string;
  quantity: number;
  modifier_notes?: string;
  status: 'queued' | 'cooking' | 'ready';
}

export interface KitchenOrder {
  id: string;
  order_code: string;
  table_name?: string;
  type: 'dine_in' | 'takeaway' | 'delivery';
  status: 'queued' | 'cooking' | 'ready' | 'served' | 'cancelled';
  notes?: string;
  items: KitchenOrderItem[];
  created_at: string;
  accepted_at?: string;
  ready_at?: string;
  served_at?: string;
}

// ─── Shift ────────────────────────────────────────────────────────────────────
export interface CashDrawerLog {
  id: string;
  type: 'in' | 'out';
  amount: number;
  reason?: string;
  created_at: string;
  user?: { id: string; name: string };
  expense?: Expense;
}

export interface Shift {
  id: string;
  outlet_id: string;
  opening_cash: number;
  closing_cash?: number;
  expected_cash?: number;
  cash_difference?: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  notes?: string;
  openedBy?: { id: string; name: string };
  closedBy?: { id: string; name: string };
  cash_drawer_logs?: CashDrawerLog[];
  report?: {
    gross_sales: number;
    refund_total: number;
    net_sales: number;
    payment_breakdown: Record<string, number>;
    cash_in: number;
    cash_out: number;
    expected_cash: number;
    actual_cash: number;
    difference: number;
    discrepancy_status: 'OK' | 'Shortage' | 'Over' | 'Requires Approval';
    opened_by_name?: string;
    closed_by_name?: string;
  };
}

// ─── Subscription & Plans ─────────────────────────────────────────────────────
export interface PlanFeature {
  feature_key: string;
  feature_value: string;
}

export interface Plan {
  id: number;
  slug: string;
  name: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  max_outlets: number;
  max_users: number;
  max_products: number;
  max_categories: number;
  max_ingredients: number;
  max_modifiers: number;
  trial_days: number;
  is_active: boolean;
  description?: string;
  features: PlanFeature[];
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id?: number;
  status: 'trial' | 'active' | 'expired' | 'cancelled' | 'pending';
  trial_ends_at?: string;
  starts_at?: string;
  ends_at?: string;
  days_remaining?: number;
  is_active?: boolean;
  total_days?: number;
  plan?: Plan;
}

export interface PaymentTransaction {
  id: string;
  tenant_id: string;
  type: string;
  amount: number;
  gateway: string;
  gateway_order_id: string;
  snap_token?: string;
  gateway_transaction_id?: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  gateway_payload?: Record<string, unknown>;
  paid_at?: string;
  created_at: string;
  tenant?: Tenant;
}

// ─── Customer ─────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

// ─── Transaction ──────────────────────────────────────────────────────────────
export interface TransactionItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  modifiers: {
    modifier_id: string;
    name: string;
    price: number;
  }[];
}

export interface Transaction {
  id: string;
  invoice_number: string;
  outlet_id?: string;
  table_id?: string;
  shift_id?: string;
  type?: 'dine_in' | 'takeaway' | 'delivery' | 'walk_in' | 'online';
  subtotal: number;
  tax_rate?: number;
  tax: number;
  service_charge?: number;
  discount: number;
  grand_total: number;
  paid_amount: number;
  change_amount: number;
  payment_method?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancel_reason?: string;
  cancelledBy?: { id: string; name: string };
  cashier?: { id: string; name: string };
  customer?: { id: string; name: string; phone?: string } | null;
  table?: { id: string; name: string } | null;
  items?: TransactionItem[];
  created_at: string;
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export interface DailyReport {
  date: string;
  total_sales: number;
  total_revenue: number;
  total_discount: number;
  average_transaction: number;
}

export interface DailyBreakdown {
  date: string;
  revenue: number;
  transaction_count: number;
}

export interface MonthlyReport {
  monthly_total: number;
  daily_breakdown: DailyBreakdown[];
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface ProfitReport {
  period: { start: string; end: string };
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  transaction_count: number;
  product_breakdown: {
    product_name: string;
    qty_sold: number;
    revenue: number;
    cogs: number;
    profit: number;
  }[];
}

// ─── Super Admin ──────────────────────────────────────────────────────────────
export interface SuperAdminStats {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  total_revenue: number;
  total_paid_revenue: number;
  total_orders: number;
  pending_orders: number;
  recent_tenants: Tenant[];
}

export interface Discount {
  id: number;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase_amount: number;
  max_uses_total?: number;
  uses_count: number;
  max_uses_per_user: number;
  applicable_plan_ids?: number[];
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiscountUsage {
  id: number;
  discount_id: number;
  tenant_id: string;
  user_id: string;
  payment_transaction_id?: string;
  created_at: string;
  discount?: Discount;
}

export interface TenantDetail extends Tenant {
  users_count: number;
  subscription?: Subscription;
  users?: User[];
}

// ─── Bluetooth Printer ────────────────────────────────────────────────────────
export interface BluetoothPrinterDevice {
  id: string;
  tenant_id: string;
  outlet_id?: string;
  name: string;
  mac_address?: string;
  is_default: boolean;
  type: 'cashier' | 'kitchen' | 'both';
  outlet?: Outlet;
  created_at: string;
  updated_at: string;
}

export interface PrinterReceiptItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  modifiers?: {
    name: string;
    price: number;
  }[];
}

export interface PrinterReceiptData {
  store_name: string;
  store_address: string;
  store_phone: string;
  invoice_number: string;
  date: string;
  cashier: string;
  customer: string;
  table_id?: string;
  table_name?: string;
  type?: 'dine_in' | 'takeaway' | 'delivery' | 'walk_in' | 'online';
  items: PrinterReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  tax_rate: number;
  service_charge: number;
  grand_total: number;
  paid_amount: number;
  change_amount: number;
  payment_method: string;
  status: string;
  notes?: string;
  receipt_settings?: ReceiptSettings;
}

// ─── Expense ──────────────────────────────────────────────────────────────────
export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
}

export interface IngredientPurchase {
  id: string;
  expense_id: string;
  ingredient_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  ingredient?: Ingredient;
}

export interface Expense {
  id: string;
  category_id: string;
  outlet_id: string;
  user_id: string;
  shift_id?: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'other';
  reference_number?: string;
  notes?: string;
  date: string;
  attachment?: string;
  type: 'operational' | 'ingredient_purchase';
  category?: ExpenseCategory;
  user?: { id: string; name: string };
  outlet?: Outlet;
  ingredient_purchases?: IngredientPurchase[];
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id?: number;
  outlet_id?: string;
  action: string;
  model_type?: string;
  model_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
  user?: { id: number; name: string };
  outlet?: { id: string; name: string };
}

export interface AuditLogResponse {
  success: boolean;
  data: AuditLog[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    has_plan_access: boolean;
    message?: string;
  };
}
