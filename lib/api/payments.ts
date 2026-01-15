/**
 * Payments API Service (real backend where available)
 */

import { ApiResponse, PaginationResponse, apiClient } from './client';

export interface Payment {
  id: string;
  paymentLinkId?: string;
  customer_id?: string;
  amount: number;
  currency: string;
  description?: string;
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' | string;
  paymentMethod?: string;
  customer?: {
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
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
   * Get helpful error message for generic "Initialization error"
   * Provides context-specific error messages based on request data
   */
  private getHelpfulErrorMessage(requestData: any, statusCode: number): string | null {
    // Check for common issues that cause initialization errors
    const issues: string[] = [];
    
    // Check amount - might be too small
    // Amount could be in centimes or XAF format
    if (requestData.amount && requestData.amount < 100) {
      // Likely in centimes, below 1 XAF minimum
      issues.push(`Amount (${requestData.amount} centimes = ${requestData.amount / 100} XAF) is below the minimum transaction amount. Mobile money providers typically require at least 1 XAF (100 centimes) or more.`);
    } else if (requestData.amount && requestData.amount >= 100 && requestData.amount < 10000) {
      // Could be in XAF format, check if it's below 100 XAF minimum
      // If it's actually centimes, 100-10000 would be 1-100 XAF which might be acceptable
      // But if it's XAF, then 100-10000 XAF should be fine
      // We'll just note that very small amounts might be an issue
      if (requestData.amount < 1000) {
        issues.push(`Amount (${requestData.amount}) may be too small. Please verify the amount format - mobile money providers typically require at least 100 XAF for transactions.`);
      }
    }
    
    // Check if application_id is missing (required for some operations)
    if (!requestData.application_id) {
      issues.push('Application ID is missing. This may be required for payment initialization.');
    }
    
    // Check if username is missing for COLLECTION type
    if (requestData.type === 'COLLECTION' && !requestData.username) {
      issues.push('Username is missing. COLLECTION type transactions may require a merchant username.');
    }
    
    // Check provider configuration
    if (requestData.provider && (requestData.provider === 'MTN_CAM' || requestData.provider === 'ORANGE_CAM')) {
      issues.push('Provider credentials may not be properly configured for this application. Please verify your MTN/Orange API credentials in the application settings.');
    }
    
    if (issues.length > 0) {
      return `Initialization error: ${issues.join(' ')} Please check your payment configuration and try again.`;
    }
    
    return null;
  }

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
      // Backend expects phone_number as a NUMBER (not string)
      // For Cameroon providers, send LOCAL number only (9 digits starting with 6)
      // The backend will add the country code (237) when calling MTN/Orange API
      let phoneNumberStr = data.phoneNumber.replace(/\D/g, ''); // Remove non-digits
      
      // Remove country code if present (237 for Cameroon)
      // MTN/Orange APIs expect just the local 9-digit number
      if (phoneNumberStr.startsWith('237')) {
        phoneNumberStr = phoneNumberStr.substring(3); // Remove '237' prefix
      }
      
      // Remove leading 0 if present (local format: 0653878190 -> 653878190)
      phoneNumberStr = phoneNumberStr.replace(/^0+/, '');
      
      // Validate phone number length (should be 9 digits for Cameroon)
      if (phoneNumberStr.length !== 9) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid phone number format. Cameroon phone numbers must be 9 digits (e.g., 653878190). Got ${phoneNumberStr.length} digits.`,
          },
        };
      }
      
      // Validate it starts with 6 (Cameroon mobile numbers start with 6)
      if (!phoneNumberStr.startsWith('6')) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phone number format. Cameroon mobile numbers must start with 6.',
          },
        };
      }
      
      // Convert to number - backend expects numeric value
      const phoneNumberForRequest = parseInt(phoneNumberStr, 10);

      if (isNaN(phoneNumberForRequest)) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phone number format. Phone number must be numeric.',
          },
        };
      }

      console.log('[Payment] Phone number formatting:', {
        original: data.phoneNumber,
        cleaned: phoneNumberStr,
        finalFormat: phoneNumberForRequest,
        provider: data.provider,
        note: 'Sending local number only - backend will add country code when calling MTN/Orange API',
      });

      // Generate transaction_id - backend REQUIRES it (cannot be empty)
      const transactionId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // For XAF currency (and mobile money in general), amounts must be integers (no decimals)
      // Round the amount to ensure it's a whole number
      const currency = data.currency || 'XAF';
      const isXAF = currency.toUpperCase() === 'XAF';
      const finalAmount = isXAF ? Math.round(data.amount) : data.amount;
      
      // Validate amount
      if (finalAmount <= 0) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Amount must be greater than 0.',
          },
        };
      }
      
      // Validate minimum amount for mobile money (typically 100 XAF for Cameroon)
      // Note: Amount format depends on how it's passed - could be in XAF or centimes
      // If amount is less than 100, it's likely in centimes (100 centimes = 1 XAF)
      // If amount is 100 or more, it could be in XAF or centimes
      // For safety, we'll check if it's below a reasonable minimum
      const MIN_AMOUNT_CENTIMES = 100; // 1 XAF minimum (100 centimes)
      const MIN_AMOUNT_XAF = 100; // 100 XAF minimum (if amount is in XAF)
      
      // If amount is very small (< 100), it's likely in centimes and below minimum
      // If amount is between 100-1000, it might be in XAF but still too small
      if (isXAF) {
        if (finalAmount < MIN_AMOUNT_CENTIMES) {
          // Amount is likely in centimes and below 1 XAF minimum
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Amount is too small. Minimum transaction amount is 1 XAF (100 centimes). Your amount: ${finalAmount} centimes (${finalAmount / 100} XAF).`,
            },
          };
        } else if (finalAmount >= MIN_AMOUNT_CENTIMES && finalAmount < MIN_AMOUNT_XAF) {
          // Amount is between 1-100 XAF, might be acceptable but warn
          // Don't block, but this might still fail on backend
          console.warn(`[Payment] Amount ${finalAmount} is between 1-100 XAF. This may be below the minimum transaction amount required by the mobile money provider.`);
        }
      }
      
      // Build request data - use snake_case for all fields to match backend expectations
      const requestData: any = {
        type: data.type,
        amount: finalAmount, // Use rounded amount for XAF, original for other currencies
        phone_number: phoneNumberForRequest, // String with +237 for Cameroon, number for others
        provider: data.provider, // MTN_CAM or ORANGE_CAM
        transaction_id: transactionId, // Backend REQUIRES this field (cannot be empty)
      };

      // Include optional application_id if provided via param or environment
      const appId = data.applicationId || process.env.NEXT_PUBLIC_APPLICATION_ID;
      if (appId) requestData.application_id = appId;
      
      // Include username if provided - may be required for COLLECTION type transactions
      // MTN/Orange APIs might need merchant username for collection operations
      if (data.username && data.username.trim()) {
        // Clean username: remove spaces, special characters, convert to lowercase
        const cleanedUsername = data.username
          .trim()
          .replace(/\s+/g, '') // Remove all whitespace
          .replace(/[^a-zA-Z0-9]/g, '') // Remove all non-alphanumeric characters
          .toLowerCase();
        
        if (cleanedUsername.length >= 4 && cleanedUsername.length <= 15) {
          requestData.username = cleanedUsername;
        } else {
          console.warn('[Payment] Username validation failed:', {
            original: data.username,
            cleaned: cleanedUsername,
            length: cleanedUsername.length,
            reason: cleanedUsername.length < 4 
              ? 'Too short (minimum 4 characters)' 
              : 'Too long (maximum 15 characters)',
          });
        }
      }
      
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
          
          // Check if response body contains an error even if HTTP status is 201/200
          // Backend may return 201 Created but with error in body: { status_code: 422, message: "..." }
          if (typeof responseBody === 'object' && responseBody !== null) {
            const statusCode = (responseBody as any).status_code;
            const isError = statusCode && (statusCode < 200 || statusCode >= 300);
            
            // If body indicates an error, treat it as an error regardless of HTTP status
            if (isError) {
              let errorMessage = (responseBody as any).message || `Request failed with status ${statusCode}`;
              const errorDetails = (responseBody as any).data || responseBody;
              
              // Try to extract more detailed error information from the data field
              if (errorDetails && typeof errorDetails === 'object') {
                // Check for validation errors array
                if (Array.isArray(errorDetails)) {
                  const validationErrors = errorDetails
                    .map((err: any) => {
                      if (typeof err === 'string') return err;
                      if (err?.message) return err.message;
                      if (err?.field && err?.error) return `${err.field}: ${err.error}`;
                      return JSON.stringify(err);
                    })
                    .filter(Boolean);
                  if (validationErrors.length > 0) {
                    errorMessage = validationErrors.join(', ');
                  }
                } else if (errorDetails.message && typeof errorDetails.message === 'string') {
                  errorMessage = errorDetails.message;
                } else if (errorDetails.message && Array.isArray(errorDetails.message)) {
                  errorMessage = errorDetails.message.join(', ');
                } else if (errorDetails.errors && Array.isArray(errorDetails.errors)) {
                  errorMessage = errorDetails.errors.join(', ');
                } else if (errorDetails.error && typeof errorDetails.error === 'string') {
                  errorMessage = errorDetails.error;
                }
              }
              
              // If error message is generic "Initialization error", provide more helpful context
              if (errorMessage === 'Initialization error' || errorMessage.toLowerCase().includes('initialization')) {
                const helpfulMessage = this.getHelpfulErrorMessage(requestData, statusCode);
                if (helpfulMessage) {
                  errorMessage = helpfulMessage;
                }
              }
              
              console.error('[Payment] Backend returned error in response body:', {
                httpStatus: res.status,
                bodyStatusCode: statusCode,
                message: errorMessage,
                details: errorDetails,
                requestData: {
                  type: requestData.type,
                  amount: requestData.amount,
                  provider: requestData.provider,
                  hasApplicationId: !!requestData.application_id,
                  hasUsername: !!requestData.username,
                },
              });
              
              return {
                success: false,
                error: {
                  code: `HTTP_${statusCode}`,
                  message: errorMessage,
                  details: errorDetails,
                },
              };
            }
          }
          
          if (res.ok && responseBody) {
            const raw = responseBody.data || responseBody;
            return {
              success: true,
              data: {
                transaction_id: raw.transaction_id || raw.transactionId || raw.id || '',
                status: raw.status || 'pending',
                amount: raw.amount ?? finalAmount,
                currency: raw.currency || currency,
              },
            };
          }
          
          // Extract error message from response
          let errorMessage = `Request failed with status ${res.status}`;
          if (responseBody) {
            if (typeof responseBody === 'object') {
              errorMessage = responseBody.message || responseBody.status || errorMessage;
              // Handle backend error format: { status_code, status, message, data }
              if (responseBody.status_code && responseBody.message) {
                errorMessage = responseBody.message;
              }
            } else if (typeof responseBody === 'string') {
              errorMessage = responseBody;
            }
          }
          
          return {
            success: false,
            error: {
              code: `HTTP_${res.status}`,
              message: errorMessage,
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
        // Double-check: even if apiClient says success, verify the response body doesn't contain an error
        // Backend may return HTTP 201 but with error in body: { status_code: 422, message: "..." }
        const responseData = response.data;
        if (typeof responseData === 'object' && responseData !== null) {
          const statusCode = (responseData as any).status_code;
          const isError = statusCode && (statusCode < 200 || statusCode >= 300);
          
          if (isError) {
            let errorMessage = (responseData as any).message || `Request failed with status ${statusCode}`;
            const errorDetails = (responseData as any).data || responseData;
            
            // Try to extract more detailed error information
            if (errorDetails && typeof errorDetails === 'object') {
              if (Array.isArray(errorDetails)) {
                const validationErrors = errorDetails
                  .map((err: any) => {
                    if (typeof err === 'string') return err;
                    if (err?.message) return err.message;
                    if (err?.field && err?.error) return `${err.field}: ${err.error}`;
                    return JSON.stringify(err);
                  })
                  .filter(Boolean);
                if (validationErrors.length > 0) {
                  errorMessage = validationErrors.join(', ');
                }
              } else if (errorDetails.message && typeof errorDetails.message === 'string') {
                errorMessage = errorDetails.message;
              } else if (errorDetails.message && Array.isArray(errorDetails.message)) {
                errorMessage = errorDetails.message.join(', ');
              } else if (errorDetails.errors && Array.isArray(errorDetails.errors)) {
                errorMessage = errorDetails.errors.join(', ');
              }
            }
            
            // If error message is generic "Initialization error", provide more helpful context
            if (errorMessage === 'Initialization error' || errorMessage.toLowerCase().includes('initialization')) {
              const helpfulMessage = this.getHelpfulErrorMessage(requestData, statusCode);
              if (helpfulMessage) {
                errorMessage = helpfulMessage;
              }
            }
            
            console.error('[Payment] Backend returned error in response body (via apiClient):', {
              bodyStatusCode: statusCode,
              message: errorMessage,
              details: errorDetails,
              requestData: {
                type: requestData.type,
                amount: requestData.amount,
                provider: requestData.provider,
                hasApplicationId: !!requestData.application_id,
                hasUsername: !!requestData.username,
              },
            });
            
            return {
              success: false,
              error: {
                code: `HTTP_${statusCode}`,
                message: errorMessage,
                details: errorDetails,
              },
            };
          }
        }
        
        const raw = responseData.data || responseData;
        return {
          success: true,
          data: {
            transaction_id: raw.transaction_id || raw.transactionId || raw.id || '',
            status: raw.status || 'pending',
            amount: raw.amount ?? finalAmount,
            currency: raw.currency || currency,
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
              amount: raw.amount ?? finalAmount,
              currency: raw.currency || currency,
            },
          };
        }
        return fallback;
      }
      
      // Improve error message extraction for 422 and other errors
      if (response.error) {
        // If the error message is generic, try to extract more details
        if (response.error.message === 'Initialization error' || response.error.code === 'HTTP_422') {
          const details = response.error.details;
          if (details && typeof details === 'object') {
            // Try to extract validation errors from details
            if (Array.isArray(details)) {
              const validationErrors = details
                .map((err: any) => {
                  if (typeof err === 'string') return err;
                  if (err?.message) return err.message;
                  if (err?.field && err?.error) return `${err.field}: ${err.error}`;
                  return JSON.stringify(err);
                })
                .filter(Boolean);
              if (validationErrors.length > 0) {
                response.error.message = validationErrors.join(', ');
              }
            } else if (details.message && details.message !== 'Initialization error') {
              if (Array.isArray(details.message)) {
                response.error.message = details.message.join(', ');
              } else {
                response.error.message = details.message;
              }
            } else if (details.errors && Array.isArray(details.errors)) {
              response.error.message = details.errors.join(', ');
            }
          }
          
          // If still generic, provide helpful context
          if (response.error.message === 'Initialization error' || response.error.message.toLowerCase().includes('initialization')) {
            const helpfulMessage = this.getHelpfulErrorMessage(requestData, 422);
            if (helpfulMessage) {
              response.error.message = helpfulMessage;
            }
          }
        }
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
    type?: 'DEPOSIT' | 'COLLECTION';
  }): Promise<ApiResponse<PaymentsListResponse>> {
    const response = await apiClient.get<any>('/paiments/transactions', {
      startDate: params?.startDate,
      endDate: params?.endDate,
      status: params?.status,
      page: params?.page,
      limit: params?.limit,
      search: params?.search,
      type: params?.type,
    });

    if (!response.success || !response.data) {
      return response as ApiResponse<PaymentsListResponse>;
    }

    const dataPayload = response.data as any;
    const rawPayments = dataPayload?.payments || (Array.isArray(dataPayload) ? dataPayload : dataPayload?.data || []);
    const page = params?.page || dataPayload?.page || 1;
    const limit = params?.limit || dataPayload?.limit || rawPayments.length || 20;
    const total = dataPayload?.summary?.total ?? dataPayload?.total ?? rawPayments.length;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    const payments: Payment[] = rawPayments.map((p: any) => {
      // Normalize customer data
      let customerData = p.customer || undefined;
      if (customerData) {
        customerData = {
          id: customerData.id,
          name: customerData.name || 
                (customerData.firstName && customerData.lastName 
                  ? `${customerData.firstName} ${customerData.lastName}` 
                  : customerData.firstName || customerData.lastName || undefined),
          firstName: customerData.firstName || customerData.first_name,
          lastName: customerData.lastName || customerData.last_name,
          email: customerData.email,
          phone: customerData.phone || customerData.phone_number,
        };
      }
      
      return {
        id: p.id || p.transaction_id || '',
        customer_id: p.customer_id || p.customerId || undefined,
        amount: p.amount ?? 0,
        currency: p.currency || 'XAF',
        description: p.description,
        status: (p.status || 'pending').toLowerCase(),
        paymentMethod: p.paymentMethod || p.method,
        customer: customerData,
        createdAt: p.createdAt || p.created_at || new Date().toISOString(),
        paidAt: p.paidAt || p.paid_at || null,
      };
    });

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

