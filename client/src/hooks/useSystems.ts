import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemService } from '../api/systemService';
import { useToast } from '../context/ToastContext';
import type { CreateSystemInput, UpdateSystemInput } from '../types/system';

export const useSystems = (params?: { search?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['systems', params],
    queryFn: () => systemService.getSystems(params),
  });
};

export const useSystem = (id: number) => {
  return useQuery({
    queryKey: ['systems', id],
    queryFn: () => systemService.getSystemById(id),
    enabled: !!id,
  });
};

export const useCreateSystem = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: CreateSystemInput) => systemService.createSystem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systems'] });
      toast.success('Систем амжилттай нэмэгдлээ');
    },
    onError: () => {
      toast.error('Систем нэмэхэд алдаа гарлаа');
    },
  });
};

export const useUpdateSystem = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSystemInput }) =>
      systemService.updateSystem(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['systems'] });
      queryClient.invalidateQueries({ queryKey: ['systems', variables.id] });
      toast.success('Өөрчлөлт амжилттай хадгалагдлаа');
    },
    onError: () => {
      toast.error('Өөрчлөлт хадгалахад алдаа гарлаа');
    },
  });
};

export const useDeleteSystem = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number) => systemService.deleteSystem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systems'] });
      toast.success('Систем амжилттай устгагдлаа');
    },
    onError: () => {
      toast.error('Устгахад алдаа гарлаа');
    },
  });
};
