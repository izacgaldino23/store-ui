export interface IClient {
  id: string;
  name: string;
  phone?: string;
  city?: string;
  street?: string;
  neighborhood?: string;
  number?: string;
  complement?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IClientListResponse {
  clients: IClient[];
  total: number;
  page: number;
  limit: number;
}

export interface IClientFormState {
  name: string;
  phone: string;
  city: string;
  street: string;
  neighborhood: string;
  number: string;
  complement: string;
  notes: string;
}

export const CLIENT_DEFAULT_CITY = 'Juazeiro do Norte';

export function formatPhone(value: string | undefined | null): string {
  const digits = (value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}
