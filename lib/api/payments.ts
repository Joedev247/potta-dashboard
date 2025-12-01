// Payment API Service

import { apiClient } from './client';
import {
  MakePaymentDto,
  PaymentResponse,
  PaymentStatusResponse,
  AccountHolderInfo,
  AccountHolderBasicInfo,
} from './types';

export const paymentApi = {
  /**
   * Make payment
   * POST /api/paiments/make-payment
   */
  makePayment: async (paymentData: MakePaymentDto): Promise<PaymentResponse> => {
    return apiClient.post<PaymentResponse>('/api/paiments/make-payment', paymentData);
  },

  /**
   * Get payment status
   * GET /api/paiments/payment-status/{transaction_id}
   */
  getPaymentStatus: async (transactionId: string): Promise<PaymentStatusResponse> => {
    return apiClient.get<PaymentStatusResponse>(`/api/paiments/payment-status/${transactionId}`);
  },

  /**
   * Verify if account holder is active
   * GET /api/paiments/verify-account-holder-active
   */
  verifyAccountHolderActive: async (phoneNumber: string, provider?: string): Promise<AccountHolderInfo> => {
    const params = new URLSearchParams();
    params.append('phoneNumber', phoneNumber);
    if (provider) params.append('provider', provider);
    
    return apiClient.get<AccountHolderInfo>(`/api/paiments/verify-account-holder-active?${params.toString()}`);
  },

  /**
   * Get basic user info for account holder
   * GET /api/paiments/verify-account-holder-basic-info
   */
  verifyAccountHolderBasicInfo: async (phoneNumber: string, provider?: string): Promise<AccountHolderBasicInfo> => {
    const params = new URLSearchParams();
    params.append('phoneNumber', phoneNumber);
    if (provider) params.append('provider', provider);
    
    return apiClient.get<AccountHolderBasicInfo>(`/api/paiments/verify-account-holder-basic-info?${params.toString()}`);
  },
};


