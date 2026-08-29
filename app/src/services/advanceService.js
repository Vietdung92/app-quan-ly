/**
 * Advance Service
 * Path: src/services/advanceService.js
 */

import api from './api';

const advanceService = {
  getAll: async (params = {}) => {
    const response = await api.get('/advances', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/advances/${id}`);
    return response.data;
  },

  request: async (data) => {
    const response = await api.post('/advances/request', data);
    return response.data;
  },

  approve: async (id) => {
    const response = await api.post(`/advances/${id}/approve`);
    return response.data;
  },

  reject: async (id, reason) => {
    const response = await api.post(`/advances/${id}/reject`, { reason });
    return response.data;
  },

  getByEmployee: async (employeeId) => {
    const response = await api.get('/advances', { params: { employeeId } });
    return response.data;
  },

  getBalance: async (employeeId) => {
    const response = await api.get(`/advances/balance/${employeeId}`);
    return response.data;
  },

  deductFromSalary: async (id, amount) => {
    const response = await api.post(`/advances/${id}/deduct`, { amount });
    return response.data;
  },
};

export default advanceService;
