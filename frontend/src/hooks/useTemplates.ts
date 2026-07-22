import { useQuery } from '@tanstack/react-query'
import { useMutationAction } from './useMutationAction'
import {
  fetchTemplates, createTemplate, updateTemplate,
  deleteTemplate, executeTemplate, reorderTemplates, executeRecurring,
} from '../services/templatesApi'
import type { CreateTemplateInput, ExecuteTemplateInput, ReorderInput } from '../types/template'

export const useTemplates = () => {
  return useQuery({ queryKey: ['templates'], queryFn: fetchTemplates })
}

export const useCreateTemplate = () => {
  return useMutationAction(
    (data: CreateTemplateInput) => createTemplate(data),
    { invalidateKeys: [['templates']], successMessage: '模板已创建' },
  )
}

export const useUpdateTemplate = () => {
  return useMutationAction(
    ({ id, data }: { id: string; data: Partial<CreateTemplateInput> }) => updateTemplate(id, data),
    { invalidateKeys: [['templates']], successMessage: '模板已更新' },
  )
}

export const useDeleteTemplate = () => {
  return useMutationAction(
    (id: string) => deleteTemplate(id),
    { invalidateKeys: [['templates']], successMessage: '模板已删除' },
  )
}

export const useExecuteTemplate = () => {
  return useMutationAction(
    ({ id, data }: { id: string; data?: ExecuteTemplateInput }) => executeTemplate(id, data),
    { invalidateKeys: [['transactions'], ['templates']] },
  )
}

export const useReorderTemplates = () => {
  return useMutationAction(
    (data: ReorderInput) => reorderTemplates(data),
    { invalidateKeys: [['templates']] },
  )
}

export const useExecuteRecurring = () => {
  return useMutationAction(
    () => executeRecurring(),
    { invalidateKeys: [['transactions'], ['templates']] },
  )
}
