/**
 * Reports API Service
 * MOCK MODE: Using localStorage for reports data (no backend required)
 */

import { ApiResponse } from './client';

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

// Storage keys
const MOCK_SETTLEMENTS_KEY = 'mock_settlements';

// Helper functions
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to ${key}:`, error);
  }
}

// Initialize mock settlements data
function initializeMockSettlements() {
  if (typeof window === 'undefined') return;
  
  // Check if data already exists
  if (localStorage.getItem(MOCK_SETTLEMENTS_KEY)) return;
  
  const now = new Date();
  const settlements: Settlement[] = [];
  
  // Generate settlements for the last 6 months
  for (let i = 0; i < 18; i++) {
    const monthsAgo = Math.floor(i / 3); // 3 settlements per month
    const settlementDate = new Date(now);
    settlementDate.setMonth(settlementDate.getMonth() - monthsAgo);
    
    // Settlements typically happen on specific days (e.g., 1st, 15th, end of month)
    const dayOfMonth = [1, 15, 28][i % 3];
    settlementDate.setDate(dayOfMonth);
    
    const statuses: Settlement['status'][] = ['paid', 'pending'];
    const status = i < 3 ? 'pending' : 'paid'; // First 3 are pending, rest are paid
    
    const amount = Math.floor(Math.random() * 2000000) + 500000; // 500,000 - 2,500,000 XAF
    
    const settlement: Settlement = {
      id: generateId('stl'),
      date: settlementDate.toISOString().split('T')[0], // YYYY-MM-DD format
      amount,
      currency: 'XAF',
      status,
    };
    
    settlements.push(settlement);
  }
  
  // Sort by date (newest first)
  settlements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  saveStorage(MOCK_SETTLEMENTS_KEY, settlements);
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeMockSettlements();
}

// Helper to filter settlements
function filterSettlements(settlements: Settlement[], params?: {
  startDate?: string;
  endDate?: string;
  status?: string;
}): Settlement[] {
  let filtered = [...settlements];
  
  if (params?.startDate) {
    const start = new Date(params.startDate);
    filtered = filtered.filter(s => new Date(s.date) >= start);
  }
  
  if (params?.endDate) {
    const end = new Date(params.endDate);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter(s => new Date(s.date) <= end);
  }
  
  if (params?.status) {
    filtered = filtered.filter(s => s.status === params.status);
  }
  
  return filtered;
}

class ReportsService {
  async getSettlements(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<ApiResponse<SettlementsResponse>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (typeof window === 'undefined') {
      return {
        success: true,
        data: { settlements: [] },
      };
    }
    
    let settlements = getStorage<Settlement>(MOCK_SETTLEMENTS_KEY);
    settlements = filterSettlements(settlements, params);
    
    return {
      success: true,
      data: { settlements },
    };
  }

  async getBalanceReport(params: {
    startDate: string;
    endDate: string;
    currency?: string;
  }): Promise<ApiResponse<BalanceReport>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);
    
    // Calculate opening balance (random but realistic)
    const openingBalance = Math.floor(Math.random() * 5000000) + 1000000; // 1M - 5M XAF
    
    // Calculate closing balance (opening + transactions)
    // Get payments in date range
    const MOCK_PAYMENTS_KEY = 'mock_payments';
    const payments = getStorage<any>(MOCK_PAYMENTS_KEY);
    const paymentsInRange = payments.filter((p: any) => {
      const paymentDate = new Date(p.createdAt);
      return paymentDate >= startDate && paymentDate <= endDate && p.status === 'paid';
    });
    
    const totalPayments = paymentsInRange.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    
    // Get refunds in date range
    const MOCK_REFUNDS_KEY = 'mock_refunds';
    const refunds = getStorage<any>(MOCK_REFUNDS_KEY);
    const refundsInRange = refunds.filter((r: any) => {
      const refundDate = new Date(r.createdAt);
      return refundDate >= startDate && refundDate <= endDate && r.status === 'completed';
    });
    
    const totalRefunds = refundsInRange.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
    
    // Get chargebacks in date range
    const MOCK_CHARGEBACKS_KEY = 'mock_chargebacks';
    const chargebacks = getStorage<any>(MOCK_CHARGEBACKS_KEY);
    const chargebacksInRange = chargebacks.filter((c: any) => {
      const chargebackDate = new Date(c.createdAt);
      return chargebackDate >= startDate && chargebackDate <= endDate;
    });
    
    const totalChargebacks = chargebacksInRange.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
    
    // Calculate closing balance
    const closingBalance = openingBalance + totalPayments - totalRefunds - totalChargebacks;
    
    // Calculate pending amount (pending payments)
    const pendingPayments = payments.filter((p: any) => {
      const paymentDate = new Date(p.createdAt);
      return paymentDate >= startDate && paymentDate <= endDate && p.status === 'pending';
    });
    
    const pendingAmount = pendingPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const availableAmount = closingBalance - pendingAmount;
    
    const balanceReport: BalanceReport = {
      startDate: params.startDate,
      endDate: params.endDate,
      openingBalance,
      closingBalance: Math.max(0, closingBalance), // Ensure non-negative
      categories: [
        {
          category: 'Payments',
          pending: pendingAmount,
          available: availableAmount,
        },
        {
          category: 'Refunds',
          pending: refunds.filter((r: any) => {
            const refundDate = new Date(r.createdAt);
            return refundDate >= startDate && refundDate <= endDate && r.status === 'pending';
          }).reduce((sum: number, r: any) => sum + (r.amount || 0), 0),
          available: totalRefunds,
        },
        {
          category: 'Chargebacks',
          pending: chargebacks.filter((c: any) => {
            const chargebackDate = new Date(c.createdAt);
            return chargebackDate >= startDate && chargebackDate <= endDate && c.status === 'open';
          }).reduce((sum: number, c: any) => sum + (c.amount || 0), 0),
          available: totalChargebacks,
        },
      ],
    };
    
    return {
      success: true,
      data: balanceReport,
    };
  }

  async exportReport(data: ExportReportData): Promise<ApiResponse<Blob>> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    // Mock export - create a simple text blob
    const content = `Report Type: ${data.reportType}\nFormat: ${data.format}\nDate Range: ${data.startDate} to ${data.endDate}\n\n[MOCK] This is a mock export. In production, this would generate a ${data.format.toUpperCase()} file.`;
    const blob = new Blob([content], { type: 'text/plain' });
    
    console.log(`[MOCK] Exporting ${data.reportType} report as ${data.format}`, data);
    
    return {
      success: true,
      data: blob,
    };
  }
}

export const reportsService = new ReportsService();


