import apiClient from './apiClient';
import type { System, SystemApiResponse, CreateSystemInput, UpdateSystemInput } from '../types/system';

export const systemService = {
  getSystems: async (params?: { search?: string; page?: number; limit?: number }): Promise<SystemApiResponse> => {
    const res = await apiClient.get('/systems', { params });
    return res.data;
  },

  getSystemById: async (id: number): Promise<System> => {
    const res = await apiClient.get(`/systems/${id}`);
    return res.data;
  },

  createSystem: async (data: CreateSystemInput): Promise<System> => {
    const res = await apiClient.post('/systems', data);
    return res.data;
  },

  updateSystem: async (id: number, data: UpdateSystemInput): Promise<System> => {
    const res = await apiClient.put(`/systems/${id}`, data);
    return res.data;
  },

  deleteSystem: async (id: number): Promise<void> => {
    await apiClient.delete(`/systems/${id}`);
  },
};
