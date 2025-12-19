'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ClockClockwise, 
  MagnifyingGlass, 
  Funnel, 
  Calendar, 
  CaretLeft, 
  CaretRight,
  Spinner,
  Eye,
  WarningCircle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from '@phosphor-icons/react';
import { usersService, type CustomerTransaction } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format';

export default function CustomerTransactionsPage() {
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<CustomerTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filterType !== 'all') {
        params.type = filterType;
      }

      if (dateRange.startDate) {
        params.startDate = dateRange.startDate;
      }

      if (dateRange.endDate) {
        params.endDate = dateRange.endDate;
      }

      const response = await usersService.getTransactions(params);
      
      if (response.success && response.data) {
        setTransactions(response.data.transactions);
        setPagination(response.data.pagination);
      } else {
        setError(response.error?.message || 'Failed to load transactions');
        setTransactions([]);
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err?.message || 'Failed to load transactions. Please try again.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filterType, dateRange]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Filter transactions by search query and status
  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch = 
      !searchQuery ||
      txn.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.amount.toString().includes(searchQuery);

    const matchesStatus = filterStatus === 'all' || txn.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Get transaction status icon and color
  const getStatusInfo = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed' || statusLower === 'success' || statusLower === 'paid') {
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Completed' };
    }
    if (statusLower === 'pending' || statusLower === 'processing') {
      return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' };
    }
    if (statusLower === 'failed' || statusLower === 'cancelled' || statusLower === 'rejected') {
      return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Failed' };
    }
    return { icon: WarningCircle, color: 'text-gray-600', bg: 'bg-gray-50', label: status };
  };

  // Get transaction type icon
  const getTypeIcon = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower === 'payment' || typeLower === 'deposit' || typeLower === 'credit') {
      return { icon: ArrowDownRight, color: 'text-green-600' };
    }
    if (typeLower === 'refund' || typeLower === 'withdrawal' || typeLower === 'debit') {
      return { icon: ArrowUpRight, color: 'text-red-600' };
    }
    return { icon: History, color: 'text-gray-600' };
  };

  // View transaction details
  const handleViewTransaction = async (transactionId: string) => {
    try {
      const response = await usersService.getTransaction(transactionId);
      if (response.success && response.data) {
        setSelectedTransaction(response.data);
      } else {
        setError(response.error?.message || 'Failed to load transaction details');
      }
    } catch (err: any) {
      console.error('Error fetching transaction:', err);
      setError(err?.message || 'Failed to load transaction details');
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">My Transactions</h1>
                <p className="text-gray-600 mt-1">View your complete transaction history</p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border-2 border-gray-300 hover:border-green-500 transition-colors flex items-center gap-2"
            >
              <Funnel className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions by ID, description, or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-white border-2 border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                  >
                    <option value="all">All Types</option>
                    <option value="payment">Payment</option>
                    <option value="refund">Refund</option>
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setFilterType('all');
                    setFilterStatus('all');
                    setDateRange({ startDate: '', endDate: '' });
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2">
            <WarningCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Transactions List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white border-2 border-gray-200 p-12 text-center">
            <ClockClockwise className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600">
              {searchQuery || filterType !== 'all' || filterStatus !== 'all' || dateRange.startDate || dateRange.endDate
                ? 'Try adjusting your filters'
                : 'You don\'t have any transactions yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white border-2 border-gray-200">
              <div className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => {
                  const statusInfo = getStatusInfo(transaction.status);
                  const typeInfo = getTypeIcon(transaction.type);
                  const StatusIcon = statusInfo.icon;
                  const TypeIcon = typeInfo.icon;
                  const isCredit = transaction.type.toLowerCase() === 'payment' || transaction.type.toLowerCase() === 'deposit';

                  return (
                    <div
                      key={transaction.id}
                      onClick={() => handleViewTransaction(transaction.id)}
                      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-12 h-12 ${statusInfo.bg} rounded-full flex items-center justify-center`}>
                            <TypeIcon className={`w-6 h-6 ${typeInfo.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                              </h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3 inline mr-1" />
                                {statusInfo.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {transaction.description || `Transaction ${transaction.id.substring(0, 8)}...`}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDateTime(transaction.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                            {isCredit ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">ID: {transaction.id.substring(0, 12)}...</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-4 py-2 border-2 border-gray-300 hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
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
                    className="px-4 py-2 border-2 border-gray-300 hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    Next
                    <CaretRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedTransaction.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <p className="text-gray-900">{selectedTransaction.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <p className="text-gray-900 font-semibold text-lg">
                    {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${getStatusInfo(selectedTransaction.status).bg} ${getStatusInfo(selectedTransaction.status).color}`}>
                    {(() => {
                      const StatusIcon = getStatusInfo(selectedTransaction.status).icon;
                      return <StatusIcon className="w-4 h-4" />;
                    })()}
                    {getStatusInfo(selectedTransaction.status).label}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                  <p className="text-gray-900">{formatDateTime(selectedTransaction.createdAt)}</p>
                </div>
                {selectedTransaction.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Updated At</label>
                    <p className="text-gray-900">{formatDateTime(selectedTransaction.updatedAt)}</p>
                  </div>
                )}
              </div>

              {selectedTransaction.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900">{selectedTransaction.description}</p>
                </div>
              )}

              {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metadata</label>
                  <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedTransaction.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

