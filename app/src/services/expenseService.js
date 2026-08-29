/**
 * Expense Service
 * Path: src/services/expenseService.js
 */

import api from './api';

const expenseService = {
  getAll: async (params = {}) => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/expenses', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  approve: async (id) => {
    const response = await api.post(`/expenses/${id}/approve`);
    return response.data;
  },

  reject: async (id, reason) => {
    const response = await api.post(`/expenses/${id}/reject`, { reason });
    return response.data;
  },

  getByStatus: async (status) => {
    const response = await api.get('/expenses', { params: { status } });
    return response.data;
  },

  getMonthlyTotal: async (month) => {
    const response = await api.get(`/expenses/monthly/${month}`);
    return response.data;
  },
};

export default expenseService;
