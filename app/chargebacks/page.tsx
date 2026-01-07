'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, MagnifyingGlass, Eye, X, CheckCircle, WarningCircle, Spinner, Warning, CaretLeft, CaretRight, Funnel, CurrencyDollar, FileText } from '@phosphor-icons/react';
import { chargebacksService, paymentsService, type Chargeback, type Payment } from '@/lib/api';
import { useOrganization } from '@/contexts/OrganizationContext';
import { formatDate, formatCurrency } from '@/lib/utils/format';

export default function ChargebacksPage() {
  const { organization } = useOrganization();
  const [chargebacks, setChargebacks] = useState<Chargeback[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedChargeback, setSelectedChargeback] = useState<Chargeback | null>(null);
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
    reason: '',
    description: '',
    evidence: '',
  });

  const [statusFormData, setStatusFormData] = useState({
    status: 'PENDING' as 'PENDING' | 'DISPUTED' | 'RESOLVED',
    dispute_reason: '',
    evidence: '',
  });

  // Fetch chargebacks
  const fetchChargebacks = useCallback(async (page: number = pagination.page) => {
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

      const response = await chargebacksService.listChargebacks(params);
      if (response.success && response.data) {
        setChargebacks(response.data.chargebacks || []);
        setPagination(response.data.pagination);
      } else {
        setChargebacks([]);
        setErrorMessage(response.error?.message || 'Failed to load chargebacks');
      }
    } catch (error: any) {
      console.error('Error fetching chargebacks:', error);
      setChargebacks([]);
      setErrorMessage(error?.message || 'Failed to load chargebacks. Please try again.');
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
      });

      if (response.success && response.data) {
        setPayments(response.data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  }, []);

  useEffect(() => {
    fetchChargebacks();
    fetchPayments();
  }, [fetchChargebacks, fetchPayments]);

  // Refetch when filters change
  useEffect(() => {
    if (pagination.page === 1) {
      fetchChargebacks(1);
    } else {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [filterStatus]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchChargebacks(newPage);
    }
  };

  // Filter chargebacks by search query
  const filteredChargebacks = chargebacks.filter(chargeback => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      chargeback.id.toLowerCase().includes(query) ||
      (chargeback.payment_id ?? '').toLowerCase().includes(query) ||
      chargeback.reason.toLowerCase().includes(query) ||
      (chargeback.amount && chargeback.amount.toString().includes(query))
    );
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      payment_id: '',
      reason: '',
      description: '',
      evidence: '',
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Handle create chargeback
  const handleCreateChargeback = async () => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!formData.payment_id.trim()) {
      setErrorMessage('Payment is required');
      setActionLoading(false);
      return;
    }

    if (!formData.reason.trim()) {
      setErrorMessage('Reason is required');
      setActionLoading(false);
      return;
    }

    try {
      const chargebackData = {
        payment_id: formData.payment_id.trim(),
        reason: formData.reason.trim(),
        description: formData.description.trim() || undefined,
        evidence: formData.evidence.trim() || undefined,
      };

      const response = await chargebacksService.createChargeback(chargebackData);
      
      if (response.success) {
        setSuccessMessage('Chargeback created successfully!');
        await fetchChargebacks();
        setTimeout(() => {
          resetForm();
          setShowCreateModal(false);
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to create chargeback. Please try again.');
      }
    } catch (error: any) {
      console.error('Create chargeback error:', error);
      setErrorMessage(error?.message || 'Failed to create chargeback. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle view chargeback
  const handleViewChargeback = async (chargeback: Chargeback) => {
    setSelectedChargeback(chargeback);
    setErrorMessage('');
    try {
      const response = await chargebacksService.getChargeback(chargeback.id);
      if (response.success && response.data) {
        setSelectedChargeback(response.data);
        setShowViewModal(true);
      } else {
        setErrorMessage(response.error?.message || 'Failed to load chargeback details');
        setShowViewModal(true);
      }
    } catch (error: any) {
      console.error('Error fetching chargeback details:', error);
      setErrorMessage(error?.message || 'Failed to load chargeback details');
      setShowViewModal(true);
    }
  };

  // Handle update status
  const handleUpdateStatus = async () => {
    if (!selectedChargeback) return;

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updateData: any = {
        status: statusFormData.status,
      };

      if (statusFormData.dispute_reason) {
        updateData.dispute_reason = statusFormData.dispute_reason;
      }

      if (statusFormData.evidence) {
        try {
          updateData.evidence = JSON.parse(statusFormData.evidence);
        } catch {
          updateData.evidence = { note: statusFormData.evidence };
        }
      }

      const response = await chargebacksService.updateChargebackStatus(selectedChargeback.id, updateData);
      
      if (response.success) {
        setSuccessMessage('Chargeback status updated successfully!');
        await fetchChargebacks();
        setTimeout(() => {
          setShowStatusModal(false);
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to update chargeback status. Please try again.');
      }
    } catch (error: any) {
      console.error('Update status error:', error);
      setErrorMessage(error?.message || 'Failed to update chargeback status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'RESOLVED':
        return 'bg-green-100 text-green-700';
      case 'DISPUTED':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Warning className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Chargebacks</h1>
              <p className="text-sm text-gray-600 mt-1">Manage payment chargebacks</p>
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
            Create Chargeback
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
            placeholder="Search chargebacks by ID, payment ID, reason, or amount..."
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
            <option value="DISPUTED">Disputed</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Chargebacks List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
            <div className="hidden lg:grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
              <div>Chargeback ID</div>
              <div>Payment ID</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredChargebacks.length > 0 ? (
              filteredChargebacks.map((chargeback) => (
                <div key={chargeback.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                  {/* Mobile Card Layout */}
                  <div className="lg:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">Chargeback #{chargeback.id.slice(0, 8)}</div>
                        <div className="text-xs text-gray-600 mt-1">Payment: {(chargeback.payment_id ?? '').slice(0, 8)}</div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(chargeback.status)}`}>
                        {chargeback.status}
                      </span>
                    </div>
                    {chargeback.amount && (
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(chargeback.amount, chargeback.currency || 'XAF')}
                      </div>
                    )}
                    {chargeback.reason && (
                      <div className="text-xs text-gray-600">Reason: {chargeback.reason}</div>
                    )}
                    {chargeback.createdAt && (
                      <div className="text-xs text-gray-500">{formatDate(chargeback.createdAt)}</div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => handleViewChargeback(chargeback)}
                        className="flex-1 px-3 py-2 text-sm font-medium border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors rounded flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedChargeback(chargeback);
                          setStatusFormData({
                            status: chargeback.status as any,
                            dispute_reason: chargeback.dispute_reason || '',
                            evidence: typeof chargeback.evidence === 'string' ? chargeback.evidence : JSON.stringify(chargeback.evidence || {}),
                          });
                          setShowStatusModal(true);
                        }}
                        className="flex-1 px-3 py-2 text-sm font-medium border-2 border-green-200 text-green-700 hover:bg-green-50 transition-colors rounded"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                  {/* Desktop Table Layout */}
                  <div className="hidden lg:grid grid-cols-5 gap-4 items-center">
                    <div className="text-sm font-medium text-gray-900">#{chargeback.id.slice(0, 12)}</div>
                    <div className="text-sm text-gray-600">{(chargeback.payment_id ?? '').slice(0, 12)}</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {chargeback.amount ? formatCurrency(chargeback.amount, chargeback.currency || 'XAF') : 'N/A'}
                    </div>
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(chargeback.status)}`}>
                        {chargeback.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewChargeback(chargeback)}
                        className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedChargeback(chargeback);
                          setStatusFormData({
                            status: chargeback.status as any,
                            dispute_reason: chargeback.dispute_reason || '',
                            evidence: typeof chargeback.evidence === 'string' ? chargeback.evidence : JSON.stringify(chargeback.evidence || {}),
                          });
                          setShowStatusModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 sm:px-6 py-6 sm:py-8 text-center text-sm text-gray-500">
                {searchQuery || filterStatus !== 'all' 
                  ? 'No chargebacks found matching your filters.' 
                  : 'No chargebacks found. Create your first chargeback to get started.'}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} chargebacks
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

      {/* Create Chargeback Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create Chargeback</h2>
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
                handleCreateChargeback();
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.payment_id}
                  onChange={(e) => setFormData({ ...formData, payment_id: e.target.value })}
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
                  <option value="Fraudulent Transaction">Fraudulent Transaction</option>
                  <option value="Unauthorized Transaction">Unauthorized Transaction</option>
                  <option value="Product Not Received">Product Not Received</option>
                  <option value="Product Not as Described">Product Not as Described</option>
                  <option value="Duplicate Charge">Duplicate Charge</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  placeholder="Additional details about the chargeback..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Evidence (JSON or text)</label>
                <textarea
                  value={formData.evidence}
                  onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500 font-mono text-sm"
                  placeholder='{"document_url": "...", "notes": "..."} or plain text'
                  rows={4}
                />
                <p className="mt-1 text-xs text-gray-500">Enter JSON object or plain text evidence</p>
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
                    'Create Chargeback'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Chargeback Modal */}
      {showViewModal && selectedChargeback && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Chargeback Details</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedChargeback(null);
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
                  <label className="text-sm text-gray-600 font-medium">Chargeback ID</label>
                  <p className="text-sm font-mono text-gray-500 mt-1 break-all">{selectedChargeback.id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Status</label>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${getStatusColor(selectedChargeback.status)}`}>
                      {selectedChargeback.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Payment ID</label>
                  <p className="text-sm font-mono text-gray-500 mt-1 break-all">{selectedChargeback.payment_id}</p>
                </div>
                {selectedChargeback.amount && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium flex items-center gap-1">
                      <CurrencyDollar className="w-4 h-4" />
                      Amount
                    </label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {formatCurrency(selectedChargeback.amount, selectedChargeback.currency || 'XAF')}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600 font-medium">Reason</label>
                  <p className="text-lg text-gray-900 mt-1">{selectedChargeback.reason}</p>
                </div>
                {selectedChargeback.dispute_reason && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Dispute Reason</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedChargeback.dispute_reason}</p>
                  </div>
                )}
                {selectedChargeback.description && (
                  <div className="col-span-2">
                    <label className="text-sm text-gray-600 font-medium">Description</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedChargeback.description}</p>
                  </div>
                )}
                {selectedChargeback.evidence && (
                  <div className="col-span-2">
                    <label className="text-sm text-gray-600 font-medium flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      Evidence
                    </label>
                    <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                        {typeof selectedChargeback.evidence === 'string' 
                          ? selectedChargeback.evidence 
                          : JSON.stringify(selectedChargeback.evidence, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                {selectedChargeback.createdAt && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Created At</label>
                    <p className="text-lg text-gray-900 mt-1">{formatDate(selectedChargeback.createdAt)}</p>
                  </div>
                )}
                {selectedChargeback.updatedAt && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Updated At</label>
                    <p className="text-lg text-gray-900 mt-1">{formatDate(selectedChargeback.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setStatusFormData({
                    status: selectedChargeback.status as any,
                    dispute_reason: selectedChargeback.dispute_reason || '',
                    evidence: typeof selectedChargeback.evidence === 'string' ? selectedChargeback.evidence : JSON.stringify(selectedChargeback.evidence || {}),
                  });
                  setShowStatusModal(true);
                }}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded"
              >
                Update Status
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedChargeback(null);
                }}
                className="px-6 py-2 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedChargeback && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Update Chargeback Status</h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateStatus();
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={statusFormData.status}
                  onChange={(e) => setStatusFormData({ ...statusFormData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="PENDING">Pending</option>
                  <option value="DISPUTED">Disputed</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dispute Reason</label>
                <input
                  type="text"
                  value={statusFormData.dispute_reason}
                  onChange={(e) => setStatusFormData({ ...statusFormData, dispute_reason: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  placeholder="Reason for dispute or resolution"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Evidence (JSON or text)</label>
                <textarea
                  value={statusFormData.evidence}
                  onChange={(e) => setStatusFormData({ ...statusFormData, evidence: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500 font-mono text-sm"
                  placeholder='{"document_url": "...", "notes": "..."} or plain text'
                  rows={4}
                />
                <p className="mt-1 text-xs text-gray-500">Enter JSON object or plain text evidence</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
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
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

