import { request } from './api';
import type { Template, CreateTemplateInput, ExecuteTemplateInput, ReorderInput } from '@family-bookkeeping/shared-types';
import { API_PATHS } from '../utils/apiPaths';

export const fetchTemplates = (): Promise<Template[]> =>
  request<Template[]>(API_PATHS.templates.root, { requiresAuth: true });

export const createTemplate = (data: CreateTemplateInput): Promise<Template> =>
  request<Template>(API_PATHS.templates.root, { method: 'POST', requiresAuth: true, body: data });

export const updateTemplate = (id: string, data: Partial<CreateTemplateInput>): Promise<Template> =>
  request<Template>(API_PATHS.templates.byId(id), { method: 'PUT', requiresAuth: true, body: data });

export const deleteTemplate = (id: string): Promise<void> =>
  request<void>(API_PATHS.templates.byId(id), { method: 'DELETE', requiresAuth: true });

export const executeTemplate = (id: string, data?: ExecuteTemplateInput): Promise<any> =>
  request<any>(API_PATHS.templates.execute(id), { method: 'POST', requiresAuth: true, body: data || {} });

export const reorderTemplates = (data: ReorderInput): Promise<void> =>
  request<void>(API_PATHS.templates.reorder, { method: 'PUT', requiresAuth: true, body: data });

export const executeRecurring = (): Promise<{ executed: number; skipped: number }> =>
  request<{ executed: number; skipped: number }>(API_PATHS.templates.executeRecurring, { method: 'POST', requiresAuth: true });
