/**
 * Statistics & Analytics API Service
 */

import { apiClient, ApiResponse } from './client';

export interface Statistics {
  period: string;
  value: string;
  revenue: number;
  transactions: number;
  refunds: number;
  chargebacks: number;
  dataPoints: Array<{
    label: string;
    revenue: number;
    date: string;
    transactions: number;
  }>;
  previousPeriod?: {
    revenue: number;
    transactions: number;
  } | null;
  totals: {
    revenue: number;
    transactions: number;
    refunds: number;
    chargebacks: number;
  };
}

export interface DailyStatistics {
  startDate: string;
  endDate: string;
  data: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
}

class StatisticsService {
  async getStatistics(params: {
    period: 'days' | 'weeks' | 'months' | 'quarters' | 'years';
    value: string;
    comparePrevious?: boolean;
  }): Promise<ApiResponse<Statistics>> {
    // Backwards-compatible wrapper: call timeseries endpoint when possible
    const orgId = typeof window !== 'undefined' ? localStorage.getItem('currentOrganizationId') : null;
    if (orgId) {
      // Map period/value to timeseries query
      const paramsMapping: any = {
        startDate: undefined,
        endDate: undefined,
        granularity: params.period === 'days' ? 'day' : params.period === 'weeks' ? 'day' : params.period,
        metrics: ['total_volume', 'total_count'],
      };
      // If value looks like "Month YYYY" try to set start/end for that month
      try {
        const parts = params.value.split(' ');
        if (parts.length === 2) {
          const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
          const monthIndex = monthNames.indexOf(parts[0]);
          const year = parseInt(parts[1], 10);
          if (!isNaN(monthIndex) && !isNaN(year)) {
            const start = new Date(Date.UTC(year, monthIndex, 1)).toISOString();
            const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23,59,59)).toISOString();
            paramsMapping.startDate = start;
            paramsMapping.endDate = end;
          }
        }
      } catch (e) {
        // ignore
      }
      // Build querystring explicitly to support array params (metrics[])
      const qs = new URLSearchParams();
      if (paramsMapping.startDate) qs.append('startDate', paramsMapping.startDate);
      if (paramsMapping.endDate) qs.append('endDate', paramsMapping.endDate);
      if (paramsMapping.granularity) qs.append('granularity', paramsMapping.granularity);
      if (Array.isArray(paramsMapping.metrics)) {
        paramsMapping.metrics.forEach((m: string) => qs.append('metrics[]', m));
      } else if (paramsMapping.metrics) {
        qs.append('metrics', String(paramsMapping.metrics));
      }
      const resp = await apiClient.get<any>(`/organizations/${orgId}/statistics/timeseries?${qs.toString()}`);
      if (resp.success && resp.data) {
        // Normalize into existing Statistics shape minimally
        const dataPoints = Array.isArray(resp.data)
          ? resp.data.map((p: any, i: number) => ({ label: p.ts || p.date || `pt-${i}`, revenue: p.total_volume || 0, date: p.ts || p.date, transactions: p.total_count || 0 }))
          : [];
        const totals = {
          revenue: dataPoints.reduce((s: number, d: any) => s + (d.revenue || 0), 0),
          transactions: dataPoints.reduce((s: number, d: any) => s + (d.transactions || 0), 0),
          refunds: 0,
          chargebacks: 0,
        };
        return { success: true, data: { period: params.period, value: params.value, revenue: totals.revenue, transactions: totals.transactions, refunds: 0, chargebacks: 0, dataPoints, previousPeriod: null, totals } };
      }
      return resp;
    }
    return apiClient.get<Statistics>('/statistics', params);
  }

  async getDailyStatistics(params: {
    startDate: string;
    endDate: string;
  }): Promise<ApiResponse<DailyStatistics>> {
    const orgId = typeof window !== 'undefined' ? localStorage.getItem('currentOrganizationId') : null;
    if (orgId) {
      return apiClient.get<DailyStatistics>(`/organizations/${orgId}/statistics/timeseries`, params as any);
    }
    return apiClient.get<DailyStatistics>('/statistics/daily', params);
  }

  async getOverview(params: { startDate: string; endDate: string; tz?: string }) {
    const orgId = typeof window !== 'undefined' ? localStorage.getItem('currentOrganizationId') : null;
    if (!orgId) return { success: false, error: { code: 'NO_ORG', message: 'No organization selected' } } as ApiResponse<any>;
    return apiClient.get(`/organizations/${orgId}/statistics/overview`, params as any);
  }

  async getTimeSeries(params: { startDate: string; endDate: string; granularity?: 'hour'|'day'|'month'; metrics?: string[]; tz?: string; currency?: string; payment_method?: string; productId?: string; status?: string }) {
    const orgId = typeof window !== 'undefined' ? localStorage.getItem('currentOrganizationId') : null;
    if (!orgId) return { success: false, error: { code: 'NO_ORG', message: 'No organization selected' } } as ApiResponse<any>;
    // Build querystring manually to ensure arrays are passed correctly
    const qs = new URLSearchParams();
    if (params.startDate) qs.append('startDate', params.startDate);
    if (params.endDate) qs.append('endDate', params.endDate);
    if (params.granularity) qs.append('granularity', params.granularity);
    if (params.tz) qs.append('tz', params.tz);
    if (params.currency) qs.append('currency', params.currency);
    if (params.payment_method) qs.append('payment_method', params.payment_method);
    if (params.productId) qs.append('productId', params.productId);
    if (params.status) qs.append('status', params.status);
    if (Array.isArray(params.metrics)) {
      params.metrics.forEach((m) => qs.append('metrics[]', m));
    } else if (params.metrics) {
      qs.append('metrics', String(params.metrics));
    }
    return apiClient.get(`/organizations/${orgId}/statistics/timeseries?${qs.toString()}`);
  }

  async getBreakdown(params: { startDate: string; endDate: string; dimension: 'payment_method' | 'status' | 'currency' | 'product'; tz?: string }) {
    const orgId = typeof window !== 'undefined' ? localStorage.getItem('currentOrganizationId') : null;
    if (!orgId) return { success: false, error: { code: 'NO_ORG', message: 'No organization selected' } } as ApiResponse<any>;
    return apiClient.get(`/organizations/${orgId}/statistics/breakdown`, params as any);
  }

  async getEvents(params: { startDate?: string; endDate?: string; page?: number; limit?: number; status?: string; type?: string; tz?: string }) {
    const orgId = typeof window !== 'undefined' ? localStorage.getItem('currentOrganizationId') : null;
    if (!orgId) return { success: false, error: { code: 'NO_ORG', message: 'No organization selected' } } as ApiResponse<any>;
    return apiClient.get(`/organizations/${orgId}/statistics/events`, params as any);
  }

  async refreshStatistics() {
    const orgId = typeof window !== 'undefined' ? localStorage.getItem('currentOrganizationId') : null;
    if (!orgId) return { success: false, error: { code: 'NO_ORG', message: 'No organization selected' } } as ApiResponse<any>;
    return apiClient.post(`/organizations/${orgId}/statistics/refresh`, {});
  }
}

export const statisticsService = new StatisticsService();


