import apiClient from './apiClient';
import type {
  GenerateInvoiceResponse,
  InvoiceCompany,
  InvoiceRecord,
  InvoiceStatus,
  ListInvoicesResponse,
  PublicInvoiceResponse,
} from '../types/invoice';

export const invoiceService = {
  generate: async (body: {
    clientId: number;
    day: number;
    month: number;
    year: number;
  }): Promise<GenerateInvoiceResponse> => {
    const res = await apiClient.post<GenerateInvoiceResponse>(
      '/invoices/generate',
      body
    );
    return res.data;
  },

  /** Returns list + company config for PDF re-download */
  listByClient: async (clientId: number): Promise<ListInvoicesResponse> => {
    const res = await apiClient.get<ListInvoicesResponse>('/invoices', {
      params: { clientId },
    });
    return res.data;
  },

  getPublic: async (token: string): Promise<PublicInvoiceResponse> => {
    const res = await apiClient.get<PublicInvoiceResponse>(
      `/invoices/public/${token}`
    );
    return res.data;
  },

  patch: async (
    id: number,
    body: Partial<{
      status: InvoiceStatus;
      description: string | null;
      amount: number;
      dueDate: string;
    }>
  ): Promise<InvoiceRecord> => {
    const res = await apiClient.patch<InvoiceRecord>(`/invoices/${id}`, body);
    return res.data;
  },
};

export type { InvoiceCompany, InvoiceRecord, InvoiceStatus };
