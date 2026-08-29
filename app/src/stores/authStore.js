/**
 * Auth Store
 * Path: src/stores/authStore.js
 *
 * Global authentication state with Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { accessToken, refreshToken, user } = response.data.data;

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Set auth header
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Login failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      // Register
      register: async (fullName, email, password, confirmPassword) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/auth/register', {
            fullName,
            email,
            password,
            confirmPassword,
          });

          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Registration failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      // Refresh token
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const response = await api.post('/auth/refresh-token', {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          set({
            accessToken,
            refreshToken: newRefreshToken,
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          return true;
        } catch (error) {
          set({ isAuthenticated: false, user: null, accessToken: null });
          return false;
        }
      },

      // Logout
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });

          delete api.defaults.headers.common['Authorization'];
        }
      },

      // Change password
      changePassword: async (oldPassword, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/auth/change-password', {
            oldPassword,
            newPassword,
          });

          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Password change failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      // Update user profile
      updateProfile: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.put('/auth/profile', userData);
          const { user } = response.data.data;

          set({ user, isLoading: false });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Update failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Initialize auth from stored token
      initialize: async () => {
        const { accessToken, refreshToken } = get();

        if (accessToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          // Try to refresh token to verify it's still valid
          const isValid = await get().refreshAccessToken();
          if (!isValid) {
            set({ isAuthenticated: false, user: null });
          }
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
