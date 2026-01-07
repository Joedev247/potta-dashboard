/**
 * Payment Links API Service
 * Base Path: /api/payment-links
 * Authentication: Bearer Token or x-api-key for most endpoints (public for slug-based endpoints)
 * Description: Create, manage, and process shareable payment links
 */

import { ApiResponse, PaginationResponse, apiClient } from './client';

export interface PaymentLink {
  id: string;
  slug: string;
  url?: string;
  amount: number;
  currency: string;
  description?: string;
  status: 'ACTIVE' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  expires_at?: string;
  metadata?: Record<string, any>;
  max_uses?: number;
  current_uses?: number;
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

export interface CreatePaymentLinkData {
  amount: number;
  currency?: string;
  description?: string;
  expires_at?: string;
  provider?: string;
  type?: 'DEPOSIT' | 'COLLECTION';
  max_uses?: number;
  metadata?: Record<string, any>;
}

export interface UpdatePaymentLinkData {
  description?: string;
  expires_at?: string;
  status?: 'ACTIVE' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  max_uses?: number;
  metadata?: Record<string, any>;
}

export interface PaymentLinksListResponse {
  items: PaymentLink[];
  pagination: PaginationResponse;
}

class PaymentLinksService {
  /**
   * Create a new payment link
   * POST /api/payment-links/create
   */
  async createPaymentLink(data: CreatePaymentLinkData, appApiKey?: string): Promise<ApiResponse<PaymentLink>> {
    try {
      if (appApiKey) {
        // Use custom API key from selected application
        const base = process.env.NEXT_PUBLIC_PAYMENTS_API_BASE_URL || 'https://payments.dev.instanvi.com/api';
        const url = `${base.replace(/\/$/, '')}/payment-links/create`;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-api-key': appApiKey,
        };

        // Include mode also as a header as a fallback in case the payments API
        // doesn't map the JSON `mode` field correctly into the database insert.
        if ((data as any).mode) {
          headers['x-mode'] = (data as any).mode;
        }

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        });

        const responseBody = (res.headers.get('content-type') || '').includes('application/json')
          ? await res.json()
          : await res.text();

        if (res.ok && responseBody) {
          // Some backends return a 2xx HTTP status but include an error payload
          // (e.g. { status_code: 400, message: 'Failed to create payment link', data: {...} }).
          // Treat those as errors.
          const isErrorPayload = typeof responseBody.status_code === 'number' && responseBody.status_code >= 400
            || responseBody.status === 'BAD REQUEST' || /failed to create/i.test(responseBody.message || '');

          if (isErrorPayload) {
            return {
              success: false,
              error: {
                code: `HTTP_${responseBody.status_code || res.status}`,
                message: responseBody.message || 'Failed to create payment link',
                details: responseBody,
              },
            };
          }

          const raw = responseBody.data || responseBody;
          return {
            success: true,
            data: {
              id: raw.id || '',
              slug: raw.slug || '',
              url: raw.url || '',
              amount: raw.amount ?? data.amount,
              currency: raw.currency || data.currency || 'XAF',
              description: raw.description || data.description,
              status: raw.status || 'ACTIVE',
              expires_at: raw.expires_at,
              metadata: raw.metadata || data.metadata,
              max_uses: raw.max_uses ?? data.max_uses,
              current_uses: raw.current_uses || 0,
              created_at: raw.created_at || new Date().toISOString(),
            },
          };
        }

        return {
          success: false,
          error: {
            code: `HTTP_${res.status}`,
            message: (responseBody && responseBody.message) || `Request failed with status ${res.status}`,
            details: responseBody,
          },
        };
      }

