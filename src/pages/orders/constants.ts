export const statusColors: Record<string, string> = {
  pendente: 'orange',
  em_producao: 'blue',
  pronto: 'green',
  entregue: 'default',
  rascunho: 'purple',
  cancelado: 'red',
};

export const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_producao: 'Em Produção',
  pronto: 'Pronto',
  entregue: 'Entregue',
  rascunho: 'Rascunho',
  cancelado: 'Cancelado',
};

export const paymentMethodLabels: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  credito: 'Crédito',
  debito: 'Débito',
};

export const validTransitions: Record<string, string[]> = {
  rascunho: ['pendente', 'em_producao', 'pronto', 'entregue', 'cancelado'],
  pendente: ['em_producao', 'pronto', 'cancelado'],
  em_producao: ['pronto', 'cancelado'],
  pronto: ['entregue', 'cancelado'],
  entregue: ['cancelado'],
  cancelado: [],
};

export const statusFilterOptions = Object.entries(statusLabels).map(([value, label]) => ({
  value,
  label,
}));

export const paymentMethodOptions = Object.entries(paymentMethodLabels).map(([value, label]) => ({
  value,
  label,
}));

export function formatCurrency(value?: number | null): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
