import type { DataProvider } from '@refinedev/core';
import { API_URL } from '../config';
import apiClient from './rest-client';

const API_BASE = `${API_URL}/api`;

const resourceMap: Record<string, string> = {
  items: 'catalog/items',
  'items/low-stock': 'catalog/items/low-stock',
  orders: 'orders',
  'price-table': 'pricing/table',
  'cash-register': 'cash-register',
  expenses: 'expenses',
};

function mapResource(resource: string): string {
  return resourceMap[resource] || resource;
}

function adaptListResponse(data: Record<string, unknown>): { data: unknown[]; total: number } {
  const items =
    (data.items as unknown[]) ||
    (data.orders as unknown[]) ||
    (data.registers as unknown[]) ||
    (data.data as unknown[]) ||
    [];
  const total =
    data.total !== undefined && data.total !== null
      ? (data.total as number)
      : items.length;
  return { data: items, total };
}

export const dataProvider = {
  getList: async ({ resource, pagination, sorters, filters }) => {
    const endpoint = mapResource(resource);
    const current = pagination?.current || 1;
    const pageSize = pagination?.pageSize || 10;

    const params: Record<string, unknown> = {
      page: current,
      limit: pageSize,
    };

    if (sorters && sorters.length > 0) {
      params.sort = sorters[0].field;
      params.order = sorters[0].order;
    }

    if (filters) {
      for (const filter of filters) {
        if ('field' in filter && filter.field) {
          params[filter.field] = filter.value;
        }
      }
    }

    const { data } = await apiClient.get(`/${endpoint}`, { params });

    return adaptListResponse(data as Record<string, unknown>);
  },

  getMany: async ({ resource, ids }) => {
    const endpoint = mapResource(resource);
    const { data } = await apiClient.get(`/${endpoint}`, {
      params: { id: ids.join(',') },
    });
    const items =
      (data as Record<string, unknown>).items as unknown[] ||
      (data as Record<string, unknown>).data as unknown[] ||
      [];
    return { data: items };
  },

  getOne: async ({ resource, id }) => {
    const endpoint = mapResource(resource);
    const { data } = await apiClient.get(`/${endpoint}/${id}`);
    const record = (data as Record<string, unknown>)?.data || data;
    return { data: record };
  },

  create: async ({ resource, variables }) => {
    const endpoint = mapResource(resource);
    const { data } = await apiClient.post(`/${endpoint}`, variables);
    const record = (data as Record<string, unknown>)?.data || data;
    return { data: record };
  },

  update: async ({ resource, id, variables }) => {
    const endpoint = mapResource(resource);
    const { data } = await apiClient.put(`/${endpoint}/${id}`, variables);
    const record = (data as Record<string, unknown>)?.data || data;
    return { data: record };
  },

  deleteOne: async ({ resource, id, variables }) => {
    const endpoint = mapResource(resource);
    const { data } = await apiClient.delete(`/${endpoint}/${id}`, {
      data: variables,
    });
    const record = (data as Record<string, unknown>)?.data || data;
    return { data: record };
  },

  getApiUrl: () => API_BASE,

  custom: async ({ url, method, payload, query, headers }) => {
    const { data } = await apiClient.request({
      url,
      method: method || 'get',
      data: payload,
      params: query,
      headers,
    });
    return { data };
  },
} as DataProvider;
