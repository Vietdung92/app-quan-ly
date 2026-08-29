/**
 * Leave Service
 * Path: src/services/leaveService.js
 */

import api from './api';

const leaveService = {
  getAll: async (params = {}) => {
    const response = await api.get('/leaves', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/leaves/${id}`);
    return response.data;
  },

  request: async (data) => {
    const response = await api.post('/leaves/request', data);
    return response.data;
  },

  approve: async (id) => {
    const response = await api.post(`/leaves/${id}/approve`);
    return response.data;
  },

  reject: async (id, reason) => {
    const response = await api.post(`/leaves/${id}/reject`, { reason });
    return response.data;
  },

  getBalance: async (employeeId) => {
    const response = await api.get(`/leaves/balance/${employeeId}`);
    return response.data;
  },

  getByEmployeeAndYear: async (employeeId, year) => {
    const response = await api.get('/leaves', {
      params: { employeeId, year },
    });
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.post(`/leaves/${id}/cancel`);
    return response.data;
  },
};

export default leaveService;
