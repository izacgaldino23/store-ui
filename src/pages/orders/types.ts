export interface IOrderItem {
  id: string;
  item_id: string;
  item_type: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface IPayment {
  id?: string;
  method: string;
  amount: number;
}

export interface IOrder {
  id: string;
  items: IOrderItem[];
  prints?: IOrderPrint[];
  payments: IPayment[];
  subtotal_amount?: number;
  discount_type?: 'valor' | 'percentual';
  discount_value?: number;
  discount_amount?: number;
  total_amount: number;
  status: string;
  notes?: string;
  client_id?: string;
  client_name?: string;
  cancel_reason?: string;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ICatalogItem {
  id: string;
  name: string;
  item_type: string;
  sale_price: number | null;
  current_stock?: number | null;
}

export interface ICartItem {
  item_id: string;
  item_name: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface IPrintAddon {
  id: string;
  name: string;
  price_type: 'fixed' | 'percentage';
  price_value: number;
  active: boolean;
}

export interface IPrintPaper {
  id: string;
  item_id?: string | null;
  custom_name?: string | null;
  display_name: string;
  price_per_sheet: number;
  sheets_remaining?: number | null;
  active: boolean;
}

export interface IOrderPrintAddon {
  addon_id: string;
  name: string;
  price_type: string;
  price_value: number;
}

export interface IOrderPrint {
  id: string;
  print_paper_id: string;
  paper_name: string;
  description?: string;
  quantity: number;
  addons: IOrderPrintAddon[];
  unit_price: number;
  total_price: number;
}

export interface IPrintLine {
  print_paper_id?: string;
  description?: string;
  quantity: number;
  addon_ids: string[];
}
