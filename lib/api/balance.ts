/**
 * Balance & Transactions API Service
 * MOCK MODE: Using localStorage for balance data (no backend required)
 */

import { ApiResponse, PaginationResponse } from './client';

export interface Balance {
  currency: string;
  available: number;
  pending: number;
  reserved: number;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'payout' | 'fee' | 'chargeback';
  amount: number;
  currency: string;
  description?: string;
  status: string;
  createdAt: string;
}

export interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description?: string;
  estimatedArrival?: string;
  createdAt: string;
}

export interface TransactionsListResponse {
  transactions: Transaction[];
  pagination: PaginationResponse;
}

export interface PayoutsListResponse {
  payouts: Payout[];
  pagination: PaginationResponse;
}

// Storage keys
const MOCK_BALANCE_KEY = 'mock_balance';
const MOCK_TRANSACTIONS_KEY = 'mock_balance_transactions';
const MOCK_PAYOUTS_KEY = 'mock_payouts';

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

function getStorageSingle<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveStorageSingle<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to ${key}:`, error);
  }
}

// Initialize mock balance and transactions
function initializeMockBalance() {
  if (typeof window === 'undefined') return;
  
  // Initialize balance
  if (!localStorage.getItem(MOCK_BALANCE_KEY)) {
    const balance: Balance = {
      currency: 'XAF',
      available: 2500000, // 2.5M XAF
      pending: 450000, // 450K XAF
      reserved: 100000, // 100K XAF
      lastUpdated: new Date().toISOString(),
    };
    saveStorageSingle(MOCK_BALANCE_KEY, balance);
  }
  
  // Initialize transactions
  if (!localStorage.getItem(MOCK_TRANSACTIONS_KEY)) {
    const now = new Date();
    const transactions: Transaction[] = [];
    
    // Get payments from payments service to create transactions
    const MOCK_PAYMENTS_KEY = 'mock_payments';
    const payments = getStorage<any>(MOCK_PAYMENTS_KEY);
    
    // Create transactions from payments
    payments.slice(0, 15).forEach((payment: any) => {
      if (payment.status === 'paid') {
        transactions.push({
          id: `txn_${payment.id}`,
          type: 'payment',
          amount: payment.amount,
          currency: payment.currency,
          description: payment.description || 'Payment received',
          status: 'completed',
          createdAt: payment.paidAt || payment.createdAt,
        });
      }
    });
    
    // Add some refunds and payouts
    const MOCK_REFUNDS_KEY = 'mock_refunds';
    const refunds = getStorage<any>(MOCK_REFUNDS_KEY);
    refunds.slice(0, 5).forEach((refund: any) => {
      transactions.push({
        id: `txn_${refund.id}`,
        type: 'refund',
        amount: refund.amount,
        currency: refund.currency,
        description: refund.description || 'Refund processed',
        status: refund.status === 'completed' ? 'completed' : 'pending',
        createdAt: refund.createdAt,
      });
    });
    
    // Add some payout transactions
    for (let i = 0; i < 3; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - daysAgo);
      
      transactions.push({
        id: generateId('txn'),
        type: 'payout',
        amount: Math.floor(Math.random() * 500000) + 100000,
        currency: 'XAF',
        description: 'Withdrawal to bank account',
        status: ['completed', 'pending', 'processing'][Math.floor(Math.random() * 3)],
        createdAt: createdAt.toISOString(),
      });
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    saveStorage(MOCK_TRANSACTIONS_KEY, transactions);
  }
  
  // Initialize payouts
  if (!localStorage.getItem(MOCK_PAYOUTS_KEY)) {
    const now = new Date();
    const payouts: Payout[] = [];
    
    for (let i = 0; i < 5; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - daysAgo);
      
      const statuses: Payout['status'][] = ['completed', 'pending', 'processing', 'failed'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const payout: Payout = {
        id: generateId('payout'),
        amount: Math.floor(Math.random() * 1000000) + 200000,
        currency: 'XAF',
        status,
        description: 'Withdrawal request',
        createdAt: createdAt.toISOString(),
        estimatedArrival: status === 'pending' || status === 'processing' 
          ? new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
      };
      
      payouts.push(payout);
    }
    
    payouts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    saveStorage(MOCK_PAYOUTS_KEY, payouts);
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeMockBalance();
}

// Helper for pagination
function paginate<T>(items: T[], page: number = 1, limit: number = 20): { items: T[]; pagination: PaginationResponse } {
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedItems = items.slice(start, end);
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  
  return {
    items: paginatedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Helper to filter transactions
function filterTransactions(transactions: Transaction[], params?: {
  type?: string;
  startDate?: string;
  endDate?: string;
}): Transaction[] {
  let filtered = [...transactions];
  
  if (params?.type) {
    filtered = filtered.filter(t => t.type === params.type);
  }
  
  if (params?.startDate) {
    const start = new Date(params.startDate);
    filtered = filtered.filter(t => new Date(t.createdAt) >= start);
  }
  
  if (params?.endDate) {
    const end = new Date(params.endDate);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter(t => new Date(t.createdAt) <= end);
  }
  
  return filtered;
}

class BalanceService {
  async getBalance(currency?: string): Promise<ApiResponse<Balance>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    let balance = getStorageSingle<Balance>(MOCK_BALANCE_KEY);
    
    if (!balance) {
      balance = {
        currency: currency || 'XAF',
        available: 0,
        pending: 0,
        reserved: 0,
        lastUpdated: new Date().toISOString(),
      };
      saveStorageSingle(MOCK_BALANCE_KEY, balance);
    }
    
    // Update currency if specified
    if (currency && balance.currency !== currency) {
      balance.currency = currency;
      saveStorageSingle(MOCK_BALANCE_KEY, balance);
    }
    
    return { success: true, data: balance };
  }

  async getTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<TransactionsListResponse>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (typeof window === 'undefined') {
      return {
        success: true,
        data: { transactions: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      };
    }
    
    let transactions = getStorage<Transaction>(MOCK_TRANSACTIONS_KEY);
    transactions = filterTransactions(transactions, params);
    
    const { items, pagination } = paginate(transactions, params?.page || 1, params?.limit || 20);
    
    return {
      success: true,
      data: {
        transactions: items,
        pagination,
      },
    };
  }

  async requestPayout(data: {
    amount: number;
    currency: string;
    description?: string;
  }): Promise<ApiResponse<Payout>> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const balance = getStorageSingle<Balance>(MOCK_BALANCE_KEY);
    if (!balance) {
      return {
        success: false,
        error: { code: 'BALANCE_NOT_FOUND', message: 'Balance not found' },
      };
    }
    
    if (data.amount > balance.available) {
      return {
        success: false,
        error: { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' },
      };
    }
    
    const payout: Payout = {
      id: generateId('payout'),
      amount: data.amount,
      currency: data.currency,
      status: 'pending',
      description: data.description,
      createdAt: new Date().toISOString(),
      estimatedArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    // Update balance
    balance.available -= data.amount;
    balance.pending += data.amount;
    balance.lastUpdated = new Date().toISOString();
    saveStorageSingle(MOCK_BALANCE_KEY, balance);
    
    // Add payout
    const payouts = getStorage<Payout>(MOCK_PAYOUTS_KEY);
    payouts.unshift(payout);
    saveStorage(MOCK_PAYOUTS_KEY, payouts);
    
    // Add transaction
    const transactions = getStorage<Transaction>(MOCK_TRANSACTIONS_KEY);
    const transaction: Transaction = {
      id: generateId('txn'),
      type: 'payout',
      amount: data.amount,
      currency: data.currency,
      description: data.description || 'Withdrawal request',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    transactions.unshift(transaction);
    saveStorage(MOCK_TRANSACTIONS_KEY, transactions);
    
    return { success: true, data: payout };
  }

  async getPayouts(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<PayoutsListResponse>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return {
        success: true,
        data: { payouts: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      };
    }
    
    let payouts = getStorage<Payout>(MOCK_PAYOUTS_KEY);
    
    if (params?.status) {
      payouts = payouts.filter(p => p.status === params.status);
    }
    
    const { items, pagination } = paginate(payouts, params?.page || 1, params?.limit || 20);
    
    return {
      success: true,
      data: {
        payouts: items,
        pagination,
      },
    };
  }

  async getPayout(payoutId: string): Promise<ApiResponse<Payout>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Payout not found' },
      };
    }
    
    const payouts = getStorage<Payout>(MOCK_PAYOUTS_KEY);
    const payout = payouts.find(p => p.id === payoutId);
    
    if (!payout) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Payout not found' },
      };
    }
    
    return { success: true, data: payout };
  }
}

export const balanceService = new BalanceService();


