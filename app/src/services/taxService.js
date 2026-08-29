/**
 * Tax Service (Thuế Hộ Chủ Nhà)
 * Path: src/services/taxService.js
 */

import api from './api';

const taxService = {
  getAll: async () => {
    const response = await api.get('/taxes');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/taxes/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/taxes', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/taxes/${id}`, data);
    return response.data;
  },

  generate: async (id) => {
    const response = await api.post(`/taxes/${id}/generate`);
    return response.data;
  },

  pay: async (paymentId, data = {}) => {
    const response = await api.post(`/taxes/payments/${paymentId}/pay`, data);
    return response.data;
  },

  unpay: async (paymentId) => {
    const response = await api.post(`/taxes/payments/${paymentId}/unpay`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/taxes/${id}`);
    return response.data;
  },
};

export default taxService;
