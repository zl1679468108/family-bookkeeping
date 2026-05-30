/**
 * Auth API service — login, register, profile.
 */

import apiClient, { storeToken, clearStoredToken } from './api';
import type { AuthResponse, UserProfile } from '../types';

const AUTH_PATH = '/auth';

/** Login with email + password */
export const login = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>(
    `${AUTH_PATH}/login`,
    { email, password },
  );
  return data;
};

/** Register new user */
export const register = async (
  email: string,
  password: string,
  username: string,
): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>(
    `${AUTH_PATH}/register`,
    { email, password, username },
  );
  return data;
};

/** Get current user profile */
export const getProfile = async (): Promise<UserProfile> => {
  const { data } = await apiClient.get<UserProfile>(`${AUTH_PATH}/profile`);
  return data;
};

/** Logout */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post(`${AUTH_PATH}/logout`);
  } finally {
    clearStoredToken();
  }
};
