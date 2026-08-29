/**
 * Dashboard Service
 * Path: src/services/dashboardService.js
 */

import api from './api';

const dashboardService = {
  getOverview: async () => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },

  getStats: async (period = 'month') => {
    const response = await api.get('/dashboard/stats', { params: { period } });
    return response.data;
  },

  getChartData: async (type, period = 'month') => {
    const response = await api.get(`/dashboard/chart/${type}`, {
      params: { period },
    });
    return response.data;
  },

  getActivities: async (limit = 10) => {
    const response = await api.get('/dashboard/activities', {
      params: { limit },
    });
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  getProjectStats: async () => {
    const response = await api.get('/dashboard/projects');
    return response.data;
  },

  getExpenseStats: async () => {
    const response = await api.get('/dashboard/expenses');
    return response.data;
  },

  getEmployeeStats: async () => {
    const response = await api.get('/dashboard/employees');
    return response.data;
  },
};

export default dashboardService;
