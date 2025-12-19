/**
 * Reports API Service (backend)
 * Base Path: /api/reports
 * Authentication: Bearer Token or Token Header
 */

import { ApiResponse, apiClient } from './client';

export interface PaymentReportData {
  payments: any[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface TransactionReportData {
  transactions: any[];
  summary?: {
    total: number;
    [key: string]: any;
  };
}

export interface FinancialReportData {
  revenue: number;
  refunds: number;
  net: number;
  byCurrency: Record<string, number>;
}

export interface ReportParams {
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  status?: string;
  type?: string;
  currency?: string;
  organizationId?: string;
  format?: 'JSON' | 'CSV' | 'XLSX' | 'PDF';
}

class ReportsService {
  /**
   * Get Payment Report
   * Endpoint: GET /api/reports/payments
   */
  async getPaymentReport(params?: ReportParams): Promise<ApiResponse<PaymentReportData>> {
    try {
      const queryParams: ReportParams = {
        ...params,
        format: params?.format || 'JSON',
      };
      const response = await apiClient.get<any>('/reports/payments', queryParams);
      
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'REPORT_FETCH_ERROR', message: 'Failed to fetch payment report' },
        };
      }

      // Handle response structure from API
      const data = response.data.data || response.data;
      return {
        success: true,
        data: {
          payments: data.payments || [],
          summary: data.summary || { total: 0, successful: 0, failed: 0 },
        },
      };
    } catch (error: any) {
      console.error('Error fetching payment report:', error);
      return {
        success: false,
        error: {
          code: 'PAYMENT_REPORT_ERROR',
          message: error?.message || 'Failed to fetch payment report',
        },
      };
    }
  }

  /**
   * Get Transaction Report
   * Endpoint: GET /api/reports/transactions
   */
  async getTransactionReport(params?: ReportParams): Promise<ApiResponse<TransactionReportData>> {
    try {
      const queryParams: ReportParams = {
        ...params,
        format: params?.format || 'JSON',
      };
      const response = await apiClient.get<any>('/reports/transactions', queryParams);
      
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'REPORT_FETCH_ERROR', message: 'Failed to fetch transaction report' },
        };
      }

      const data = response.data.data || response.data;
      return {
        success: true,
        data: {
          transactions: data.transactions || [],
          summary: data.summary || { total: 0 },
        },
      };
    } catch (error: any) {
      console.error('Error fetching transaction report:', error);
      return {
        success: false,
        error: {
          code: 'TRANSACTION_REPORT_ERROR',
          message: error?.message || 'Failed to fetch transaction report',
        },
      };
    }
  }

  /**
   * Get Financial Report
   * Endpoint: GET /api/reports/financial
   */
  async getFinancialReport(params?: ReportParams): Promise<ApiResponse<FinancialReportData>> {
    try {
      const queryParams: ReportParams = {
        ...params,
        format: params?.format || 'JSON',
      };
      const response = await apiClient.get<any>('/reports/financial', queryParams);
      
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || { code: 'REPORT_FETCH_ERROR', message: 'Failed to fetch financial report' },
        };
      }

      const data = response.data.data || response.data;
      return {
        success: true,
        data: {
          revenue: data.revenue ?? 0,
          refunds: data.refunds ?? 0,
          net: data.net ?? 0,
          byCurrency: data.byCurrency || {},
        },
      };
    } catch (error: any) {
      console.error('Error fetching financial report:', error);
      return {
        success: false,
        error: {
          code: 'FINANCIAL_REPORT_ERROR',
          message: error?.message || 'Failed to fetch financial report',
        },
      };
    }
  }

  /**
   * Export Payment Report
   * Endpoint: GET /api/reports/payments/export
   */
  async exportPaymentReport(params: { 
    startDate?: string; 
    endDate?: string; 
    status?: string; 
    organizationId?: string;
    currency?: string;
    format?: 'CSV' | 'XLSX' | 'PDF' 
  }): Promise<ApiResponse<Blob>> {
    return this.exportReportFile('/reports/payments/export', params);
  }

  /**
   * Export Transaction Report
   * Endpoint: GET /api/reports/transactions/export
   */
  async exportTransactionReport(params: { 
    startDate?: string; 
    endDate?: string; 
    type?: string; 
    organizationId?: string;
    currency?: string;
    format?: 'CSV' | 'XLSX' | 'PDF' 
  }): Promise<ApiResponse<Blob>> {
    return this.exportReportFile('/reports/transactions/export', params);
  }

  /**
   * Export Financial Report
   * Endpoint: GET /api/reports/financial/export
   */
  async exportFinancialReport(params: { 
    startDate?: string; 
    endDate?: string; 
    currency?: string; 
    organizationId?: string;
    format?: 'CSV' | 'XLSX' | 'PDF' 
  }): Promise<ApiResponse<Blob>> {
    return this.exportReportFile('/reports/financial/export', params);
  }

  /**
   * Helper method to export report files
   */
  private async exportReportFile(endpoint: string, params: Record<string, any>): Promise<ApiResponse<Blob>> {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3005';
      const apiVersion = '/api';
      const urlParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          urlParams.append(key, String(value));
        }
      });

      const url = `${base}${apiVersion}${endpoint}?${urlParams.toString()}`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('apiKey') : null;
      const headers: Record<string, string> = {};
      
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (apiKey) headers['x-api-key'] = apiKey;

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const text = await res.text();
        let errorMessage = 'Export failed';
        try {
          const errorJson = JSON.parse(text);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        return { 
          success: false, 
          error: { 
            code: `HTTP_${res.status}`, 
            message: errorMessage 
          } 
        };
      }

      const blob = await res.blob();
      return { success: true, data: blob };
    } catch (error: any) {
      console.error('Error exporting report:', error);
      return { 
        success: false, 
        error: { 
          code: 'NETWORK_ERROR', 
          message: error?.message || 'Network error during export' 
        } 
      };
    }
  }
}

export const reportsService = new ReportsService();


