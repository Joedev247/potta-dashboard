'use client';

import { Search, Plus, ExternalLink, ArrowLeft, ChevronDown, Calendar, X, RotateCcw, ChevronUp, ArrowRight, AlertCircle, Package, RefreshCw, Eye, CheckCircle2, Copy, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { paymentsService, type Payment, type Refund, type Chargeback, type Order } from '@/lib/api';
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
    { id: 'refunds', label: 'Refunds' },
    { id: 'chargebacks', label: 'Chargebacks' },
    { id: 'orders', label: 'Orders' },
  ];

  // Fetch data functions
  const fetchPayments = useCallback(async () => {
    setLoading(prev => ({ ...prev, payments: true }));
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
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
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
        search: searchQuery || undefined,
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
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Payments</h1>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b-2 border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 text-sm font-semibold transition-colors relative
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search here"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-1 bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-500  w-64 transition-all"
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
                <ChevronDown className="w-4 h-4" />
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
          <button 
            onClick={() => setShowCreateLink(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Create payment
          </button>
        </div>
      </div>

      {/* Create Link Form */}
      {showCreateLink ? (
        <div className="bg-white max-w-4xl mx-auto px-8">
          {/* Header */}
          <div className="mb-8">
            <button 
              onClick={() => {
                setShowCreateLink(false);
                setError(null);
                setCreatedLink(null);
                // Reset form when closing
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
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Payment links</span>
            </button>
            
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold text-gray-900">Create link</h1>
              <div className="relative">
                <select className="px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded appearance-none focus:outline-none focus:border-green-500 pr-20">
                  <option>Codev</option>
                </select>
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center text-xs font-semibold text-green-700">CO</div>
                </div>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Type, Currency, Amount Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="relative">
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded appearance-none focus:outline-none focus:border-green-500 pr-10"
                >
                  <option value="Fixed">Fixed Amount</option>
                  <option value="Variable">Variable Amount</option>
                  <option value="Subscription">Subscription</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <div className="relative">
                <select 
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded appearance-none focus:outline-none focus:border-green-500 pr-10"
                >
                  <option value="XAF">XAF (Central African CFA Franc)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input
                type="text"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder={formData.type === 'Variable' ? 'Leave empty for variable' : 'Enter amount'}
                className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter payment description"
              className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Expiry Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry date (optional)</label>
            <div className="relative">
              <input
                type="text"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                placeholder="DD-MM-YYYY"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCalendar(!showCalendar);
                }}
                className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500 pr-10 cursor-pointer"
                readOnly
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCalendar(!showCalendar);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Calendar className="w-4 h-4" />
              </button>
              {showCalendar && (
                <div 
                  className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 rounded-lg p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    <div className="text-xs font-semibold text-gray-600 text-center py-1">Su</div>
                    <div className="text-xs font-semibold text-gray-600 text-center py-1">Mo</div>
                    <div className="text-xs font-semibold text-gray-600 text-center py-1">Tu</div>
                    <div className="text-xs font-semibold text-gray-600 text-center py-1">We</div>
                    <div className="text-xs font-semibold text-gray-600 text-center py-1">Th</div>
                    <div className="text-xs font-semibold text-gray-600 text-center py-1">Fr</div>
                    <div className="text-xs font-semibold text-gray-600 text-center py-1">Sa</div>
                  </div>
                  {(() => {
                    const today = new Date();
                    const currentMonth = today.getMonth();
                    const currentYear = today.getFullYear();
                    const firstDay = new Date(currentYear, currentMonth, 1);
                    const lastDay = new Date(currentYear, currentMonth + 1, 0);
                    const daysInMonth = lastDay.getDate();
                    const startingDayOfWeek = firstDay.getDay();
                    const days = [];
                    
                    // Add empty cells for days before the first day of the month
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(null);
                    }
                    
                    // Add all days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      days.push(day);
                    }
                    
                    return (
                      <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => {
                          if (day === null) {
                            return <div key={index} className="w-8 h-8"></div>;
                          }
                          const date = new Date(currentYear, currentMonth, day);
                          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleDateSelect(date)}
                              disabled={isPast}
                              className={`w-8 h-8 text-sm rounded hover:bg-green-100 transition-colors ${
                                isPast
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-900 hover:text-green-700'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Redirect URL */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Redirect URL (optional)</label>
            <input
              type="text"
              value={formData.redirectUrl}
              onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
              placeholder="https://yourwebsite.com/success"
              className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Save URL Checkbox */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={savXAFl}
                onChange={(e) => setSavXAFl(e.target.checked)}
                className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
              />
              <span className="text-sm text-gray-700">Save URL for all future links</span>
            </label>
          </div>

          {/* Extra Options */}
          <div className="mb-6 border border-gray-200 rounded">
            <button
              onClick={() => setShowExtraOptions(!showExtraOptions)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900">Extra options</span>
              {showExtraOptions ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            {showExtraOptions && (
              <div className="p-4 border-t border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reusable}
                    onChange={(e) => setReusable(e.target.checked)}
                    className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500 focus:ring-2 mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <RotateCcw className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">Reusable</span>
                    </div>
                    <p className="text-sm text-gray-600">Create a reusable payment link that can be paid multiple times</p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment methods</label>
            <div className="relative">
              <div className="border border-gray-200 rounded p-3 bg-white min-h-[48px] flex items-center gap-2 flex-wrap">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded text-sm text-gray-900"
                    >
                      <span>{method}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
                        }}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">No payment methods selected</span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPaymentMethodsDropdown(!showPaymentMethodsDropdown);
                  }}
                  className="ml-auto flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              {showPaymentMethodsDropdown && (
                <div 
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 rounded-lg overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {availablePaymentMethods
                    .filter(method => !paymentMethods.includes(method))
                    .map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setPaymentMethods([...paymentMethods, method]);
                          setShowPaymentMethodsDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                      >
                        {method}
                      </button>
                    ))}
                  {availablePaymentMethods.filter(method => !paymentMethods.includes(method)).length === 0 && (
                    <div className="px-4 py-2 text-sm text-gray-500">All payment methods are selected</div>
                  )}
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">By default, all methods are offered in your checkout.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Success Message */}
          {createdLink && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">Payment link created successfully!</h3>
                  <p className="text-sm text-green-700">Your payment link has been generated.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white border border-green-200 rounded p-3">
                <input
                  type="text"
                  value={createdLink}
                  readOnly
                  className="flex-1 text-sm text-gray-900 bg-transparent focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(createdLink)}
                  className="px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button 
              onClick={handleCreateLink}
              disabled={isCreating}
              className="px-6 py-1 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create link'
              )}
            </button>
            <button 
              onClick={() => {
                setShowCreateLink(false);
                setError(null);
                setCreatedLink(null);
                // Reset form when canceling
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
              }}
              disabled={isCreating}
              className="px-6 py-1 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
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
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
              );
            }

            return (
              <>
                {/* Payments Stats */}
                <div className="grid grid-cols-4 gap-6 mb-6">
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Payments</div>
                    <div className="text-2xl font-bold text-gray-900">{totalPayments}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Paid</div>
                    <div className="text-2xl font-bold text-green-600">{paidCount}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Pending</div>
                    <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</div>
                  </div>
                </div>

                {filteredPayments.length > 0 ? (
              <div className="bg-white border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
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
                    <div key={payment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-6 gap-4 items-center">
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
                <Search className="w-24 h-24 text-gray-300" />
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
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
              );
            }

            // Filter refunds from API data
            const filteredRefunds = refunds.filter(refund => {
              const matchesSearch = !searchQuery || 
                refund.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                refund.paymentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                <div className="grid grid-cols-4 gap-6 mb-6">
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Refunds</div>
                    <div className="text-2xl font-bold text-gray-900">{totalRefunds}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Completed</div>
                    <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Pending</div>
                    <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Refunded</div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalRefundAmount)}</div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
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
                    <div key={refund.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-6 gap-4 items-center">
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
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
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
                <div className="grid grid-cols-4 gap-6 mb-6">
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Chargebacks</div>
                    <div className="text-2xl font-bold text-gray-900">{totalChargebacks}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Open</div>
                    <div className="text-2xl font-bold text-red-600">{openCount}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Won</div>
                    <div className="text-2xl font-bold text-green-600">{wonCount}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Open Amount</div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalChargebackAmount)}</div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
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
                    <div key={chargeback.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-6 gap-4 items-center">
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
                            {chargeback.status === 'open' && <AlertCircle className="w-3 h-3" />}
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
                <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
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

          {/* Orders Tab Content */}
          {activeTab === 'orders' && (() => {
            if (loading.orders) {
              return (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
              );
            }

            // Filter orders from API data
            const filteredOrders = orders.filter(order => {
              const matchesSearch = !searchQuery || 
                order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                <div className="grid grid-cols-4 gap-6 mb-6">
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Orders</div>
                    <div className="text-2xl font-bold text-gray-900">{totalOrders}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Paid</div>
                    <div className="text-2xl font-bold text-green-600">{paidCount}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Pending</div>
                    <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                  </div>
                  <div className="bg-white border border-gray-200 p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 overflow-hidden">
                  {/* Table Header */}
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
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
                    <div key={order.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-7 gap-4 items-center">
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
        </>
      )}

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
