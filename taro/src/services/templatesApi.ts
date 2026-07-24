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
import { API_PATHS } from "../utils/apiPaths";

/** Get template list */
export const getTemplates = async (): Promise<Template[]> => {
  return apiGet<Template[]>(API_PATHS.templates.root, { requiresAuth: true });
};

/** Get a single template */
export const getTemplate = async (id: string): Promise<Template> => {
  return apiGet<Template>(API_PATHS.templates.byId(id), { requiresAuth: true });
};

/** Create a new template */
export const createTemplate = async (
  data: CreateTemplateInput,
): Promise<Template> => {
  return apiPost<Template>(API_PATHS.templates.root, { data, requiresAuth: true });
};

/** Update a template */
export const updateTemplate = async (
  id: string,
  data: Partial<CreateTemplateInput>,
): Promise<Template> => {
  return apiPut<Template>(API_PATHS.templates.byId(id), { data, requiresAuth: true });
};

/** Delete a template */
export const deleteTemplate = async (id: string): Promise<void> => {
  return apiDelete<void>(API_PATHS.templates.byId(id), { requiresAuth: true });
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
  return apiPost(API_PATHS.templates.execute(id), { data: data || {}, requiresAuth: true });
};

/** Reorder templates (PUT /templates/reorder with { ids: string[] }) */
export const reorderTemplates = async (
  data: ReorderInput,
): Promise<void> => {
  return apiPut<void>(API_PATHS.templates.reorder, { data, requiresAuth: true });
};
