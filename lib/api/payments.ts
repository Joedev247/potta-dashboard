/**
 * Payments API Service
 */

import { apiClient, ApiResponse, PaginationResponse } from './client';

export interface Payment {
  id: string;
  paymentLinkId?: string;
  amount: number;
  currency: string;
  description?: string;
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';
  paymentMethod?: string;
  customer?: {
    name?: string;
    email?: string;
  };
  createdAt: string;
  paidAt?: string | null;
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
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description?: string;
  reason?: string;
  createdAt: string;
}

export interface Chargeback {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'open' | 'won' | 'lost';
  reason?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  status: string;
  createdAt: string;
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
  async createPaymentLink(data: CreatePaymentLinkData): Promise<ApiResponse<PaymentLink>> {
    return apiClient.post<PaymentLink>('/payments/links', data);
  }

  async getPaymentLinks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<PaymentLink[]>> {
    return apiClient.get<PaymentLink[]>('/payments/links', params);
  }

  async getPaymentLink(linkId: string): Promise<ApiResponse<PaymentLink>> {
    return apiClient.get<PaymentLink>(`/payments/links/${linkId}`);
  }

  async getPayments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    amountMin?: number;
    amountMax?: number;
  }): Promise<ApiResponse<PaymentsListResponse>> {
    return apiClient.get<PaymentsListResponse>('/payments', params);
  }

  async getPayment(paymentId: string): Promise<ApiResponse<Payment>> {
    return apiClient.get<Payment>(`/payments/${paymentId}`);
  }

  async cancelPayment(paymentId: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`/payments/${paymentId}/cancel`);
  }

  async createRefund(paymentId: string, data: {
    amount: number;
    description?: string;
    reason?: string;
  }): Promise<ApiResponse<Refund>> {
    return apiClient.post<Refund>(`/payments/${paymentId}/refunds`, data);
  }

  async getRefunds(params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentId?: string;
  }): Promise<ApiResponse<RefundsListResponse>> {
    return apiClient.get<RefundsListResponse>('/refunds', params);
  }

  async getRefund(refundId: string): Promise<ApiResponse<Refund>> {
    return apiClient.get<Refund>(`/refunds/${refundId}`);
  }

  async getChargebacks(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<ChargebacksListResponse>> {
    return apiClient.get<ChargebacksListResponse>('/chargebacks', params);
  }

  async getChargeback(chargebackId: string): Promise<ApiResponse<Chargeback>> {
    return apiClient.get<Chargeback>(`/chargebacks/${chargebackId}`);
  }

  async submitChargebackEvidence(chargebackId: string, data: {
    documents: string[];
    description: string;
    additionalInfo?: string;
  }): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`/chargebacks/${chargebackId}/evidence`, data);
  }

  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
  }): Promise<ApiResponse<OrdersListResponse>> {
    return apiClient.get<OrdersListResponse>('/orders', params);
  }

  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    return apiClient.get<Order>(`/orders/${orderId}`);
  }
}

export const paymentsService = new PaymentsService();

