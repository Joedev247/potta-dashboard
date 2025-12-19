/**
 * Chargebacks API Service
 * Base Path: /api/chargebacks
 * Authentication: Bearer Token + x-api-key
 * 
 * Endpoints:
 * - POST /api/chargebacks - Create a chargeback
 * - GET /api/chargebacks - Get all chargebacks
 * - GET /api/chargebacks/{id} - Get a chargeback by ID
 * - PUT /api/chargebacks/{id}/status - Update chargeback status
 */

import { ApiResponse, PaginationResponse, apiClient } from './client';

export interface Chargeback {
  id: string;
  payment_id: string;
  amount?: number;
  currency?: string;
  reason: string;
  description?: string;
  evidence?: string | Record<string, any>;
  dispute_reason?: string;
  status: 'PENDING' | 'DISPUTED' | 'RESOLVED' | string;
  payment?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateChargebackData {
  payment_id: string;
  reason: string;
  description?: string;
  evidence?: string | Record<string, any>;
}

export interface UpdateChargebackStatusData {
  status: 'PENDING' | 'DISPUTED' | 'RESOLVED';
  dispute_reason?: string;
  evidence?: Record<string, any>;
}

export interface ChargebacksListResponse {
  chargebacks: Chargeback[];
  pagination: PaginationResponse;
}

class ChargebacksService {
  /**
   * Create a chargeback for a payment
   * POST /api/chargebacks
   */
  async createChargeback(data: CreateChargebackData): Promise<ApiResponse<Chargeback>> {
    try {
      const response = await apiClient.post<any>('/chargebacks', data);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<Chargeback>;
      }

      // Handle different response structures
      const raw = response.data.data || response.data;
      
      const chargeback: Chargeback = {
        id: raw.id || '',
        payment_id: raw.payment_id || raw.paymentId || '',
        amount: raw.amount ?? undefined,
        currency: raw.currency || undefined,
        reason: raw.reason || '',
        description: raw.description || undefined,
        evidence: raw.evidence || undefined,
        dispute_reason: raw.dispute_reason || undefined,
        status: raw.status || 'PENDING',
        payment: raw.payment || undefined,
        createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
        updatedAt: raw.updatedAt || raw.updated_at,
      };

      return {
        success: true,
        data: chargeback,
      };
    } catch (error: any) {
      console.error('Error creating chargeback:', error);
      return {
        success: false,
        error: {
          code: 'CHARGEBACK_CREATE_ERROR',
          message: error?.message || 'Failed to create chargeback',
        },
      };
    }
  }

  /**
   * List all chargebacks
   * GET /api/chargebacks
   */
  async listChargebacks(params?: { 
    page?: number; 
    limit?: number;
    status?: string;
    payment_id?: string;
  }): Promise<ApiResponse<ChargebacksListResponse>> {
    try {
      const response = await apiClient.get<any>('/chargebacks', params);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<ChargebacksListResponse>;
      }

      // Handle different response structures
      const data = response.data.data || response.data;
      const chargebacks = Array.isArray(data.chargebacks) 
        ? data.chargebacks 
        : (Array.isArray(data) ? data : []);

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const total = data.total || data.pagination?.total || chargebacks.length;
      const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

      // Normalize chargeback data
      const normalizedChargebacks: Chargeback[] = chargebacks.map((chargeback: any) => ({
        id: chargeback.id || '',
        payment_id: chargeback.payment_id || chargeback.paymentId || '',
        amount: chargeback.amount ?? undefined,
        currency: chargeback.currency || undefined,
        reason: chargeback.reason || '',
        description: chargeback.description || undefined,
        evidence: chargeback.evidence || undefined,
        dispute_reason: chargeback.dispute_reason || undefined,
        status: chargeback.status || 'PENDING',
        payment: chargeback.payment || undefined,
        createdAt: chargeback.createdAt || chargeback.created_at,
        updatedAt: chargeback.updatedAt || chargeback.updated_at,
      }));

      return {
        success: true,
        data: {
          chargebacks: normalizedChargebacks,
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
      console.error('Error listing chargebacks:', error);
      return {
        success: false,
        error: {
          code: 'CHARGEBACKS_LIST_ERROR',
          message: error?.message || 'Failed to load chargebacks',
        },
      };
    }
  }

  /**
   * Get chargeback by ID
   * GET /api/chargebacks/{id}
   */
  async getChargeback(chargebackId: string): Promise<ApiResponse<Chargeback>> {
    try {
      const response = await apiClient.get<any>(`/chargebacks/${chargebackId}`);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<Chargeback>;
      }

      // Handle different response structures
      const raw = response.data.data || response.data;
      
      const chargeback: Chargeback = {
        id: raw.id || chargebackId,
        payment_id: raw.payment_id || raw.paymentId || '',
        amount: raw.amount ?? undefined,
        currency: raw.currency || undefined,
        reason: raw.reason || '',
        description: raw.description || undefined,
        evidence: raw.evidence || undefined,
        dispute_reason: raw.dispute_reason || undefined,
        status: raw.status || 'PENDING',
        payment: raw.payment || undefined,
        createdAt: raw.createdAt || raw.created_at,
        updatedAt: raw.updatedAt || raw.updated_at,
      };

      return {
        success: true,
        data: chargeback,
      };
    } catch (error: any) {
      console.error('Error fetching chargeback:', error);
      return {
        success: false,
        error: {
          code: 'CHARGEBACK_FETCH_ERROR',
          message: error?.message || 'Failed to fetch chargeback',
        },
      };
    }
  }

  /**
   * Update chargeback status
   * PUT /api/chargebacks/{id}/status
   */
  async updateChargebackStatus(chargebackId: string, data: UpdateChargebackStatusData): Promise<ApiResponse<Chargeback>> {
    try {
      const response = await apiClient.put<any>(`/chargebacks/${chargebackId}/status`, data);
      
      if (!response.success) {
        return response as ApiResponse<Chargeback>;
      }

      // If response includes updated chargeback data, normalize it
      if (response.data) {
        const raw = response.data.data || response.data;
        const chargeback: Chargeback = {
          id: raw.id || chargebackId,
          payment_id: raw.payment_id || raw.paymentId || '',
          amount: raw.amount ?? undefined,
          currency: raw.currency || undefined,
          reason: raw.reason || '',
          description: raw.description || undefined,
          evidence: raw.evidence || data.evidence || undefined,
          dispute_reason: raw.dispute_reason || data.dispute_reason || undefined,
          status: data.status,
          payment: raw.payment || undefined,
          createdAt: raw.createdAt || raw.created_at,
          updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
        };

        return {
          success: true,
          data: chargeback,
        };
      }

      // If no data returned, return success
      return {
        success: true,
        data: {} as Chargeback, // Will be handled by UI refreshing the list
      };
    } catch (error: any) {
      console.error('Error updating chargeback status:', error);
      return {
        success: false,
        error: {
          code: 'CHARGEBACK_STATUS_UPDATE_ERROR',
          message: error?.message || 'Failed to update chargeback status',
        },
      };
    }
  }
}

export const chargebacksService = new ChargebacksService();
