import apiClient from '../providers/rest-client'
import type {
  CashRegister,
  Client,
  DailyReport,
  Expense,
  ItemPayload,
  CatalogItem,
  Order,
  OrderPayload,
  OrdersSummary,
  PrintAddon,
  PrintPaper,
  ProductsReport,
  StatusCount,
} from './types'

const unwrap = <T>(data: T | undefined, fallback: T): T => data ?? fallback

export const apiError = (error: unknown, fallback: string): string => {
  const message = (error as { message?: unknown })?.message
  return typeof message === 'string' && message ? message : fallback
}

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post<{
      access_token: string
      email: string
      username: string
    }>('/auth/login', { email, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('user', JSON.stringify({ email: data.email, username: data.username }))
    return data
  },
  register: async (email: string, username: string, password: string) => {
    await apiClient.post('/auth/register', { email, username, password })
  },
  logout: async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
    }
  },
}

export const ordersApi = {
  list: async (params: Record<string, string | number | boolean | undefined> = {}) => {
    const { data } = await apiClient.get<{ orders: Order[]; total: number }>('/orders', { params })
    return { orders: unwrap(data?.orders, []), total: data?.total ?? 0 }
  },
  get: async (id: string) => {
    const { data } = await apiClient.get<Order>(`/orders/${id}`)
    return data
  },
  create: async (payload: OrderPayload) => {
    const { data } = await apiClient.post<Order>('/orders', payload)
    return data
  },
  update: async (id: string, payload: OrderPayload) => {
    const { data } = await apiClient.put<Order>(`/orders/${id}`, payload)
    return data
  },
  finalize: async (id: string, method: string) => {
    const { data } = await apiClient.post<Order>(`/orders/${id}/finalize`, { method })
    return data
  },
  cancel: async (id: string, reason: string) => {
    const { data } = await apiClient.post<Order>(`/orders/${id}/cancel`, { reason })
    return data
  },
}

export const itemsApi = {
  list: async (params: Record<string, string | number | undefined> = {}) => {
    const { data } = await apiClient.get<{ items: CatalogItem[]; total: number }>('/catalog/items', {
      params,
    })
    return { items: unwrap(data?.items, []), total: data?.total ?? 0 }
  },
  get: async (id: string) => {
    const { data } = await apiClient.get<CatalogItem>(`/catalog/items/${id}`)
    return data
  },
  lowStock: async () => {
    const { data } = await apiClient.get<CatalogItem[]>('/catalog/items/low-stock')
    return unwrap(data, [])
  },
  create: async (payload: ItemPayload) => {
    const { data } = await apiClient.post<CatalogItem>('/catalog/items', payload)
    return data
  },
  update: async (id: string, payload: Partial<ItemPayload>) => {
    const { data } = await apiClient.put<CatalogItem>(`/catalog/items/${id}`, payload)
    return data
  },
  remove: async (id: string) => {
    await apiClient.delete(`/catalog/items/${id}`)
  },
  removeMany: async (ids: string[]) => {
    await apiClient.delete('/catalog/items/batch', { data: { ids } })
  },
  adjustStock: async (id: string, quantity: number, reason: string) => {
    const { data } = await apiClient.post<CatalogItem>(`/catalog/items/${id}/adjust-stock`, {
      quantity,
      reason,
    })
    return data
  },
  importCsv: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await apiClient.post<{
      total: number
      created: number
      skipped?: { line: number; reason: string }[]
    }>('/catalog/import/csv', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data
  },
}

export const printingApi = {
  papers: async (params: Record<string, string | number | boolean | undefined> = {}) => {
    const { data } = await apiClient.get<{ papers: PrintPaper[]; total: number }>(
      '/printing/papers',
      { params },
    )
    return { papers: unwrap(data?.papers, []), total: data?.total ?? 0 }
  },
  savePaper: async (
    payload: {
      item_id?: string
      custom_name?: string
      price_per_sheet: number
      sheets_remaining?: number
    },
    id?: string,
  ) => {
    if (id) await apiClient.put(`/printing/papers/${id}`, payload)
    else await apiClient.post('/printing/papers', payload)
  },
  removePaper: async (id: string) => {
    await apiClient.delete(`/printing/papers/${id}`)
  },
  addons: async (params: Record<string, string | number | boolean | undefined> = {}) => {
    const { data } = await apiClient.get<{ addons: PrintAddon[]; total: number }>(
      '/printing/addons',
      { params },
    )
    return { addons: unwrap(data?.addons, []), total: data?.total ?? 0 }
  },
  saveAddon: async (
    payload: { name: string; price_type: string; price_value: number; active?: boolean },
    id?: string,
  ) => {
    if (id) await apiClient.put(`/printing/addons/${id}`, payload)
    else await apiClient.post('/printing/addons', payload)
  },
  removeAddon: async (id: string) => {
    await apiClient.delete(`/printing/addons/${id}`)
  },
}

export const clientsApi = {
  list: async (params: Record<string, string | number | boolean | undefined> = {}) => {
    const { data } = await apiClient.get<{ clients: Client[]; total: number }>('/clients', {
      params,
    })
    return { clients: unwrap(data?.clients, []), total: data?.total ?? 0 }
  },
  get: async (id: string) => {
    const { data } = await apiClient.get<Client>(`/clients/${id}`)
    return data
  },
  save: async (payload: Omit<Client, 'id' | 'active'>, id?: string) => {
    const { data } = id
      ? await apiClient.put<Client>(`/clients/${id}`, payload)
      : await apiClient.post<Client>('/clients', payload)
    return data
  },
  remove: async (id: string) => {
    await apiClient.delete(`/clients/${id}`)
  },
}

export const cashApi = {
  current: async () => {
    const { data } = await apiClient.get<CashRegister>('/cash-register/current')
    return data
  },
  open: async (starting_balance: number, notes: string) => {
    const { data } = await apiClient.post<CashRegister>('/cash-register/open', {
      starting_balance,
      notes,
    })
    return data
  },
  close: async (closing_balance: number, notes: string) => {
    const { data } = await apiClient.post<CashRegister>('/cash-register/close', {
      closing_balance,
      notes,
    })
    return data
  },
  history: async () => {
    const { data } = await apiClient.get<{ registers: CashRegister[] }>('/cash-register/history')
    return unwrap(data?.registers, [])
  },
  dailyReport: async () => {
    const { data } = await apiClient.get<DailyReport>('/cash-register/daily-report')
    return data
  },
  expenses: async () => {
    const { data } = await apiClient.get<Expense[]>('/expenses')
    return unwrap(data, [])
  },
  addExpense: async (payload: {
    description: string
    amount: number
    payment_method: string
    category: string
  }) => {
    const { data } = await apiClient.post<Expense>('/expenses', payload)
    return data
  },
}

export const reportsApi = {
  statusCounts: async () => {
    const { data } = await apiClient.get<{ counts: StatusCount[] }>(
      '/reports/orders/status-counts',
    )
    return unwrap(data?.counts, [])
  },
  summary: async (params: Record<string, string | undefined> = {}) => {
    const { data } = await apiClient.get<OrdersSummary>('/reports/orders/summary', { params })
    return data
  },
  products: async (params: Record<string, string | undefined> = {}) => {
    const { data } = await apiClient.get<ProductsReport>('/reports/products', { params })
    return data
  },
}
