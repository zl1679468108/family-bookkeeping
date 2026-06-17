/**
 * Templates API service.
 */
import { apiGet } from "./api";

const TEMPLATES_PATH = "/templates";

export interface Template {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  amount: number;
  brand?: string;
  description?: string;
  type: "expense" | "income";
  icon?: string;
}

/** Get template list */
export const getTemplates = async (): Promise<{ data: Template[] }> => {
  return apiGet<{ data: Template[] }>(TEMPLATES_PATH, { requiresAuth: true });
};

/** Get a single template */
export const getTemplate = async (id: string): Promise<Template> => {
  return apiGet<Template>(`${TEMPLATES_PATH}/${encodeURIComponent(id)}`, { requiresAuth: true });
};
