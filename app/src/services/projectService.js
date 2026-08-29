/**
 * Project Service
 * Path: src/services/projectService.js
 *
 * API calls for project management
 */

import api from './api';

const projectService = {
  // Get all projects
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/projects', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get single project
  getById: async (id) => {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create project
  create: async (data) => {
    try {
      const response = await api.post('/projects', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update project
  update: async (id, data) => {
    try {
      const response = await api.put(`/projects/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete project
  delete: async (id) => {
    try {
      const response = await api.delete(`/projects/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get project by status
  getByStatus: async (status) => {
    try {
      const response = await api.get('/projects', {
        params: { status },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get project budget info
  getBudgetInfo: async (id) => {
    try {
      const response = await api.get(`/projects/${id}/budget`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update project status
  updateStatus: async (id, status) => {
    try {
      const response = await api.patch(`/projects/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default projectService;
