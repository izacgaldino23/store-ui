import type { Client, DiscountType, OrderStatus, PaymentMethod, PrintAddon, PrintPaper } from './types'

export const money = (value?: number | null) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)

export const shortDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    : '-'

export const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'pix', label: 'Pix' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'credito', label: 'Crédito' },
  { value: 'debito', label: 'Débito' },
]

export const paymentLabel: Record<PaymentMethod, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  credito: 'Crédito',
  debito: 'Débito',
}

export const statusLabel: Record<OrderStatus, string> = {
  rascunho: 'Rascunho',
  pendente: 'Pendente',
  em_producao: 'Em produção',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

export const statusOptions = (Object.keys(statusLabel) as OrderStatus[]).map((value) => ({
  value,
  label: statusLabel[value],
}))

export const discountTypeOptions: { value: DiscountType; label: string }[] = [
  { value: 'valor', label: 'Valor (R$)' },
  { value: 'percentual', label: 'Percentual (%)' },
]

export const expenseCategories = [
  { value: 'suprimentos', label: 'Suprimentos' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'outros', label: 'Outros' },
]

export const itemTypes = [
  { value: 'revenda', label: 'Revenda' },
  { value: 'insumo', label: 'Insumo' },
  { value: 'servico', label: 'Serviço' },
]

export const addonPriceTypes = [
  { value: 'fixed', label: 'Por folha' },
  { value: 'percentage', label: 'Percentual' },
  { value: 'per_print', label: 'Por impressão' },
]

export function computeDiscountAmount(
  subtotal: number,
  type: DiscountType,
  value: number,
): number {
  if (!value || value <= 0 || subtotal <= 0) return 0
  const raw = type === 'percentual' ? (subtotal * value) / 100 : value
  return Math.round(raw * 100) / 100
}

export function computePrintUnitPrice(paper: PrintPaper | undefined, addons: PrintAddon[]): number {
  if (!paper) return 0
  let total = paper.price_per_sheet
  let percentSum = 0
  for (const addon of addons) {
    if (addon.price_type === 'fixed') total += addon.price_value
    if (addon.price_type === 'percentage') percentSum += addon.price_value
  }
  return Math.round((total + paper.price_per_sheet * (percentSum / 100)) * 100) / 100
}

export function computePrintTotal(
  paper: PrintPaper | undefined,
  addons: PrintAddon[],
  quantity: number,
): number {
  if (!paper) return 0
  const flat = addons.reduce(
    (sum, addon) => sum + (addon.price_type === 'per_print' ? addon.price_value : 0),
    0,
  )
  return Math.round((computePrintUnitPrice(paper, addons) * quantity + flat) * 100) / 100
}

export const emptyClient: Omit<Client, 'id' | 'active'> = {
  name: '',
  phone: '',
  city: 'Juazeiro do Norte',
  street: '',
  neighborhood: '',
  number: '',
  complement: '',
  notes: '',
}
