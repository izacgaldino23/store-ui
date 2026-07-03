import axios from 'axios';
import { API_URL } from '../config';
import { translateError } from './error-mapping';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          }
        );

        localStorage.setItem('access_token', data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        return Promise.reject(error);
      }
    }

    const data = error.response?.data;
    const code = data?.code;
    if (data?.message) {
      error.message = data.message;
    } else if (code) {
      error.message = translateError(code);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
