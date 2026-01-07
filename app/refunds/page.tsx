'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, MagnifyingGlass, Eye, X, CheckCircle, WarningCircle, Spinner, ArrowCounterClockwise, CaretLeft, CaretRight, Funnel, CurrencyDollar } from '@phosphor-icons/react';
import { refundsService, paymentsService, type Refund, type Payment } from '@/lib/api';
import { useOrganization } from '@/contexts/OrganizationContext';
import { formatDate, formatCurrency } from '@/lib/utils/format';

export default function RefundsPage() {
  const { organization } = useOrganization();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Form data
  const [formData, setFormData] = useState({
    payment_id: '',
    amount: '',
    reason: '',
    description: '',
  });

  // Fetch refunds
  const fetchRefunds = useCallback(async (page: number = pagination.page) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params: any = {
        page,
        limit: pagination.limit,
      };

      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await refundsService.listRefunds(params);
      if (response.success && response.data) {
        setRefunds(response.data.refunds || []);
        setPagination(response.data.pagination);
      } else {
        setRefunds([]);
        setErrorMessage(response.error?.message || 'Failed to load refunds');
      }
    } catch (error: any) {
      console.error('Error fetching refunds:', error);
      setRefunds([]);
      setErrorMessage(error?.message || 'Failed to load refunds. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filterStatus]);

  // Fetch payments for create form
  const fetchPayments = useCallback(async () => {
    try {
      const response = await paymentsService.getPayments({
        page: 1,
        limit: 100,
        status: 'SUCCESS', // Only show successful payments that can be refunded
      });

      if (response.success && response.data) {
        setPayments(response.data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
    fetchPayments();
  }, [fetchRefunds, fetchPayments]);

  // Refetch when filters change
  useEffect(() => {
    if (pagination.page === 1) {
      fetchRefunds(1);
    } else {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [filterStatus]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchRefunds(newPage);
    }
  };

  // Filter refunds by search query
  const filteredRefunds = refunds.filter(refund => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      refund.id.toLowerCase().includes(query) ||
      (refund.payment_id ?? '').toLowerCase().includes(query) ||
      (refund.reason ?? '').toLowerCase().includes(query) ||
      (refund.amount && refund.amount.toString().includes(query))
    );
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      payment_id: '',
      amount: '',
      reason: '',
      description: '',
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Handle create refund
  const handleCreateRefund = async () => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!formData.payment_id.trim()) {
      setErrorMessage('Payment is required');
      setActionLoading(false);
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setErrorMessage('Amount must be greater than 0');
      setActionLoading(false);
      return;
    }

    if (!formData.reason.trim()) {
      setErrorMessage('Reason is required');
      setActionLoading(false);
      return;
    }

    // Check if amount exceeds payment amount
    const selectedPayment = payments.find(p => p.id === formData.payment_id);
    if (selectedPayment && parseFloat(formData.amount) > selectedPayment.amount) {
      setErrorMessage(`Amount cannot exceed payment amount of ${formatCurrency(selectedPayment.amount, selectedPayment.currency)}`);
      setActionLoading(false);
      return;
    }

    try {
      const refundData = {
        payment_id: formData.payment_id.trim(),
        amount: parseFloat(formData.amount),
        reason: formData.reason.trim(),
        description: formData.description.trim() || undefined,
      };

      const response = await refundsService.createRefund(refundData);
      
      if (response.success) {
        setSuccessMessage('Refund created successfully!');
        await fetchRefunds();
        setTimeout(() => {
          resetForm();
          setShowCreateModal(false);
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to create refund. Please try again.');
      }
    } catch (error: any) {
      console.error('Create refund error:', error);
      setErrorMessage(error?.message || 'Failed to create refund. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle view refund
  const handleViewRefund = async (refund: Refund) => {
    setSelectedRefund(refund);
    setErrorMessage('');
    try {
      const response = await refundsService.getRefund(refund.id);
      if (response.success && response.data) {
        setSelectedRefund(response.data);
        setShowViewModal(true);
      } else {
        setErrorMessage(response.error?.message || 'Failed to load refund details');
        setShowViewModal(true);
      }
    } catch (error: any) {
      console.error('Error fetching refund details:', error);
      setErrorMessage(error?.message || 'Failed to load refund details');
      setShowViewModal(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-700';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-700';
      case 'FAILED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  // Get selected payment details
  const selectedPayment = payments.find(p => p.id === formData.payment_id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <ArrowCounterClockwise className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Refunds</h1>
              <p className="text-sm text-gray-600 mt-1">Manage payment refunds</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="w-full sm:w-auto px-4 sm:px-5 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Create Refund
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2">
          <WarningCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-4 sm:mb-6 space-y-3">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search refunds by ID, payment ID, reason, or amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-1 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Funnel className="w-4 h-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 text-base border-2 border-gray-200 focus:outline-none focus:border-green-500 bg-white rounded"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Refunds List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
            <div className="hidden lg:grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
              <div>Refund ID</div>
              <div>Payment ID</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredRefunds.length > 0 ? (
              filteredRefunds.map((refund) => (
                <div key={refund.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                  {/* Mobile Card Layout */}
                  <div className="lg:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">Refund #{refund.id.slice(0, 8)}</div>
                        <div className="text-xs text-gray-600 mt-1">Payment: {(refund.payment_id ?? '').slice(0, 8)}</div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(refund.status)}`}>
                        {refund.status}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(refund.amount, refund.currency || 'XAF')}
                    </div>
                    {refund.reason && (
                      <div className="text-xs text-gray-600">Reason: {refund.reason}</div>
                    )}
                    {refund.createdAt && (
                      <div className="text-xs text-gray-500">{formatDate(refund.createdAt)}</div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => handleViewRefund(refund)}
                        className="flex-1 px-3 py-2 text-sm font-medium border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors rounded flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </div>
                  {/* Desktop Table Layout */}
                  <div className="hidden lg:grid grid-cols-5 gap-4 items-center">
                    <div className="text-sm font-medium text-gray-900">#{refund.id.slice(0, 12)}</div>
                    <div className="text-sm text-gray-600">{(refund.payment_id ?? '').slice(0, 12)}</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(refund.amount, refund.currency || 'XAF')}
                    </div>
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(refund.status)}`}>
                        {refund.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewRefund(refund)}
                        className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 sm:px-6 py-6 sm:py-8 text-center text-sm text-gray-500">
                {searchQuery || filterStatus !== 'all' 
                  ? 'No refunds found matching your filters.' 
                  : 'No refunds found. Create your first refund to get started.'}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} refunds
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
        </div>
      )}

      {/* Create Refund Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create Refund</h2>
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateRefund();
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.payment_id}
                  onChange={(e) => {
                    setFormData({ ...formData, payment_id: e.target.value });
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="">Select a payment</option>
                  {payments.map(payment => (
                    <option key={payment.id} value={payment.id}>
                      {payment.id.slice(0, 12)} - {formatCurrency(payment.amount, payment.currency)} - {payment.status}
                    </option>
                  ))}
                </select>
                {selectedPayment && (
                  <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-600">
                    <div>Payment Amount: <span className="font-semibold">{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</span></div>
                    <div>Status: <span className="font-semibold">{selectedPayment.status}</span></div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CurrencyDollar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedPayment?.amount || undefined}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                {selectedPayment && (
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum: {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Customer Request">Customer Request</option>
                  <option value="Product Defect">Product Defect</option>
                  <option value="Service Not Provided">Service Not Provided</option>
                  <option value="Duplicate Payment">Duplicate Payment</option>
                  <option value="Fraudulent Transaction">Fraudulent Transaction</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  placeholder="Additional details about the refund..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(false);
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Spinner className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Refund'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Refund Modal */}
      {showViewModal && selectedRefund && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Refund Details</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedRefund(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2">
                  <WarningCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{errorMessage}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 font-medium">Refund ID</label>
                  <p className="text-sm font-mono text-gray-500 mt-1 break-all">{selectedRefund.id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Status</label>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${getStatusColor(selectedRefund.status)}`}>
                      {selectedRefund.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Payment ID</label>
                  <p className="text-sm font-mono text-gray-500 mt-1 break-all">{selectedRefund.payment_id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium flex items-center gap-1">
                    <CurrencyDollar className="w-4 h-4" />
                    Refund Amount
                  </label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {formatCurrency(selectedRefund.amount, selectedRefund.currency || 'XAF')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Reason</label>
                  <p className="text-lg text-gray-900 mt-1">{selectedRefund.reason}</p>
                </div>
                {selectedRefund.description && (
                  <div className="col-span-2">
                    <label className="text-sm text-gray-600 font-medium">Description</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedRefund.description}</p>
                  </div>
                )}
                {selectedRefund.createdAt && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Created At</label>
                    <p className="text-lg text-gray-900 mt-1">{formatDate(selectedRefund.createdAt)}</p>
                  </div>
                )}
                {selectedRefund.updatedAt && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Updated At</label>
                    <p className="text-lg text-gray-900 mt-1">{formatDate(selectedRefund.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedRefund(null);
                }}
                className="px-6 py-2 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors rounded"
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

