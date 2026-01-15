/**
 * Balance & Transactions API Service (real backend)
 * Balances API Endpoints
 * 
 * GET /api/balances - Get balance
 * GET /api/balances/transactions - Get transaction history
 */

import { ApiResponse, PaginationResponse, apiClient } from './client';

export interface Balance {
  currency: string;
  available: number;
  pending: number;
  reserved: number;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'payout' | 'fee' | 'chargeback' | string;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

export interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | string;
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
  /**
   * Get balance
   * GET /api/balances
   * 
   * @param currency - Optional currency code (default: XAF)
   * @returns Balance information including available, pending, and reserved amounts
   */
  async getBalance(currency?: string): Promise<ApiResponse<Balance>> {
    try {
      const response = await apiClient.get<any>('/balances', currency ? { currency } : undefined);
      
      if (!response.success || !response.data) {
        console.warn('[BalanceService] API response not successful:', response);
        return response as ApiResponse<Balance>;
      }

      // Handle different response structures
      const raw = response.data.data || response.data;
      
      console.log('[BalanceService] Raw response data:', raw);
      
      // Helper function to safely convert to number
      const toNumber = (value: any, defaultValue: number = 0): number => {
        if (value === null || value === undefined || value === '') {
          return defaultValue;
        }
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(num) || !isFinite(num) ? defaultValue : num;
      };
      
      const balance: Balance = {
        currency: raw.currency || currency || 'XAF',
        available: toNumber(raw.available_balance ?? raw.balance ?? raw.available, 0),
        pending: toNumber(raw.pending_balance ?? raw.pending, 0),
        reserved: toNumber(raw.reserved_balance ?? raw.reserved, 0),
        lastUpdated: raw.lastUpdated || raw.last_updated || raw.updatedAt || raw.updated_at || new Date().toISOString(),
      };

      console.log('[BalanceService] Normalized balance object:', balance);

      return {
        success: true,
        data: balance,
      };
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      return {
        success: false,
        error: {
          code: 'BALANCE_FETCH_ERROR',
          message: error?.message || 'Failed to fetch balance',
        },
      };
    }
  }

  /**
   * Get transaction history
   * GET /api/balances/transactions
   * 
   * @param params - Query parameters for filtering and pagination
   * @returns List of transactions with pagination information
   */
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<ApiResponse<TransactionsListResponse>> {
    try {
      const response = await apiClient.get<any>('/balances/transactions', params);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<TransactionsListResponse>;
      }

      // Handle different response structures
      const data = response.data.data || response.data;
      const rawTxns = Array.isArray(data.transactions) 
        ? data.transactions 
        : (Array.isArray(data) ? data : []);
      
      // Extract pagination info
      const paginationData = data.pagination || {};
      const total = paginationData.total ?? data.total ?? rawTxns.length;
      const page = params?.page || paginationData.page || 1;
      const limit = params?.limit || paginationData.limit || 50;
      const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

      // Helper function to safely convert to number
      const toNumber = (value: any, defaultValue: number = 0): number => {
        if (value === null || value === undefined || value === '') {
          return defaultValue;
        }
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(num) || !isFinite(num) ? defaultValue : num;
      };
      
      // Normalize transactions
      const transactions: Transaction[] = rawTxns.map((txn: any) => ({
        id: txn.id || txn.transaction_id || txn.reference || txn._id || '',
        type: txn.type || 'payment',
        amount: toNumber(txn.amount, 0),
        currency: txn.currency || 'XAF',
        description: txn.description || txn.note || txn.memo,
        status: txn.status || 'PENDING',
        createdAt: txn.createdAt || txn.created_at || txn.date || new Date().toISOString(),
        updatedAt: txn.updatedAt || txn.updated_at,
        metadata: txn.metadata || txn.meta,
      }));

      return {
        success: true,
        data: {
          transactions,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: paginationData.hasNext ?? (page < totalPages),
            hasPrev: paginationData.hasPrev ?? (page > 1),
          },
        },
      };
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      return {
        success: false,
        error: {
          code: 'TRANSACTIONS_FETCH_ERROR',
          message: error?.message || 'Failed to fetch transactions',
        },
      };
    }
  }

  async getPayouts(): Promise<ApiResponse<PayoutsListResponse>> {
    // Backend payouts endpoints are not defined in the current documentation.
    return {
      success: true,
      data: {
        payouts: [],
        pagination: { page: 1, limit: 0, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      },
    };
  }
}

export const balanceService = new BalanceService();

