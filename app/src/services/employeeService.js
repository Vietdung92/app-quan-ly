/**
 * Employee Service
 * Path: src/services/employeeService.js
 */

import api from './api';

const employeeService = {
  getAll: async (params = {}) => {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/employees', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  getByRole: async (role) => {
    const response = await api.get('/employees', { params: { role } });
    return response.data;
  },

  getByDepartment: async (department) => {
    const response = await api.get('/employees', { params: { department } });
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/employees/${id}/status`, { status });
    return response.data;
  },

  changeSalary: async (id, salary) => {
    const response = await api.patch(`/employees/${id}/salary`, { salary });
    return response.data;
  },
};

export default employeeService;
