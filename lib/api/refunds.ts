/**
 * Refunds API Service
 * Base Path: /api/refunds
 * Authentication: Bearer Token + x-api-key
 * 
 * Endpoints:
 * - POST /api/refunds - Create refund
 * - GET /api/refunds - List refunds
 * - GET /api/refunds/{id} - Get refund by ID
 */

import { ApiResponse, PaginationResponse, apiClient } from './client';

export interface Refund {
  id: string;
  payment_id?: string;
  // camelCase alias
  paymentId?: string;
  amount: number;
  currency?: string;
  reason: string;
  description?: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | string;
  payment?: Record<string, any>;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface CreateRefundData {
  payment_id: string;
  amount: number;
  reason: string;
  description?: string;
}

export interface RefundsListResponse {
  refunds: Refund[];
  pagination: PaginationResponse;
}

class RefundsService {
  /**
   * Create a refund for a payment
   * POST /api/refunds
   */
  async createRefund(data: CreateRefundData): Promise<ApiResponse<Refund>> {
    try {
      const response = await apiClient.post<any>('/refunds', data);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<Refund>;
      }

      // Handle different response structures
      const raw = response.data.data || response.data;
      
      const refund: Refund = {
        id: raw.id || '',
        payment_id: raw.payment_id || raw.paymentId || '',
        amount: raw.amount ?? 0,
        currency: raw.currency || 'XAF',
        reason: raw.reason || '',
        description: raw.description || undefined,
        status: raw.status || 'PENDING',
        payment: raw.payment || undefined,
        createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
        updatedAt: raw.updatedAt || raw.updated_at,
      };

      return {
        success: true,
        data: refund,
      };
    } catch (error: any) {
      console.error('Error creating refund:', error);
      return {
        success: false,
        error: {
          code: 'REFUND_CREATE_ERROR',
          message: error?.message || 'Failed to create refund',
        },
      };
    }
  }

  /**
   * List all refunds
   * GET /api/refunds
   */
  async listRefunds(params?: { 
    page?: number; 
    limit?: number;
    status?: string;
    payment_id?: string;
  }): Promise<ApiResponse<RefundsListResponse>> {
    try {
      const response = await apiClient.get<any>('/refunds', params);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<RefundsListResponse>;
      }

      // Handle different response structures
      const data = response.data.data || response.data;
      const refunds = Array.isArray(data.refunds) 
        ? data.refunds 
        : (Array.isArray(data) ? data : []);

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const total = data.total || data.pagination?.total || refunds.length;
      const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

      // Normalize refund data
      const normalizedRefunds: Refund[] = refunds.map((refund: any) => ({
        id: refund.id || '',
        payment_id: refund.payment_id || refund.paymentId || '',
        amount: refund.amount ?? 0,
        currency: refund.currency || 'XAF',
        reason: refund.reason || '',
        description: refund.description || undefined,
        status: refund.status || 'PENDING',
        payment: refund.payment || undefined,
        createdAt: refund.createdAt || refund.created_at,
        updatedAt: refund.updatedAt || refund.updated_at,
      }));

      return {
        success: true,
        data: {
          refunds: normalizedRefunds,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      };
    } catch (error: any) {
      console.error('Error listing refunds:', error);
      return {
        success: false,
        error: {
          code: 'REFUNDS_LIST_ERROR',
          message: error?.message || 'Failed to load refunds',
        },
      };
    }
  }

  /**
   * Get refund by ID
   * GET /api/refunds/{id}
   */
  async getRefund(refundId: string): Promise<ApiResponse<Refund>> {
    try {
      const response = await apiClient.get<any>(`/refunds/${refundId}`);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<Refund>;
      }

      // Handle different response structures
      const raw = response.data.data || response.data;
      
      const refund: Refund = {
        id: raw.id || refundId,
        payment_id: raw.payment_id || raw.paymentId || '',
        amount: raw.amount ?? 0,
        currency: raw.currency || 'XAF',
        reason: raw.reason || '',
        description: raw.description || undefined,
        status: raw.status || 'PENDING',
        payment: raw.payment || undefined,
        createdAt: raw.createdAt || raw.created_at,
        updatedAt: raw.updatedAt || raw.updated_at,
      };

      return {
        success: true,
        data: refund,
      };
    } catch (error: any) {
      console.error('Error fetching refund:', error);
      return {
        success: false,
        error: {
          code: 'REFUND_FETCH_ERROR',
          message: error?.message || 'Failed to fetch refund',
        },
      };
    }
  }
}

export const refundsService = new RefundsService();
