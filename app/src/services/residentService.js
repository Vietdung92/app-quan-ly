/**
 * Resident Service (Tạm Trú Khách Nước Ngoài)
 * Path: src/services/residentService.js
 */

import api from './api';

const residentService = {
  getAll: async (params = {}) => {
    const response = await api.get('/residents', { params });
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/residents/summary');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/residents/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/residents', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/residents/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/residents/${id}`);
    return response.data;
  },
};

export default residentService;
