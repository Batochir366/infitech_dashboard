import type { Client, CreateClientInput } from '../types/client';
import apiClient from './apiClient';

export const clientService = {
  getClients: async (): Promise<Client[]> => {
    const res = await apiClient.get('/clients');
    return res.data.data.map((c: Client & { id: number }) => ({
      ...c,
      id: String(c.id),
    }));
  },

  getClientById: async (id: string): Promise<Client> => {
    const res = await apiClient.get(`/clients/${id}`);
    return { ...res.data, id: String(res.data.id) };
  },

  createClient: async (data: CreateClientInput): Promise<Client> => {
    const res = await apiClient.post('/clients', data);
    return { ...res.data, id: String(res.data.id) };
  },

  updateClient: async (id: string, data: Partial<CreateClientInput>): Promise<Client> => {
    const res = await apiClient.put(`/clients/${id}`, data);
    return { ...res.data, id: String(res.data.id) };
  },

  deleteClient: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}`);
  },
};
