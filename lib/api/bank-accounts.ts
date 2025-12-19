/**
 * Bank Accounts API Service
 * Base Path: /api/bank-accounts
 * Authentication: Bearer Token + x-api-key
 */

import { ApiResponse, apiClient } from './client';

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  swiftCode?: string;
  iban?: string;
  currency: string;
  isVerified?: boolean;
  createdAt?: string;
}

export interface CreateBankAccountData {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  swiftCode?: string;
  iban?: string;
  currency: string;
}

export interface UpdateBankAccountData {
  bankName?: string;
  accountHolderName?: string;
  swiftCode?: string;
  iban?: string;
}

class BankAccountsService {
  /**
   * Create a new bank account
   */
  async createBankAccount(data: CreateBankAccountData): Promise<ApiResponse<BankAccount>> {
    return apiClient.post<BankAccount>('/bank-accounts', data);
  }

  /**
   * List all bank accounts
   */
  async listBankAccounts(): Promise<ApiResponse<BankAccount[]>> {
    const response = await apiClient.get<any>('/bank-accounts');
    if (!response.success || !response.data) return response as ApiResponse<BankAccount[]>;
    
    const accounts = Array.isArray(response.data) ? response.data : (response.data as any).accounts || [];
    return { ...response, data: accounts };
  }

  /**
   * Get bank account by ID
   */
  async getBankAccount(accountId: string): Promise<ApiResponse<BankAccount>> {
    return apiClient.get<BankAccount>(`/bank-accounts/${accountId}`);
  }

  /**
   * Update bank account
   */
  async updateBankAccount(accountId: string, data: UpdateBankAccountData): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/bank-accounts/${accountId}`, data);
  }

  /**
   * Verify bank account
   */
  async verifyBankAccount(accountId: string): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/bank-accounts/${accountId}/verify`);
  }
}

export const bankAccountsService = new BankAccountsService();
