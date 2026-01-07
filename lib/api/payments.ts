/**
 * Payments API Service (real backend where available)
 */

import { ApiResponse, PaginationResponse, apiClient } from './client';

export interface Payment {
  id: string;
  paymentLinkId?: string;
  amount: number;
  currency: string;
  description?: string;
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' | string;
  paymentMethod?: string;
  customer?: {
    name?: string;
    email?: string;
  };
  createdAt: string;
  paidAt?: string | null;
  // Allow backend variations and extra fields
  created_at?: string;
  [key: string]: any;
}

export interface PaymentLink {
  paymentLinkId: string;
  url: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface CreatePaymentLinkData {
  type: 'Fixed' | 'Subscription' | 'Donation';
  amount: number;
  currency: 'XAF' | 'USD';
  description?: string;
  expiryDate?: string | null;
  redirectUrl?: string | null;
  reusable?: boolean;
  paymentMethods: string[];
  saveUrl?: boolean;
}

export interface Refund {
  id: string;
  paymentId: string;
  // also accept snake_case
  payment_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | string;
  description?: string;
  reason: string;
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface Chargeback {
  id: string;
  paymentId: string;
  // also accept snake_case
  payment_id: string;
  amount: number;
  currency: string;
  status: 'open' | 'won' | 'lost' | 'pending' | 'resolved' | string;
  reason: string;
  createdAt: string;
  created_at?: string;
  [key: string]: any;
}

export interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  [key: string]: any;
}

export interface Order {
  id: string;
  customer_id: string;
  customer: {
    id?: string;
    name?: string;
    email?: string;
  };
  amount: number;
  currency: string;
  items: OrderItem[];
  status: string;
  createdAt: string;
  created_at?: string;
  [key: string]: any;
}

export interface PaymentsListResponse {
  payments: Payment[];
  pagination: PaginationResponse;
}

export interface RefundsListResponse {
  refunds: Refund[];
  pagination: PaginationResponse;
}

export interface ChargebacksListResponse {
  chargebacks: Chargeback[];
  pagination: PaginationResponse;
}

export interface OrdersListResponse {
  orders: Order[];
  pagination: PaginationResponse;
  summary?: {
    totalOrders: number;
    paid: number;
    pending: number;
    totalRevenue: number;
  };
}

class PaymentsService {
  /**
   * Make a payment (initialize payment)
   * POST /api/paiments/make-payment
   */
  async makePayment(data: {
    amount: number;
    // currency is no longer required by the backend schema
    currency?: string;
    phoneNumber: string;
    // username/user_name removed from required schema
    username?: string;
    // optional application id to include in the request body
    applicationId?: string;
    // optional api key from the selected application (will be used in x-api-key header)
    appApiKey?: string;
    type: 'DEPOSIT' | 'COLLECTION';
    provider: 'MTN_CAM' | 'ORANGE_CAM';
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<{ transaction_id: string; status: string; amount: number; currency?: string }>> {
    try {
      // Transform data to match backend API format (snake_case)
      // Backend expects phone_number as a number, not a string
      const phoneNumberStr = data.phoneNumber.replace(/\D/g, ''); // Remove non-digits
      const phoneNumberNum = parseInt(phoneNumberStr, 10);
      
      if (isNaN(phoneNumberNum) || phoneNumberStr.length < 4) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phone number format. Phone number must be at least 4 digits.',
          },
        };
      }

      // Generate transaction_id - backend REQUIRES it (cannot be empty)
      const transactionId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      // Build request data - use snake_case for all fields to match backend expectations
      const requestData: any = {
        type: data.type,
        amount: data.amount,
        phone_number: phoneNumberNum, // Backend expects snake_case and number type
        provider: data.provider, // MTN_CAM or ORANGE_CAM
        transaction_id: transactionId, // Backend REQUIRES this field (cannot be empty)
      };

      // Include optional application_id if provided via param or environment
      const appId = data.applicationId || process.env.NEXT_PUBLIC_APPLICATION_ID;
      if (appId) requestData.application_id = appId;
      
      // Only include optional fields if they have values
      if (data.description) {
        requestData.description = data.description;
      }
      if (data.metadata) {
        requestData.metadata = data.metadata;
      }
      
      console.log('[Payment] Request data:', JSON.stringify(requestData, null, 2));

      // If a specific app's API key is provided, use it in a custom request
      if (data.appApiKey) {
        try {
          const base = process.env.NEXT_PUBLIC_PAYMENTS_API_BASE_URL || 'https://payments.dev.instanvi.com/api';
          const url = `${base.replace(/\/$/, '')}/paiments/make-payment`;
          
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-api-key': data.appApiKey,
          };
          
          console.log('[Payment] Using custom API key from selected application');
          
          const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestData),
          });
          
