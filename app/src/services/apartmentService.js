/**
 * Apartment Service (Quản Lý Căn Hộ)
 * Path: src/services/apartmentService.js
 */

import api from './api';

const apartmentService = {
  getAll: async (month) => {
    const response = await api.get('/apartments', { params: month ? { month } : {} });
    return response.data;
  },

  // Tất cả căn hộ (kể cả chưa có hồ sơ) — dùng cho dropdown chọn căn
  getAllRaw: async () => {
    const response = await api.get('/apartments', { params: { all: 1 } });
    return response.data;
  },

  getById: async (objectId) => {
    const response = await api.get(`/apartments/${objectId}`);
    return response.data;
  },

  update: async (objectId, data) => {
    const response = await api.put(`/apartments/${objectId}`, data);
    return response.data;
  },

  generateRents: async (month) => {
    const response = await api.post('/apartments/generate-rents', { month });
    return response.data;
  },

  payRent: async (rentId, data = {}) => {
    const response = await api.post(`/apartments/rents/${rentId}/pay`, data);
    return response.data;
  },

  generateOwnerDues: async (month) => {
    const response = await api.post('/apartments/generate-owner-dues', { month });
    return response.data;
  },

  payOwnerDue: async (dueId, data = {}) => {
    const response = await api.post(`/apartments/owner-dues/${dueId}/pay`, data);
    return response.data;
  },
};

export default apartmentService;
