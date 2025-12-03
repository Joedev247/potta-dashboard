/**
 * Reports API Service
 */

import { apiClient, ApiResponse } from './client';

export interface Settlement {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid';
}

export interface BalanceReport {
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  categories: Array<{
    category: string;
    pending: number;
    available: number;
  }>;
}

export interface SettlementsResponse {
  settlements: Settlement[];
}

export interface ExportReportData {
  reportType: 'settlements' | 'balance' | 'invoices' | 'payments';
  format: 'pdf' | 'csv' | 'xlsx';
  startDate: string;
  endDate: string;
  filters?: Record<string, any>;
}

class ReportsService {
  async getSettlements(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<ApiResponse<SettlementsResponse>> {
    return apiClient.get<SettlementsResponse>('/reports/settlements', params);
  }

  async getBalanceReport(params: {
    startDate: string;
    endDate: string;
    currency?: string;
  }): Promise<ApiResponse<BalanceReport>> {
    return apiClient.get<BalanceReport>('/reports/balance', params);
  }

  async exportReport(data: ExportReportData): Promise<ApiResponse<Blob>> {
    return apiClient.post<Blob>('/reports/export', data);
  }
}

export const reportsService = new ReportsService();

