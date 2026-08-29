/**
 * Fund Service (Quỹ Thu Chi)
 * Path: src/services/fundService.js
 */

import api from './api';

const fundService = {
  getMeta: async () => {
    const response = await api.get('/funds/meta');
    return response.data;
  },

  getSummary: async (params = {}) => {
    const response = await api.get('/funds/summary', { params });
    return response.data;
  },

  getTransactions: async (params = {}) => {
    const response = await api.get('/funds/transactions', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/funds/transactions/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/funds/transactions', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/funds/transactions/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/funds/transactions/${id}`);
    return response.data;
  },

  getRecurring: async () => {
    const response = await api.get('/funds/recurring');
    return response.data;
  },
};

export default fundService;
