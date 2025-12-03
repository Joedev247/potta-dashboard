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
    return apiClient.get<Statistics>('/statistics', params);
  }

  async getDailyStatistics(params: {
    startDate: string;
    endDate: string;
  }): Promise<ApiResponse<DailyStatistics>> {
    return apiClient.get<DailyStatistics>('/statistics/daily', params);
  }
}

export const statisticsService = new StatisticsService();

