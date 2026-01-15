/**
 * Users & Profile API Service (real backend)
 * Customer Self-Service API Endpoints
 */

import { ApiResponse, PaginationResponse, apiClient } from './client';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  image?: string;
  isVerified: boolean;
  role: string;
  bio?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

export interface AccountSettings {
  twoFactorEnabled?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  username?: string;
  bio?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CustomerTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

export interface TransactionsListResponse {
  transactions: CustomerTransaction[];
  pagination: PaginationResponse;
}

class UsersService {
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    // Try both Swagger path and legacy path
    try {
      const primary = await apiClient.get<UserProfile>('/users/customer/profile');
      if (primary.success) return primary;
    } catch (e) {
      // ignore
    }
    return apiClient.get<UserProfile>('/customer/profile');
  }

  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<UserProfile>> {
    try {
      const primary = await apiClient.put<UserProfile>('/users/customer/profile', data);
      if (primary.success) return primary;
    } catch (e) {
      // ignore
    }
    return apiClient.put<UserProfile>('/customer/profile', data);
  }

  async changePassword(_data: ChangePasswordData): Promise<ApiResponse<void>> {
    return {
      success: false,
      error: { code: 'NOT_IMPLEMENTED', message: 'Change password is not available in this client' },
    };
  }

  async toggle2FA(enabled: boolean): Promise<ApiResponse<void>> {
    try {
      const primary = await apiClient.put<void>('/users/customer/settings', { twoFactorEnabled: enabled });
      if (primary.success) return primary;
    } catch (e) {
      // ignore
    }
    return apiClient.put<void>('/customer/settings', { twoFactorEnabled: enabled });
  }

  async getSettings(): Promise<ApiResponse<AccountSettings>> {
    try {
      const primary = await apiClient.get<AccountSettings>('/users/customer/settings');
      if (primary.success) return primary;
    } catch (e) {
      // ignore
    }
    return apiClient.get<AccountSettings>('/customer/settings');
  }

  async updateSettings(data: AccountSettings): Promise<ApiResponse<AccountSettings>> {
    try {
      const primary = await apiClient.put<AccountSettings>('/users/customer/settings', data);
      if (primary.success) return primary;
    } catch (e) {
      // ignore
    }
    return apiClient.put<AccountSettings>('/customer/settings', data);
  }

