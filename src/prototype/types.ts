export type OrderStatus =
  | 'rascunho'
  | 'pendente'
  | 'em_producao'
  | 'pronto'
  | 'entregue'
  | 'cancelado'

export type PaymentMethod = 'pix' | 'dinheiro' | 'credito' | 'debito'
export type DiscountType = 'valor' | 'percentual'
export type ItemType = 'revenda' | 'insumo' | 'servico'
export type AddonPriceType = 'fixed' | 'percentage' | 'per_print'
export type ExpenseCategory = 'suprimentos' | 'transporte' | 'alimentacao' | 'outros'

export interface OrderItem {
  id: string
  item_id: string
  item_type: string
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface Payment {
  id?: string
  method: PaymentMethod
  amount: number
}

export interface OrderPrintAddon {
  addon_id: string
  name: string
  price_type: string
  price_value: number
}

export interface OrderPrint {
  id: string
  print_paper_id: string
  paper_name: string
  description?: string
  quantity: number
  addons: OrderPrintAddon[]
  unit_price: number
  total_price: number
}

export interface Order {
  id: string
  items: OrderItem[]
  prints: OrderPrint[]
  payments: Payment[]
  subtotal_amount: number
  discount_type?: DiscountType | ''
  discount_value: number
  discount_amount: number
  total_amount: number
  status: OrderStatus
  notes?: string
  client_id?: string
  client_name?: string
  cancel_reason?: string
  canceled_at?: string
  created_at: string
  updated_at: string
}

export interface OrderPayload {
  items: { item_id: string; quantity: number }[]
  prints: { print_paper_id: string; quantity: number; addon_ids: string[]; description?: string }[]
  payments: { method: PaymentMethod; amount: number }[]
  notes?: string
  client_id?: string
  discount_type?: DiscountType
  discount_value?: number
  status?: 'rascunho'
}

export interface CatalogItem {
  id: string
  item_type: ItemType
  code: string
  bar_code?: string
  name: string
  display_name?: string
  keywords?: string
  description?: string
  cost_price: number
  sale_price?: number | null
  min_stock: number
  unit: string
  supplier?: string
  units_per_pack: number
  active: boolean
  current_stock?: number | null
  created_at: string
  updated_at: string
}

export interface ItemPayload {
  item_type: ItemType
  name: string
  display_name?: string
  keywords?: string
  bar_code?: string
  description?: string
  cost_price: number
  sale_price?: number | null
  min_stock: number
  unit: string
  supplier?: string
  units_per_pack: number
}

export interface PrintPaper {
  id: string
  item_id?: string
  custom_name?: string
  display_name: string
  price_per_sheet: number
  sheets_remaining?: number | null
  active: boolean
}

export interface PrintAddon {
  id: string
  name: string
  price_type: AddonPriceType
  price_value: number
  active: boolean
}

export interface Client {
  id: string
  name: string
  phone?: string
  city?: string
  street?: string
  neighborhood?: string
  number?: string
  complement?: string
  notes?: string
  active: boolean
}

export interface CashRegister {
  id: string
  opened_at: string
  closed_at?: string
  starting_balance: number
  closing_balance?: number
  status: string
  notes?: string
  current_balance?: number
  discrepancy?: number
}

export interface Expense {
  id: string
  description: string
  amount: number
  payment_method: PaymentMethod
  category: ExpenseCategory
  registered_at: string
}

export interface CashHistoryResponse {
  registers: CashRegister[]
  total: number
  page: number
  limit: number
}

export interface DailyReport {
  register_id: string
  opened_at: string
  closed_at?: string
  starting_balance: number
  closing_balance?: number
  total_sales: number
  total_expenses: number
  cash_sales: number
  cash_expenses: number
  expected_balance: number
  discrepancy?: number
  status: string
}

export interface StatusCount {
  status: string
  count: number
}

export interface OrdersSummary {
  total_revenue: number
  orders_count: number
  avg_ticket: number
  total_discount: number
  daily: { date: string; revenue: number; orders: number }[]
  status_counts: StatusCount[]
}

export interface ProductsReport {
  best_sellers: { item_id: string; item_name: string; quantity: number; revenue: number }[]
  highest_margin: {
    item_id: string
    item_name: string
    quantity: number
    revenue: number
    cost_price: number
    margin: number
    margin_percent: number
  }[]
  highest_discount: {
    item_id: string
    item_name: string
    quantity: number
    total_discount: number
  }[]
}
