/**
 * Utility functions for formatting API data for display
 */

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return "Invalid Date";
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }
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

export const formatCurrency = (amount: number | string | null | undefined, currency: string = 'XAF'): string => {
  // Handle null, undefined, or empty string
  if (amount === null || amount === undefined || amount === '') {
    return `${currency} 0.00`;
  }
  
  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle NaN or invalid numbers
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return `${currency} 0.00`;
  }
  
  return `${currency} ${numAmount.toFixed(2)}`;
};

export const formatAmount = (amount: number | string | null | undefined, currency: string = 'XAF'): string => {
  return formatCurrency(amount, currency);
};


