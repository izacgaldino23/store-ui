export type OrderStatus = 'rascunho' | 'pendente' | 'entregue'

export type PaymentMethod = 'pix' | 'dinheiro' | 'credito' | 'debito'

export interface Order {
  id: string
  number: string
  customer: string
  status: OrderStatus
  total: number
  products: number
  prints: number
  paymentMethod?: PaymentMethod
}

export interface CatalogItem {
  id: string
  name: string
  code: string
  price: number
  stock?: number
}

export const orders: Order[] = [
  { id: '1', number: 'PED-0001', customer: 'Maria Souza', status: 'rascunho', total: 87.9, products: 2, prints: 1 },
  { id: '2', number: 'PED-0002', customer: 'Balcão', status: 'pendente', total: 42.0, products: 1, prints: 0 },
  { id: '3', number: 'PED-0003', customer: 'João Alves', status: 'entregue', total: 156.5, products: 3, prints: 2, paymentMethod: 'pix' },
]

export const products: CatalogItem[] = [
  { id: 'p1', name: 'Caderno A4 capa dura', code: 'REV-0012', price: 32.9, stock: 18 },
  { id: 'p2', name: 'Caneta esferográfica azul', code: 'REV-0007', price: 4.5, stock: 64 },
  { id: 'p3', name: 'Grampeador 25 folhas', code: 'REV-0031', price: 48.0, stock: 7 },
]

export const printServices: CatalogItem[] = [
  { id: 'i1', name: 'Impressão colorida A4', code: 'IMP-01', price: 2.5 },
  { id: 'i2', name: 'Impressão preto e branco A4', code: 'IMP-02', price: 0.8 },
  { id: 'i3', name: 'Encadernação espiral', code: 'IMP-03', price: 12.0 },
]

export const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'pix', label: 'Pix' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'credito', label: 'Crédito' },
  { value: 'debito', label: 'Débito' },
]

export const statusLabel: Record<OrderStatus, string> = {
  rascunho: 'Rascunho',
  pendente: 'Pendente',
  entregue: 'Entregue',
}

export const paymentLabel: Record<PaymentMethod, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  credito: 'Crédito',
  debito: 'Débito',
}

export const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
