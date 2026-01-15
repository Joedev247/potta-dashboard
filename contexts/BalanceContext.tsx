'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { balanceService } from '@/lib/api';

export interface BalanceContextType {
  balance: { available: number; pending: number; reserved: number; currency: string; lastUpdated: string };
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  notifyTransactionCompleted: (transaction: any) => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState({ available: 0, pending: 0, reserved: 0, currency: 'XAF', lastUpdated: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh balance from API
  const refreshBalance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await balanceService.getBalance('XAF');
      if (response.success && response.data) {
        setBalance(response.data);
        console.log('[BalanceContext] Balance refreshed:', response.data);
      } else {
        setError(response.error?.message || 'Failed to load balance');
      }
    } catch (err: any) {
      console.error('[BalanceContext] Error refreshing balance:', err);
      setError(err?.message || 'Failed to load balance');
    } finally {
      setLoading(false);
    }
  }, []);

  // Notify that a transaction was completed (allows optimistic updates if needed)
  const notifyTransactionCompleted = useCallback(async (transaction: any) => {
    console.log('[BalanceContext] Transaction completed:', transaction);
    
    // Refresh balance after a short delay to allow backend to update
    // This ensures we get the most current balance
    setTimeout(() => {
      refreshBalance();
    }, 500);
  }, [refreshBalance]);

  // Load initial balance on mount
  useEffect(() => {
    refreshBalance();
    
    // Set up event listener for balance refresh events
    const handleBalanceRefreshEvent = () => {
      refreshBalance();
    };
    
    window.addEventListener('balanceRefresh', handleBalanceRefreshEvent);
    
    return () => {
      window.removeEventListener('balanceRefresh', handleBalanceRefreshEvent);
    };
  }, [refreshBalance]);

  return (
    <BalanceContext.Provider value={{ balance, loading, error, refreshBalance, notifyTransactionCompleted }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
}
