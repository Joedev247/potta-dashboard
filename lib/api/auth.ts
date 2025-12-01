// Auth API Service

import { apiClient } from './client';
import { LoginDto, LoginResponse } from './types';

export const authApi = {
  /**
   * Login for internal users
   * POST /api/auth/login
   */
  login: async (credentials: LoginDto): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
    
    // Store token in API client
    if (response.token) {
      apiClient.setToken(response.token);
    }
    
    return response;
  },

  /**
   * Logout - clears token
   */
  logout: (): void => {
    apiClient.setToken(null);
  },
};


