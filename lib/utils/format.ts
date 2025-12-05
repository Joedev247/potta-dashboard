/**
 * Utility functions for formatting API data for display
 */

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount: number, currency: string = 'XAF'): string => {
  return `${currency} ${amount.toFixed(2)}`;
};

export const formatAmount = (amount: number | string, currency: string = 'XAF'): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return formatCurrency(numAmount, currency);
};


