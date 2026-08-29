/**
 * Portal API - dành riêng cho khách thuê (tách khỏi hệ thống nhân viên)
 * Path: src/services/portalApi.js
 */

import axios from 'axios';

const portalApi = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '/api') + '/portal',
  headers: { 'Content-Type': 'application/json' },
});

portalApi.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('tenant_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch { /* ignore */ }
  return config;
});

portalApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.endsWith('/portal/login')) {
      try { localStorage.removeItem('tenant_token'); } catch { /* ignore */ }
      window.location.href = '/portal/login';
    }
    return Promise.reject(error);
  }
);

export default portalApi;
