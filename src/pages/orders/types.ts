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
  payments: IPayment[];
  total_amount: number;
  status: string;
  notes?: string;
  customer_name?: string;
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
