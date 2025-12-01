// User API Service

import { apiClient } from './client';
import {
  RegisterDto,
  UserEnabledDto,
  CreatedProviderDto,
  ActivatedProviderDto,
  GenerateCredentialsResponse,
  Transaction,
  FindUserResponse,
  User,
} from './types';

export const userApi = {
  // Customer Endpoints

  /**
   * Generate new credentials for user
   * PUT /api/users/customer/genarate-credentials
   */
  generateCredentials: async (): Promise<GenerateCredentialsResponse> => {
    return apiClient.put<GenerateCredentialsResponse>('/api/users/customer/genarate-credentials');
  },

  /**
   * Get all user transactions
   * GET /api/users/customer/transactions
   */
  getCustomerTransactions: async (): Promise<Transaction[]> => {
    return apiClient.get<Transaction[]>('/api/users/customer/transactions');
  },

  /**
   * Get transaction by ID
   * GET /api/users/customer/transactions/{id}
   */
  getCustomerTransaction: async (id: string): Promise<Transaction> => {
    return apiClient.get<Transaction>(`/api/users/customer/transactions/${id}`);
  },

  // Admin Endpoints

  /**
   * Register user or service
   * POST /api/users/admin/register
   */
  registerUser: async (userData: RegisterDto): Promise<User> => {
    return apiClient.post<User>('/api/users/admin/register', userData);
  },

  /**
   * Change user status to Enabled or Disabled
   * PUT /api/users/admin/change-status
   */
  changeUserStatus: async (data: UserEnabledDto): Promise<User> => {
    return apiClient.put<User>('/api/users/admin/change-status', data);
  },

  /**
   * Create new provider
   * POST /api/users/admin/created-provider
   */
  createProvider: async (data: CreatedProviderDto): Promise<{ message: string; provider: string }> => {
    return apiClient.post<{ message: string; provider: string }>('/api/users/admin/created-provider', data);
  },

  /**
   * Enable or Disable one provider for user
   * PUT /api/users/admin/activated-provider
   */
  activateProvider: async (data: ActivatedProviderDto): Promise<{ message: string; provider: string; status: string }> => {
    return apiClient.put<{ message: string; provider: string; status: string }>('/api/users/admin/activated-provider', data);
  },

  /**
   * Find user
   * GET /api/users/admin/find
   */
  findUser: async (userId?: string, email?: string): Promise<FindUserResponse> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (email) params.append('email', email);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/api/users/admin/find?${queryString}` : '/api/users/admin/find';
    
    return apiClient.get<FindUserResponse>(endpoint);
  },

  /**
   * Get logs requests
   * GET /api/users/admin/logs
   */
  getLogs: async (): Promise<any[]> => {
    return apiClient.get<any[]>('/api/users/admin/logs');
  },

  /**
   * Get log by ID
   * GET /api/users/admin/logs/{id}
   */
  getLog: async (id: string): Promise<any> => {
    return apiClient.get<any>(`/api/users/admin/logs/${id}`);
  },
};


