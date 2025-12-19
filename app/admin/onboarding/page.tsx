'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Spinner, 
  WarningCircle, 
  Shield, 
  Clock,
  User,
  Building,
  MagnifyingGlass,
  Funnel,
  CaretDown,
  Download,
  X,
  ChatCircle,
  Calendar
} from '@phosphor-icons/react';
import { onboardingService } from '@/lib/api';
import { formatDate } from '@/lib/utils/format';

export default function AdminOnboardingPage() {
  const [activeTab, setActiveTab] = useState('documents');
  const [pendingDocuments, setPendingDocuments] = useState<any[]>([]);
  const [pendingSteps, setPendingSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState({ documents: false, steps: false });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Modal states
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [selectedStep, setSelectedStep] = useState<any | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showViewDocumentModal, setShowViewDocumentModal] = useState(false);
  const [showViewStepModal, setShowViewStepModal] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);
  
  // Refs to prevent duplicate requests and track component mount state
  const fetchingRef = useRef({ documents: false, steps: false });
  const mountedRef = useRef(true);

  // Form states
  const [verifyFormData, setVerifyFormData] = useState({
    status: 'APPROVED' as 'APPROVED' | 'REJECTED',
    rejection_reason: '',
    admin_notes: '',
  });

  const [approveFormData, setApproveFormData] = useState({
    approved: true,
    rejection_reason: '',
    admin_notes: '',
  });

  const tabs = [
    { id: 'documents', label: 'Pending Documents', count: pendingDocuments.length },
    { id: 'steps', label: 'Pending Steps', count: pendingSteps.length },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilterDropdown]);

  // Fetch pending documents
  const fetchPendingDocuments = useCallback(async () => {
    // Prevent duplicate requests
    if (fetchingRef.current.documents) {
      return;
    }

    fetchingRef.current.documents = true;
    setLoading(prev => ({ ...prev, documents: true }));
    setErrorMessage('');
    
    try {
      const response = await onboardingService.getPendingDocuments();
      if (!mountedRef.current) return; // Component unmounted
      
      if (response.success && response.data) {
        setPendingDocuments(Array.isArray(response.data) ? response.data : []);
      } else {
        setPendingDocuments([]);
        if (response.error) {
          // Check if it's an admin access error
          if (response.error.code === 'ADMIN_ACCESS_REQUIRED') {
            setErrorMessage('Admin access required. Your account does not have admin privileges. Please contact your system administrator.');
          } else {
            setErrorMessage(response.error.message || 'Failed to load pending documents');
          }
        }
      }
    } catch (error: any) {
      if (!mountedRef.current) return; // Component unmounted
      console.error('Error fetching pending documents:', error);
      setPendingDocuments([]);
      // Only show error if it's not an abort error
      if (error.name !== 'AbortError') {
        setErrorMessage('Failed to load pending documents. Please try again.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(prev => ({ ...prev, documents: false }));
      }
      fetchingRef.current.documents = false;
    }
  }, []);

  // Fetch pending steps
  const fetchPendingSteps = useCallback(async () => {
    // Prevent duplicate requests
    if (fetchingRef.current.steps) {
      return;
    }

    fetchingRef.current.steps = true;
    setLoading(prev => ({ ...prev, steps: true }));
    setErrorMessage('');
    
    try {
      const response = await onboardingService.getPendingSteps();
      if (!mountedRef.current) return; // Component unmounted
      
      if (response.success && response.data) {
        setPendingSteps(Array.isArray(response.data) ? response.data : []);
      } else {
        setPendingSteps([]);
        if (response.error) {
          // Check if it's an admin access error
          if (response.error.code === 'ADMIN_ACCESS_REQUIRED') {
            setErrorMessage('Admin access required. Your account does not have admin privileges. Please contact your system administrator.');
          } else {
            setErrorMessage(response.error.message || 'Failed to load pending steps');
          }
        }
      }
    } catch (error: any) {
      if (!mountedRef.current) return; // Component unmounted
      console.error('Error fetching pending steps:', error);
      setPendingSteps([]);
      // Only show error if it's not an abort error
      if (error.name !== 'AbortError') {
        setErrorMessage('Failed to load pending steps. Please try again.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(prev => ({ ...prev, steps: false }));
      }
      fetchingRef.current.steps = false;
    }
  }, []);

  // Fetch data on mount and tab change
  useEffect(() => {
    mountedRef.current = true;
    
    // Reset fetching flags when tab changes to allow new requests
    if (activeTab === 'documents') {
      fetchingRef.current.documents = false;
      fetchPendingDocuments();
    } else if (activeTab === 'steps') {
      fetchingRef.current.steps = false;
      fetchPendingSteps();
    }

    return () => {
      mountedRef.current = false;
      // Reset fetching flags on cleanup
      fetchingRef.current.documents = false;
      fetchingRef.current.steps = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // fetchPendingDocuments and fetchPendingSteps are stable (useCallback with empty deps)

  // Filter documents
  const getFilteredDocuments = () => {
    let filtered = [...pendingDocuments];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.document_type?.toLowerCase().includes(query) ||
        doc.organization_id?.toLowerCase().includes(query) ||
        doc.user_id?.toLowerCase().includes(query) ||
        doc.document_number?.toLowerCase().includes(query)
      );
    }

    if (selectedFilter && selectedFilter !== 'All') {
      filtered = filtered.filter(doc => doc.document_type === selectedFilter);
    }

    return filtered;
  };

  // Filter steps
  const getFilteredSteps = () => {
    let filtered = [...pendingSteps];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(step =>
        step.step_name?.toLowerCase().includes(query) ||
        step.organization_id?.toLowerCase().includes(query) ||
        step.user_id?.toLowerCase().includes(query)
      );
    }

    if (selectedFilter && selectedFilter !== 'All') {
      filtered = filtered.filter(step => step.step_name === selectedFilter);
    }

    return filtered;
  };

  // Handle document verification
  const handleVerifyDocument = async () => {
    if (!selectedDocument) return;

    setActionLoading(selectedDocument.id);
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (verifyFormData.status === 'REJECTED' && !verifyFormData.rejection_reason.trim()) {
      setErrorMessage('Rejection reason is required when rejecting a document');
      setActionLoading(null);
      return;
    }

    try {
      const response = await onboardingService.verifyDocument(selectedDocument.id, {
        status: verifyFormData.status,
        rejection_reason: verifyFormData.status === 'REJECTED' ? verifyFormData.rejection_reason.trim() : undefined,
        admin_notes: verifyFormData.admin_notes.trim() || undefined,
      });

      if (response.success) {
        setSuccessMessage(`Document ${verifyFormData.status === 'APPROVED' ? 'approved' : 'rejected'} successfully!`);
        await fetchPendingDocuments();
        setTimeout(() => {
          setShowVerifyModal(false);
          setSelectedDocument(null);
          setVerifyFormData({
            status: 'APPROVED',
            rejection_reason: '',
            admin_notes: '',
          });
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to verify document. Please try again.');
      }
    } catch (error: any) {
      console.error('Verify document error:', error);
      setErrorMessage('Failed to verify document. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle step approval
  const handleApproveStep = async () => {
    if (!selectedStep) return;

    setActionLoading(selectedStep.id);
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!approveFormData.approved && !approveFormData.rejection_reason.trim()) {
      setErrorMessage('Rejection reason is required when rejecting a step');
      setActionLoading(null);
      return;
    }

    try {
      const response = await onboardingService.approveStep(selectedStep.id, {
        approved: approveFormData.approved,
        rejection_reason: !approveFormData.approved ? approveFormData.rejection_reason.trim() : undefined,
        admin_notes: approveFormData.admin_notes.trim() || undefined,
      });

      if (response.success) {
        setSuccessMessage(`Step ${approveFormData.approved ? 'approved' : 'rejected'} successfully!`);
        await fetchPendingSteps();
        setTimeout(() => {
          setShowApproveModal(false);
          setSelectedStep(null);
          setApproveFormData({
            approved: true,
            rejection_reason: '',
            admin_notes: '',
          });
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to approve step. Please try again.');
      }
    } catch (error: any) {
      console.error('Approve step error:', error);
      setErrorMessage('Failed to approve step. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Open verify modal
  const openVerifyModal = (document: any) => {
    setSelectedDocument(document);
    setVerifyFormData({
      status: 'APPROVED',
      rejection_reason: '',
      admin_notes: '',
    });
    setShowVerifyModal(true);
  };

  // Open approve modal
  const openApproveModal = (step: any) => {
    setSelectedStep(step);
    setApproveFormData({
      approved: true,
      rejection_reason: '',
      admin_notes: '',
    });
    setShowApproveModal(true);
  };

  // View document
  const handleViewDocument = (document: any) => {
    setSelectedDocument(document);
    setShowViewDocumentModal(true);
  };

  // View step
  const handleViewStep = (step: any) => {
    setSelectedStep(step);
    setShowViewStepModal(true);
  };

  // Get document type badge color
  const getDocumentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      ID_CARD: 'bg-blue-100 text-blue-700 border-blue-200',
      PASSPORT: 'bg-green-100 text-green-700 border-green-200',
      BUSINESS_REGISTRATION: 'bg-green-100 text-green-700 border-green-200',
      VAT_CERTIFICATE: 'bg-amber-100 text-amber-700 border-amber-200',
      BANK_STATEMENT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      OTHER: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[type] || colors.OTHER;
  };

  // Get step name badge color
  const getStepNameBadge = (stepName: string) => {
    const colors: Record<string, string> = {
      STAKEHOLDER: 'bg-blue-100 text-blue-700 border-blue-200',
      BUSINESS: 'bg-green-100 text-green-700 border-green-200',
      PAYMENT_METHODS: 'bg-green-100 text-green-700 border-green-200',
      DOCUMENTS: 'bg-amber-100 text-amber-700 border-amber-200',
    };
    return colors[stepName] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mt-20 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Admin Onboarding</h1>
              <p className="text-sm text-gray-600 mt-1">Review and approve onboarding documents and steps</p>
            </div>
          </div>
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

      {/* Tabs */}
      <div className="flex gap-1 mb-4 sm:mb-6 border-b-2 border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors relative whitespace-nowrap flex items-center gap-2
              ${activeTab === tab.id
                ? 'text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                activeTab === tab.id
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-green-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'documents' ? 'Search documents by type, organization, or document number...' : 'Search steps by name or organization...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-1 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
          />
        </div>

        {/* Filter Dropdown */}
        {activeTab === 'documents' && (
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-base bg-white border border-gray-200 text-sm transition-colors ${
                selectedFilter ? 'border-green-500 bg-green-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>{selectedFilter || 'Document Type'}</span>
              <CaretDown className="w-4 h-4" />
            </button>
            {showFilterDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[200px] rounded">
                {['All', 'ID_CARD', 'PASSPORT', 'BUSINESS_REGISTRATION', 'VAT_CERTIFICATE', 'BANK_STATEMENT', 'OTHER'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedFilter(type === 'All' ? '' : type);
                      setShowFilterDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                  >
                    {type === 'All' ? 'All Types' : type.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'steps' && (
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-base bg-white border border-gray-200 text-sm transition-colors ${
                selectedFilter ? 'border-green-500 bg-green-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>{selectedFilter || 'Step Type'}</span>
              <CaretDown className="w-4 h-4" />
            </button>
            {showFilterDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[200px] rounded">
                {['All', 'STAKEHOLDER', 'BUSINESS', 'PAYMENT_METHODS', 'DOCUMENTS'].map((step) => (
                  <button
                    key={step}
                    onClick={() => {
                      setSelectedFilter(step === 'All' ? '' : step);
                      setShowFilterDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                  >
                    {step === 'All' ? 'All Steps' : step.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pending Documents Tab */}
      {activeTab === 'documents' && (
        loading.documents ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
              <div className="hidden lg:grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                <div>Document</div>
                <div>Organization</div>
                <div>Type</div>
                <div>Uploaded</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {getFilteredDocuments().length > 0 ? (
                getFilteredDocuments().map((document) => (
                  <div key={document.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                    {/* Mobile Card Layout */}
                    <div className="lg:hidden space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {document.document_type?.replace(/_/g, ' ') || 'Unknown Document'}
                          </div>
                          {document.document_number && (
                            <div className="text-xs text-gray-600 mt-1">#{document.document_number}</div>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getDocumentTypeBadge(document.document_type)}`}>
                          {document.document_type?.replace(/_/g, ' ') || 'Unknown'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <div className="flex items-center gap-1 mb-1">
                          <Building className="w-3 h-3" />
                          {document.organization_id || 'N/A'}
                        </div>
                        {document.created_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(document.created_at)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => handleViewDocument(document)}
                          className="flex-1 px-3 py-2 text-sm font-medium border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors rounded flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => openVerifyModal(document)}
                          className="flex-1 px-3 py-2 text-sm font-medium bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all rounded flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Review
                        </button>
                      </div>
                    </div>
                    {/* Desktop Table Layout */}
                    <div className="hidden lg:grid grid-cols-6 gap-4 items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {document.document_type?.replace(/_/g, ' ') || 'Unknown Document'}
                        {document.document_number && (
                          <div className="text-xs text-gray-500 mt-1">#{document.document_number}</div>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{document.organization_id || 'N/A'}</div>
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getDocumentTypeBadge(document.document_type)}`}>
                          {document.document_type?.replace(/_/g, ' ') || 'Unknown'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {document.created_at ? formatDate(document.created_at) : 'N/A'}
                      </div>
                      <div>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700 border border-yellow-200">
                          <Clock className="w-3 h-3 inline-block mr-1" />
                          Pending
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDocument(document)}
                          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => openVerifyModal(document)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 sm:px-6 py-6 sm:py-8 text-center text-sm text-gray-500">
                  {searchQuery || selectedFilter
                    ? 'No documents found matching your search criteria.'
                    : 'No pending documents at this time.'}
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Pending Steps Tab */}
      {activeTab === 'steps' && (
        loading.steps ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
              <div className="hidden lg:grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
                <div>Step</div>
                <div>Organization</div>
                <div>Completed</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {getFilteredSteps().length > 0 ? (
                getFilteredSteps().map((step) => (
                  <div key={step.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                    {/* Mobile Card Layout */}
                    <div className="lg:hidden space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {step.step_name?.replace(/_/g, ' ') || 'Unknown Step'}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            <Building className="w-3 h-3 inline-block mr-1" />
                            {step.organization_id || 'N/A'}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getStepNameBadge(step.step_name)}`}>
                          {step.step_name?.replace(/_/g, ' ') || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-gray-600">
                          Completed: {step.completed ? (
                            <span className="text-green-600 font-medium">Yes</span>
                          ) : (
                            <span className="text-gray-500">No</span>
                          )}
                        </div>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700 border border-yellow-200">
                          <Clock className="w-3 h-3 inline-block mr-1" />
                          Pending Approval
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => handleViewStep(step)}
                          className="flex-1 px-3 py-2 text-sm font-medium border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors rounded flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => openApproveModal(step)}
                          className="flex-1 px-3 py-2 text-sm font-medium bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all rounded flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Review
                        </button>
                      </div>
                    </div>
                    {/* Desktop Table Layout */}
                    <div className="hidden lg:grid grid-cols-5 gap-4 items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {step.step_name?.replace(/_/g, ' ') || 'Unknown Step'}
                        </div>
                        <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded border ${getStepNameBadge(step.step_name)}`}>
                          {step.step_name?.replace(/_/g, ' ') || 'Unknown'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">{step.organization_id || 'N/A'}</div>
                      <div className="text-sm text-gray-600">
                        {step.completed ? (
                          <span className="text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-gray-500">No</span>
                        )}
                      </div>
                      <div>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700 border border-yellow-200">
                          <Clock className="w-3 h-3 inline-block mr-1" />
                          Pending Approval
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewStep(step)}
                          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => openApproveModal(step)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 sm:px-6 py-6 sm:py-8 text-center text-sm text-gray-500">
                  {searchQuery || selectedFilter
                    ? 'No steps found matching your search criteria.'
                    : 'No pending steps at this time.'}
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Verify Document Modal */}
      {showVerifyModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Verify Document</h2>
                <button
                  onClick={() => {
                    setShowVerifyModal(false);
                    setSelectedDocument(null);
                    setVerifyFormData({
                      status: 'APPROVED',
                      rejection_reason: '',
                      admin_notes: '',
                    });
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
                handleVerifyDocument();
              }}
              className="p-6 space-y-4"
            >
              {/* Document Info */}
              <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 font-medium">Document Type:</span>
                    <p className="text-gray-900 mt-1">{selectedDocument.document_type?.replace(/_/g, ' ') || 'N/A'}</p>
                  </div>
                  {selectedDocument.document_number && (
                    <div>
                      <span className="text-gray-600 font-medium">Document Number:</span>
                      <p className="text-gray-900 mt-1">{selectedDocument.document_number}</p>
                    </div>
                  )}
                  {selectedDocument.organization_id && (
                    <div>
                      <span className="text-gray-600 font-medium">Organization ID:</span>
                      <p className="text-gray-900 mt-1">{selectedDocument.organization_id}</p>
                    </div>
                  )}
                  {selectedDocument.created_at && (
                    <div>
                      <span className="text-gray-600 font-medium">Uploaded:</span>
                      <p className="text-gray-900 mt-1">{formatDate(selectedDocument.created_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Status <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setVerifyFormData({ ...verifyFormData, status: 'APPROVED', rejection_reason: '' })}
                    className={`flex-1 px-4 py-3 border-2 rounded transition-all ${
                      verifyFormData.status === 'APPROVED'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">Approve</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyFormData({ ...verifyFormData, status: 'REJECTED' })}
                    className={`flex-1 px-4 py-3 border-2 rounded transition-all ${
                      verifyFormData.status === 'REJECTED'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-red-300'
                    }`}
                  >
                    <XCircle className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">Reject</div>
                  </button>
                </div>
              </div>

              {/* Rejection Reason */}
              {verifyFormData.status === 'REJECTED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={verifyFormData.rejection_reason}
                    onChange={(e) => setVerifyFormData({ ...verifyFormData, rejection_reason: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-red-500"
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                    required
                  />
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={verifyFormData.admin_notes}
                  onChange={(e) => setVerifyFormData({ ...verifyFormData, admin_notes: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  placeholder="Add any additional notes or comments..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowVerifyModal(false);
                    setSelectedDocument(null);
                    setVerifyFormData({
                      status: 'APPROVED',
                      rejection_reason: '',
                      admin_notes: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === selectedDocument.id}
                  className={`flex-1 px-4 py-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2 ${
                    verifyFormData.status === 'APPROVED'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                  }`}
                >
                  {actionLoading === selectedDocument.id ? (
                    <>
                      <Spinner className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {verifyFormData.status === 'APPROVED' ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Approve Document
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Reject Document
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Step Modal */}
      {showApproveModal && selectedStep && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Approve Onboarding Step</h2>
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedStep(null);
                    setApproveFormData({
                      approved: true,
                      rejection_reason: '',
                      admin_notes: '',
                    });
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
                handleApproveStep();
              }}
              className="p-6 space-y-4"
            >
              {/* Step Info */}
              <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 font-medium">Step Name:</span>
                    <p className="text-gray-900 mt-1">{selectedStep.step_name?.replace(/_/g, ' ') || 'N/A'}</p>
                  </div>
                  {selectedStep.organization_id && (
                    <div>
                      <span className="text-gray-600 font-medium">Organization ID:</span>
                      <p className="text-gray-900 mt-1">{selectedStep.organization_id}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600 font-medium">Completed:</span>
                    <p className="text-gray-900 mt-1">
                      {selectedStep.completed ? (
                        <span className="text-green-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </p>
                  </div>
                  {selectedStep.created_at && (
                    <div>
                      <span className="text-gray-600 font-medium">Completed At:</span>
                      <p className="text-gray-900 mt-1">{formatDate(selectedStep.created_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Approval Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Status <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setApproveFormData({ ...approveFormData, approved: true, rejection_reason: '' })}
                    className={`flex-1 px-4 py-3 border-2 rounded transition-all ${
                      approveFormData.approved
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">Approve</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApproveFormData({ ...approveFormData, approved: false })}
                    className={`flex-1 px-4 py-3 border-2 rounded transition-all ${
                      !approveFormData.approved
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-red-300'
                    }`}
                  >
                    <XCircle className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">Reject</div>
                  </button>
                </div>
              </div>

              {/* Rejection Reason */}
              {!approveFormData.approved && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={approveFormData.rejection_reason}
                    onChange={(e) => setApproveFormData({ ...approveFormData, rejection_reason: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-red-500"
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                    required
                  />
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={approveFormData.admin_notes}
                  onChange={(e) => setApproveFormData({ ...approveFormData, admin_notes: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  placeholder="Add any additional notes or comments..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedStep(null);
                    setApproveFormData({
                      approved: true,
                      rejection_reason: '',
                      admin_notes: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === selectedStep.id}
                  className={`flex-1 px-4 py-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2 ${
                    approveFormData.approved
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                  }`}
                >
                  {actionLoading === selectedStep.id ? (
                    <>
                      <Spinner className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {approveFormData.approved ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Approve Step
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Reject Step
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {showViewDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Document Details</h2>
                <button
                  onClick={() => {
                    setShowViewDocumentModal(false);
                    setSelectedDocument(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 font-medium">Document Type</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {selectedDocument.document_type?.replace(/_/g, ' ') || 'N/A'}
                  </p>
                </div>
                {selectedDocument.document_number && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Document Number</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedDocument.document_number}</p>
                  </div>
                )}
                {selectedDocument.organization_id && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Organization ID</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedDocument.organization_id}</p>
                  </div>
                )}
                {selectedDocument.user_id && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">User ID</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedDocument.user_id}</p>
                  </div>
                )}
                {selectedDocument.issuing_authority && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Issuing Authority</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedDocument.issuing_authority}</p>
                  </div>
                )}
                {selectedDocument.expiry_date && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Expiry Date</label>
                    <p className="text-lg text-gray-900 mt-1">{formatDate(selectedDocument.expiry_date)}</p>
                  </div>
                )}
                {selectedDocument.created_at && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Uploaded At</label>
                    <p className="text-lg text-gray-900 mt-1">{formatDate(selectedDocument.created_at)}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600 font-medium">Status</label>
                  <div className="mt-1">
                    <span className="px-3 py-1 text-sm font-medium rounded bg-yellow-100 text-yellow-700 border border-yellow-200">
                      <Clock className="w-4 h-4 inline-block mr-1" />
                      Pending Review
                    </span>
                  </div>
                </div>
              </div>

              {/* Document Preview */}
              {selectedDocument.file_url && (
                <div>
                  <label className="text-sm text-gray-600 font-medium mb-2 block">Document Preview</label>
                  <div className="border-2 border-gray-200 rounded p-4 bg-gray-50">
                    <a
                      href={selectedDocument.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                    >
                      <Download className="w-4 h-4" />
                      View/Download Document
                    </a>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  setShowViewDocumentModal(false);
                  openVerifyModal(selectedDocument);
                }}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Review Document
              </button>
              <button
                onClick={() => {
                  setShowViewDocumentModal(false);
                  setSelectedDocument(null);
                }}
                className="px-6 py-2 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Step Modal */}
      {showViewStepModal && selectedStep && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Step Details</h2>
                <button
                  onClick={() => {
                    setShowViewStepModal(false);
                    setSelectedStep(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 font-medium">Step Name</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {selectedStep.step_name?.replace(/_/g, ' ') || 'N/A'}
                  </p>
                </div>
                {selectedStep.organization_id && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Organization ID</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedStep.organization_id}</p>
                  </div>
                )}
                {selectedStep.user_id && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">User ID</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedStep.user_id}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600 font-medium">Completed</label>
                  <div className="mt-1">
                    {selectedStep.completed ? (
                      <span className="px-3 py-1 text-sm font-medium rounded bg-green-100 text-green-700 border border-green-200 flex items-center gap-1 w-fit">
                        <CheckCircle className="w-4 h-4" />
                        Yes
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-sm font-medium rounded bg-gray-100 text-gray-700 border border-gray-200">
                        No
                      </span>
                    )}
                  </div>
                </div>
                {selectedStep.created_at && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Completed At</label>
                    <p className="text-lg text-gray-900 mt-1">{formatDate(selectedStep.created_at)}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600 font-medium">Admin Approval Status</label>
                  <div className="mt-1">
                    <span className="px-3 py-1 text-sm font-medium rounded bg-yellow-100 text-yellow-700 border border-yellow-200">
                      <Clock className="w-4 h-4 inline-block mr-1" />
                      Pending Approval
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  setShowViewStepModal(false);
                  openApproveModal(selectedStep);
                }}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Review Step
              </button>
              <button
                onClick={() => {
                  setShowViewStepModal(false);
                  setSelectedStep(null);
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

