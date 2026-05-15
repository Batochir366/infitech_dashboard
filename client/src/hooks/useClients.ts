import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '../api/clientService';
import { useToast } from '../context/ToastContext';
import type { CreateClientInput } from '../types/client';

export const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getClients,
  });
};

export const useClient = (id: string) => {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientService.getClientById(id),
    enabled: !!id,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: clientService.createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Үйлчлүүлэгч амжилттай нэмэгдлээ');
    },
    onError: () => {
      toast.error('Үйлчлүүлэгч нэмэхэд алдаа гарлаа');
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id: clientId, data }: { id: string; data: Partial<CreateClientInput> }) =>
      clientService.updateClient(clientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] });
      toast.success('Өөрчлөлт амжилттай хадгалагдлаа');
    },
    onError: () => {
      toast.error('Өөрчлөлт хадгалахад алдаа гарлаа');
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: clientService.deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Үйлчлүүлэгч амжилттай устгагдлаа');
    },
    onError: () => {
      toast.error('Устгахад алдаа гарлаа');
    },
  });
};
