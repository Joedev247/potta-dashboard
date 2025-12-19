'use client';

import { Wallet, ArrowDown, ArrowUp, ArrowUpRight, X, CheckCircle, WarningCircle, ArrowClockwise, Spinner, TrendUp, TrendDown, Clock, Funnel, MagnifyingGlass, Calendar, Download, Eye, EyeSlash, CreditCard, DeviceMobile, Building, CaretLeft, CaretRight } from '@phosphor-icons/react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { balanceService } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format';

export default function WalletPage() {
  // Modal states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  // Action states
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  
  // Form states
  const [depositData, setDepositData] = useState({
    amount: '',
    currency: 'XAF',
    method: 'MTN Mobile Money',
    description: '',
  });
  
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    currency: 'XAF',
    description: '',
  });

  // Balance state
  const [balance, setBalance] = useState({ available: 0, pending: 0, reserved: 0, currency: 'XAF', lastUpdated: '' });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState({ balance: false, transactions: false, payouts: false });
  const [error, setError] = useState<{ balance?: string; transactions?: string }>({});
  const [showBalance, setShowBalance] = useState(true);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    setLoading(prev => ({ ...prev, balance: true }));
    setError(prev => ({ ...prev, balance: undefined }));
    try {
      const response = await balanceService.getBalance('XAF');
      if (response.success && response.data) {
        setBalance(response.data);
      } else {
        setError(prev => ({ 
          ...prev, 
          balance: response.error?.message || 'Failed to load balance' 
        }));
      }
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      setError(prev => ({ 
        ...prev, 
        balance: error?.message || 'Failed to load balance. Please try again.' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, balance: false }));
    }
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    const page = pagination.page;
    setLoading(prev => ({ ...prev, transactions: true }));
    setError(prev => ({ ...prev, transactions: undefined }));
    try {
      const params: any = {
        page,
        limit: pagination.limit,
      };

      if (filterType !== 'all') {
        params.type = filterType;
      }

      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      if (dateRange.startDate) {
        params.startDate = dateRange.startDate;
      }

      if (dateRange.endDate) {
        params.endDate = dateRange.endDate;
      }

      const response = await balanceService.getTransactions(params);
      if (response.success && response.data) {
        setTransactions(response.data.transactions || []);
        setPagination(response.data.pagination);
      } else {
        setError(prev => ({ 
          ...prev, 
          transactions: response.error?.message || 'Failed to load transactions' 
        }));
        setTransactions([]);
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      setError(prev => ({ 
        ...prev, 
        transactions: error?.message || 'Failed to load transactions. Please try again.' 
      }));
      setTransactions([]);
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  }, [pagination.page, pagination.limit, filterType, filterStatus, dateRange]);

  // Fetch payouts
  const fetchPayouts = useCallback(async () => {
    setLoading(prev => ({ ...prev, payouts: true }));
    try {
      const response = await balanceService.getPayouts();
      if (response.success && response.data) {
        setPayouts(response.data.payouts || []);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoading(prev => ({ ...prev, payouts: false }));
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchBalance();
    fetchTransactions();
    fetchPayouts();
  }, [fetchBalance, fetchPayouts]);

  // Refetch transactions when filters change
  useEffect(() => {
    if (pagination.page === 1) {
      fetchTransactions();
    } else {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [filterType, filterStatus, dateRange.startDate, dateRange.endDate, fetchTransactions]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      // fetchTransactions will be called automatically via useEffect when pagination.page changes
    }
  };

  // Refetch transactions when page changes
  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, fetchTransactions]);

  // Handle deposit
  const handleDeposit = async () => {
    setActionError(null);
    setActionSuccess(false);

    if (!depositData.amount || parseFloat(depositData.amount) <= 0) {
      setActionError('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate deposit (in real app, this would call an API)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a deposit transaction
      // Use crypto.randomUUID if available, otherwise use a timestamp-based ID
      const transactionId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const depositTransaction = {
        id: transactionId,
        type: 'payment' as const,
        amount: parseFloat(depositData.amount),
        currency: depositData.currency,
        description: depositData.description || `Deposit via ${depositData.method}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };

      // Update balance
      setBalance(prev => ({
        ...prev,
        available: prev.available + parseFloat(depositData.amount),
        lastUpdated: new Date().toISOString(),
      }));

      // Add to transactions
      setTransactions(prev => [depositTransaction, ...prev]);

      setActionSuccess(true);
      
      setTimeout(() => {
        setActionSuccess(false);
        setDepositData({
          amount: '',
          currency: 'XAF',
          method: 'MTN Mobile Money',
          description: '',
        });
        setShowDepositModal(false);
      }, 2000);
    } catch (err) {
      console.error('Deposit error:', err);
      setActionError('Failed to process deposit. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle withdraw
  const handleWithdraw = async () => {
    setActionError(null);
    setActionSuccess(false);

    if (!withdrawData.amount || parseFloat(withdrawData.amount) <= 0) {
      setActionError('Please enter a valid amount');
      return;
    }

    const requestedAmount = parseFloat(withdrawData.amount);
    
    if (requestedAmount > balance.available) {
      setActionError(`Insufficient balance. Available: ${formatCurrency(balance.available, withdrawData.currency)}`);
      return;
    }

    setIsProcessing(true);

    try {
      // Note: Payout request endpoint is not part of balances API
      // This would typically be handled by a separate payouts/payments service
      // Simulating payout request for now
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In production, this would call: paymentsService.requestPayout() or payoutsService.create()
      // For now, simulate success
      const response: ApiResponse<any> = { success: true };

      if (response.success) {
        setActionSuccess(true);
        await fetchBalance();
        await fetchTransactions();
        await fetchPayouts();
        
        setTimeout(() => {
          setActionSuccess(false);
          setWithdrawData({
            amount: '',
            currency: 'XAF',
            description: '',
          });
          setShowWithdrawModal(false);
        }, 2000);
      } else {
        setActionError(response.error?.message || 'Failed to process withdrawal. Please try again.');
      }
    } catch (err) {
      console.error('Withdraw error:', err);
      setActionError('Failed to process withdrawal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter transactions by search query (client-side filtering for search only)
  const filteredTransactions = transactions.filter(transaction => {
    if (!searchQuery) return true;
    return (
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.amount.toString().includes(searchQuery)
    );
  });

  // Calculate stats
  const stats = {
    totalIncome: transactions
      .filter(t => t.type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions
      .filter(t => (t.type === 'payout' || t.type === 'refund' || t.type === 'fee') && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    pendingPayouts: payouts.filter(p => p.status === 'pending' || p.status === 'processing').length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Wallet</h1>
              <p className="text-xs sm:text-sm text-gray-600">Manage your balance and transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              {showBalance ? <EyeSlash className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button
              onClick={() => {
                fetchBalance();
                fetchTransactions();
                fetchPayouts();
              }}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowClockwise className={`w-4 h-4 sm:w-5 sm:h-5 ${loading.balance ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Balance Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Main Balance Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 p-4 sm:p-6 lg:p-8 text-white shadow-xl transform hover:scale-[1.02] transition-transform duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-green-100 text-xs sm:text-sm font-medium">Available Balance</p>
                <p className="text-white/80 text-xs">{balance.currency}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-green-100 text-xs sm:text-sm">Last updated</p>
              <p className="text-white/80 text-xs">{balance.lastUpdated ? formatDate(balance.lastUpdated) : 'Just now'}</p>
            </div>
          </div>
          
          <div className="mb-4 sm:mb-6">
            {error.balance && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2">
                  <WarningCircle className="w-4 h-4" />
                  {error.balance}
                </div>
            )}
            {loading.balance ? (
              <Spinner className="w-8 h-8 sm:w-12 sm:h-12 animate-spin" />
            ) : (
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
                {showBalance ? formatCurrency(balance.available, balance.currency) : '••••••'}
              </div>
            )}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-green-100">
              <div className="flex items-center gap-2">
                <TrendUp className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Pending: {showBalance ? formatCurrency(balance.pending, balance.currency) : '••••'}</span>
              </div>
              {balance.reserved > 0 && (
                <div className="flex items-center gap-2">
                  <WarningCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Reserved: {showBalance ? formatCurrency(balance.reserved, balance.currency) : '••••'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setShowDepositModal(true)}
              className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-3 sm:py-4 px-4 transition-all flex items-center justify-center gap-2 transform hover:scale-105 text-sm sm:text-base"
            >
              <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
              Deposit
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-3 sm:py-4 px-4 transition-all flex items-center justify-center gap-2 transform hover:scale-105 text-sm sm:text-base"
            >
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
              Withdraw
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="space-y-3 sm:space-y-4">
          {/* Income Card */}
          <div className="bg-white p-4 sm:p-6 border-2 border-gray-200 hover:border-green-400 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Total Income</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(stats.totalIncome, balance.currency)}</p>
            <p className="text-xs text-gray-500 mt-1">From payments</p>
          </div>

          {/* Expenses Card */}
          <div className="bg-white p-4 sm:p-6 border-2 border-gray-200 hover:border-red-400 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Total Expenses</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(stats.totalExpenses, balance.currency)}</p>
            <p className="text-xs text-gray-500 mt-1">Payouts & fees</p>
          </div>
        </div>
      </div>

      {/* Pending Payouts Section */}
      {stats.pendingPayouts > 0 && (
        <div className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Pending Payouts</h3>
                <p className="text-xs sm:text-sm text-gray-600">{stats.pendingPayouts} payout{stats.pendingPayouts > 1 ? 's' : ''} being processed</p>
              </div>
            </div>
            <Link
              href="/payments?tab=refunds"
              className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors text-center"
            >
              View All
            </Link>
          </div>
        </div>
      )}

      {/* Transactions Section */}
      <div className="bg-white  border-2 border-gray-200 shadow-sm overflow-hidden">
        {/* Transactions Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Transaction History</h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  {pagination.total > 0 
                    ? `${pagination.total} transaction${pagination.total !== 1 ? 's' : ''}`
                    : 'No transactions'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Funnel className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-base border-2 border-gray-200 focus:outline-none focus:border-green-500"
              />
            </div>
            {showFilters && (
              <div className="mt-3 p-4 bg-gray-50 border border-gray-200  space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 text-base border-2 border-gray-200 focus:outline-none focus:border-green-500 bg-white"
                  >
                    <option value="all">All Types</option>
                    <option value="payment">Payments</option>
                    <option value="payout">Payouts</option>
                    <option value="refund">Refunds</option>
                    <option value="fee">Fees</option>
                    <option value="chargeback">Chargebacks</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 text-base border-2 border-gray-200 focus:outline-none focus:border-green-500 bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="px-4 py-2 text-base border-2 border-gray-200 focus:outline-none focus:border-green-500 bg-white"
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="px-4 py-2 text-base border-2 border-gray-200 focus:outline-none focus:border-green-500 bg-white"
                    placeholder="End Date"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setFilterType('all');
                      setFilterStatus('all');
                      setDateRange({ startDate: '', endDate: '' });
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error.transactions && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
            <WarningCircle className="w-5 h-5" />
            {error.transactions}
          </div>
        )}

        {/* Transactions List */}
        {loading.transactions ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="divide-y divide-gray-200">
              {transactions.map((transaction) => {
              const isIncome = transaction.type === 'payment';
              const isExpense = transaction.type === 'payout' || transaction.type === 'refund' || transaction.type === 'fee' || transaction.type === 'chargeback';
              
              return (
                <div
                  key={transaction.id}
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setShowTransactionDetails(true);
                  }}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isIncome ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {isIncome ? (
                          <ArrowDown className="w-6 h-6 text-green-600" />
                        ) : (
                          <ArrowUp className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 capitalize">{transaction.type}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            transaction.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{transaction.description || 'No description'}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDateTime(transaction.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${
                        isIncome ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-4 py-2 border-2 border-gray-300 hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm"
                  >
                    <CaretLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="px-4 py-2 border-2 border-gray-300 hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm"
                  >
                    Next
                    <CaretRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <Clock className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
            <p className="text-sm text-gray-600">
              {searchQuery || filterType !== 'all' || filterStatus !== 'all' || dateRange.startDate || dateRange.endDate
                ? 'Try adjusting your filters' 
                : 'Your transaction history will appear here'}
            </p>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!isProcessing) {
              setShowDepositModal(false);
              setActionError(null);
              setActionSuccess(false);
            }
          }}
        >
          <div 
            className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <ArrowDown className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Deposit Funds</h2>
              </div>
              <button
                onClick={() => {
                  if (!isProcessing) {
                    setShowDepositModal(false);
                    setActionError(null);
                    setActionSuccess(false);
                  }
                }}
                disabled={isProcessing}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {actionSuccess && (
                <div className="bg-green-50 border border-green-200 p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 font-medium">Deposit successful!</p>
                    <p className="text-xs text-green-700 mt-1">Your funds have been added to your wallet.</p>
                  </div>
                </div>
              )}

              {actionError && (
                <div className="bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                  <WarningCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{actionError}</p>
                  </div>
                  <button
                    onClick={() => setActionError(null)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Available Balance</span>
                  <span className="text-lg font-bold text-gray-900">{depositData.currency} {balance.available.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={depositData.method}
                  onChange={(e) => setDepositData({ ...depositData, method: e.target.value })}
                  disabled={isProcessing || actionSuccess}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-900 focus:outline-none focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="MTN Mobile Money">MTN Mobile Money</option>
                  <option value="Orange Money">Orange Money</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">
                    {depositData.currency}
                  </span>
                  <input
                    type="number"
                    value={depositData.amount}
                    onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={isProcessing || actionSuccess}
                    className="w-full pl-16 pr-4 py-3 bg-white border-2 border-gray-200 text-gray-900 focus:outline-none focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Minimum deposit: {depositData.currency} 1,000</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <textarea
                  value={depositData.description}
                  onChange={(e) => setDepositData({ ...depositData, description: e.target.value })}
                  placeholder="Add a note for this deposit"
                  rows={3}
                  disabled={isProcessing || actionSuccess}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-900 focus:outline-none focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  if (!isProcessing) {
                    setShowDepositModal(false);
                    setActionError(null);
                    setActionSuccess(false);
                  }
                }}
                disabled={isProcessing}
                className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={isProcessing || actionSuccess || !depositData.amount}
                className="px-6 py-3 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <ArrowClockwise className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowDown className="w-4 h-4" />
                    Deposit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!isProcessing) {
              setShowWithdrawModal(false);
              setActionError(null);
              setActionSuccess(false);
            }
          }}
        >
          <div 
            className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <ArrowUp className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Withdraw Funds</h2>
              </div>
              <button
                onClick={() => {
                  if (!isProcessing) {
                    setShowWithdrawModal(false);
                    setActionError(null);
                    setActionSuccess(false);
                  }
                }}
                disabled={isProcessing}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {actionSuccess && (
                <div className="bg-green-50 border border-green-200 p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 font-medium">Withdrawal request submitted!</p>
                    <p className="text-xs text-green-700 mt-1">Your withdrawal will be processed within 1-3 business days.</p>
                  </div>
                </div>
              )}

              {actionError && (
                <div className="bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                  <WarningCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{actionError}</p>
                  </div>
                  <button
                    onClick={() => setActionError(null)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200  p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Available Balance</span>
                  <span className="text-lg font-bold text-gray-900">{withdrawData.currency} {balance.available.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="text-sm text-gray-900">{withdrawData.currency} {balance.pending.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">
                    {withdrawData.currency}
                  </span>
                  <input
                    type="number"
                    value={withdrawData.amount}
                    onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={isProcessing || actionSuccess}
                    className="w-full pl-16 pr-4 py-3 bg-white border-2 border-gray-200 text-gray-900 focus:outline-none focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Maximum: {withdrawData.currency} {balance.available.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <textarea
                  value={withdrawData.description}
                  onChange={(e) => setWithdrawData({ ...withdrawData, description: e.target.value })}
                  placeholder="Add a note for this withdrawal"
                  rows={3}
                  disabled={isProcessing || actionSuccess}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-900  focus:outline-none focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start gap-3">
                  <WarningCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-800 font-medium mb-1">Processing Time</p>
                    <p className="text-xs text-blue-700">
                      Withdrawals are typically processed within 1-3 business days. You'll receive a notification once completed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  if (!isProcessing) {
                    setShowWithdrawModal(false);
                    setActionError(null);
                    setActionSuccess(false);
                  }
                }}
                disabled={isProcessing}
                className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isProcessing || actionSuccess || !withdrawData.amount}
                className="px-6 py-3 bg-red-500 text-white font-medium hover:bg-red-600 transition-colors  disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <ArrowClockwise className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-4 h-4" />
                    Withdraw
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showTransactionDetails && selectedTransaction && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowTransactionDetails(false);
            setSelectedTransaction(null);
          }}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
              <button
                onClick={() => {
                  setShowTransactionDetails(false);
                  setSelectedTransaction(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-mono text-sm text-gray-900">{selectedTransaction.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Type</span>
                <span className="font-semibold text-gray-900 capitalize">{selectedTransaction.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Amount</span>
                <span className={`text-lg font-bold ${
                  selectedTransaction.type === 'payment' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedTransaction.type === 'payment' ? '+' : '-'}
                  {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  selectedTransaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                  selectedTransaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  selectedTransaction.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedTransaction.status}
                </span>
              </div>
              {selectedTransaction.description && (
                <div>
                  <span className="text-gray-600 block mb-1">Description</span>
                  <p className="text-gray-900">{selectedTransaction.description}</p>
                </div>
              )}
              <div>
                <span className="text-gray-600 block mb-1">Date</span>
                <p className="text-gray-900">{formatDateTime(selectedTransaction.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
