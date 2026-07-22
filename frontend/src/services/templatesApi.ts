import { request } from './api';
import type { Template, CreateTemplateInput, ExecuteTemplateInput, ReorderInput } from '../types/template';

export const fetchTemplates = (): Promise<Template[]> =>
  request<Template[]>('/templates', { requiresAuth: true });

export const createTemplate = (data: CreateTemplateInput): Promise<Template> =>
  request<Template>('/templates', { method: 'POST', requiresAuth: true, body: data });

export const updateTemplate = (id: string, data: Partial<CreateTemplateInput>): Promise<Template> =>
  request<Template>(`/templates/${id}`, { method: 'PUT', requiresAuth: true, body: data });

export const deleteTemplate = (id: string): Promise<void> =>
  request<void>(`/templates/${id}`, { method: 'DELETE', requiresAuth: true });

export const executeTemplate = (id: string, data?: ExecuteTemplateInput): Promise<any> =>
  request<any>(`/templates/${id}/execute`, { method: 'POST', requiresAuth: true, body: data || {} });

export const reorderTemplates = (data: ReorderInput): Promise<void> =>
  request<void>('/templates/reorder', { method: 'PUT', requiresAuth: true, body: data });

export const executeRecurring = (): Promise<{ executed: number; skipped: number }> =>
  request<{ executed: number; skipped: number }>('/templates/execute-recurring', { method: 'POST', requiresAuth: true });
