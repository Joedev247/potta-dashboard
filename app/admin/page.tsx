'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Shield,
  UserPlus,
  MagnifyingGlass,
  Eye,
  Power,
  CheckCircle,
  XCircle,
  Spinner,
  WarningCircle,
  X,
  Users,
  Building,
  FileText,
  List,
  Plus,
} from '@phosphor-icons/react';
import { adminService, type RegisterUserData, type ChangeUserStatusData } from '@/lib/api';
import type { User, Organization, PendingDocument, PendingStep, LogEntry } from '@/lib/api/admin';
import { formatDate } from '@/lib/utils/format';
import AdminTabs from '@/components/admin/AdminTabs';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import StatusBadge from '@/components/admin/StatusBadge';

type AdminTab = 'users' | 'organizations' | 'documents' | 'onboarding' | 'logs';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'username' | 'email' | 'id'>('username');
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [registerData, setRegisterData] = useState<RegisterUserData>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user',
  });

  // Organizations state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgStatusModalOpen, setOrgStatusModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgStatus, setOrgStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'REJECTED'>('ACTIVE');
  const [orgReason, setOrgReason] = useState('');

  // Onboarding documents state
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<PendingDocument | null>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docAction, setDocAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [docRejectionReason, setDocRejectionReason] = useState('');

  // Onboarding steps state
  const [steps, setSteps] = useState<PendingStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<PendingStep | null>(null);
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [stepAction, setStepAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [stepRejectionReason, setStepRejectionReason] = useState('');

  // Logs state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [logModalOpen, setLogModalOpen] = useState(false);

  // Payment providers state
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [providerStatuses, setProviderStatuses] = useState<{ [key: string]: boolean }>({
    MTN_CAM: false,
    ORANGE_CAM: false,
  });
  const [providerLoading, setProviderLoading] = useState<string | null>(null);

  // Fetch users - fetch all users by default, filter when search query is provided
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // If search query exists, filter by that parameter
      // Otherwise, fetch all users (no params = all users)
      const params: any = {};
      if (searchQuery.trim()) {
        params[searchType] = searchQuery;
      }
      
      const response = await adminService.findUsers(params);

      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setErrorMessage(response.error?.message || 'Failed to fetch users');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, searchType]);

  // Fetch pending organizations
  const fetchPendingOrganizations = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await adminService.getPendingOrganizations();
      if (response.success && response.data) {
        setOrganizations(response.data);
      } else {
        setErrorMessage(response.error?.message || 'Failed to fetch organizations');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pending documents
  const fetchPendingDocuments = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await adminService.getPendingOnboardingDocuments();
      if (response.success && response.data?.documents) {
        setDocuments(response.data.documents);
      } else {
        setErrorMessage(response.error?.message || 'Failed to fetch documents');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pending steps
  const fetchPendingSteps = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await adminService.getPendingOnboardingSteps();
      if (response.success && response.data?.steps) {
        setSteps(response.data.steps);
      } else {
        setErrorMessage(response.error?.message || 'Failed to fetch onboarding steps');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to fetch onboarding steps');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async (page: number = 1, limit: number = 20) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await adminService.getLogs({ page, limit });
      console.log('[AdminPage.fetchLogs] Response:', {
        success: response.success,
        hasData: !!response.data,
        logsCount: response.data?.logs?.length || 0,
        pagination: response.data?.pagination,
        error: response.error,
      });
      
      if (response.success && response.data) {
        const logsArray = response.data.logs || [];
        const pagination = response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false };
        
        console.log('[AdminPage.fetchLogs] Setting logs:', {
          logsCount: logsArray.length,
          pagination,
          firstLog: logsArray[0],
        });
        
        setLogs(logsArray);
        setLogsPagination(pagination);
      } else {
        setErrorMessage(response.error?.message || 'Failed to fetch logs');
      }
    } catch (error: any) {
      console.error('[AdminPage.fetchLogs] Error:', error);
      setErrorMessage(error?.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(); // Always fetch users when users tab is active
    } else if (activeTab === 'organizations') {
      fetchPendingOrganizations();
    } else if (activeTab === 'documents') {
      fetchPendingDocuments();
    } else if (activeTab === 'onboarding') {
      fetchPendingSteps();
    } else if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, fetchUsers, fetchPendingOrganizations, fetchPendingDocuments, fetchPendingSteps, fetchLogs]);

  // Refetch users when search query or search type changes
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [searchQuery, searchType, activeTab, fetchUsers]);

  // Handle register user
  const handleRegisterUser = async () => {
    if (!registerData.username || !registerData.email || !registerData.password) {
      setErrorMessage('Username, email, and password are required');
      return;
    }

    setActionLoading('register');
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await adminService.registerUser(registerData);
      if (response.success) {
        setSuccessMessage('User registered successfully!');
        setRegisterData({
          username: '',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'user',
        });
        setTimeout(() => {
          setRegisterModalOpen(false);
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to register user');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to register user');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle change user status
  const handleChangeUserStatus = async () => {
    if (!selectedUser) return;

    setActionLoading('status');
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Backend expects: ACTIVE, STOP, PENDING
      // Map frontend INACTIVE/STOP to backend STOP, ACTIVE to ACTIVE
      const currentStatus = selectedUser.status === 'STOP' || selectedUser.status === 'INACTIVE' ? 'STOP' : selectedUser.status;
      const newStatus = currentStatus === 'ACTIVE' ? 'STOP' : 'ACTIVE';
      
      const response = await adminService.changeUserStatus({
        id: selectedUser.id,
        status: newStatus as 'ACTIVE' | 'STOP' | 'PENDING',
      });
      if (response.success) {
        setSuccessMessage('User status updated successfully!');
        setTimeout(() => {
          setStatusModalOpen(false);
          setSuccessMessage('');
          fetchUsers();
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to update user status');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle organization status change
  const handleChangeOrgStatus = async () => {
    if (!selectedOrg) return;

    setActionLoading('org-status');
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await adminService.changeOrganizationStatus(selectedOrg.id, {
        status: orgStatus,
        reason: orgReason,
      });
      if (response.success) {
        setSuccessMessage('Organization status updated successfully!');
        setTimeout(() => {
          setOrgStatusModalOpen(false);
          setSuccessMessage('');
          fetchPendingOrganizations();
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to update organization status');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to update organization status');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle verify document
  const handleVerifyDocument = async () => {
    if (!selectedDoc) return;

    setActionLoading('doc-verify');
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await adminService.verifyOnboardingDocument(selectedDoc.id, {
        status: docAction,
        rejectionReason: docAction === 'REJECTED' ? docRejectionReason : undefined,
      });
      if (response.success) {
        setSuccessMessage(`Document ${docAction.toLowerCase()} successfully!`);
        setTimeout(() => {
          setDocModalOpen(false);
          setSuccessMessage('');
          fetchPendingDocuments();
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to verify document');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to verify document');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle approve step
  const handleApproveStep = async () => {
    if (!selectedStep) return;

    setActionLoading('step-approve');
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await adminService.approveOnboardingStep(selectedStep.id, {
        status: stepAction,
        rejectionReason: stepAction === 'REJECTED' ? stepRejectionReason : undefined,
      });
      if (response.success) {
        setSuccessMessage(`Onboarding step ${stepAction.toLowerCase()} successfully!`);
        setTimeout(() => {
          setStepModalOpen(false);
          setSuccessMessage('');
          fetchPendingSteps();
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to approve step');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to approve step');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle toggle provider status
  const handleToggleProvider = async (provider: string) => {
    if (!selectedUser) return;

    const currentStatus = providerStatuses[provider];
    setProviderLoading(provider);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await adminService.activateProvider({
        user_id: selectedUser.id,
        provider: provider,
        status: !currentStatus,
      });

      if (response.success) {
        setProviderStatuses(prev => ({
          ...prev,
          [provider]: !currentStatus,
        }));
        setSuccessMessage(`Provider ${provider} ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        setTimeout(() => {
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || `Failed to ${!currentStatus ? 'activate' : 'deactivate'} provider`);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || `Failed to ${!currentStatus ? 'activate' : 'deactivate'} provider`);
    } finally {
      setProviderLoading(null);
    }
  };

  // Open provider management modal
  const handleOpenProviderModal = (user: User) => {
    setSelectedUser(user);
    // Reset provider statuses - in a real app, you'd fetch current statuses from API
    setProviderStatuses({
      MTN_CAM: false,
      ORANGE_CAM: false,
    });
    setProviderModalOpen(true);
  };

  const tabs = [
    { id: 'users', label: 'Users', icon: <Users size={16} /> },
    { id: 'organizations', label: 'Organizations', icon: <Building size={16} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
    { id: 'onboarding', label: 'Onboarding Steps', icon: <List size={16} /> },
    { id: 'logs', label: 'Logs', icon: <FileText size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mt-12 gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage users, organizations, and onboarding</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700  flex items-center gap-3">
            <CheckCircle size={20} className="flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700  flex items-center gap-3">
            <WarningCircle size={20} className="flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 bg-white  shadow">
          <AdminTabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as AdminTab)} />

          <div className="p-6">
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex gap-2">
                    <select
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300  text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="username">Username</option>
                      <option value="email">Email</option>
                      <option value="id">ID</option>
                    </select>
                    <input
                      type="text"
                      placeholder={searchQuery ? `Search by ${searchType}...` : `Filter by ${searchType} (optional - showing all users)...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                      className="flex-1 px-4 py-2 border border-gray-300  text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <button
                    onClick={fetchUsers}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white  text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <Spinner size={16} className="animate-spin" /> : <MagnifyingGlass size={16} />}
                    {!loading && (searchQuery.trim() ? 'Search' : 'Refresh')}
                  </button>
                  <button
                    onClick={() => setRegisterModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white  text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors"
                  >
                    <Plus size={16} />
                    Register
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <Spinner size={32} className="animate-spin text-green-600" />
                  </div>
                ) : users.length > 0 ? (
                  <AdminTable
                    columns={[
                      { key: 'username', label: 'Username', render: (v, u: User) => u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : v },
                      { key: 'email', label: 'Email' },
                      { key: 'role', label: 'Role' },
                      {
                        key: 'status',
                        label: 'Status',
                        render: (v) => <StatusBadge status={v} />,
                      },
                      { key: 'createdAt', label: 'Created', render: (v) => v ? formatDate(v) : '-' },
                      {
                        key: 'id',
                        label: 'Actions',
                        render: (_, user: User) => (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setStatusModalOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              {user.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleOpenProviderModal(user)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Providers
                            </button>
                          </div>
                        ),
                      },
                    ]}
                    data={users}
                    rowKey={(u: User) => u.id}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    {searchQuery.trim() 
                      ? 'No users found matching your search. Try a different query.' 
                      : 'No users found. Users will appear here once registered.'}
                  </div>
                )}
              </div>
            )}

            {/* Organizations Tab */}
            {activeTab === 'organizations' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Spinner size={32} className="animate-spin text-green-600" />
                  </div>
                ) : organizations.length > 0 ? (
                  <div className="grid gap-4">
                    {organizations.map((org) => (
                      <div key={org.id} className="p-4 border border-gray-200  hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{org.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">Owner: {org.owner?.email || org.owner?.username}</p>
                            {org.onboardingStatus && (
                              <p className="text-sm text-gray-600 mt-1">
                                Onboarding: {org.onboardingStatus.completedSteps}/{org.onboardingStatus.totalSteps} steps
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">ID: {org.id}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <StatusBadge status={org.status} />
                            <button
                              onClick={() => {
                                setSelectedOrg(org);
                                setOrgStatus(org.status === 'PENDING' ? 'ACTIVE' : 'SUSPENDED');
                                setOrgReason('');
                                setOrgStatusModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Change Status
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No pending organizations.
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Spinner size={32} className="animate-spin text-green-600" />
                  </div>
                ) : documents.length > 0 ? (
                  <div className="grid gap-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-4 border border-gray-200  hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{doc.fileName}</h3>
                            <p className="text-sm text-gray-600 mt-1">Type: {doc.documentType}</p>
                            {doc.user && <p className="text-sm text-gray-600">User: {doc.user.email}</p>}
                            {doc.organization && <p className="text-sm text-gray-600">Organization: {doc.organization.name}</p>}
                            <p className="text-xs text-gray-500 mt-2">Uploaded: {doc.uploadedAt ? formatDate(doc.uploadedAt) : '-'}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedDoc(doc);
                                setDocAction('APPROVED');
                                setDocRejectionReason('');
                                setDocModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              Review
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No pending documents.
                  </div>
                )}
              </div>
            )}

            {/* Onboarding Steps Tab */}
            {activeTab === 'onboarding' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Spinner size={32} className="animate-spin text-green-600" />
                  </div>
                ) : steps.length > 0 ? (
                  <div className="grid gap-4">
                    {steps.map((step) => (
                      <div key={step.id} className="p-4 border border-gray-200  hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{step.stepName}</h3>
                            {step.user && <p className="text-sm text-gray-600 mt-1">User: {step.user.email}</p>}
                            {step.organization && <p className="text-sm text-gray-600">Organization: {step.organization.name}</p>}
                            <p className="text-xs text-gray-500 mt-2">Submitted: {step.submittedAt ? formatDate(step.submittedAt) : '-'}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedStep(step);
                                setStepAction('APPROVED');
                                setStepRejectionReason('');
                                setStepModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              Review
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No pending onboarding steps.
                  </div>
                )}
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {logs.length} of {logsPagination.total} logs
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchLogs(logsPagination.page - 1, logsPagination.limit)}
                      disabled={!logsPagination.hasPrev || loading}
                      className="px-4 py-2 bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Page {logsPagination.page} of {logsPagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchLogs(logsPagination.page + 1, logsPagination.limit)}
                      disabled={!logsPagination.hasNext || loading}
                      className="px-4 py-2 bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Spinner size={32} className="animate-spin text-green-600" />
                  </div>
                ) : logs.length > 0 ? (
                  <AdminTable
                    columns={[
                      { key: 'method', label: 'Method', render: (v) => <span className="font-mono text-xs">{v}</span> },
                      { 
                        key: 'endpoint', 
                        label: 'Endpoint', 
                        render: (v) => <span className="font-mono text-xs max-w-md truncate block" title={v}>{v}</span> 
                      },
                      { 
                        key: 'status', 
                        label: 'Status', 
                        render: (v) => {
                          const status = parseInt(String(v), 10);
                          const color = status >= 200 && status < 300 ? 'text-green-600' : status >= 400 ? 'text-red-600' : 'text-yellow-600';
                          return <span className={`font-semibold ${color}`}>{status}</span>;
                        }
                      },
                      { key: 'executionTime', label: 'Time', render: (v) => v || '-' },
                      { key: 'ipAddress', label: 'IP', render: (v) => v || '-' },
                      { key: 'createdAt', label: 'Date', render: (v) => v ? formatDate(v) : '-' },
                      {
                        key: 'id',
                        label: 'Actions',
                        render: (_, log: LogEntry) => (
                          <button
                            onClick={() => {
                              setSelectedLog(log);
                              setLogModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View
                          </button>
                        ),
                      },
                    ]}
                    data={logs}
                    rowKey={(log: LogEntry) => log.id}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No logs found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Register User Modal */}
      <AdminModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Register New User"
        description="Create a new user account in the system"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRegisterUser();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={registerData.username}
                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300  text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300  text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300  text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={registerData.role}
                onChange={(e) => setRegisterData({ ...registerData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300  text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={registerData.firstName}
                onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300  text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={registerData.lastName}
                onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300  text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setRegisterModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700  font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading === 'register'}
              className="flex-1 px-4 py-2 bg-green-600 text-white  font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {actionLoading === 'register' && <Spinner size={16} className="animate-spin" />}
              Register User
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Change User Status Modal */}
      <AdminModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Change User Status"
        description={`Change ${selectedUser?.username || selectedUser?.email}'s status`}
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleChangeUserStatus();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
            <p className="text-sm font-medium text-gray-900">
              <StatusBadge status={selectedUser?.status || 'UNKNOWN'} />
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
            <p className="text-sm font-medium text-gray-900">
              {(selectedUser?.status === 'ACTIVE' || selectedUser?.status === 'PENDING') ? 'STOP (INACTIVE)' : 'ACTIVE'}
            </p>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700  font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading === 'status'}
              className="flex-1 px-4 py-2 bg-red-600 text-white  font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {actionLoading === 'status' && <Spinner size={16} className="animate-spin" />}
              Update Status
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Organization Status Modal */}
      <AdminModal
        isOpen={orgStatusModalOpen}
        onClose={() => setOrgStatusModalOpen(false)}
        title="Change Organization Status"
        description={selectedOrg?.name || 'Organization Status'}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleChangeOrgStatus();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
            <select
              value={orgStatus}
              onChange={(e) => setOrgStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300  text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          {orgStatus === 'REJECTED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
              <textarea
                value={orgReason}
                onChange={(e) => setOrgReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300  text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Why is this organization being rejected?"
              />
            </div>
          )}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setOrgStatusModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700  font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading === 'org-status'}
              className="flex-1 px-4 py-2 bg-green-600 text-white  font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {actionLoading === 'org-status' && <Spinner size={16} className="animate-spin" />}
              Update Status
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Document Verification Modal */}
      <AdminModal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title="Verify Document"
        description={selectedDoc?.fileName || 'Document Verification'}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerifyDocument();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <p className="text-sm text-gray-600">{selectedDoc?.documentType}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
            <select
              value={docAction}
              onChange={(e) => setDocAction(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300  text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="APPROVED">Approve</option>
              <option value="REJECTED">Reject</option>
            </select>
          </div>
          {docAction === 'REJECTED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
              <textarea
                value={docRejectionReason}
                onChange={(e) => setDocRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300  text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Why is this document being rejected?"
              />
            </div>
          )}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setDocModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700  font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading === 'doc-verify'}
              className="flex-1 px-4 py-2 bg-green-600 text-white  font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {actionLoading === 'doc-verify' && <Spinner size={16} className="animate-spin" />}
              Verify Document
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Step Approval Modal */}
      <AdminModal
        isOpen={stepModalOpen}
        onClose={() => setStepModalOpen(false)}
        title="Approve Onboarding Step"
        description={selectedStep?.stepName || 'Onboarding Step'}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleApproveStep();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Step Name</label>
            <p className="text-sm text-gray-600">{selectedStep?.stepName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
            <select
              value={stepAction}
              onChange={(e) => setStepAction(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300  text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="APPROVED">Approve</option>
              <option value="REJECTED">Reject</option>
            </select>
          </div>
          {stepAction === 'REJECTED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
              <textarea
                value={stepRejectionReason}
                onChange={(e) => setStepRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300  text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Why is this step being rejected?"
              />
            </div>
          )}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setStepModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700  font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading === 'step-approve'}
              className="flex-1 px-4 py-2 bg-green-600 text-white  font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {actionLoading === 'step-approve' && <Spinner size={16} className="animate-spin" />}
              Approve Step
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Log Details Modal */}
      <AdminModal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title="Log Details"
        description="Detailed information about this log entry"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedLog.method}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
              <p className="text-sm font-mono bg-gray-50 p-2 rounded break-all">{selectedLog.endpoint}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <p className="text-sm font-semibold">{selectedLog.status}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Execution Time</label>
              <p className="text-sm">{selectedLog.executionTime || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
              <p className="text-sm font-mono">{selectedLog.ipAddress || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <p className="text-sm">{selectedLog.createdAt ? formatDate(selectedLog.createdAt) : '-'}</p>
            </div>
            {selectedLog.requestBody && Object.keys(selectedLog.requestBody).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Body</label>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(selectedLog.requestBody, null, 2)}
                </pre>
              </div>
            )}
            {selectedLog.responseBody && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Response Body</label>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-40">
                  {typeof selectedLog.responseBody === 'string' 
                    ? selectedLog.responseBody 
                    : JSON.stringify(selectedLog.responseBody, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </AdminModal>

      {/* Payment Providers Management Modal */}
      <AdminModal
        isOpen={providerModalOpen}
        onClose={() => setProviderModalOpen(false)}
        title="Manage Payment Providers"
        description={`Manage payment providers for ${selectedUser?.username || selectedUser?.email || 'user'}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Enable or disable payment providers for this user. Users can only make payments using enabled providers.
          </div>
          
          {/* MTN Cameroon Provider */}
          <div className="p-4 border border-gray-200 ">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">MTN Mobile Money Cameroon</h3>
                <p className="text-sm text-gray-600 mt-1">MTN_CAM</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={providerStatuses.MTN_CAM ? 'ACTIVE' : 'INACTIVE'} />
                <button
                  onClick={() => handleToggleProvider('MTN_CAM')}
                  disabled={providerLoading === 'MTN_CAM'}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    providerStatuses.MTN_CAM
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  } disabled:opacity-50 flex items-center gap-2`}
                >
                  {providerLoading === 'MTN_CAM' && <Spinner size={16} className="animate-spin" />}
                  {providerStatuses.MTN_CAM ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>

          {/* Orange Cameroon Provider */}
          <div className="p-4 border border-gray-200 ">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Orange Money Cameroon</h3>
                <p className="text-sm text-gray-600 mt-1">ORANGE_CAM</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={providerStatuses.ORANGE_CAM ? 'ACTIVE' : 'INACTIVE'} />
                <button
                  onClick={() => handleToggleProvider('ORANGE_CAM')}
                  disabled={providerLoading === 'ORANGE_CAM'}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    providerStatuses.ORANGE_CAM
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  } disabled:opacity-50 flex items-center gap-2`}
                >
                  {providerLoading === 'ORANGE_CAM' && <Spinner size={16} className="animate-spin" />}
                  {providerStatuses.ORANGE_CAM ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setProviderModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}

