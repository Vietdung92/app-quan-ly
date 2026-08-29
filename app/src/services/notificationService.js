/**
 * Notification Service
 * Path: src/services/notificationService.js
 */

import api from './api';

const notificationService = {
  getAll: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  getUnread: async () => {
    const response = await api.get('/notifications/unread');
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  deleteAll: async () => {
    const response = await api.delete('/notifications');
    return response.data;
  },

  getByType: async (type) => {
    const response = await api.get('/notifications', { params: { type } });
    return response.data;
  },

  subscribe: async (endpoint) => {
    const response = await api.post('/notifications/subscribe', { endpoint });
    return response.data;
  },
};

export default notificationService;
