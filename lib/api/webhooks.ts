// Webhook and IPN API Service

import { apiClient } from './client';
import { MtnCallbackDto } from './types';

export const webhookApi = {
  /**
   * Handle MTN MoMo callback events
   * PUT /api/paiments/webhooks/mtn-callback
   */
  handleMtnCallback: async (callbackData: MtnCallbackDto): Promise<{ message: string; success: boolean }> => {
    return apiClient.put<{ message: string; success: boolean }>('/api/paiments/webhooks/mtn-callback', callbackData);
  },

  // IPN Endpoints for MoMo
  // These are typically called by the payment provider, not by the frontend
  // But we include them for completeness

  /**
   * IPN MoMo - GET
   * GET /api/paiments/ipn/momo
   */
  ipnMomoGet: async (params?: Record<string, string>): Promise<any> => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const endpoint = queryString ? `/api/paiments/ipn/momo?${queryString}` : '/api/paiments/ipn/momo';
    return apiClient.get<any>(endpoint);
  },

  /**
   * IPN MoMo - POST
   * POST /api/paiments/ipn/momo
   */
  ipnMomoPost: async (data: any): Promise<any> => {
    return apiClient.post<any>('/api/paiments/ipn/momo', data);
  },

  /**
   * IPN MoMo - PUT
   * PUT /api/paiments/ipn/momo
   */
  ipnMomoPut: async (data: any): Promise<any> => {
    return apiClient.put<any>('/api/paiments/ipn/momo', data);
  },

  /**
   * IPN MoMo - DELETE
   * DELETE /api/paiments/ipn/momo
   */
  ipnMomoDelete: async (): Promise<any> => {
    return apiClient.delete<any>('/api/paiments/ipn/momo');
  },

  /**
   * IPN MoMo - PATCH
   * PATCH /api/paiments/ipn/momo
   */
  ipnMomoPatch: async (data: any): Promise<any> => {
    return apiClient.patch<any>('/api/paiments/ipn/momo', data);
  },

  /**
   * IPN MoMo - OPTIONS
   * OPTIONS /api/paiments/ipn/momo
   */
  ipnMomoOptions: async (): Promise<any> => {
    return apiClient.options<any>('/api/paiments/ipn/momo');
  },

  /**
   * IPN MoMo - HEAD
   * HEAD /api/paiments/ipn/momo
   */
  ipnMomoHead: async (): Promise<any> => {
    return apiClient.head<any>('/api/paiments/ipn/momo');
  },
};


