/**
 * Payroll Service
 * Path: src/services/payrollService.js
 */

import api from './api';

const payrollService = {
  getAll: async (params = {}) => {
    const response = await api.get('/payroll', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/payroll/${id}`);
    return response.data;
  },

  getByMonth: async (month) => {
    const response = await api.get('/payroll', { params: { month } });
    return response.data;
  },

  generate: async (month) => {
    const response = await api.post('/payroll/generate', { month });
    return response.data;
  },

  approve: async (id) => {
    const response = await api.post(`/payroll/${id}/approve`);
    return response.data;
  },

  process: async (id) => {
    const response = await api.post(`/payroll/${id}/process`);
    return response.data;
  },

  pay: async (id) => {
    const response = await api.post(`/payroll/${id}/pay`);
    return response.data;
  },

  export: async (month, format = 'excel') => {
    const response = await api.get('/payroll/export', {
      params: { month, format },
      responseType: format === 'excel' ? 'blob' : 'json',
    });
    return response.data;
  },

  getEmployeeHistory: async (employeeId) => {
    const response = await api.get(`/payroll/employee/${employeeId}`);
    return response.data;
  },
};

export default payrollService;
