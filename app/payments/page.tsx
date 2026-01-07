'use client';

import { MagnifyingGlass, Plus, ArrowSquareOut, ArrowLeft, CaretDown, Calendar, X, ArrowCounterClockwise, CaretUp, ArrowRight, WarningCircle, Package, ArrowClockwise, Eye, CheckCircle, Copy, Spinner, CreditCard, UserCheck, Phone, Link as LinkIcon } from '@phosphor-icons/react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { paymentsService, applicationsService, type Payment, type Refund, type Chargeback, type Order } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils/format';

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState('payments');
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [showExtraOptions, setShowExtraOptions] = useState(true);
  const [reusable, setReusable] = useState(false);
  const [savXAFl, setSavXAFl] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState(['MTN Mobile Money', 'Orange Money']);
  const [showPaymentMethodsDropdown, setShowPaymentMethodsDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'Fixed',
    currency: 'XAF',
    amount: '',
    description: '',
    expiryDate: '',
    redirectUrl: '',
  });
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showAmountFilter, setShowAmountFilter] = useState(false);
  const [showPeriodFilter, setShowPeriodFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // API data states
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [chargebacks, setChargebacks] = useState<Chargeback[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState({ payments: false, refunds: false, chargebacks: false, orders: false });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const tabs = [
    { id: 'payments', label: 'Payments' },
    { id: 'make-payment', label: 'Make Payment' },
    { id: 'payment-status', label: 'Payment Status' },
    { id: 'verify-account', label: 'Verify Account' },
    { id: 'refunds', label: 'Refunds' },
    { id: 'chargebacks', label: 'Chargebacks' },
    { id: 'orders', label: 'Orders' },
  ];
  
  // Make Payment states
  const [makePaymentForm, setMakePaymentForm] = useState({
    amount: '',
    currency: 'XAF',
    phoneNumber: '',
    username: '',
    type: 'DEPOSIT' as 'DEPOSIT' | 'COLLECTION',
    provider: 'MTN_CAM' as 'MTN_CAM' | 'ORANGE_CAM',
    description: '',
    // Optional: payment link slug to redeem (public redeem endpoint)
    slug: '',
  });
  const [makePaymentLoading, setMakePaymentLoading] = useState(false);
  const [makePaymentResult, setMakePaymentResult] = useState<any>(null);
  const [makePaymentError, setMakePaymentError] = useState<string | null>(null);
  // Applications (for selecting which application to use when making a payment)
  const [applications, setApplications] = useState<{ id: string; name: string; api_key: string }[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  
  // Payment Status states
  const [statusTransactionId, setStatusTransactionId] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<any>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  
  // Verify Account states
  const [verifyForm, setVerifyForm] = useState({
    phoneNumber: '',
    type: 'DEPOSIT' as 'DEPOSIT' | 'COLLECTION',
  });
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyType, setVerifyType] = useState<'active' | 'basic-info'>('active');

  // Fetch data functions
  const fetchPayments = useCallback(async () => {
    setLoading(prev => ({ ...prev, payments: true }));
    setError(null);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        status: selectedStatus || undefined,
      };
      
      // Add date filters if period is selected
      if (selectedPeriod && selectedPeriod !== 'All') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let startDate: Date = today;
        
        switch (selectedPeriod) {
          case 'Today':
            startDate = today;
            break;
          case 'This Week':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'This Month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'Last 3 Months':
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 3);
            break;
        }
        
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = new Date().toISOString().split('T')[0];
      }
      
      const response = await paymentsService.getPayments(params);
      if (response.success && response.data) {
        setPayments(response.data.payments || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else if (response && response.error && response.error.code === '403') {
        setPayments([]);
        setError('Access denied: you do not have permission to view payments. Please request admin access or use admin API credentials.');
      } else if (response && !response.success) {
        setError(response.error?.message || 'Failed to fetch payments.');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError((error as any)?.message || 'Failed to fetch payments.');
    } finally {
      setLoading(prev => ({ ...prev, payments: false }));
    }
  }, [searchQuery, selectedStatus, selectedPeriod, pagination.page, pagination.limit]);

  const fetchRefunds = useCallback(async () => {
    setLoading(prev => ({ ...prev, refunds: true }));
    try {
      const response = await paymentsService.getRefunds({
        page: pagination.page,
        limit: pagination.limit,
        status: selectedStatus || undefined,
      });
      if (response.success && response.data) {
        setRefunds(response.data.refunds || []);
      }
    } catch (error) {
      console.error('Error fetching refunds:', error);
    } finally {
      setLoading(prev => ({ ...prev, refunds: false }));
    }
  }, [searchQuery, selectedStatus, pagination.page, pagination.limit]);

  const fetchChargebacks = useCallback(async () => {
    setLoading(prev => ({ ...prev, chargebacks: true }));
    try {
      const response = await paymentsService.getChargebacks({
        page: pagination.page,
        limit: pagination.limit,
        status: selectedStatus || undefined,
      });
      if (response.success && response.data) {
        setChargebacks(response.data.chargebacks || []);
      }
    } catch (error) {
      console.error('Error fetching chargebacks:', error);
    } finally {
      setLoading(prev => ({ ...prev, chargebacks: false }));
    }
  }, [selectedStatus, pagination.page, pagination.limit]);

  const fetchOrders = useCallback(async () => {
    setLoading(prev => ({ ...prev, orders: true }));
    try {
      const response = await paymentsService.getOrders({
        page: pagination.page,
        limit: pagination.limit,
        status: selectedStatus || undefined,
      });
      if (response.success && response.data) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  }, [selectedStatus, pagination.page, pagination.limit]);

  // Fetch data on mount and when filters change
  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
    } else if (activeTab === 'refunds') {
      fetchRefunds();
    } else if (activeTab === 'chargebacks') {
      fetchChargebacks();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, fetchPayments, fetchRefunds, fetchChargebacks, fetchOrders]);

  // Fetch applications when the make-payment tab is opened
  const fetchApplications = useCallback(async () => {
    setApplicationsLoading(true);
    try {
      const resp = await applicationsService.listApplications({ limit: 50 });
      if (resp.success && resp.data) {
        const apps = resp.data.applications || [];
        setApplications(apps.map(a => ({ id: a.id, name: a.name, api_key: a.api_key })));
        if (apps.length === 1) setSelectedApplicationId(apps[0].id);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setApplicationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'make-payment') {
      fetchApplications();
    }
  }, [activeTab, fetchApplications]);

  // Handle make payment
  const handleMakePayment = async () => {
    setMakePaymentLoading(true);
    setMakePaymentError(null);
    setMakePaymentResult(null);

    // Validation
    if (!makePaymentForm.amount && !makePaymentForm.slug) {
      setMakePaymentError('Amount is required unless redeeming an existing payment link (provide slug).');
      setMakePaymentLoading(false);
      return;
    }

    if (!makePaymentForm.phoneNumber) {
      setMakePaymentError('Phone number is required');
      setMakePaymentLoading(false);
      return;
    }

    if (!makePaymentForm.provider) {
      setMakePaymentError('Payment provider is required');
      setMakePaymentLoading(false);
      return;
    }

    // Clean username: remove spaces, special characters, and Unicode characters, keep only ASCII alphanumeric, convert to lowercase
    const cleanedUsername = makePaymentForm.username
      .trim()
      .replace(/\s+/g, '') // Remove all whitespace
      .replace(/[^a-zA-Z0-9]/g, '') // Remove all non-alphanumeric characters
      .toLowerCase()
      .normalize('NFD') // Normalize to decompose Unicode characters
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
    
    // Validate it's pure ASCII alphanumeric
    if (!/^[a-z0-9]+$/.test(cleanedUsername)) {
      setMakePaymentError('Username must contain only lowercase letters and numbers (a-z, 0-9). No spaces, special characters, or Unicode characters allowed.');
      setMakePaymentLoading(false);
      return;
    }
    
    // Validate length (4-15 characters)
    if (cleanedUsername.length < 4 || cleanedUsername.length > 15) {
      setMakePaymentError(`Username must be between 4 and 15 characters long after cleaning. Original: "${makePaymentForm.username}" (${makePaymentForm.username.length} chars), Cleaned: "${cleanedUsername}" (${cleanedUsername.length} chars)`);
      setMakePaymentLoading(false);
      return;
    }

    try {
      // include optional applicationId from selected app
      // If a slug is provided, use the public redeem endpoint
      if (makePaymentForm.slug && makePaymentForm.slug.trim()) {
        const slug = makePaymentForm.slug.trim();
        const redeemResp = await paymentsService.redeemPaymentLink(slug, {
          phone_number: makePaymentForm.phoneNumber.replace(/\D/g, ''),
          provider: makePaymentForm.provider,
        });

        if (redeemResp.success && redeemResp.data) {
          setMakePaymentResult(redeemResp.data);
          setMakePaymentForm({ ...makePaymentForm, amount: '', phoneNumber: '', username: '', slug: '' });
        } else {
          const code = redeemResp.error?.code || '';
          if (String(code).includes('HTTP_404') || String(code).includes('404')) {
            setMakePaymentError('Payment link not found (404). Please verify the slug.');
          } else if (String(code).includes('HTTP_410') || String(code).includes('410') || (redeemResp.error?.message && redeemResp.error.message.toLowerCase().includes('gone'))) {
            setMakePaymentError('Payment link is no longer available (paid, expired, or cancelled).');
          } else if (redeemResp.error?.code === 'BAD_REQUEST' || String(redeemResp.error?.code).includes('400')) {
            setMakePaymentError(redeemResp.error?.message || 'Invalid request to redeem payment link.');
          } else {
            setMakePaymentError(redeemResp.error?.message || 'Failed to redeem payment link.');
          }
        }
        } else {
        // Get the selected app's API key if available
        const selectedApp = applications.find(a => a.id === selectedApplicationId);
        const appApiKey = selectedApp?.api_key || undefined;
        
        const response = await paymentsService.makePayment({
          amount: parseFloat(makePaymentForm.amount),
          currency: makePaymentForm.currency,
          phoneNumber: makePaymentForm.phoneNumber,
          applicationId: selectedApplicationId || undefined,
          appApiKey: appApiKey,
          type: makePaymentForm.type,
          provider: makePaymentForm.provider,
          description: makePaymentForm.description || undefined,
        });

        if (response.success && response.data) {
          setMakePaymentResult(response.data);
          setMakePaymentForm({
            amount: '',
            currency: 'XAF',
            phoneNumber: '',
            username: '',
            type: 'DEPOSIT',
            provider: 'MTN_CAM',
            description: '',
            slug: '',
          });
        } else {
          setMakePaymentError(response.error?.message || 'Failed to make payment. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Make payment error:', error);
      setMakePaymentError(error?.message || 'Failed to make payment. Please try again.');
    } finally {
      setMakePaymentLoading(false);
    }
  };

  // Handle get payment status
  const handleGetPaymentStatus = async () => {
    if (!statusTransactionId.trim()) {
      setStatusError('Transaction ID is required');
      return;
    }

    setStatusLoading(true);
    setStatusError(null);
    setStatusResult(null);

    try {
      const response = await paymentsService.getPaymentStatus(statusTransactionId.trim());

      if (response.success && response.data) {
        setStatusResult(response.data);
      } else {
        setStatusError(response.error?.message || 'Failed to get payment status. Please try again.');
      }
    } catch (error: any) {
      console.error('Get payment status error:', error);
      setStatusError(error?.message || 'Failed to get payment status. Please try again.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Handle verify account holder active
  const handleVerifyAccountActive = async () => {
    if (!verifyForm.phoneNumber.trim()) {
      setVerifyError('Phone number is required');
      return;
    }

    setVerifyLoading(true);
    setVerifyError(null);
    setVerifyResult(null);

    try {
      const response = await paymentsService.verifyAccountHolderActive(
        verifyForm.phoneNumber.trim(),
        verifyForm.type
      );

      if (response.success && response.data) {
        setVerifyResult({ type: 'active', ...response.data });
      } else {
        setVerifyError(response.error?.message || 'Failed to verify account holder. Please try again.');
      }
    } catch (error: any) {
      console.error('Verify account active error:', error);
      setVerifyError(error?.message || 'Failed to verify account holder. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Handle verify account holder basic info
  const handleVerifyAccountBasicInfo = async () => {
    if (!verifyForm.phoneNumber.trim()) {
      setVerifyError('Phone number is required');
      return;
    }

    setVerifyLoading(true);
    setVerifyError(null);
    setVerifyResult(null);

    try {
      const response = await paymentsService.verifyAccountHolderBasicInfo(
        verifyForm.phoneNumber.trim(),
        verifyForm.type
      );

      if (response.success && response.data) {
        setVerifyResult({ type: 'basic-info', ...response.data });
      } else {
        setVerifyError(response.error?.message || 'Failed to get account holder info. Please try again.');
      }
    } catch (error: any) {
      console.error('Verify account basic info error:', error);
      setVerifyError(error?.message || 'Failed to get account holder info. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Helper function to extract numeric amount from string
  const extractAmount = (amountStr: string): number => {
    const match = amountStr.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  // Helper function to check if amount matches filter
  const matchesAmountFilter = (amountStr: string): boolean => {
    if (!selectedAmount || selectedAmount === 'All') return true;
    const amount = extractAmount(amountStr);
    
    switch (selectedAmount) {
      case '0-100':
        return amount >= 0 && amount <= 100;
      case '100-500':
        return amount > 100 && amount <= 500;
      case '500-1000':
        return amount > 500 && amount <= 1000;
      case '1000+':
        return amount > 1000;
      default:
        return true;
    }
  };

  // Helper function to check if date matches period filter
  const matchesPeriodFilter = (dateStr: string): boolean => {
    if (!selectedPeriod || selectedPeriod === 'All') return true;
    
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (selectedPeriod) {
      case 'Today':
        return date.toDateString() === today.toDateString();
      case 'This Week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo;
      }
      case 'This Month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return date >= monthStart;
      }
      case 'Last 3 Months': {
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return date >= threeMonthsAgo;
      }
      default:
        return true;
    }
  };

  // Available payment methods for Cameroon
  const availablePaymentMethods = ['MTN Mobile Money', 'Orange Money'];
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowAmountFilter(false);
      setShowPeriodFilter(false);
      setShowStatusFilter(false);
      setShowPaymentMethodsDropdown(false);
      setShowCalendar(false);
    };
    
    if (showAmountFilter || showPeriodFilter || showStatusFilter || showPaymentMethodsDropdown || showCalendar) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showAmountFilter, showPeriodFilter, showStatusFilter, showPaymentMethodsDropdown, showCalendar]);

  // Format date for input field (calendar selection)
  const formatDateForInput = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    setFormData({ ...formData, expiryDate: formatDateForInput(date) });
    setShowCalendar(false);
  };

  // Handle create link submission
  const handleCreateLink = async () => {
    setError(null);
    setCreatedLink(null);

    // Validation
    if (formData.type !== 'Variable' && !formData.amount) {
      setError('Amount is required for fixed and subscription payments');
      return;
    }

    if (paymentMethods.length === 0) {
      setError('Please select at least one payment method');
      return;
    }

    setIsCreating(true);

    try {
      const response = await paymentsService.createPaymentLink({
        type: formData.type as 'Fixed' | 'Subscription' | 'Donation',
        amount: formData.amount ? parseFloat(formData.amount) : 0,
        currency: formData.currency as 'XAF' | 'USD',
        description: formData.description || undefined,
        expiryDate: formData.expiryDate || null,
        redirectUrl: formData.redirectUrl || null,
        reusable,
        paymentMethods,
        saveUrl: savXAFl,
      });

      if (response.success && response.data) {
        setCreatedLink(response.data.url);
        
        // Refresh payments list
        fetchPayments();
        
        // Reset form after successful creation
        setTimeout(() => {
          setFormData({
            type: 'Fixed',
            currency: 'XAF',
            amount: '',
            description: '',
            expiryDate: '',
            redirectUrl: '',
          });
          setPaymentMethods(['MTN Mobile Money', 'Orange Money']);
          setReusable(false);
          setSavXAFl(false);
          setCreatedLink(null);
          setShowCreateLink(false);
        }, 3000);
      } else {
        setError(response.error?.message || 'Failed to create payment link. Please try again.');
      }
    } catch (err) {
      console.error('Error creating payment link:', err);
      setError('Failed to create payment link. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Payments</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/payment-links" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:shadow-sm text-sm text-gray-700">
              <LinkIcon className="w-4 h-4 text-green-600" />
              Payment Links
            </Link>
          </div>
        </div>
        
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

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1">
            <div className="relative flex-1 sm:flex-initial">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search here"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 sm:py-1 text-base bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all"
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => {
                  setShowStatusFilter(!showStatusFilter);
                  setShowAmountFilter(false);
                  setShowPeriodFilter(false);
                }}
                className={`px-4 py-1 bg-white border-2 ${selectedStatus ? 'border-green-500 bg-green-50' : 'border-gray-200'} text-sm text-gray-700 hover:border-green-400 hover:bg-green-50 transition-all font-medium flex items-center gap-2`}
              >
                Status {selectedStatus && `(${selectedStatus})`}
                <CaretDown className="w-4 h-4" />
              </button>
              {showStatusFilter && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg z-10 min-w-[150px]">
                  {activeTab === 'payments' && ['All', 'paid', 'pending', 'failed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setSelectedStatus(status === 'All' ? '' : status);
                        setShowStatusFilter(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                  {activeTab === 'refunds' && ['All', 'completed', 'pending', 'processing'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setSelectedStatus(status === 'All' ? '' : status);
                        setShowStatusFilter(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
                  ))}
                  {activeTab === 'chargebacks' && ['All', 'open', 'won', 'lost'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setSelectedStatus(status === 'All' ? '' : status);
                        setShowStatusFilter(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
                  ))}
                  {activeTab === 'orders' && ['All', 'paid', 'pending', 'shipped', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setSelectedStatus(status === 'All' ? '' : status);
                        setShowStatusFilter(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
          {/* Payments Tab Content */}
          {activeTab === 'payments' && (() => {
            // Filter payments from API data
            let filteredPayments = payments.filter(payment => {
              const matchesSearch = !searchQuery || 
                payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (payment.paymentLinkId && payment.paymentLinkId.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (payment.customer?.name && payment.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (payment.customer?.email && payment.customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                payment.amount.toString().includes(searchQuery);
              
              const matchesStatus = !selectedStatus || payment.status === selectedStatus.toLowerCase();
              
              return matchesSearch && matchesStatus;
            });

            // Calculate stats
            const totalPayments = payments.length;
            const paidCount = payments.filter(p => p.status === 'paid').length;
            const pendingCount = payments.filter(p => p.status === 'pending').length;
            const totalRevenue = payments
              .filter(p => p.status === 'paid')
              .reduce((sum, p) => sum + p.amount, 0);

            if (loading.payments) {
              return (
                <div className="flex items-center justify-center py-20">
                  <Spinner className="w-8 h-8 animate-spin text-green-600" />
                </div>
              );
            }

            return (
              <>
                {/* Payments Stats */}
                {error && (
                  <div className="mb-4 p-3 border border-red-200 bg-red-50 text-red-700 rounded">
                    <div className="flex items-center gap-2">
                      <WarningCircle className="w-5 h-5" />
                      <div className="text-sm">{error}</div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                  <div className="bg-white border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Payments</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalPayments}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Paid</div>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{paidCount}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Pending</div>
                    <div className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingCount}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Revenue</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</div>
                  </div>
                </div>

                {filteredPayments.length > 0 ? (
              <div className="bg-white border border-gray-200 overflow-hidden">
                {/* Desktop Table Header */}
                <div className="hidden lg:block bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                    <div>Payment ID</div>
                    <div>Customer</div>
                    <div>Amount</div>
                    <div>Status</div>
                    <div>Date</div>
                    <div>Actions</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <div key={payment.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                      {/* Mobile Card Layout */}
                      <div className="lg:hidden space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-xs sm:text-sm text-gray-900 truncate">{payment.id}</div>
                            <div className="text-sm text-gray-600 mt-1">{formatDate(payment.createdAt)}</div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded flex-shrink-0 ml-2 ${
                            payment.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-600">Customer</div>
                            <div className="text-sm font-medium text-gray-900">{payment.customer?.name || payment.customer?.email || 'N/A'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-600">Amount</div>
                            <div className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount, payment.currency)}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedItem({ ...payment, type: 'payment' })}
                          className="w-full text-green-600 hover:text-green-700 text-sm font-medium flex items-center justify-center gap-1 py-2 border border-green-200 hover:bg-green-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                      {/* Desktop Table Layout */}
                      <div className="hidden lg:grid grid-cols-6 gap-4 items-center">
                        <div className="font-mono text-sm text-gray-900">{payment.id}</div>
                        <div className="text-sm text-gray-900">{payment.customer?.name || payment.customer?.email || 'N/A'}</div>
                        <div className="font-semibold text-gray-900">{formatCurrency(payment.amount, payment.currency)}</div>
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            payment.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{formatDate(payment.createdAt)}</div>
                        <div>
                          <button 
                            onClick={() => setSelectedItem({ ...payment, type: 'payment' })}
                            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
                ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-24 h-24 mb-6 flex items-center justify-center">
                <MagnifyingGlass className="w-24 h-24 text-gray-300" />
              </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-3">No payments found</h2>
                    <p className="text-gray-600 mb-6 text-center max-w-md">
                      {searchQuery || selectedStatus ? 'Try adjusting your search or filters' : loading.payments ? 'Loading payments...' : 'No payments yet. Create your first payment link to get started.'}
                    </p>
            </div>
          )}
              </>
            );
          })()}

          {/* Refunds Tab Content */}
          {activeTab === 'refunds' && (() => {
            if (loading.refunds) {
              return (
                <div className="flex items-center justify-center py-20">
                  <Spinner className="w-8 h-8 animate-spin text-green-600" />
                </div>
              );
            }

            // Filter refunds from API data
            const filteredRefunds = refunds.filter(refund => {
              const matchesSearch = !searchQuery || 
                refund.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (refund.paymentId ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                refund.amount.toString().includes(searchQuery);
              const matchesStatus = !selectedStatus || refund.status === selectedStatus.toLowerCase();
              return matchesSearch && matchesStatus;
            });

            // Calculate stats
            const totalRefunds = refunds.length;
            const completedCount = refunds.filter(r => r.status === 'completed').length;
            const pendingCount = refunds.filter(r => r.status === 'pending').length;
            const totalRefundAmount = refunds
              .filter(r => r.status === 'completed')
              .reduce((sum, r) => sum + r.amount, 0);

            return (
            <div>
                {/* Refunds Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                  <div className="bg-white border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Refunds</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalRefunds}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Completed</div>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{completedCount}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Pending</div>
                    <div className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingCount}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Refunded</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(totalRefundAmount)}</div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 overflow-hidden">
                {/* Desktop Table Header */}
                <div className="hidden lg:block bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                    <div>Refund ID</div>
                    <div>Payment ID</div>
                    <div>Amount</div>
                    <div>Status</div>
                    <div>Date</div>
                    <div>Actions</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                    {filteredRefunds.map((refund) => (
                    <div key={refund.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                      {/* Mobile Card Layout */}
                      <div className="lg:hidden space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-xs sm:text-sm text-gray-900 truncate">{refund.id}</div>
                            <div className="text-xs text-gray-500 mt-1">Payment: {refund.paymentId}</div>
                            <div className="text-sm text-gray-600 mt-1">{formatDate(refund.createdAt)}</div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded flex-shrink-0 ml-2 ${
                            refund.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : refund.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {refund.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-900">{formatCurrency(refund.amount, refund.currency)}</div>
                          <button 
                            onClick={() => setSelectedItem({ ...refund, type: 'refund' })}
                            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 px-3 py-1 border border-green-200 hover:bg-green-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </div>
                      {/* Desktop Table Layout */}
                      <div className="hidden lg:grid grid-cols-6 gap-4 items-center">
                        <div className="font-mono text-sm text-gray-900">{refund.id}</div>
                        <div className="font-mono text-sm text-gray-600">{refund.paymentId}</div>
                        <div className="font-semibold text-gray-900">{formatCurrency(refund.amount, refund.currency)}</div>
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            refund.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : refund.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {refund.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{formatDate(refund.createdAt)}</div>
                        <div>
                          <button 
                            onClick={() => setSelectedItem({ ...refund, type: 'refund' })}
                            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </div>
            );
          })()}

          {/* Chargebacks Tab Content */}
          {activeTab === 'chargebacks' && (() => {
            if (loading.chargebacks) {
              return (
                <div className="flex items-center justify-center py-20">
                  <Spinner className="w-8 h-8 animate-spin text-green-600" />
                </div>
              );
            }

            // Filter chargebacks from API data
            const filteredChargebacks = chargebacks.filter(chargeback => {
              const matchesSearch = !searchQuery || 
                chargeback.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                chargeback.paymentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                chargeback.amount.toString().includes(searchQuery);
              const matchesStatus = !selectedStatus || chargeback.status === selectedStatus.toLowerCase();
              return matchesSearch && matchesStatus;
            });

            // Calculate stats
            const totalChargebacks = chargebacks.length;
            const openCount = chargebacks.filter(c => c.status === 'open').length;
            const wonCount = chargebacks.filter(c => c.status === 'won').length;
            const totalChargebackAmount = chargebacks
              .filter(c => c.status === 'open')
              .reduce((sum, c) => sum + c.amount, 0);

            return (
            <div>
                {/* Chargebacks Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                  <div className="bg-white border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Chargebacks</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalChargebacks}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Open</div>
                    <div className="text-xl sm:text-2xl font-bold text-red-600">{openCount}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Won</div>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{wonCount}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Open Amount</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(totalChargebackAmount)}</div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 overflow-hidden">
                {/* Desktop Table Header */}
                <div className="hidden lg:block bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                    <div>Chargeback ID</div>
                    <div>Payment ID</div>
                    <div>Amount</div>
                    <div>Status</div>
                    <div>Date</div>
                    <div>Actions</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                    {filteredChargebacks.map((chargeback) => (
                    <div key={chargeback.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                      {/* Mobile Card Layout */}
                      <div className="lg:hidden space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-xs sm:text-sm text-gray-900 truncate">{chargeback.id}</div>
                            <div className="text-xs text-gray-500 mt-1">Payment: {chargeback.paymentId}</div>
                            <div className="text-sm text-gray-600 mt-1">{formatDate(chargeback.createdAt)}</div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 flex-shrink-0 ml-2 ${
                            chargeback.status === 'open'
                              ? 'bg-red-100 text-red-700'
                              : chargeback.status === 'won'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {chargeback.status === 'open' && <WarningCircle className="w-3 h-3" />}
                            {chargeback.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-900">{formatCurrency(chargeback.amount, chargeback.currency)}</div>
                          <button 
                            onClick={() => setSelectedItem({ ...chargeback, type: 'chargeback' })}
                            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 px-3 py-1 border border-green-200 hover:bg-green-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </div>
                      {/* Desktop Table Layout */}
                      <div className="hidden lg:grid grid-cols-6 gap-4 items-center">
                        <div className="font-mono text-sm text-gray-900">{chargeback.id}</div>
                        <div className="font-mono text-sm text-gray-600">{chargeback.paymentId}</div>
                        <div className="font-semibold text-gray-900">{formatCurrency(chargeback.amount, chargeback.currency)}</div>
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 w-fit ${
                            chargeback.status === 'open'
                              ? 'bg-red-100 text-red-700'
                              : chargeback.status === 'won'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {chargeback.status === 'open' && <WarningCircle className="w-3 h-3" />}
                            {chargeback.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{formatDate(chargeback.createdAt)}</div>
                        <div>
                          <button 
                            onClick={() => setSelectedItem({ ...chargeback, type: 'chargeback' })}
                            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chargeback Info Banner */}
                <div className="mt-4 sm:mt-6 bg-yellow-50 border border-yellow-200 p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <WarningCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">About chargebacks</h4>
                    <p className="text-sm text-gray-700">
                      A chargeback occurs when a customer disputes a payment with their bank. 
                      You can respond to chargebacks and provide evidence to contest them.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            );
          })()}

          {/* Make Payment Tab Content - Right Slide Modal */}
          {activeTab === 'make-payment' && (
            <div className="fixed inset-0 z-50 flex items-center justify-end">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
                onClick={() => setActiveTab('payments')}
              />
              {/* Modal Content */}
              <div className="relative bg-white h-full w-full max-w-2xl shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-6 h-6" />
                    Make Payment
                  </h2>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <p className="text-gray-600">Initiate a payment transaction</p>
                </div>

                {makePaymentError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2">
                    <WarningCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{makePaymentError}</span>
                  </div>
                )}

                {makePaymentResult && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="font-semibold">Payment Initiated Successfully!</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div><strong>Transaction ID:</strong> {makePaymentResult.transaction_id}</div>
                      <div><strong>Status:</strong> {makePaymentResult.status}</div>
                      <div><strong>Amount:</strong> {formatCurrency(makePaymentResult.amount, makePaymentResult.currency)}</div>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleMakePayment();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application (optional)
                    </label>
                    <select
                      value={selectedApplicationId || ''}
                      onChange={(e) => setSelectedApplicationId(e.target.value || null)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                    >
                      <option value="">Use default application (env) — or select one</option>
                      {applicationsLoading && <option disabled>Loading applications...</option>}
                      {applications.map((app) => (
                        <option key={app.id} value={app.id}>{app.name} — {app.id}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">If you select an application, its `application_id` will be sent with the payment request. Otherwise the app id from environment will be used.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={makePaymentForm.amount}
                      onChange={(e) => setMakePaymentForm({ ...makePaymentForm, amount: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={makePaymentForm.currency}
                      onChange={(e) => setMakePaymentForm({ ...makePaymentForm, currency: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                      required
                    >
                      <option value="XAF">XAF</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={makePaymentForm.phoneNumber}
                      onChange={(e) => setMakePaymentForm({ ...makePaymentForm, phoneNumber: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                      placeholder="+237 6XX XXX XXX"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Money Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={makePaymentForm.username}
                      onChange={(e) => setMakePaymentForm({ ...makePaymentForm, username: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                      placeholder="e.g., johnsmith, user123, myaccount"
                      minLength={4}
                      maxLength={15}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Enter your mobile money account username (4-15 characters, letters and numbers only, lowercase, no spaces).
                      This is the username you registered with {makePaymentForm.provider === 'MTN_CAM' ? 'MTN Mobile Money' : 'Orange Money'}.
                    </p>
                    <p className="mt-1 text-xs text-blue-600">
                      <strong>Examples:</strong> johnsmith (9), user123 (7), myaccount (9), payuser01 (9)
                    </p>
                    <p className="mt-1 text-xs text-red-500">
                      <strong>Note:</strong> Username will be converted to lowercase. Spaces and special characters will be automatically removed.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Link Slug (optional)
                    </label>
                    <input
                      type="text"
                      value={makePaymentForm.slug}
                      onChange={(e) => setMakePaymentForm({ ...makePaymentForm, slug: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                      placeholder="e.g., pay_abc123xyz"
                    />
                    <p className="mt-1 text-xs text-gray-500">If you already have a payment link slug, provide it to redeem the link directly (public endpoint).</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Provider <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={makePaymentForm.provider}
                      onChange={(e) => setMakePaymentForm({ ...makePaymentForm, provider: e.target.value as 'MTN_CAM' | 'ORANGE_CAM' })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                      required
                    >
                      <option value="MTN_CAM">MTN Mobile Money</option>
                      <option value="ORANGE_CAM">Orange Money</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={makePaymentForm.type}
                      onChange={(e) => setMakePaymentForm({ ...makePaymentForm, type: e.target.value as any })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                      required
                    >
                      <option value="DEPOSIT">Deposit</option>
                      <option value="COLLECTION">Collection</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={makePaymentForm.description}
                      onChange={(e) => setMakePaymentForm({ ...makePaymentForm, description: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                      placeholder="Optional payment description"
                      rows={3}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={makePaymentLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2"
                  >
                    {makePaymentLoading ? (
                      <>
                        <Spinner className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Make Payment
                      </>
                    )}
                  </button>
                </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Status Tab Content - Right Slide Modal */}
          {activeTab === 'payment-status' && (
            <div className="fixed inset-0 z-50 flex items-center justify-end">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
                onClick={() => setActiveTab('payments')}
              />
              {/* Modal Content */}
              <div className="relative bg-white h-full w-full max-w-2xl shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6" />
                    Payment Status
                  </h2>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <p className="text-gray-600">Check the status of a payment transaction</p>
                </div>

                {statusError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2">
                    <WarningCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{statusError}</span>
                  </div>
                )}

                {statusResult && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">Payment Status</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600">Transaction ID:</span>
                          <p className="font-mono text-gray-900">{statusResult.transaction_id}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <p className={`font-semibold ${
                            statusResult.status === 'paid' || statusResult.status === 'success'
                              ? 'text-green-600'
                              : statusResult.status === 'pending'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {statusResult.status}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <p className="font-semibold text-gray-900">{formatCurrency(statusResult.amount, statusResult.currency)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Currency:</span>
                          <p className="text-gray-900">{statusResult.currency}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleGetPaymentStatus();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={statusTransactionId}
                      onChange={(e) => setStatusTransactionId(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                      placeholder="Enter transaction ID"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={statusLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2"
                  >
                    {statusLoading ? (
                      <>
                        <Spinner className="w-5 h-5 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Check Status
                      </>
                    )}
                  </button>
                </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verify Account Tab Content - Right Slide Modal */}
          {activeTab === 'verify-account' && (
            <div className="fixed inset-0 z-50 flex items-center justify-end">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
                onClick={() => setActiveTab('payments')}
              />
              {/* Modal Content */}
              <div className="relative bg-white h-full w-full max-w-2xl shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <UserCheck className="w-6 h-6" />
                    Verify Account Holder
                  </h2>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <p className="text-gray-600">Verify account holder status and get basic information</p>
                </div>

                <div className="mb-6 flex gap-2 border-b border-gray-200">
                  <button
                    onClick={() => {
                      setVerifyType('active');
                      setVerifyResult(null);
                      setVerifyError(null);
                    }}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                      verifyType === 'active'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Verify Active Status
                  </button>
                  <button
                    onClick={() => {
                      setVerifyType('basic-info');
                      setVerifyResult(null);
                      setVerifyError(null);
                    }}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                      verifyType === 'basic-info'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Get Basic Info
                  </button>
                </div>

                {verifyError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2">
                    <WarningCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{verifyError}</span>
                  </div>
                )}

                {verifyResult && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">
                        {verifyResult.type === 'active' ? 'Account Status' : 'Account Information'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {verifyResult.type === 'active' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-gray-600">Phone Number:</span>
                            <p className="font-mono text-gray-900">{verifyResult.phoneNumber}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <p className={`font-semibold ${
                              verifyResult.isActive ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {verifyResult.isActive ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-gray-600">Name:</span>
                            <p className="font-semibold text-gray-900">{verifyResult.name || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Phone Number:</span>
                            <p className="font-mono text-gray-900">{verifyResult.phoneNumber}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (verifyType === 'active') {
                      handleVerifyAccountActive();
                    } else {
                      handleVerifyAccountBasicInfo();
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={verifyForm.phoneNumber}
                      onChange={(e) => setVerifyForm({ ...verifyForm, phoneNumber: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                      placeholder="+237 6XX XXX XXX"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={verifyForm.type}
                      onChange={(e) => setVerifyForm({ ...verifyForm, type: e.target.value as any })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                      required
                    >
                      <option value="DEPOSIT">Deposit</option>
                      <option value="COLLECTION">Collection</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={verifyLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2"
                  >
                    {verifyLoading ? (
                      <>
                        <Spinner className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-5 h-5" />
                        {verifyType === 'active' ? 'Verify Active Status' : 'Get Basic Info'}
                      </>
                    )}
                  </button>
                </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab Content */}
          {activeTab === 'orders' && (() => {
            if (loading.orders) {
              return (
                <div className="flex items-center justify-center py-20">
                  <Spinner className="w-8 h-8 animate-spin text-green-600" />
                </div>
              );
            }

            // Filter orders from API data
            const filteredOrders = orders.filter(order => {
              const matchesSearch = !searchQuery || 
                order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (order.customer?.name && order.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (order.customer?.email && order.customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                order.amount.toString().includes(searchQuery);
              const matchesStatus = !selectedStatus || order.status === selectedStatus.toLowerCase();
              return matchesSearch && matchesStatus;
            });

            // Calculate stats
            const totalOrders = orders.length;
            const paidCount = orders.filter(o => o.status === 'paid').length;
            const pendingCount = orders.filter(o => o.status === 'pending').length;
            const totalRevenue = orders
              .filter(o => o.status === 'paid')
              .reduce((sum, o) => sum + o.amount, 0);

            return (
              <div>
                {/* Orders Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                  <div className="bg-white border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Orders</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalOrders}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Paid</div>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{paidCount}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Pending</div>
                    <div className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingCount}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Revenue</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 overflow-hidden">
                  {/* Desktop Table Header */}
                  <div className="hidden lg:block bg-gray-50 border-b border-gray-200 px-6 py-4">
                    <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-700">
                      <div>Order ID</div>
                      <div>Customer</div>
                      <div>Amount</div>
                      <div>Items</div>
                      <div>Status</div>
                      <div>Date</div>
                      <div>Actions</div>
                    </div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                    <div key={order.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                      {/* Mobile Card Layout */}
                      <div className="lg:hidden space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-xs sm:text-sm text-gray-900 truncate">{order.id}</div>
                            <div className="text-sm text-gray-600 mt-1">{formatDate(order.createdAt)}</div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded flex-shrink-0 ml-2 ${
                            order.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : order.status === 'shipped'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Customer</div>
                          <div className="font-medium text-sm text-gray-900">{order.customer.name}</div>
                          <div className="text-xs text-gray-500">{order.customer.email}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-600">Amount</div>
                            <div className="text-sm font-semibold text-gray-900">{formatCurrency(order.amount, order.currency)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-600">Items</div>
                            <div className="text-sm text-gray-900">{order.items.length} items</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedItem({ ...order, type: 'order' })}
                          className="w-full text-green-600 hover:text-green-700 text-sm font-medium flex items-center justify-center gap-1 py-2 border border-green-200 hover:bg-green-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                      {/* Desktop Table Layout */}
                      <div className="hidden lg:grid grid-cols-7 gap-4 items-center">
                        <div className="font-mono text-sm text-gray-900">{order.id}</div>
                        <div>
                          <div className="font-medium text-gray-900">{order.customer.name}</div>
                          <div className="text-xs text-gray-500">{order.customer.email}</div>
                        </div>
                        <div className="font-semibold text-gray-900">{formatCurrency(order.amount, order.currency)}</div>
                        <div className="text-sm text-gray-600">{order.items.length} items</div>
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            order.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : order.status === 'shipped'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{formatDate(order.createdAt)}</div>
                        <div>
                          <button 
                            onClick={() => setSelectedItem({ ...order, type: 'order' })}
                            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            );
          })()}

      {/* Payment Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedItem.type === 'payment' && 'Payment Details'}
                {selectedItem.type === 'refund' && 'Refund Details'}
                {selectedItem.type === 'chargeback' && 'Chargeback Details'}
                {selectedItem.type === 'order' && 'Order Details'}
              </h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedItem.type === 'payment' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Payment ID</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.id}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Transaction ID</label>
                      <p className="text-lg font-mono text-gray-900">{selectedItem.paymentId}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Customer</label>
                      <p className="text-lg text-gray-900">{selectedItem.customer}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Payment Method</label>
                      <p className="text-lg text-gray-900">{selectedItem.paymentMethod}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Amount</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.amount}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Status</label>
                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${
                        selectedItem.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : selectedItem.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedItem.status}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Date</label>
                      <p className="text-lg text-gray-900">{selectedItem.date}</p>
                    </div>
                  </div>
                </>
              )}
              {(selectedItem.type === 'refund' || selectedItem.type === 'chargeback') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">{selectedItem.type === 'refund' ? 'Refund ID' : 'Chargeback ID'}</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.id}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Payment ID</label>
                      <p className="text-lg font-mono text-gray-900">{selectedItem.paymentId}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Amount</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.amount}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Status</label>
                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${
                        selectedItem.status === 'completed' || selectedItem.status === 'won'
                          ? 'bg-green-100 text-green-700'
                          : selectedItem.status === 'pending' || selectedItem.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-700'
                          : selectedItem.status === 'open'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedItem.status}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Date</label>
                      <p className="text-lg text-gray-900">{selectedItem.date}</p>
                    </div>
                  </div>
                </>
              )}
              {selectedItem.type === 'order' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Order ID</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.id}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Date</label>
                      <p className="text-lg text-gray-900">{selectedItem.date}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Customer</label>
                      <p className="text-lg text-gray-900">{selectedItem.customer}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Email</label>
                      <p className="text-lg text-gray-900">{selectedItem.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Amount</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.amount}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Items</label>
                      <p className="text-lg text-gray-900">{selectedItem.items} items</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Status</label>
                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${
                        selectedItem.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : selectedItem.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : selectedItem.status === 'shipped'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedItem.status}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
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
