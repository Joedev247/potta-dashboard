'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Shield, 
  UserPlus, 
  MagnifyingGlass, 
  Funnel, 
  CaretDown, 
  Eye, 
  PencilSimple, 
  CheckCircle, 
  XCircle, 
  Spinner, 
  WarningCircle, 
  X,
  Users,
  Gear,
  Building,
  Envelope,
  Calendar,
  Power,
  PowerOff
} from '@phosphor-icons/react';
import { adminService, type RegisterUserData, type ChangeUserStatusData } from '@/lib/api';
import type { User } from '@/lib/api/admin';
import { formatDate } from '@/lib/utils/format';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'username' | 'email' | 'id'>('username');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);
  
  // Modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [registerFormData, setRegisterFormData] = useState<RegisterUserData>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user',
  });
  
  const [statusFormData, setStatusFormData] = useState<ChangeUserStatusData>({
    id: '',
    status: 'ACTIVE',
  });
  
  const [providerFormData, setProviderFormData] = useState({
    name: '',
    status: 'PENDING' as 'ACTIVE' | 'INACTIVE' | 'PENDING',
  });

  const tabs = [
    { id: 'users', label: 'User Management' },
    { id: 'providers', label: 'Provider Management' },
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

  // Find users
  const findUsers = useCallback(async () => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    
    try {
      const params: any = {};
      if (searchType === 'username') {
        params.username = searchQuery;
      } else if (searchType === 'email') {
        params.email = searchQuery;
      } else if (searchType === 'id') {
        params.id = searchQuery;
      }

      const response = await adminService.findUsers(params);
      
      if (response.success && response.data) {
        let filteredUsers = response.data;
        
        // Apply status filter if selected
        if (selectedFilter && selectedFilter !== 'All') {
          filteredUsers = filteredUsers.filter((user: User) => 
            user.status?.toUpperCase() === selectedFilter.toUpperCase()
          );
        }
        
        setUsers(filteredUsers);
      } else {
        setUsers([]);
        // Check if it's an admin access error
        if (response.error?.code === 'ADMIN_ACCESS_REQUIRED') {
          setErrorMessage('Admin access required. Your account does not have admin privileges. Please contact your system administrator.');
        } else {
          setErrorMessage(response.error?.message || 'Failed to find users');
        }
      }
    } catch (error: any) {
      console.error('Error finding users:', error);
      setUsers([]);
      setErrorMessage(error?.message || 'Failed to find users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, searchType, selectedFilter]);

  // Handle register user
  const handleRegisterUser = async () => {
    setActionLoading('register');
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!registerFormData.username || !registerFormData.email || !registerFormData.password) {
      setErrorMessage('Username, email, and password are required');
      setActionLoading(null);
      return;
    }

    try {
      const response = await adminService.registerUser(registerFormData);
      
      if (response.success) {
        setSuccessMessage('User registered successfully!');
        setRegisterFormData({
          username: '',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'user',
        });
        setTimeout(() => {
          setShowRegisterModal(false);
          setSuccessMessage('');
          findUsers();
        }, 2000);
      } else {
        // Check if it's an admin access error
        if (response.error?.code === 'ADMIN_ACCESS_REQUIRED') {
          setErrorMessage('Admin access required. Your account does not have admin privileges. Please contact your system administrator.');
        } else {
          setErrorMessage(response.error?.message || 'Failed to register user. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Register user error:', error);
      setErrorMessage(error?.message || 'Failed to register user. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle change user status
  const handleChangeUserStatus = async () => {
    if (!selectedUser) return;

    setActionLoading(selectedUser.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await adminService.changeUserStatus({
        id: selectedUser.id,
        status: statusFormData.status,
      });
      
      if (response.success) {
        setSuccessMessage(`User status updated to ${statusFormData.status} successfully!`);
        await findUsers();
        setTimeout(() => {
          setShowStatusModal(false);
          setSuccessMessage('');
        }, 2000);
      } else {
        // Check if it's an admin access error
        if (response.error?.code === 'ADMIN_ACCESS_REQUIRED') {
          setErrorMessage('Admin access required. Your account does not have admin privileges. Please contact your system administrator.');
        } else {
          setErrorMessage(response.error?.message || 'Failed to update user status. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Change user status error:', error);
      setErrorMessage(error?.message || 'Failed to update user status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle create provider
  const handleCreateProvider = async () => {
    setActionLoading('provider');
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!providerFormData.name) {
      setErrorMessage('Provider name is required');
      setActionLoading(null);
      return;
    }

    try {
      const response = await adminService.createProvider({
        name: providerFormData.name,
        status: providerFormData.status,
      });
      
      if (response.success) {
        setSuccessMessage('Provider created successfully!');
        setProviderFormData({
          name: '',
          status: 'PENDING',
        });
        setTimeout(() => {
          setShowProviderModal(false);
          setSuccessMessage('');
        }, 2000);
      } else {
        // Check if it's an admin access error
        if (response.error?.code === 'ADMIN_ACCESS_REQUIRED') {
          setErrorMessage('Admin access required. Your account does not have admin privileges. Please contact your system administrator.');
        } else {
          setErrorMessage(response.error?.message || 'Failed to create provider. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Create provider error:', error);
      setErrorMessage(error?.message || 'Failed to create provider. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle view user
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  // Handle change status click
  const handleChangeStatusClick = (user: User) => {
    setSelectedUser(user);
    setStatusFormData({
      id: user.id,
      status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    });
    setShowStatusModal(true);
  };

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200';
      case 'INACTIVE': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.id.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query)
    );
  });

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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage users, providers, and system settings</p>
            </div>
          </div>
          {activeTab === 'users' && (
            <button
              onClick={() => {
                setRegisterFormData({
                  username: '',
                  email: '',
                  password: '',
                  firstName: '',
                  lastName: '',
                  role: 'user',
                });
                setShowRegisterModal(true);
              }}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
            >
              <UserPlus className="w-4 h-4" />
              Register User
            </button>
          )}
          {activeTab === 'providers' && (
            <button
              onClick={() => {
                setProviderFormData({
                  name: '',
                  status: 'PENDING',
                });
                setShowProviderModal(true);
              }}
              className="w-full sm:w-auto px-4 sm:px-5 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
            >
              <Gear className="w-4 h-4" />
              Create Provider
            </button>
          )}
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
              px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-colors relative whitespace-nowrap
              ${activeTab === tab.id
                ? 'text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-green-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          {/* Search and Filters */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <div className="flex gap-2">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                  className="px-3 py-2 text-sm border-2 border-gray-200 rounded-l focus:outline-none focus:border-green-500 bg-white"
                >
                  <option value="username">Username</option>
                  <option value="email">Email</option>
                  <option value="id">ID</option>
                </select>
                <input
                  type="text"
                  placeholder={`Search by ${searchType}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      findUsers();
                    }
                  }}
                  className="flex-1 pl-10 pr-4 py-2 text-base bg-white border-2 border-gray-200 border-l-0 text-gray-900 rounded-r focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
            <button
              onClick={findUsers}
              disabled={loading || !searchQuery.trim()}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-base bg-white border border-gray-200 text-sm transition-colors ${
                  selectedFilter ? 'border-green-500 bg-green-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>{selectedFilter || 'Status'}</span>
                <CaretDown className="w-4 h-4" />
              </button>
              {showFilterDropdown && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[150px] rounded">
                  {['All', 'ACTIVE', 'INACTIVE'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setSelectedFilter(status === 'All' ? '' : status);
                        setShowFilterDropdown(false);
                        findUsers();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
                <div className="hidden lg:grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                  <div>User</div>
                  <div>Email</div>
                  <div>Role</div>
                  <div>Status</div>
                  <div>Created</div>
                  <div>Actions</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                    {/* Mobile Card Layout */}
                    <div className="lg:hidden space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || user.id}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{user.email || 'N/A'}</div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(user.status)}`}>
                          {user.status || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <div>Role: {user.role || 'N/A'}</div>
                        {user.createdAt && <div>{formatDate(user.createdAt)}</div>}
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="flex-1 px-3 py-2 text-sm font-medium border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors rounded flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleChangeStatusClick(user)}
                          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors rounded flex items-center justify-center gap-2 ${
                            user.status === 'ACTIVE'
                              ? 'border-2 border-red-200 text-red-700 hover:bg-red-50'
                              : 'border-2 border-green-200 text-green-700 hover:bg-green-50'
                          }`}
                        >
                          {user.status === 'ACTIVE' ? (
                            <>
                              <PowerOff className="w-4 h-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Power className="w-4 h-4" />
                              Enable
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    {/* Desktop Table Layout */}
                    <div className="hidden lg:grid grid-cols-6 gap-4 items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || user.id}
                      </div>
                      <div className="text-sm text-gray-600">{user.email || 'N/A'}</div>
                      <div className="text-sm text-gray-600">{user.role || 'N/A'}</div>
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(user.status)}`}>
                          {user.status || 'N/A'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleChangeStatusClick(user)}
                          className={`text-sm font-medium flex items-center gap-1 ${
                            user.status === 'ACTIVE'
                              ? 'text-red-600 hover:text-red-700'
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {user.status === 'ACTIVE' ? (
                            <>
                              <PowerOff className="w-4 h-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Power className="w-4 h-4" />
                              Enable
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Users className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">No Users Found</p>
              <p className="text-gray-500 mb-6">
                {searchQuery ? 'No users match your search criteria. Try a different search term.' : 'Search for users by username, email, or ID.'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <Gear className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-xl font-semibold text-gray-700 mb-2">Provider Management</p>
          <p className="text-gray-500 mb-6">
            Create and manage payment providers for users.
          </p>
          <button
            onClick={() => setShowProviderModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all  shadow-md flex items-center gap-2"
          >
            <Gear className="w-5 h-5" />
            Create Provider
          </button>
        </div>
      )}

      {/* Register User Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Register User</h2>
                <button
                  onClick={() => {
                    setShowRegisterModal(false);
                    setRegisterFormData({
                      username: '',
                      email: '',
                      password: '',
                      firstName: '',
                      lastName: '',
                      role: 'user',
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
                handleRegisterUser();
              }}
              className="p-6 space-y-4"
            >
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2">
                  <WarningCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{errorMessage}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={registerFormData.username}
                    onChange={(e) => setRegisterFormData({ ...registerFormData, username: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={registerFormData.email}
                    onChange={(e) => setRegisterFormData({ ...registerFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={registerFormData.password}
                    onChange={(e) => setRegisterFormData({ ...registerFormData, password: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={registerFormData.role}
                    onChange={(e) => setRegisterFormData({ ...registerFormData, role: e.target.value as any })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={registerFormData.firstName}
                    onChange={(e) => setRegisterFormData({ ...registerFormData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={registerFormData.lastName}
                    onChange={(e) => setRegisterFormData({ ...registerFormData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterModal(false);
                    setRegisterFormData({
                      username: '',
                      email: '',
                      password: '',
                      firstName: '',
                      lastName: '',
                      role: 'user',
                    });
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'register'}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2"
                >
                  {actionLoading === 'register' ? (
                    <>
                      <Spinner className="w-4 h-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedUser(null);
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
                  <label className="text-sm text-gray-600 font-medium">User ID</label>
                  <p className="text-sm font-mono text-gray-500 mt-1 break-all">{selectedUser.id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Username</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{selectedUser.username || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Email</label>
                  <p className="text-lg text-gray-900 mt-1">{selectedUser.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Role</label>
                  <p className="text-lg text-gray-900 mt-1">{selectedUser.role || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Status</label>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded border ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status || 'N/A'}
                    </span>
                  </div>
                </div>
                {selectedUser.firstName && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">First Name</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedUser.firstName}</p>
                  </div>
                )}
                {selectedUser.lastName && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Last Name</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedUser.lastName}</p>
                  </div>
                )}
                {selectedUser.createdAt && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Created At</label>
                    <p className="text-lg text-gray-900 mt-1">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                )}
                {selectedUser.updatedAt && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Updated At</label>
                    <p className="text-lg text-gray-900 mt-1">{formatDate(selectedUser.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleChangeStatusClick(selectedUser);
                }}
                className={`px-4 py-2 font-medium transition-colors rounded flex items-center gap-2 ${
                  selectedUser.status === 'ACTIVE'
                    ? 'bg-white border border-red-200 text-red-700 hover:bg-red-50'
                    : 'bg-white border border-green-200 text-green-700 hover:bg-green-50'
                }`}
              >
                {selectedUser.status === 'ACTIVE' ? (
                  <>
                    <PowerOff className="w-4 h-4" />
                    Disable User
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4" />
                    Enable User
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUser(null);
                }}
                className="px-6 py-2 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {showStatusModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Change User Status</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleChangeUserStatus();
              }}
              className="space-y-4"
            >
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2">
                  <WarningCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{errorMessage}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                <p className="text-lg font-semibold text-gray-900">{selectedUser.username || selectedUser.email || selectedUser.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded border ${getStatusColor(selectedUser.status)}`}>
                  {selectedUser.status || 'N/A'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={statusFormData.status}
                  onChange={(e) => setStatusFormData({ ...statusFormData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
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
                  disabled={actionLoading === selectedUser.id}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2"
                >
                  {actionLoading === selectedUser.id ? (
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

      {/* Create Provider Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create Provider</h2>
                <button
                  onClick={() => {
                    setShowProviderModal(false);
                    setProviderFormData({
                      name: '',
                      status: 'PENDING',
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
                handleCreateProvider();
              }}
              className="p-6 space-y-4"
            >
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2">
                  <WarningCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{errorMessage}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={providerFormData.name}
                  onChange={(e) => setProviderFormData({ ...providerFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  placeholder="e.g., MTN_CAM, ORANGE_CMR"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Provider identifier name</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={providerFormData.status}
                  onChange={(e) => setProviderFormData({ ...providerFormData, status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'PENDING' })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="PENDING">Pending</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Initial status of the provider</p>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowProviderModal(false);
                    setProviderFormData({
                      name: '',
                      status: 'PENDING',
                    });
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'provider'}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2"
                >
                  {actionLoading === 'provider' ? (
                    <>
                      <Spinner className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Provider'
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

