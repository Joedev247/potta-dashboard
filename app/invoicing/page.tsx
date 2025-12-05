'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Settings, ArrowLeft, ChevronDown, Info, FileText, Eye, Download, Search, Calendar, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { invoicingService } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils/format';

export default function InvoicingPage() {
  const [activeTab, setActiveTab] = useState('invoices');
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState('one-off');
  const [vatDisplay, setVatDisplay] = useState('including');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showAmountDropdown, setShowAmountDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Last 30 days');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    profile: 'Codev',
    customer: '',
    paymentTerm: '',
    memo: '',
    items: [{ product: '', quantity: 1, price: '', vat: 0, total: 0 }],
    discount: 0,
    subtotal: 0,
    total: 0,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const periodRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'invoices', label: 'Invoices' },
    { id: 'recurring', label: 'Recurring' },
    { id: 'credit-notes', label: 'Credit notes' },
    { id: 'customers', label: 'Customers' },
    { id: 'products', label: 'Products' },
  ];

  // API data state
  const [invoices, setInvoices] = useState<any[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<any[]>([]);
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    invoices: false,
    recurring: false,
    creditNotes: false,
    customers: false,
    products: false,
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

  // Helper function to extract numeric amount
  const extractAmount = (amountStr: string | number): number => {
    if (typeof amountStr === 'number') return amountStr;
    const match = amountStr.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(prev => ({ ...prev, invoices: true }));
    try {
      const params: any = {};
      
      if (selectedPeriod && selectedPeriod !== 'All') {
        const today = new Date();
        let startDate: Date = today;
        
        switch (selectedPeriod) {
          case 'Last 7 days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            break;
          case 'Last 30 days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 30);
            break;
          case 'Last 90 days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 90);
            break;
          case 'This year':
            startDate = new Date(today.getFullYear(), 0, 1);
            break;
        }
        
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = today.toISOString().split('T')[0];
      }
      
      if (selectedStatus && selectedStatus !== 'All') {
        params.status = selectedStatus.toLowerCase();
      }
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const response = await invoicingService.getInvoices(params);
      if (response.success && response.data) {
        setInvoices(response.data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(prev => ({ ...prev, invoices: false }));
    }
  }, [selectedPeriod, selectedStatus, searchQuery]);

  // Fetch recurring invoices
  const fetchRecurringInvoices = useCallback(async () => {
    setLoading(prev => ({ ...prev, recurring: true }));
    try {
      const response = await invoicingService.getRecurringInvoices();
      if (response.success && response.data) {
        setRecurringInvoices(response.data.recurringInvoices || []);
      }
    } catch (error) {
      console.error('Error fetching recurring invoices:', error);
    } finally {
      setLoading(prev => ({ ...prev, recurring: false }));
    }
  }, []);

  // Fetch credit notes
  const fetchCreditNotes = useCallback(async () => {
    setLoading(prev => ({ ...prev, creditNotes: true }));
    try {
      const response = await invoicingService.getCreditNotes();
      if (response.success && response.data) {
        setCreditNotes(response.data.creditNotes || []);
      }
    } catch (error) {
      console.error('Error fetching credit notes:', error);
    } finally {
      setLoading(prev => ({ ...prev, creditNotes: false }));
    }
  }, []);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setLoading(prev => ({ ...prev, customers: true }));
    try {
      const response = await invoicingService.getCustomers();
      if (response.success && response.data) {
        setCustomers(response.data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(prev => ({ ...prev, products: true }));
    try {
      const response = await invoicingService.getProducts();
      if (response.success && response.data) {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  }, []);

  // Fetch data on mount and tab change
  useEffect(() => {
    if (activeTab === 'invoices') {
      fetchInvoices();
    } else if (activeTab === 'recurring') {
      fetchRecurringInvoices();
    } else if (activeTab === 'credit-notes') {
      fetchCreditNotes();
    } else if (activeTab === 'customers') {
      fetchCustomers();
    } else if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab, fetchInvoices, fetchRecurringInvoices, fetchCreditNotes, fetchCustomers, fetchProducts]);

  // Filter invoices (client-side filtering for search)
  const getFilteredInvoices = () => {
    let filtered = [...invoices];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(invoice =>
        invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus && selectedStatus !== 'All') {
      filtered = filtered.filter(invoice => invoice.status === selectedStatus.toLowerCase());
    }

    // Period filter
    if (selectedPeriod && selectedPeriod !== 'All') {
      const today = new Date();
      const periodStart = new Date();
      
      switch (selectedPeriod) {
        case 'Last 7 days':
          periodStart.setDate(today.getDate() - 7);
          break;
        case 'Last 30 days':
          periodStart.setDate(today.getDate() - 30);
          break;
        case 'Last 90 days':
          periodStart.setDate(today.getDate() - 90);
          break;
        case 'This year':
          periodStart.setMonth(0, 1);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= periodStart && invoiceDate <= today;
      });
    }

    // Amount filter
    if (selectedAmount && selectedAmount !== 'All') {
      filtered = filtered.filter(invoice => {
        const amount = invoice.amount;
        switch (selectedAmount) {
          case '0-1000':
            return amount >= 0 && amount <= 1000;
          case '1000-2000':
            return amount > 1000 && amount <= 2000;
          case '2000-5000':
            return amount > 2000 && amount <= 5000;
          case '5000+':
            return amount > 5000;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  // Calculate invoice totals
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseFloat(item.quantity.toString()) || 0;
      const itemTotal = price * qty;
      const vatAmount = (itemTotal * item.vat) / 100;
      return sum + itemTotal + vatAmount;
    }, 0);
    
    const discountAmount = (subtotal * formData.discount) / 100;
    const total = subtotal - discountAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      total: Math.max(0, total),
    }));
  }, [formData.items, formData.discount]);

  // Handle item changes
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculate item total
    const price = parseFloat(newItems[index].price) || 0;
    const qty = parseFloat(newItems[index].quantity.toString()) || 0;
    const vatAmount = (price * qty * newItems[index].vat) / 100;
    newItems[index].total = (price * qty) + vatAmount;
    
    setFormData({ ...formData, items: newItems });
  };

  // Add new item
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 1, price: '', vat: 0, total: 0 }],
    });
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  // Handle create invoice
  const handleCreateInvoice = async () => {
    setCreateError(null);
    setCreateSuccess(false);

    // Validation
    if (!formData.customer) {
      setCreateError('Please select a customer');
      return;
    }

    if (formData.items.some(item => !item.product || !item.price)) {
      setCreateError('Please fill in all item fields (product and price)');
      return;
    }

    if (formData.total <= 0) {
      setCreateError('Invoice total must be greater than 0');
      return;
    }

    setIsCreating(true);

    try {
      // Prepare invoice data
      const invoiceData = {
        customerId: formData.customer,
        customerName: formData.customer,
        items: formData.items.map(item => ({
          product: item.product,
          quantity: parseFloat(item.quantity.toString()) || 1,
          price: parseFloat(item.price) || 0,
          vatRate: item.vat || 0,
        })),
        subtotal: formData.subtotal,
        discount: formData.discount || 0,
        total: formData.total,
        paymentTerm: formData.paymentTerm || undefined,
        memo: formData.memo || undefined,
        currency: 'XAF',
      };
      
      const response = await invoicingService.createInvoice(invoiceData);
      
      if (response.success) {
        setCreateSuccess(true);
        
        // Refresh invoices list
        await fetchInvoices();
        
        // Reset form after success
        setTimeout(() => {
          setFormData({
            profile: 'Codev',
            customer: '',
            paymentTerm: '',
            memo: '',
            items: [{ product: '', quantity: 1, price: '', vat: 0, total: 0 }],
            discount: 0,
            subtotal: 0,
            total: 0,
          });
          setCreateSuccess(false);
          setShowCreateInvoice(false);
        }, 3000);
      } else {
        setCreateError(response.error?.message || 'Failed to create invoice. Please try again.');
      }
    } catch (err) {
      console.error('Create invoice error:', err);
      setCreateError('Failed to create invoice. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Download invoice
  const handleDownloadInvoice = (invoice: any) => {
    const invoiceContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f3f4f6; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .header { margin-bottom: 30px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Invoice ${invoice.id}</h1>
          <p>Date: ${invoice.date}</p>
        </div>
        <table>
          <tr>
            <th>Customer</th>
            <td>${invoice.customer}</td>
          </tr>
          <tr>
            <th>Email</th>
            <td>${invoice.email}</td>
          </tr>
          <tr>
            <th>Amount</th>
            <td>XAF ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <th>Status</th>
            <td>${invoice.status}</td>
          </tr>
        </table>
        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          <p>Codev Payment Platform</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([invoiceContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Invoices</h1>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/settings"
            className="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 text-sm font-semibold hover:border-green-400 hover:bg-green-50 transition-all flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <button 
            onClick={() => setShowCreateInvoice(true)}
            className="px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b-2 border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-1 text-sm font-semibold transition-colors relative
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

      {/* Filters */}
      {!showCreateInvoice && (
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
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
              <ChevronDown className="w-4 h-4" />
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

          {/* Amount Dropdown */}
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
              <ChevronDown className="w-4 h-4 inline-block ml-2" />
            </button>
            {showAmountDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[150px] rounded">
                {['All', '0-1000', '1000-2000', '2000-5000', '5000+'].map((amount) => (
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
              <ChevronDown className="w-4 h-4 inline-block ml-2" />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[150px] rounded">
                {['All', 'paid', 'pending', 'overdue'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setSelectedStatus(status === 'All' ? '' : status);
                      setShowStatusDropdown(false);
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
      )}

      {/* Create Invoice Form */}
      {showCreateInvoice ? (
        <div className="bg-white max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 px-8">
            <button 
              onClick={() => {
                setShowCreateInvoice(false);
                setCreateError(null);
                setCreateSuccess(false);
                setFormData({
                  profile: 'Codev',
                  customer: '',
                  paymentTerm: '',
                  memo: '',
                  items: [{ product: '', quantity: 1, price: '', vat: 0, total: 0 }],
                  discount: 0,
                  subtotal: 0,
                  total: 0,
                });
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Invoices</span>
            </button>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold text-gray-900">Create invoice</h1>
                <div className="flex gap-1 bg-gray-100 p-1 rounded">
                  <button
                    onClick={() => setInvoiceType('one-off')}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      invoiceType === 'one-off'
                        ? 'bg-white text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    One-off
                  </button>
                  <button
                    onClick={() => setInvoiceType('recurring')}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      invoiceType === 'recurring'
                        ? 'bg-white text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Recurring
                  </button>
                </div>
              </div>
              <button 
                onClick={handleCreateInvoice}
                disabled={isCreating}
                className="px-6 py-1.5 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>

          {/* Invoice Details Section */}
          <div className="flex gap-8 mb-8 items-start">
            {/* Left Column - Logo */}
            <div className="flex-shrink-0 pl-8">
              <div className="border-2 border-dashed border-gray-300 p-6 h-32 w-32 flex items-center justify-center bg-gray-50 hover:border-green-400 transition-colors cursor-pointer">
                <div className="text-center">
                  <Plus className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <span className="text-xs text-gray-600">+ Add logo</span>
                </div>
              </div>
            </div>

            {/* Right Column - Sender Information and Form Fields */}
            <div className="flex-1">
              {/* Sender Information - Right Aligned */}
              <div className="mb-6 text-right pr-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Codev</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>joedev247@gmail.com</p>
                  <p>+237 6 54 58 34 54</p>
                  <p>my.instanvi.com</p>
                </div>
              </div>

              {/* Profile */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <span>Profile</span>
                    <Info className="w-4 h-4 text-gray-400" />
                  </div>
                </label>
                <div className="relative">
                  <select className="w-full px-4 py-1.5 bg-white border border-gray-200 text-gray-900 rounded appearance-none focus:outline-none focus:border-green-500 pr-20">
                    <option>Codev</option>
                  </select>
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center text-xs font-semibold text-green-700">CO</div>
                  </div>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Customer */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    placeholder="Enter customer name"
                    className="w-full px-4 py-1.5 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
              </div>

              {/* Payment term */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment term</label>
                <div className="relative">
                  <select
                    value={formData.paymentTerm}
                    onChange={(e) => setFormData({ ...formData, paymentTerm: e.target.value })}
                    className="w-full px-4 py-1.5 bg-white border border-gray-200 text-gray-900 rounded appearance-none focus:outline-none focus:border-green-500 pr-10"
                  >
                    <option value="">Select payment term</option>
                    <option value="net-15">Net 15</option>
                    <option value="net-30">Net 30</option>
                    <option value="net-45">Net 45</option>
                    <option value="net-60">Net 60</option>
                    <option value="due-on-receipt">Due on Receipt</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Memo */}
              {formData.memo ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Memo</label>
                  <textarea
                    value={formData.memo}
                    onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                    placeholder="Add a memo or note"
                    rows={3}
                    className="w-full px-4 py-1.5 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500 resize-none"
                  />
                  <button
                    onClick={() => setFormData({ ...formData, memo: '' })}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 hover:underline"
                  >
                    Remove memo
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setFormData({ ...formData, memo: '' })}
                  className="text-sm text-green-600 hover:text-green-700 hover:underline"
                >
                  + Add memo
                </button>
              )}
            </div>
          </div>

          {/* Items Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Items</h2>
              <div className="flex gap-1 bg-gray-100 p-1 rounded">
                <button
                  onClick={() => setVatDisplay('including')}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    vatDisplay === 'including'
                      ? 'bg-white text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Including VAT
                </button>
                <button
                  onClick={() => setVatDisplay('excluding')}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    vatDisplay === 'excluding'
                      ? 'bg-white text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Excluding VAT
                </button>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-gray-200 rounded">
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
                <div className="col-span-5">Product</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">VAT</div>
                <div className="col-span-1">Total</div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {formData.items.map((item, index) => (
                  <div key={index} className="p-4">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={item.product}
                          onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                          placeholder="Product name"
                          className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <span className="text-sm text-gray-600">XAF</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="flex-1 px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={item.vat}
                          onChange={(e) => handleItemChange(index, 'vat', parseFloat(e.target.value))}
                          className="w-full px-4 py-1 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
                        >
                          <option value={0}>0%</option>
                          <option value={5.5}>5.5%</option>
                          <option value={10}>10%</option>
                          <option value={18}>18%</option>
                          <option value={19.25}>19.25%</option>
                        </select>
                      </div>
                      <div className="col-span-1 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">
                          XAF {item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {formData.items.length > 1 && (
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-700 ml-2"
                            title="Remove item"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleAddItem}
              className="mt-4 text-sm text-green-600 hover:text-green-700 hover:underline"
            >
              + Add item
            </button>
          </div>

          {/* Totals Section */}
          <div className="border border-gray-200 rounded p-6 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Totals</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Subtotal</span>
                <span className="text-gray-900 font-medium">
                  XAF {formData.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">Discount</span>
                  {formData.discount === 0 ? (
                    <button 
                      onClick={() => setFormData({ ...formData, discount: 0 })}
                      className="text-sm text-green-600 hover:text-green-700 hover:underline"
                    >
                      + Add
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                        min="0"
                        max="100"
                        className="w-20 px-2 py-1 text-sm border border-gray-200 rounded"
                      />
                      <span className="text-sm text-gray-600">%</span>
                      <button
                        onClick={() => setFormData({ ...formData, discount: 0 })}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-gray-900 font-medium">
                  XAF {((formData.subtotal * formData.discount) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-lg font-semibold text-gray-900">
                  XAF {formData.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {createSuccess && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-800 font-medium">Invoice created successfully!</p>
                <p className="text-xs text-green-700 mt-1">Your invoice has been created and saved.</p>
              </div>
            </div>
          )}

          {createError && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{createError}</p>
              </div>
              <button
                onClick={() => setCreateError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Invoices List */}
          {activeTab === 'invoices' && (
            loading.invoices ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              </div>
            ) : (() => {
              const filteredInvoices = getFilteredInvoices();
              
              return (
                <div className="bg-white border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                    <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                      <div>Invoice #</div>
                      <div>Customer</div>
                      <div>Date</div>
                      <div>Amount</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {filteredInvoices.length > 0 ? (
                      filteredInvoices.map((invoice) => (
                        <div key={invoice.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="grid grid-cols-6 gap-4 items-center">
                            <div className="font-mono text-sm text-gray-900 font-semibold">{invoice.invoiceNumber || invoice.id}</div>
                            <div className="text-sm text-gray-900">{invoice.customerName || invoice.customer?.name || invoice.customer}</div>
                            <div className="text-sm text-gray-600">{formatDate(invoice.date || invoice.createdAt)}</div>
                            <div className="font-semibold text-gray-900">{formatCurrency(invoice.amount, invoice.currency || 'XAF')}</div>
                            <div>
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                invoice.status === 'paid'
                                  ? 'bg-green-100 text-green-700'
                                  : invoice.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {invoice.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setSelectedItem({ ...invoice, type: 'invoice' })}
                                className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                              <button 
                                onClick={() => handleDownloadInvoice(invoice)}
                                className="text-gray-600 hover:text-gray-700"
                                title="Download invoice"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-6 py-8 text-center text-gray-500">
                        No invoices found matching the selected filters
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}

          {/* Recurring Tab */}
          {activeTab === 'recurring' && (
            <div className="bg-white border border-gray-200  overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
                  <div>Recurring Invoice</div>
                  <div>Customer</div>
                  <div>Frequency</div>
                  <div>Next Invoice</div>
                  <div>Actions</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {[
                  { id: 'REC-001', customer: 'John Doe', frequency: 'Monthly', next: '2024-02-01', amount: 500.00, email: 'john@example.com', status: 'active', startDate: '2024-01-01' },
                  { id: 'REC-002', customer: 'Jane Smith', frequency: 'Weekly', next: '2024-01-22', amount: 200.00, email: 'jane@example.com', status: 'active', startDate: '2024-01-01' },
                  { id: 'REC-003', customer: 'Bob Johnson', frequency: 'Monthly', next: '2024-02-05', amount: 1000.00, email: 'bob@example.com', status: 'active', startDate: '2024-01-01' },
                ].map((recurring) => (
                  <div key={recurring.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div className="font-mono text-sm text-gray-900 font-semibold">{recurring.id}</div>
                      <div className="text-sm text-gray-900">{recurring.customer}</div>
                      <div className="text-sm text-gray-600">{recurring.frequency}</div>
                      <div className="text-sm text-gray-600">{recurring.next}</div>
                      <div>
                        <button 
                          onClick={() => setSelectedItem({ ...recurring, type: 'recurring' })}
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
          )}

          {/* Credit Notes Tab */}
          {activeTab === 'credit-notes' && (
            <div className="bg-white border border-gray-200  overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
                  <div>Credit Note #</div>
                  <div>Invoice</div>
                  <div>Date</div>
                  <div>Amount</div>
                  <div>Actions</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {[
                  { id: 'CN-001', invoice: 'INV-2024-001', date: '2024-01-10', amount: 150.00, customer: 'John Doe', reason: 'Refund for cancelled service', status: 'applied' },
                  { id: 'CN-002', invoice: 'INV-2024-003', date: '2024-01-08', amount: 75.00, customer: 'Bob Johnson', reason: 'Discount adjustment', status: 'applied' },
                ].map((creditNote) => (
                  <div key={creditNote.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div className="font-mono text-sm text-gray-900 font-semibold">{creditNote.id}</div>
                      <div className="text-sm text-gray-600">{creditNote.invoice}</div>
                      <div className="text-sm text-gray-600">{creditNote.date}</div>
                      <div className="font-semibold text-gray-900">XAF {creditNote.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div>
                        <button 
                          onClick={() => setSelectedItem({ ...creditNote, type: 'credit-note' })}
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
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="bg-white border border-gray-200  overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700">
                  <div>Customer</div>
                  <div>Email</div>
                  <div>Total Invoices</div>
                  <div>Actions</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {[
                  { name: 'John Doe', email: 'john@example.com', invoices: 5, total: 6250.00, phone: '+237 6 12 34 56 78', address: 'Douala, Cameroon', status: 'active' },
                  { name: 'Jane Smith', email: 'jane@example.com', invoices: 3, total: 2550.00, phone: '+237 6 87 65 43 21', address: 'Yaoundé, Cameroon', status: 'active' },
                  { name: 'Bob Johnson', email: 'bob@example.com', invoices: 4, total: 4200.00, phone: '+237 6 98 76 54 32', address: 'Bafoussam, Cameroon', status: 'active' },
                ].map((customer, index) => (
                  <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-600">{customer.email}</div>
                      <div className="text-sm text-gray-600">{customer.invoices} invoices</div>
                      <div>
                        <button 
                          onClick={() => setSelectedItem({ ...customer, type: 'customer' })}
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
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="bg-white border border-gray-200  overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700">
                  <div>Product</div>
                  <div>Price</div>
                  <div>Used In</div>
                  <div>Actions</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {[
                  { name: 'Web Development', price: 1500.00, used: 8, description: 'Professional web development services', category: 'Services', vat: 19.25 },
                  { name: 'Consulting Services', price: 200.00, used: 12, description: 'Business consulting and advisory', category: 'Services', vat: 19.25 },
                  { name: 'Design Package', price: 850.00, used: 5, description: 'Complete design package including logo and branding', category: 'Services', vat: 19.25 },
                ].map((product, index) => (
                  <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-900 font-semibold">XAF {product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-sm text-gray-600">{product.used} invoices</div>
                      <div>
                        <button 
                          onClick={() => setSelectedItem({ ...product, type: 'product' })}
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
          )}
        </>
      )}

      {/* Invoice Detail Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedItem.type === 'invoice' && 'Invoice Details'}
                {selectedItem.type === 'recurring' && 'Recurring Invoice Details'}
                {selectedItem.type === 'credit-note' && 'Credit Note Details'}
                {selectedItem.type === 'customer' && 'Customer Details'}
                {selectedItem.type === 'product' && 'Product Details'}
              </h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Invoice Details */}
              {selectedItem.type === 'invoice' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Invoice Number</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{selectedItem.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Date</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.date}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Customer</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.customer}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Email</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Amount</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      XAF {selectedItem.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Status</label>
                    <div className="mt-1">
                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${
                        selectedItem.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : selectedItem.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Payment Method</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.paymentMethod}</p>
                  </div>
                </div>
              )}

              {/* Recurring Invoice Details */}
              {selectedItem.type === 'recurring' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Recurring Invoice ID</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{selectedItem.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Status</label>
                    <div className="mt-1">
                      <span className="inline-block px-3 py-1 text-sm font-medium rounded bg-green-100 text-green-700">
                        {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Customer</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.customer}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Email</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Frequency</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.frequency}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Next Invoice Date</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.next}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Amount</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      XAF {selectedItem.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Start Date</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.startDate}</p>
                  </div>
                </div>
              )}

              {/* Credit Note Details */}
              {selectedItem.type === 'credit-note' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Credit Note Number</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{selectedItem.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Date</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.date}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Related Invoice</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.invoice}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Customer</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.customer}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Amount</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      XAF {selectedItem.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Status</label>
                    <div className="mt-1">
                      <span className="inline-block px-3 py-1 text-sm font-medium rounded bg-green-100 text-green-700">
                        {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-600 font-medium">Reason</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.reason}</p>
                  </div>
                </div>
              )}

              {/* Customer Details */}
              {selectedItem.type === 'customer' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Customer Name</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{selectedItem.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Email</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Phone</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Address</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.address}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Total Invoices</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.invoices}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Total Amount</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      XAF {selectedItem.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Status</label>
                    <div className="mt-1">
                      <span className="inline-block px-3 py-1 text-sm font-medium rounded bg-green-100 text-green-700">
                        {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Details */}
              {selectedItem.type === 'product' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Product Name</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{selectedItem.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Category</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.category}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Price</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      XAF {selectedItem.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">VAT Rate</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.vat}%</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Used In</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.used} invoices</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-600 font-medium">Description</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
              {selectedItem.type === 'invoice' && (
                <button
                  onClick={() => handleDownloadInvoice(selectedItem)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
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
