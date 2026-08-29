/**
 * Task Service
 * Path: src/services/taskService.js
 */

import api from './api';

const taskService = {
  getAll: async (params = {}) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/tasks/${id}/status`, { status });
    return response.data;
  },

  assignTo: async (id, employeeId) => {
    const response = await api.patch(`/tasks/${id}/assign`, { employeeId });
    return response.data;
  },

  getByPriority: async (priority) => {
    const response = await api.get('/tasks', { params: { priority } });
    return response.data;
  },

  getByAssignee: async (employeeId) => {
    const response = await api.get('/tasks', { params: { assignedTo: employeeId } });
    return response.data;
  },
};

export default taskService;
