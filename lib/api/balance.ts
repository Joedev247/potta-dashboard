/**
 * Balance & Transactions API Service
 */

import { apiClient, ApiResponse, PaginationResponse } from './client';

export interface Balance {
  currency: string;
  available: number;
  pending: number;
  reserved: number;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'payout' | 'fee' | 'chargeback';
  amount: number;
  currency: string;
  description?: string;
  status: string;
  createdAt: string;
}

export interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description?: string;
  estimatedArrival?: string;
  createdAt: string;
}

export interface TransactionsListResponse {
  transactions: Transaction[];
  pagination: PaginationResponse;
}

export interface PayoutsListResponse {
  payouts: Payout[];
  pagination: PaginationResponse;
}

class BalanceService {
  async getBalance(currency?: string): Promise<ApiResponse<Balance>> {
    return apiClient.get<Balance>('/balance', currency ? { currency } : undefined);
  }

  async getTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<TransactionsListResponse>> {
    return apiClient.get<TransactionsListResponse>('/transactions', params);
  }

  async requestPayout(data: {
    amount: number;
    currency: string;
    description?: string;
  }): Promise<ApiResponse<Payout>> {
    return apiClient.post<Payout>('/payouts', data);
  }

  async getPayouts(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<PayoutsListResponse>> {
    return apiClient.get<PayoutsListResponse>('/payouts', params);
  }

  async getPayout(payoutId: string): Promise<ApiResponse<Payout>> {
    return apiClient.get<Payout>(`/payouts/${payoutId}`);
  }
}

export const balanceService = new BalanceService();

