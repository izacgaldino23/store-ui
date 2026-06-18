import type { AuthProvider } from '@refinedev/core';
import apiClient from './rest-client';

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const { data } = await apiClient.post('/auth/login', { email, password });

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem(
      'user',
      JSON.stringify({ email: data.email, username: data.username })
    );

    return { success: true, redirectTo: '/' };
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('user');

    return { success: true, redirectTo: '/login' };
  },

  check: async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      return { authenticated: true };
    }
    return { authenticated: false, redirectTo: '/login' };
  },

  getIdentity: async () => {
    const user = localStorage.getItem('user');
    if (user) {
      return JSON.parse(user);
    }
    return null;
  },

  onError: async (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      return { redirectTo: '/login', logout: true };
    }
    return {};
  },

  register: async ({ email, username, password }) => {
    await apiClient.post('/auth/register', {
      email,
      username,
      password,
    });
    return { success: true, redirectTo: '/login' };
  },
};
