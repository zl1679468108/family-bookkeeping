/**
 * Templates API service.
 * 对齐 PC 端 frontend/src/services/templatesApi.ts
 */
import { apiGet, apiPost, apiPut, apiDelete } from "./api";
import type {
  Template,
  CreateTemplateInput,
  ExecuteTemplateInput,
  ReorderInput,
} from "../types";

const TEMPLATES_PATH = "/templates";

/** Get template list */
export const getTemplates = async (): Promise<Template[]> => {
  return apiGet<Template[]>(TEMPLATES_PATH, { requiresAuth: true });
};

/** Get a single template */
export const getTemplate = async (id: string): Promise<Template> => {
  return apiGet<Template>(`${TEMPLATES_PATH}/${encodeURIComponent(id)}`, { requiresAuth: true });
};

/** Create a new template */
export const createTemplate = async (
  data: CreateTemplateInput,
): Promise<Template> => {
  return apiPost<Template>(TEMPLATES_PATH, { data, requiresAuth: true });
};

/** Update a template */
export const updateTemplate = async (
  id: string,
  data: Partial<CreateTemplateInput>,
): Promise<Template> => {
  return apiPut<Template>(`${TEMPLATES_PATH}/${encodeURIComponent(id)}`, { data, requiresAuth: true });
};

/** Delete a template */
export const deleteTemplate = async (id: string): Promise<void> => {
  return apiDelete<void>(`${TEMPLATES_PATH}/${encodeURIComponent(id)}`, { requiresAuth: true });
};

/** Execute a template (creates a transaction from template) */
export const executeTemplate = async (
  id: string,
  data?: ExecuteTemplateInput,
): Promise<{
  id: number;
  amount: number;
  category_id: string;
  description?: string;
  note?: string;
  brand?: string;
  merchant_name?: string;
  type: "expense" | "income";
}> => {
  return apiPost(`${TEMPLATES_PATH}/${encodeURIComponent(id)}/execute`, { data: data || {}, requiresAuth: true });
};

/** Reorder templates (PUT /templates/reorder with { ids: string[] }) */
export const reorderTemplates = async (
  data: ReorderInput,
): Promise<void> => {
  return apiPut<void>(`${TEMPLATES_PATH}/reorder`, { data, requiresAuth: true });
};