  /**
   * Get customer transaction history
   * GET /api/users/customer/transactions
   */
  async getTransactions(params?: { 
    page?: number; 
    limit?: number; 
    type?: string; 
    startDate?: string; 
    endDate?: string;
  }): Promise<ApiResponse<TransactionsListResponse>> {
    try {
      const primary = await apiClient.get<any>('/users/customer/transactions', params);
      if (primary.success && primary.data) {
        // Handle response structure
        const data = primary.data.data || primary.data;
        const transactions = Array.isArray(data.transactions) ? data.transactions : (Array.isArray(data) ? data : []);
        const pagination = data.pagination || {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: transactions.length,
          totalPages: Math.ceil(transactions.length / (params?.limit || 10)),
        };

        return {
          success: true,
          data: {
            transactions: transactions.map((txn: any) => ({
              id: txn.id || '',
              amount: txn.amount ?? 0,
              currency: txn.currency || 'XAF',
              status: txn.status || 'PENDING',
              type: txn.type || 'payment',
              description: txn.description,
              createdAt: txn.createdAt || txn.created_at || new Date().toISOString(),
              updatedAt: txn.updatedAt || txn.updated_at,
              metadata: txn.metadata,
            })),
            pagination: {
              page: pagination.page || params?.page || 1,
              limit: pagination.limit || params?.limit || 10,
              total: pagination.total || transactions.length,
              totalPages: pagination.totalPages || Math.ceil((pagination.total || transactions.length) / (pagination.limit || params?.limit || 10)),
              hasNext: pagination.hasNext ?? (pagination.page || params?.page || 1) < (pagination.totalPages || Math.ceil((pagination.total || transactions.length) / (pagination.limit || params?.limit || 10))),
              hasPrev: pagination.hasPrev ?? (pagination.page || params?.page || 1) > 1,
            },
          },
        };
      }
    } catch (e) {
      // Fallback to legacy path
    }
    
    // Fallback to legacy endpoint
    const fallback = await apiClient.get<any>('/customer/transactions', params);
    if (fallback.success && fallback.data) {
      const data = fallback.data.data || fallback.data;
      const transactions = Array.isArray(data.transactions) ? data.transactions : (Array.isArray(data) ? data : []);
      const pagination = data.pagination || {
        page: params?.page || 1,
        limit: params?.limit || 10,
        total: transactions.length,
        totalPages: Math.ceil(transactions.length / (params?.limit || 10)),
      };

      return {
        success: true,
        data: {
          transactions: transactions.map((txn: any) => ({
            id: txn.id || '',
            amount: txn.amount ?? 0,
            currency: txn.currency || 'XAF',
            status: txn.status || 'PENDING',
            type: txn.type || 'payment',
            description: txn.description,
            createdAt: txn.createdAt || txn.created_at || new Date().toISOString(),
            updatedAt: txn.updatedAt || txn.updated_at,
            metadata: txn.metadata,
          })),
          pagination: {
            page: pagination.page || params?.page || 1,
            limit: pagination.limit || params?.limit || 10,
            total: pagination.total || transactions.length,
            totalPages: pagination.totalPages || Math.ceil((pagination.total || transactions.length) / (pagination.limit || params?.limit || 10)),
            hasNext: pagination.hasNext ?? (pagination.page || params?.page || 1) < (pagination.totalPages || Math.ceil((pagination.total || transactions.length) / (pagination.limit || params?.limit || 10))),
            hasPrev: pagination.hasPrev ?? (pagination.page || params?.page || 1) > 1,
          },
        },
      };
    }
    
    return fallback as ApiResponse<TransactionsListResponse>;
  }

  /**
   * Get a specific transaction by ID
   * GET /api/users/customer/transactions/{id}
   */
  async getTransaction(transactionId: string): Promise<ApiResponse<CustomerTransaction>> {
    try {
      const primary = await apiClient.get<any>(`/users/customer/transactions/${transactionId}`);
      if (primary.success && primary.data) {
        const data = primary.data.data || primary.data;
        return {
          success: true,
          data: {
            id: data.id || transactionId,
            amount: data.amount ?? 0,
            currency: data.currency || 'XAF',
            status: data.status || 'PENDING',
            type: data.type || 'payment',
            description: data.description,
            createdAt: data.createdAt || data.created_at || new Date().toISOString(),
            updatedAt: data.updatedAt || data.updated_at,
            metadata: data.metadata,
          },
        };
      }
    } catch (e) {
      // Fallback to legacy path
    }
    
    // Fallback to legacy endpoint
    const fallback = await apiClient.get<any>(`/customer/transactions/${transactionId}`);
    if (fallback.success && fallback.data) {
      const data = fallback.data.data || fallback.data;
      return {
        success: true,
        data: {
          id: data.id || transactionId,
          amount: data.amount ?? 0,
          currency: data.currency || 'XAF',
          status: data.status || 'PENDING',
          type: data.type || 'payment',
          description: data.description,
          createdAt: data.createdAt || data.created_at || new Date().toISOString(),
          updatedAt: data.updatedAt || data.updated_at,
          metadata: data.metadata,
        },
      };
    }
    
    return fallback as ApiResponse<CustomerTransaction>;
  }

  // Generate API credentials (Swagger path)
  async generateCredentials(): Promise<ApiResponse<any>> {
    try {
      const primary = await apiClient.put<any>('/users/customer/genarate-credentials', {});
      if (primary.success) return primary;
    } catch (e) {
      // ignore
    }
    return apiClient.put<any>('/customer/genarate-credentials', {});
  }
}

export const usersService = new UsersService();

