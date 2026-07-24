import { useQuery } from '@tanstack/react-query'
import { useMutationAction } from './useMutationAction'
import {
  fetchTemplates, createTemplate, updateTemplate,
  deleteTemplate, executeTemplate, reorderTemplates, executeRecurring,
} from '../services/templatesApi'
import type { CreateTemplateInput, ExecuteTemplateInput, ReorderInput } from '@family-bookkeeping/shared-types'
import { useBook } from './useBook'
import { queryKeys, TRANSACTION_IMPACT_ROOT_KEYS } from '../utils/queryKeys'
import { STALE } from '../utils/cachePolicy'

export const useTemplates = () => {
  const { currentBook } = useBook()
  const bookId = currentBook?.id || ''

  return useQuery({
    queryKey: queryKeys.templates.list(bookId),
    queryFn: fetchTemplates,
    enabled: !!bookId,
    staleTime: STALE.templates,
  })
}

export const useCreateTemplate = () => {
  return useMutationAction(
    (data: CreateTemplateInput) => createTemplate(data),
    { invalidateKeys: [queryKeys.templates.all], successMessage: '模板已创建' },
  )
}

export const useUpdateTemplate = () => {
  return useMutationAction(
    ({ id, data }: { id: string; data: Partial<CreateTemplateInput> }) => updateTemplate(id, data),
    { invalidateKeys: [queryKeys.templates.all], successMessage: '模板已更新' },
  )
}

export const useDeleteTemplate = () => {
  return useMutationAction(
    (id: string) => deleteTemplate(id),
    { invalidateKeys: [queryKeys.templates.all], successMessage: '模板已删除' },
  )
}

export const useExecuteTemplate = () => {
  return useMutationAction(
    ({ id, data }: { id: string; data?: ExecuteTemplateInput }) => executeTemplate(id, data),
    { invalidateKeys: [...TRANSACTION_IMPACT_ROOT_KEYS, queryKeys.templates.all] },
  )
}

export const useReorderTemplates = () => {
  return useMutationAction(
    (data: ReorderInput) => reorderTemplates(data),
    { invalidateKeys: [queryKeys.templates.all] },
  )
}

export const useExecuteRecurring = () => {
  return useMutationAction(
    () => executeRecurring(),
    { invalidateKeys: [...TRANSACTION_IMPACT_ROOT_KEYS, queryKeys.templates.all] },
  )
}