          const responseBody = (res.headers.get('content-type') || '').includes('application/json') 
            ? await res.json() 
            : await res.text();
          
          if (res.ok && responseBody) {
            const raw = responseBody.data || responseBody;
            return {
              success: true,
              data: {
                transaction_id: raw.transaction_id || raw.transactionId || raw.id || '',
                status: raw.status || 'pending',
                amount: raw.amount ?? data.amount,
                currency: raw.currency || data.currency,
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
        } catch (error: any) {
          console.error('[Payment] Error with custom API key request:', error);
          return {
            success: false,
            error: {
              code: 'PAYMENT_ERROR',
              message: error?.message || 'Failed to make payment with selected application',
            },
          };
        }
      }

      // Prefer new swagger path /paiments/make-payment (note: backend uses "paiments" in Swagger)
      const response = await apiClient.post<any>('/paiments/make-payment', requestData);
      
      if (response.success && response.data) {
        const raw = response.data.data || response.data;
        return {
          success: true,
          data: {
            transaction_id: raw.transaction_id || raw.transactionId || raw.id || '',
            status: raw.status || 'pending',
            amount: raw.amount ?? data.amount,
            currency: raw.currency || data.currency,
          },
        };
      }
      
      // If 404 or not implemented, fallback to legacy route
      if (response.error && String(response.error.code).startsWith('HTTP_404')) {
        const fallback = await apiClient.post<any>('/make-payment', requestData);
        if (fallback.success && fallback.data) {
          const raw = fallback.data.data || fallback.data;
          return {
            success: true,
            data: {
              transaction_id: raw.transaction_id || raw.transactionId || raw.id || '',
              status: raw.status || 'pending',
              amount: raw.amount ?? data.amount,
              currency: raw.currency || data.currency,
            },
          };
        }
        return fallback;
      }
      
      return response;
    } catch (error: any) {
      console.error('Error making payment:', error);
      return {
        success: false,
        error: {
          code: 'PAYMENT_ERROR',
          message: error?.message || 'Failed to make payment',
        },
      };
    }
  }

  /**
   * Get payment status by transaction ID
   * GET /api/paiments/payment-status/{transaction_id}
   */
  async getPaymentStatus(transactionId: string): Promise<ApiResponse<{ transaction_id: string; status: string; amount: number; currency: string }>> {
    try {
      const response = await apiClient.get<any>(`/paiments/payment-status/${transactionId}`);
      
      if (response.success && response.data) {
        const raw = response.data.data || response.data;
        return {
          success: true,
          data: {
            transaction_id: raw.transaction_id || raw.transactionId || transactionId,
            status: raw.status || 'pending',
            amount: raw.amount ?? 0,
            currency: raw.currency || 'XAF',
          },
        };
      }
      
      // If 404 or not implemented, fallback to legacy route
      if (response.error && String(response.error.code).startsWith('HTTP_404')) {
        const fallback = await apiClient.get<any>(`/payment-status/${transactionId}`);
        if (fallback.success && fallback.data) {
          const raw = fallback.data.data || fallback.data;
          return {
            success: true,
            data: {
              transaction_id: raw.transaction_id || raw.transactionId || transactionId,
              status: raw.status || 'pending',
              amount: raw.amount ?? 0,
              currency: raw.currency || 'XAF',
            },
          };
        }
        return fallback;
      }
      
      return response;
    } catch (error: any) {
      console.error('Error getting payment status:', error);
      return {
        success: false,
        error: {
          code: 'PAYMENT_STATUS_ERROR',
          message: error?.message || 'Failed to get payment status',
        },
      };
    }
  }

  /**
   * Verify if account holder is active
   * GET /api/paiments/verify-account-holder-active
   */
  async verifyAccountHolderActive(phoneNumber: string, type: 'DEPOSIT' | 'COLLECTION'): Promise<ApiResponse<{ isActive: boolean; phoneNumber: string }>> {
    try {
      // Transform phoneNumber to match backend format (snake_case and number type)
      const phoneNumberStr = phoneNumber.replace(/\D/g, ''); // Remove non-digits
      const phoneNumberNum = parseInt(phoneNumberStr, 10);
      
      if (isNaN(phoneNumberNum)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phone number format. Please provide a valid phone number.',
          },
        };
      }

      const params = { phone_number: phoneNumberNum, type };
      const response = await apiClient.get<any>('/paiments/verify-account-holder-active', params);
      
      if (response.success && response.data) {
        const raw = response.data.data || response.data;
        return {
          success: true,
          data: {
            isActive: raw.isActive ?? raw.is_active ?? false,
            phoneNumber: raw.phoneNumber || raw.phone_number || phoneNumber,
          },
        };
      }
      
      // If 404 or not implemented, fallback to legacy route
      if (response.error && String(response.error.code).startsWith('HTTP_404')) {
        const fallback = await apiClient.get<any>('/verify-account-holder-active', params);
        if (fallback.success && fallback.data) {
          const raw = fallback.data.data || fallback.data;
          return {
            success: true,
            data: {
              isActive: raw.isActive ?? raw.is_active ?? false,
              phoneNumber: raw.phoneNumber || raw.phone_number || phoneNumber,
            },
          };
        }
        return fallback;
      }
      
      return response;
    } catch (error: any) {
      console.error('Error verifying account holder active:', error);
      return {
        success: false,
        error: {
          code: 'ACCOUNT_VERIFY_ERROR',
          message: error?.message || 'Failed to verify account holder',
        },
      };
    }
  }

  /**
   * Get basic info for account holder
   * GET /api/paiments/verify-account-holder-basic-info
   */
  async verifyAccountHolderBasicInfo(phoneNumber: string, type: 'DEPOSIT' | 'COLLECTION'): Promise<ApiResponse<{ name: string; phoneNumber: string }>> {
    try {
      // Transform phoneNumber to match backend format (snake_case and number type)
      const phoneNumberStr = phoneNumber.replace(/\D/g, ''); // Remove non-digits
      const phoneNumberNum = parseInt(phoneNumberStr, 10);
      
      if (isNaN(phoneNumberNum)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phone number format. Please provide a valid phone number.',
          },
        };
      }

      const params = { phone_number: phoneNumberNum, type };
      const response = await apiClient.get<any>('/paiments/verify-account-holder-basic-info', params);
      
      if (response.success && response.data) {
        const raw = response.data.data || response.data;
        return {
          success: true,
          data: {
            name: raw.name || raw.fullName || raw.full_name || 'N/A',
            phoneNumber: raw.phoneNumber || raw.phone_number || phoneNumber,
          },
        };
      }
      
      // If 404 or not implemented, fallback to legacy route
      if (response.error && String(response.error.code).startsWith('HTTP_404')) {
        const fallback = await apiClient.get<any>('/verify-account-holder-basic-info', params);
        if (fallback.success && fallback.data) {
          const raw = fallback.data.data || fallback.data;
          return {
            success: true,
            data: {
              name: raw.name || raw.fullName || raw.full_name || 'N/A',
              phoneNumber: raw.phoneNumber || raw.phone_number || phoneNumber,
            },
          };
        }
        return fallback;
      }
      
      return response;
    } catch (error: any) {
      console.error('Error getting account holder basic info:', error);
      return {
        success: false,
        error: {
          code: 'ACCOUNT_INFO_ERROR',
          message: error?.message || 'Failed to get account holder info',
        },
      };
    }
  }

  // IPN (Momo) webhook endpoints - common verbs (frontend usually doesn't need all, but we provide helpers)
  async ipnMomoGet(params?: Record<string, any>): Promise<ApiResponse<any>> {
    return apiClient.get<any>('/paiments/ipn/momo', params);
  }

  async ipnMomoPost(body?: any): Promise<ApiResponse<any>> {
    return apiClient.post<any>('/paiments/ipn/momo', body);
  }

  async ipnMomoPut(body?: any): Promise<ApiResponse<any>> {
    return apiClient.put<any>('/paiments/ipn/momo', body);
  }

  async ipnMomoDelete(): Promise<ApiResponse<any>> {
    return apiClient.delete<any>('/paiments/ipn/momo');
  }

  // Additional IPN verbs sometimes required by providers
  async ipnMomoPatch(body?: any): Promise<ApiResponse<any>> {
    return apiClient.patch<any>('/paiments/ipn/momo', body);
  }

  async ipnMomoOptions(params?: Record<string, any>): Promise<ApiResponse<any>> {
    return apiClient.options<any>('/paiments/ipn/momo', params);
  }

  async ipnMomoHead(params?: Record<string, any>): Promise<ApiResponse<any>> {
    return apiClient.head<any>('/paiments/ipn/momo', params);
  }

  // Webhooks
  async handleMtnCallback(body: any): Promise<ApiResponse<any>> {
    return apiClient.put<any>('/paiments/webhooks/mtn-callback', body);
  }

  async getPayments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<ApiResponse<PaymentsListResponse>> {
    const response = await apiClient.get<any>('/reports/payments', {
      startDate: params?.startDate,
      endDate: params?.endDate,
      status: params?.status,
      format: 'JSON',
    });

    if (!response.success || !response.data) {
      return response as ApiResponse<PaymentsListResponse>;
    }

    const rawPayments = (response.data as any).payments || [];
    const page = params?.page || 1;
    const limit = params?.limit || rawPayments.length || 20;
    const total = (response.data as any).summary?.total ?? rawPayments.length;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    const payments: Payment[] = rawPayments.map((p: any) => ({
      id: p.id || p.transaction_id || '',
      amount: p.amount ?? 0,
      currency: p.currency || 'XAF',
      description: p.description,
      status: (p.status || 'pending').toLowerCase(),
      paymentMethod: p.paymentMethod || p.method,
      customer: p.customer
        ? { name: p.customer.name || p.customer.firstName || '', email: p.customer.email }
        : undefined,
      createdAt: p.createdAt || p.created_at || new Date().toISOString(),
      paidAt: p.paidAt || p.paid_at || null,
    }));

    return {
      success: true,
      data: {
        payments,
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
  }

  async getRefunds(params?: { page?: number; limit?: number; status?: string }): Promise<ApiResponse<RefundsListResponse>> {
    const response = await apiClient.get<any>('/refunds', params);
    if (!response.success || !response.data) {
      return response as ApiResponse<RefundsListResponse>;
    }

    const rawRefunds = response.data as any[];
    const page = params?.page || 1;
    const limit = params?.limit || rawRefunds.length || 20;
    const total = rawRefunds.length;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    const refunds: Refund[] = rawRefunds.map((r: any) => ({
      id: r.id || '',
      paymentId: r.payment_id || r.paymentId || '',
      payment_id: r.payment_id || r.paymentId || '',
      amount: r.amount ?? 0,
      currency: r.currency || 'XAF',
      status: r.status || 'pending',
      description: r.description,
      reason: r.reason,
      createdAt: r.createdAt || r.created_at || new Date().toISOString(),
    }));

    return {
      success: true,
      data: {
        refunds,
        pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      },
    };
  }

  async getChargebacks(params?: { page?: number; limit?: number; status?: string }): Promise<ApiResponse<ChargebacksListResponse>> {
    const response = await apiClient.get<any>('/chargebacks', params);
    if (!response.success || !response.data) {
      return response as ApiResponse<ChargebacksListResponse>;
    }

    const raw = response.data as any[];
    const page = params?.page || 1;
    const limit = params?.limit || raw.length || 20;
    const total = raw.length;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    const chargebacks: Chargeback[] = raw.map((c: any) => ({
      id: c.id || '',
      paymentId: c.payment_id || c.paymentId || '',
      payment_id: c.payment_id || c.paymentId || '',
      amount: c.amount ?? 0,
      currency: c.currency || 'XAF',
      status: c.status || 'pending',
      reason: c.reason,
      createdAt: c.createdAt || c.created_at || new Date().toISOString(),
    }));

    return {
      success: true,
      data: {
        chargebacks,
        pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      },
    };
  }

  async getOrders(params?: { page?: number; limit?: number; status?: string }): Promise<ApiResponse<OrdersListResponse>> {
    const response = await apiClient.get<any>('/orders', params);
    if (!response.success || !response.data) {
      return response as ApiResponse<OrdersListResponse>;
    }

    const rawOrders = response.data as any[];
    const page = params?.page || 1;
    const limit = params?.limit || rawOrders.length || 20;
    const total = rawOrders.length;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    const orders: Order[] = rawOrders.map((o: any) => ({
      id: o.id || '',
      customer_id: o.customer_id || o.customer?.id || '',
      customer: {
        id: o.customer_id || o.customer?.id,
        name: o.customer?.name,
        email: o.customer?.email,
      },
      amount: o.amount ?? o.total ?? 0,
      currency: o.currency || 'XAF',
      items: o.items || [],
      status: o.status || 'PENDING',
      createdAt: o.createdAt || o.created_at || new Date().toISOString(),
    }));

    return {
      success: true,
      data: {
        orders,
        pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
        summary: {
          totalOrders: total,
          paid: orders.filter(o => (o.status || '').toLowerCase() === 'paid').length,
          pending: orders.filter(o => (o.status || '').toLowerCase() === 'pending').length,
          totalRevenue: orders.reduce((sum, o) => sum + (o.amount || 0), 0),
        },
      },
    };
  }

  async createPaymentLink(data: CreatePaymentLinkData): Promise<ApiResponse<PaymentLink>> {
    try {
      const base = process.env.NEXT_PUBLIC_PAYMENTS_API_BASE_URL || 'https://payments.dev.instanvi.com/api';
      const url = `${base.replace(/\/$/, '')}/payment-links/create`;

      // Attempt to read API key from environment or localStorage
      let apiKey: string | null = process.env.NEXT_PUBLIC_API_KEY || null;
      if (!apiKey && typeof window !== 'undefined') {
        apiKey = localStorage.getItem('userApiKey');
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['x-api-key'] = apiKey;

      const payload: any = {
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        expires_at: data.expiryDate || undefined,
        max_uses: data.reusable ? 100 : 1,
        metadata: {},
        provider: undefined,
        type: 'COLLECTION',
      };

      // Remove undefined keys
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
      const body = (res.headers.get('content-type') || '').includes('application/json') ? await res.json() : await res.text();

      if (res.ok && body) {
        if (body && typeof body === 'object' && 'status_code' in body && 'data' in body) {
          const ok = body.status_code >= 200 && body.status_code < 300;
          return {
            success: ok,
            data: body.data as any,
            message: body.message,
            error: ok ? undefined : { code: String(body.status), message: body.message, details: body.data },
          };
        }

        // Try to normalize common shapes
        const dataField = body.data || body;
        return { success: true, data: dataField as any };
      }

      return { success: false, error: { code: `HTTP_${res.status}`, message: (body && body.message) || `Request failed with status ${res.status}`, details: body } };
    } catch (error: any) {
      console.error('Error creating payment link:', error);
      return { success: false, error: { code: 'NETWORK_ERROR', message: error?.message || 'Network error' } };
    }
  }

  /**
   * Get payment link details (public)
   * GET https://payments.dev.instanvi.com/api/payment-links/:slug
   */
  async getPaymentLinkBySlug(slug: string): Promise<ApiResponse<any>> {
    try {
      const base = process.env.NEXT_PUBLIC_PAYMENTS_API_BASE_URL || 'https://payments.dev.instanvi.com/api';
      const url = `${base.replace(/\/$/, '')}/payment-links/${encodeURIComponent(slug)}`;

      const res = await fetch(url, { method: 'GET' });
      const data = await (res.headers.get('content-type') || '').includes('application/json') ? await res.json() : await res.text();

      if (res.ok && data) {
        // Normalize documented backend shape: { status_code, status, message, data }
        if (data && typeof data === 'object' && 'status_code' in data && 'data' in data) {
          const ok = res.ok && (data.status_code >= 200 && data.status_code < 300);
          return {
            success: ok,
            data: data.data,
            message: data.message,
            error: ok ? undefined : { code: String(data.status), message: data.message, details: data.data },
          };
        }

        return { success: true, data } as ApiResponse<any>;
      }

      return {
        success: false,
        error: { code: `HTTP_${res.status}`, message: (data && data.message) || `Request failed with status ${res.status}`, details: data },
      };
    } catch (error: any) {
      console.error('Error fetching payment link by slug:', error);
      return { success: false, error: { code: 'NETWORK_ERROR', message: error?.message || 'Network error' } };
    }
  }

  /**
   * Redeem a payment link (public)
   * POST https://payments.dev.instanvi.com/api/payment-links/:slug/redeem
   */
  async redeemPaymentLink(slug: string, body: { phone_number: string | number; provider: string }): Promise<ApiResponse<any>> {
    try {
      const base = process.env.NEXT_PUBLIC_PAYMENTS_API_BASE_URL || 'https://payments.dev.instanvi.com/api';
      const url = `${base.replace(/\/$/, '')}/payment-links/${encodeURIComponent(slug)}/redeem`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await (res.headers.get('content-type') || '').includes('application/json') ? await res.json() : await res.text();

      if (res.ok && data) {
        if (data && typeof data === 'object' && 'status_code' in data && 'data' in data) {
          const ok = res.ok && (data.status_code >= 200 && data.status_code < 300);
          return {
            success: ok,
            data: data.data,
            message: data.message,
            error: ok ? undefined : { code: String(data.status), message: data.message, details: data.data },
          };
        }
        return { success: true, data } as ApiResponse<any>;
      }

      return {
        success: false,
        error: { code: `HTTP_${res.status}`, message: (data && data.message) || `Request failed with status ${res.status}`, details: data },
      };
    } catch (error: any) {
      console.error('Error redeeming payment link:', error);
      return { success: false, error: { code: 'NETWORK_ERROR', message: error?.message || 'Network error' } };
    }
  }
}

export const paymentsService = new PaymentsService();