      // Use default apiClient
      return apiClient.post<PaymentLink>('/payment-links/create', data);
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      return {
        success: false,
        error: {
          code: 'PAYMENT_LINK_CREATE_ERROR',
          message: error?.message || 'Failed to create payment link',
        },
      };
    }
  }

  /**
   * Get payment link by slug (public)
   * GET /api/payment-links/:slug
   */
  async getPaymentLinkBySlug(slug: string): Promise<ApiResponse<PaymentLink>> {
    try {
      const base = process.env.NEXT_PUBLIC_PAYMENTS_API_BASE_URL || 'https://payments.dev.instanvi.com/api';
      const url = `${base.replace(/\/$/, '')}/payment-links/${encodeURIComponent(slug)}`;

      const res = await fetch(url, { method: 'GET' });
      const responseBody = (res.headers.get('content-type') || '').includes('application/json')
        ? await res.json()
        : await res.text();

      if (res.ok && responseBody) {
        const raw = responseBody.data || responseBody;
        return {
          success: true,
          data: {
            id: raw.id || '',
            slug: raw.slug || slug,
            amount: raw.amount,
            currency: raw.currency || 'XAF',
            description: raw.description,
            status: raw.status || 'ACTIVE',
            expires_at: raw.expires_at,
            metadata: raw.metadata,
            max_uses: raw.max_uses,
            current_uses: raw.current_uses || 0,
            created_at: raw.created_at || new Date().toISOString(),
          },
        };
      }

      // Handle 404 and 410 errors
      if (res.status === 404) {
        return {
          success: false,
          error: {
            code: 'HTTP_404',
            message: 'Payment link not found',
          },
        };
      }

      if (res.status === 410) {
        return {
          success: false,
          error: {
            code: 'HTTP_410',
            message: responseBody?.message || 'Payment link is no longer available',
          },
        };
      }

      return {
        success: false,
        error: {
          code: `HTTP_${res.status}`,
          message: (responseBody && responseBody.message) || `Request failed with status ${res.status}`,
        },
      };
    } catch (error: any) {
      console.error('Error fetching payment link:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error?.message || 'Failed to fetch payment link',
        },
      };
    }
  }

  /**
   * Redeem payment link (public)
   * POST /api/payment-links/:slug/redeem
   */
  async redeemPaymentLink(slug: string, data: { phone_number: string | number; provider: string }): Promise<ApiResponse<any>> {
    try {
      const base = process.env.NEXT_PUBLIC_PAYMENTS_API_BASE_URL || 'https://payments.dev.instanvi.com/api';
      const url = `${base.replace(/\/$/, '')}/payment-links/${encodeURIComponent(slug)}/redeem`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseBody = (res.headers.get('content-type') || '').includes('application/json')
        ? await res.json()
        : await res.text();

      if (res.ok && responseBody) {
        return {
          success: true,
          data: responseBody.data || responseBody,
        };
      }

      if (res.status === 404) {
        return {
          success: false,
          error: {
            code: 'HTTP_404',
            message: 'Payment link not found',
          },
        };
      }

      if (res.status === 410) {
        return {
          success: false,
          error: {
            code: 'HTTP_410',
            message: responseBody?.message || 'Payment link is no longer available',
          },
        };
      }

      return {
        success: false,
        error: {
          code: `HTTP_${res.status}`,
          message: (responseBody && responseBody.message) || `Payment initialization failed`,
        },
      };
    } catch (error: any) {
      console.error('Error redeeming payment link:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error?.message || 'Failed to redeem payment link',
        },
      };
    }
  }

  /**
   * List payment links (authenticated)
   * GET /api/payment-links
   */
  async listPaymentLinks(params?: { status?: string; page?: number; limit?: number; appApiKey?: string }): Promise<ApiResponse<PaymentLinksListResponse>> {
    try {
      if (params?.appApiKey) {
        // Use custom API key
        const base = process.env.NEXT_PUBLIC_PAYMENTS_API_BASE_URL || 'https://payments.dev.instanvi.com/api';
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append('status', params.status);
        if (params.page) queryParams.append('page', String(params.page));
        if (params.limit) queryParams.append('limit', String(params.limit));

        const url = `${base.replace(/\/$/, '')}/payment-links${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const headers: Record<string, string> = {
          'x-api-key': params.appApiKey,
        };

        const res = await fetch(url, { method: 'GET', headers });
        const responseBody = (res.headers.get('content-type') || '').includes('application/json')
          ? await res.json()
          : await res.text();

        if (res.ok && responseBody) {
          const data = responseBody.data || responseBody;
          return {
            success: true,
            data: {
              items: (data.items || data.payment_links || []).map((item: any) => ({
                id: item.id,
                slug: item.slug,
                url: item.url,
                amount: item.amount,
                currency: item.currency || 'XAF',
                description: item.description,
                status: item.status || 'ACTIVE',
                expires_at: item.expires_at,
                metadata: item.metadata,
                max_uses: item.max_uses,
                current_uses: item.current_uses || 0,
                created_at: item.created_at,
              })),
              pagination: data.pagination || { page: params.page || 1, limit: params.limit || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
            },
          };
        }

        return {
          success: false,
          error: {
            code: `HTTP_${res.status}`,
            message: (responseBody && responseBody.message) || 'Failed to list payment links',
          },
        };
      }

      const response = await apiClient.get<any>('/payment-links', params);

      if (response.success && response.data) {
        const data = response.data.data || response.data;
        return {
          success: true,
          data: {
            items: (data.items || data.payment_links || []).map((item: any) => ({
              id: item.id,
              slug: item.slug,
              amount: item.amount,
              currency: item.currency || 'XAF',
              description: item.description,
              status: item.status || 'ACTIVE',
              expires_at: item.expires_at,
              metadata: item.metadata,
              max_uses: item.max_uses,
              current_uses: item.current_uses || 0,
              created_at: item.created_at,
            })),
            pagination: data.pagination || { page: params?.page || 1, limit: params?.limit || 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
          },
        };
      }

      return response as ApiResponse<PaymentLinksListResponse>;
    } catch (error: any) {
      console.error('Error listing payment links:', error);
      return {
        success: false,
        error: {
          code: 'PAYMENT_LINKS_LIST_ERROR',
          message: error?.message || 'Failed to list payment links',
        },
      };
    }
  }

  /**
   * Get payment link by ID (authenticated)
   * GET /api/payment-links/id/:id
   */
  async getPaymentLinkById(id: string, appApiKey?: string): Promise<ApiResponse<PaymentLink>> {
    try {
      if (appApiKey) {
        const base = process.env.NEXT_PUBLIC_PAYMENTS_API_BASE_URL || 'https://payments.dev.instanvi.com/api';
        const url = `${base.replace(/\/$/, '')}/payment-links/id/${encodeURIComponent(id)}`;

        const headers: Record<string, string> = {
          'x-api-key': appApiKey,
        };

        const res = await fetch(url, { method: 'GET', headers });
        const responseBody = (res.headers.get('content-type') || '').includes('application/json')
          ? await res.json()
          : await res.text();

        if (res.ok && responseBody) {
          const raw = responseBody.data || responseBody;
          return {
            success: true,
            data: {
              id: raw.id,
              slug: raw.slug,
              url: raw.url,
              amount: raw.amount,
              currency: raw.currency || 'XAF',
              description: raw.description,
              status: raw.status || 'ACTIVE',
              expires_at: raw.expires_at,
              metadata: raw.metadata,
              max_uses: raw.max_uses,
              current_uses: raw.current_uses || 0,
              created_at: raw.created_at,
              updated_at: raw.updated_at,
            },
          };
        }

        return {
          success: false,
          error: {
            code: `HTTP_${res.status}`,
            message: (responseBody && responseBody.message) || 'Payment link not found',
          },
        };
      }

      return apiClient.get<PaymentLink>(`/payment-links/id/${id}`);
    } catch (error: any) {
      console.error('Error fetching payment link by ID:', error);
      return {
        success: false,
        error: {
          code: 'PAYMENT_LINK_GET_ERROR',
          message: error?.message || 'Failed to fetch payment link',
        },
      };
    }
  }

  /**
   * Update payment link (authenticated)
   * PATCH /api/payment-links/:id
   */
  async updatePaymentLink(id: string, data: UpdatePaymentLinkData, appApiKey?: string): Promise<ApiResponse<PaymentLink>> {
    try {
      if (appApiKey) {
        const base = process.env.NEXT_PUBLIC_PAYMENTS_API_BASE_URL || 'https://payments.dev.instanvi.com/api';
        const url = `${base.replace(/\/$/, '')}/payment-links/${encodeURIComponent(id)}`;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-api-key': appApiKey,
        };

        const res = await fetch(url, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(data),
        });

        const responseBody = (res.headers.get('content-type') || '').includes('application/json')
          ? await res.json()
          : await res.text();

        if (res.ok && responseBody) {
          const raw = responseBody.data || responseBody;
          return {
            success: true,
            data: {
              id: raw.id,
              slug: raw.slug,
              amount: raw.amount,
              currency: raw.currency || 'XAF',
              description: raw.description,
              status: raw.status || 'ACTIVE',
              expires_at: raw.expires_at,
              metadata: raw.metadata,
              max_uses: raw.max_uses,
              current_uses: raw.current_uses || 0,
              created_at: raw.created_at,
              updated_at: raw.updated_at,
            },
          };
        }

        return {
          success: false,
          error: {
            code: `HTTP_${res.status}`,
            message: (responseBody && responseBody.message) || 'Failed to update payment link',
          },
        };
      }

      return apiClient.put<PaymentLink>(`/payment-links/${id}`, data);
    } catch (error: any) {
      console.error('Error updating payment link:', error);
      return {
        success: false,
        error: {
          code: 'PAYMENT_LINK_UPDATE_ERROR',
          message: error?.message || 'Failed to update payment link',
        },
      };
    }
  }

  /**
   * Cancel payment link (authenticated)
   * POST /api/payment-links/:id/cancel
   */
  async cancelPaymentLink(id: string, appApiKey?: string): Promise<ApiResponse<PaymentLink>> {
    try {
      if (appApiKey) {
        const base = process.env.NEXT_PUBLIC_PAYMENTS_API_BASE_URL || 'https://payments.dev.instanvi.com/api';
        const url = `${base.replace(/\/$/, '')}/payment-links/${encodeURIComponent(id)}/cancel`;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-api-key': appApiKey,
        };

        const res = await fetch(url, {
          method: 'POST',
          headers,
        });

        const responseBody = (res.headers.get('content-type') || '').includes('application/json')
          ? await res.json()
          : await res.text();

        if (res.ok && responseBody) {
          const raw = responseBody.data || responseBody;
          return {
            success: true,
            data: {
              id: raw.id,
              slug: raw.slug,
              amount: raw.amount,
              currency: raw.currency || 'XAF',
              description: raw.description,
              status: 'CANCELLED',
              expires_at: raw.expires_at,
              metadata: raw.metadata,
              max_uses: raw.max_uses,
              current_uses: raw.current_uses || 0,
              created_at: raw.created_at,
              updated_at: raw.updated_at,
            },
          };
        }

        return {
          success: false,
          error: {
            code: `HTTP_${res.status}`,
            message: (responseBody && responseBody.message) || 'Failed to cancel payment link',
          },
        };
      }

      return apiClient.post<PaymentLink>(`/payment-links/${id}/cancel`, {});
    } catch (error: any) {
      console.error('Error cancelling payment link:', error);
      return {
        success: false,
        error: {
          code: 'PAYMENT_LINK_CANCEL_ERROR',
          message: error?.message || 'Failed to cancel payment link',
        },
      };
    }
  }
}

export const paymentLinksService = new PaymentLinksService();
