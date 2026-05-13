import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '../api/invoiceService';
import type { InvoiceStatus } from '../types/invoice';

export function useClientInvoices(clientId: string | undefined) {
  const idNum = clientId ? parseInt(clientId, 10) : NaN;
  return useQuery({
    queryKey: ['invoices', 'client', clientId],
    queryFn: () => invoiceService.listByClient(idNum),
    enabled: !!clientId && !Number.isNaN(idNum),
  });
}

export function useGenerateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: invoiceService.generate,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['invoices', 'client', String(vars.clientId)],
      });
    },
  });
}

export function usePublicInvoice(token: string | undefined) {
  return useQuery({
    queryKey: ['invoices', 'public', token],
    queryFn: () => invoiceService.getPublic(token!),
    enabled: !!token,
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      clientId,
      ...patch
    }: {
      id: number;
      clientId: string;
    } & Partial<{
      status: InvoiceStatus;
      description: string | null;
      amount: number;
      dueDate: string;
    }>) => invoiceService.patch(id, patch),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['invoices', 'client', vars.clientId],
      });
    },
  });
}
