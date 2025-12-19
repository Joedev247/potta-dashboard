'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, MagnifyingGlass, Eye, PencilSimple, Trash, X, CheckCircle, WarningCircle, Spinner, Users, Envelope, Phone, MapPin, Calendar, CaretDown } from '@phosphor-icons/react';
import { customersService } from '@/lib/api';
import type { Customer } from '@/lib/api/customers';
import { useOrganization } from '@/contexts/OrganizationContext';
import { formatDate } from '@/lib/utils/format';

export default function CustomersPage() {
  const { organization } = useOrganization();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showAmountDropdown, setShowAmountDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Last 30 days');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const periodRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = organization?.id ? { organization_id: organization.id } : undefined;
      const response = await customersService.listCustomers(params);
      if (response.success && response.data) {
        setCustomers(Array.isArray(response.data) ? response.data : []);
      } else {
        setCustomers([]);
        if (response.error) {
          setErrorMessage(response.error.message || 'Failed to load customers');
        }
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
      setErrorMessage('Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Filter customers by search query
  const filteredCustomers = customers.filter(customer => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        customer.firstName?.toLowerCase().includes(query) ||
        customer.lastName?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query) ||
        customer.address?.toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // Period filter (uses createdAt if available)
    if (selectedPeriod && selectedPeriod !== 'All' && customer.createdAt) {
      const today = new Date();
      let startDate = new Date();
      switch (selectedPeriod) {
        case 'Last 7 days':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'Last 30 days':
          startDate.setDate(today.getDate() - 30);
          break;
        case 'Last 90 days':
          startDate.setDate(today.getDate() - 90);
          break;
        case 'This year':
          startDate = new Date(today.getFullYear(), 0, 1);
          break;
        default:
          break;
      }
      const created = new Date(customer.createdAt as any);
      if (!(created >= startDate && created <= today)) return false;
    }

    // Amount filter: not applicable for customers (kept for visual parity)

    // Status filter: simple has-email / no-email
    if (selectedStatus && selectedStatus !== 'All') {
      if (selectedStatus === 'Has Email' && !customer.email) return false;
      if (selectedStatus === 'No Email' && customer.email) return false;
    }

    return true;
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(event.target as Node)) {
        setShowPeriodDropdown(false);
      }
      if (amountRef.current && !amountRef.current.contains(event.target as Node)) {
        setShowAmountDropdown(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    if (showPeriodDropdown || showAmountDropdown || showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPeriodDropdown, showAmountDropdown, showStatusDropdown]);

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
    });
    setSelectedCustomer(null);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Handle create customer
  const handleCreateCustomer = async () => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage('First name and last name are required');
      setActionLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage('Email is required');
      setActionLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address');
      setActionLoading(false);
      return;
    }

    try {
      const customerData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        organization_id: organization?.id,
      };

      const response = await customersService.createCustomer(customerData);
      
      if (response.success) {
        setSuccessMessage('Customer created successfully!');
        await fetchCustomers();
        setTimeout(() => {
          resetForm();
          setShowCreateModal(false);
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to create customer. Please try again.');
      }
    } catch (error: any) {
      console.error('Create customer error:', error);
      setErrorMessage('Failed to create customer. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setShowEditModal(true);
  };

  // Handle update customer
  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage('First name and last name are required');
      setActionLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage('Email is required');
      setActionLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address');
      setActionLoading(false);
      return;
    }

    try {
      const updateData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
      };

      const response = await customersService.updateCustomer(selectedCustomer.id, updateData);
      
      if (response.success) {
        setSuccessMessage('Customer updated successfully!');
        await fetchCustomers();
        setTimeout(() => {
          resetForm();
          setShowEditModal(false);
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to update customer. Please try again.');
      }
    } catch (error: any) {
      console.error('Update customer error:', error);
      setErrorMessage(error?.message || 'Failed to update customer. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete customer
  const handleDeleteCustomer = async () => {
    if (!showDeleteConfirm) return;

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await customersService.deleteCustomer(showDeleteConfirm);
      
      if (response.success) {
        setSuccessMessage('Customer deleted successfully!');
        await fetchCustomers();
        setTimeout(() => {
          setShowDeleteConfirm(null);
          setSuccessMessage('');
        }, 2000);
      } else {
        setErrorMessage(response.error?.message || 'Failed to delete customer. Please try again.');
      }
    } catch (error: any) {
      console.error('Delete customer error:', error);
      setErrorMessage('Failed to delete customer. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle view customer
  const handleViewCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setErrorMessage('');
    // Fetch full customer details
    try {
      const response = await customersService.getCustomer(customer.id);
      if (response.success && response.data) {
        setSelectedCustomer(response.data);
        setShowViewModal(true);
      } else {
        setErrorMessage(response.error?.message || 'Failed to load customer details');
        // Still show modal with existing data
        setShowViewModal(true);
      }
    } catch (error: any) {
      console.error('Error fetching customer details:', error);
      setErrorMessage(error?.message || 'Failed to load customer details');
      // Still show modal with existing data
      setShowViewModal(true);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Customers</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your customer database</p>
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
            Create Customer
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

      {/* Search + Filters (matches invoices layout) */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name, email, phone, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-1 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Period Dropdown */}
          <div className="relative" ref={periodRef}>
            <button
              onClick={() => {
                setShowPeriodDropdown(!showPeriodDropdown);
                setShowAmountDropdown(false);
                setShowStatusDropdown(false);
              }}
              className={`flex items-center gap-2 px-4 py-1 bg-white border border-gray-200 rounded text-sm transition-colors ${
                selectedPeriod ? 'border-green-500 bg-green-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{selectedPeriod}</span>
              <CaretDown className="w-4 h-4" />
            </button>
            {showPeriodDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[150px] rounded">
                {['All', 'Last 7 days', 'Last 30 days', 'Last 90 days', 'This year'].map((period) => (
                  <button
                    key={period}
                    onClick={() => {
                      setSelectedPeriod(period);
                      setShowPeriodDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                  >
                    {period}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount Dropdown (visual parity; no-op for customers) */}
          <div className="relative" ref={amountRef}>
            <button
              onClick={() => {
                setShowAmountDropdown(!showAmountDropdown);
                setShowPeriodDropdown(false);
                setShowStatusDropdown(false);
              }}
              className={`px-4 py-1 bg-white border border-gray-200 text-sm transition-colors rounded ${
                selectedAmount ? 'border-green-500 bg-green-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {selectedAmount || 'Amount'}
              <CaretDown className="w-4 h-4 inline-block ml-2" />
            </button>
            {showAmountDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[150px] rounded">
                {['All'].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount === 'All' ? '' : amount);
                      setShowAmountDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                  >
                    {amount}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative" ref={statusRef}>
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowPeriodDropdown(false);
                setShowAmountDropdown(false);
              }}
              className={`px-4 py-1 bg-white border border-gray-200 text-sm transition-colors rounded ${
                selectedStatus ? 'border-green-500 bg-green-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {selectedStatus || 'Status'}
              <CaretDown className="w-4 h-4 inline-block ml-2" />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[150px] rounded">
                {['All', 'Has Email', 'No Email'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setSelectedStatus(status === 'All' ? '' : status);
                      setShowStatusDropdown(false);
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
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
            <div className="hidden lg:grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
              <div>Customer</div>
              <div>Email</div>
              <div>Phone</div>
              <div>Address</div>
              <div>Actions</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div key={customer.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                  {/* Mobile Card Layout */}
                  <div className="lg:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center gap-1">
                          <Envelope className="w-3 h-3" />
                          {customer.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 px-3 py-1 border border-green-200 hover:bg-green-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </div>
                    </div>
                    {customer.phone && (
                      <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </div>
                    )}
                    {customer.address && (
                      <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {customer.address}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => handleViewCustomer(customer)}
                        className="px-3 py-2 text-sm rounded-full font-semibold text-green-700 hover:text-green-800 transition-all duration-200 group/btn"
                        title="View Customer"
                      >
                        <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className="px-3 py-2 text-sm rounded-full font-semibold text-gray-700 hover:text-gray-800 transition-all duration-200 group/btn"
                        title="Edit Customer"
                      >
                        <PencilSimple className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(customer.id)}
                        className="px-3 py-2 text-sm rounded-full font-semibold text-red-700 hover:text-red-800 transition-all duration-200 group/btn"
                        title="Delete Customer"
                      >
                        <Trash className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                  {/* Desktop Table Layout */}
                  <div className="hidden lg:grid grid-cols-5 gap-4 items-center">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{customer.email}</div>
                    <div className="text-sm text-gray-600">{customer.phone || 'N/A'}</div>
                    <div className="text-sm text-gray-600">{customer.address || 'N/A'}</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewCustomer(customer)}
                        className="px-3 py-2 text-sm rounded-full font-semibold text-green-700 hover:text-green-800 transition-all duration-200 group/btn"
                        title="View Customer"
                      >
                        <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className="px-3 py-2 text-sm rounded-full font-semibold text-gray-700 hover:text-gray-800 transition-all duration-200 group/btn"
                        title="Edit Customer"
                      >
                        <PencilSimple className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(customer.id)}
                        className="px-3 py-2 text-sm rounded-full font-semibold text-red-700 hover:text-red-800 transition-all duration-200 group/btn"
                        title="Delete Customer"
                      >
                        <Trash className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 sm:px-6 py-6 sm:py-8 text-center text-sm text-gray-500">
                {searchQuery ? 'No customers found matching your search.' : 'No customers found. Create your first customer to get started.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Customer Modal - Right Slide Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
            onClick={() => {
              resetForm();
              setShowCreateModal(false);
            }}
          />
          {/* Modal Content */}
          <div className="relative bg-white h-full w-full max-w-2xl shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 overflow-y-auto">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Create Customer
              </h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            {/* Form Content */}
            <div className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateCustomer();
                }}
                className="space-y-4"
              >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  placeholder="john.doe@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  placeholder="+237 6 12 34 56 78"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  placeholder="Douala, Cameroon"
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
                    'Create Customer'
                  )}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Edit Customer</h2>
                <button
                  onClick={() => {
                    resetForm();
                    setShowEditModal(false);
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
                handleUpdateCustomer();
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowEditModal(false);
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
                      Updating...
                    </>
                  ) : (
                    'Update Customer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Customer Modal */}
      {showViewModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedCustomer(null);
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
                  <label className="text-sm text-gray-600 font-medium">Customer ID</label>
                  <p className="text-sm font-mono text-gray-500 mt-1 break-all">{selectedCustomer.id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Organization ID</label>
                  <p className="text-sm font-mono text-gray-500 mt-1 break-all">{selectedCustomer.organization_id || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">First Name</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{selectedCustomer.firstName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">Last Name</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{selectedCustomer.lastName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium flex items-center gap-1">
                    <Envelope className="w-4 h-4" />
                    Email
                  </label>
                  <p className="text-lg text-gray-900 mt-1 break-all">{selectedCustomer.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  <p className="text-lg text-gray-900 mt-1">{selectedCustomer.phone || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-600 font-medium flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Address
                  </label>
                  <p className="text-lg text-gray-900 mt-1">{selectedCustomer.address || 'N/A'}</p>
                </div>
                {selectedCustomer.createdAt && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Created At</label>
                    <p className="text-lg text-gray-900 mt-1">{formatDate(selectedCustomer.createdAt)}</p>
                  </div>
                )}
                {selectedCustomer.updatedAt && (
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Updated At</label>
                    <p className="text-lg text-gray-900 mt-1">{formatDate(selectedCustomer.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditCustomer(selectedCustomer);
                }}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded flex items-center gap-2"
              >
                <PencilSimple className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedCustomer(null);
                }}
                className="px-6 py-2 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <WarningCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900">Delete Customer</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this customer? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <Spinner className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


