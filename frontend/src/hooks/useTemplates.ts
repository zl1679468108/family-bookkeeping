import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTemplates, createTemplate, updateTemplate,
  deleteTemplate, executeTemplate, reorderTemplates,
} from '../services/templatesApi';
import type { CreateTemplateInput, ExecuteTemplateInput, ReorderInput } from '../types/template';

export const useTemplates = () => {
  return useQuery({ queryKey: ['templates'], queryFn: fetchTemplates });
};

export const useCreateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTemplateInput) => createTemplate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
};

export const useUpdateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTemplateInput> }) =>
      updateTemplate(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
};

export const useDeleteTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
};

export const useExecuteTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ExecuteTemplateInput }) =>
      executeTemplate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

export const useReorderTemplates = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReorderInput) => reorderTemplates(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
};
