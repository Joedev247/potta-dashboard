// API Utility Functions

import { Transaction, PaymentStatus } from './types';

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status badge color class
 */
export function getStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
    processing: 'bg-blue-100 text-blue-700',
  };
  return colors[status] || colors.pending;
}

/**
 * Filter transactions by status
 */
export function filterTransactionsByStatus(
  transactions: Transaction[],
  status: PaymentStatus
): Transaction[] {
  return transactions.filter((tx) => tx.status === status);
}

/**
 * Calculate total amount from transactions
 */
export function calculateTotal(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

/**
 * Group transactions by date
 */
export function groupTransactionsByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  return transactions.reduce((groups, tx) => {
    const date = new Date(tx.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);
}

/**
 * Validate phone number format (basic validation)
 */
export function validatePhoneNumber(phone: string): boolean {
  // Basic validation - adjust regex based on your requirements
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Basic formatting - adjust based on your requirements
  return cleaned;
}

/**
 * Get payment provider display name
 */
export function getProviderDisplayName(provider: string): string {
  const names: Record<string, string> = {
    MTN: 'MTN Mobile Money',
    ORANGE: 'Orange Money',
    MOOV: 'Moov Money',
    AIRTEL: 'Airtel Money',
  };
  return names[provider] || provider;
}

/**
 * Check if transaction is recent (within last 24 hours)
 */
export function isRecentTransaction(transaction: Transaction): boolean {
  const now = new Date();
  const txDate = new Date(transaction.createdAt);
  const diffHours = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60);
  return diffHours < 24;
}

/**
 * Sort transactions by date (newest first)
 */
export function sortTransactionsByDate(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Get transaction status icon
 */
export function getStatusIcon(status: PaymentStatus): string {
  const icons: Record<PaymentStatus, string> = {
    completed: '✓',
    pending: '⏳',
    failed: '✗',
    cancelled: '⊘',
    processing: '⟳',
  };
  return icons[status] || '?';
}


