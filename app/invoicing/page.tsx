'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Gear, ArrowLeft, CaretDown, Info, FileText, Eye, Download, MagnifyingGlass, Calendar, X, CheckCircle, WarningCircle, Spinner, PencilSimple, PaperPlaneTilt, Envelope } from '@phosphor-icons/react';
import Link from 'next/link';
import { invoicingService, customersService, productsService, type Customer, type Product } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { useOrganization } from '@/contexts/OrganizationContext';

export default function InvoicingPage() {
  const { organization } = useOrganization();
  const [activeTab, setActiveTab] = useState('invoices');
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState('one-off');
  const [vatDisplay, setVatDisplay] = useState('including');
  
  // Customers and Products state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

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
    profile: organization?.name || '',
    customer: '',
    customerId: '',
    paymentTerm: '',
    memo: null as string | null,
    items: [{ product: '', productId: '', quantity: 1, price: '', vat: 0, total: 0 }],
    discount: 0,
    subtotal: 0,
    total: 0,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  
  // Edit form data
  const [editFormData, setEditFormData] = useState({
    line_items: [] as any[],
    due_date: '',
    notes: '',
  });
  
  // Status form data
  const [statusFormData, setStatusFormData] = useState({
    status: 'DRAFT' as 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED',
  });

  const periodRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'invoices', label: 'Invoices' },
    { id: 'recurring', label: 'Recurring' },
  ];

  // API data state
  const [invoices, setInvoices] = useState<any[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    invoices: false,
    recurring: false,
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
        // Response.data is now an array directly
        let invoicesList = Array.isArray(response.data) ? response.data : [];
        
        // Fetch customer data for invoices that have customer_id but no customer object
        const invoicesNeedingCustomerData = invoicesList.filter(
          inv => inv.customer_id && (!inv.customer || !inv.customer.email)
        );
        
        if (invoicesNeedingCustomerData.length > 0) {
          // Fetch customer data in parallel
          const customerPromises = invoicesNeedingCustomerData.map(async (invoice) => {
            try {
              const customerResponse = await customersService.getCustomer(invoice.customer_id!);
              if (customerResponse.success && customerResponse.data) {
                const customer = customerResponse.data;
                return {
                  invoiceId: invoice.id,
                  customer: {
                    id: customer.id,
                    name: customer.firstName && customer.lastName 
                      ? `${customer.firstName} ${customer.lastName}` 
                      : customer.firstName || customer.lastName || undefined,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    email: customer.email,
                    phone: customer.phone,
                    address: customer.address,
                  }
                };
              }
            } catch (error) {
              console.warn(`Failed to fetch customer for invoice ${invoice.id}:`, error);
            }
            return null;
          });
          
          const customerResults = await Promise.all(customerPromises);
          
          // Update invoices with customer data
          invoicesList = invoicesList.map(invoice => {
            const customerData = customerResults.find(cr => cr?.invoiceId === invoice.id);
            if (customerData) {
              return {
                ...invoice,
                customer: customerData.customer
              };
            }
            return invoice;
          });
        }
        
        setInvoices(invoicesList);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
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
        // Handle both array response and object with recurring property
        const recurringData = Array.isArray(response.data)
          ? response.data
          : ((response.data as any)?.recurring ?? []);
        setRecurringInvoices(recurringData);
      } else {
        setRecurringInvoices([]);
      }
    } catch (error) {
      console.error('Error fetching recurring invoices:', error);
      setRecurringInvoices([]);
    } finally {
      setLoading(prev => ({ ...prev, recurring: false }));
    }
  }, []);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const params = organization?.id ? { organization_id: organization.id } : undefined;
      const response = await customersService.listCustomers(params);
      if (response.success && response.data) {
        setCustomers(Array.isArray(response.data) ? response.data : []);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  }, [organization]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = organization?.id ? { organization_id: organization.id } : undefined;
      const response = await productsService.listProducts(params);
      if (response.success && response.data) {
        setProducts(Array.isArray(response.data) ? response.data : []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [organization]);

  // Fetch customers and products when create modal opens
  useEffect(() => {
    if (showCreateInvoice) {
      fetchCustomers();
      fetchProducts();
    }
  }, [showCreateInvoice, fetchCustomers, fetchProducts]);

  // Fetch data on mount and tab change
  useEffect(() => {
    if (activeTab === 'invoices') {
      fetchInvoices();
    } else if (activeTab === 'recurring') {
      fetchRecurringInvoices();
    }
  }, [activeTab, fetchInvoices, fetchRecurringInvoices]);

  // Filter invoices (client-side filtering for search)
  const getFilteredInvoices = () => {
    let filtered = [...invoices];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(invoice => {
        const customerName = invoice.customer?.name || 
          (invoice.customer?.firstName && invoice.customer?.lastName
            ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
            : invoice.customer?.firstName || invoice.customer?.lastName || '');
        const customerEmail = invoice.customer?.email || '';
        
        return invoice.id.toLowerCase().includes(query) ||
          customerName.toLowerCase().includes(query) ||
          customerEmail.toLowerCase().includes(query) ||
          (typeof invoice.customer === 'string' && invoice.customer.toLowerCase().includes(query)) ||
          (invoice.customerName && invoice.customerName.toLowerCase().includes(query));
      });
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
    
    // If product is selected, auto-fill price
    if (field === 'productId' && value) {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        newItems[index].product = selectedProduct.name;
        newItems[index].productId = selectedProduct.id;
        newItems[index].price = selectedProduct.price.toString();
      }
    }
    
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
      items: [...formData.items, { product: '', productId: '', quantity: 1, price: '', vat: 0, total: 0 }],
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
    if (!formData.customerId) {
      setCreateError('Please select a customer');
      return;
    }

    if (formData.items.some(item => !item.productId || !item.price)) {
      setCreateError('Please fill in all item fields (product and price)');
      return;
    }

    if (formData.total <= 0) {
      setCreateError('Invoice total must be greater than 0');
      return;
    }

    setIsCreating(true);

    try {
      // Prepare invoice data according to API structure
      const invoiceData = {
        customer_id: formData.customerId,
        organization_id: organization?.id,
        line_items: formData.items.map(item => ({
          productId: item.productId,
          description: item.product,
          quantity: parseFloat(item.quantity.toString()) || 1,
          unitPrice: parseFloat(item.price) || 0,
          taxRate: item.vat || 0,
        })),
        due_date: formData.paymentTerm ? (() => {
          // Calculate due date based on payment term
          const today = new Date();
          const days = formData.paymentTerm === 'net-15' ? 15 :
                      formData.paymentTerm === 'net-30' ? 30 :
                      formData.paymentTerm === 'net-45' ? 45 :
                      formData.paymentTerm === 'net-60' ? 60 : 0;
          if (days > 0) {
            today.setDate(today.getDate() + days);
            return today.toISOString().split('T')[0];
          }
          return undefined;
        })() : undefined,
        currency: 'XAF',
        notes: formData.memo || undefined,
      };
      
      const response = await invoicingService.createInvoice(invoiceData);
      
      if (response.success) {
        setCreateSuccess(true);
        
        // Refresh invoices list
        await fetchInvoices();
        
        // Reset form after success
        setTimeout(() => {
          setFormData({
            profile: organization?.name || '',
            customer: '',
            customerId: '',
            paymentTerm: '',
            memo: null as any,
            items: [{ product: '', productId: '', quantity: 1, price: '', vat: 0, total: 0 }],
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

  // Handle view invoice
  const handleViewInvoice = async (invoice: any) => {
    setSelectedInvoice(invoice);
    setActionError('');
    setActionSuccess('');
    try {
      const response = await invoicingService.getInvoice(invoice.id);
      if (response.success && response.data) {
        setSelectedInvoice(response.data);
        setShowViewModal(true);
      } else {
        setActionError(response.error?.message || 'Failed to load invoice details');
        setShowViewModal(true);
      }
    } catch (error: any) {
      console.error('Error fetching invoice details:', error);
      setActionError(error?.message || 'Failed to load invoice details');
      setShowViewModal(true);
    }
  };

  // Handle edit invoice
  const handleEditInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setEditFormData({
      line_items: invoice.line_items || [],
      due_date: invoice.due_date || invoice.dueDate || '',
      notes: invoice.notes || '',
    });
    setShowEditModal(true);
  };

  // Handle update invoice
  const handleUpdateInvoice = async () => {
    if (!selectedInvoice) return;

    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const updateData: any = {};
      
      if (editFormData.line_items.length > 0) {
        updateData.line_items = editFormData.line_items;
      }
      
      if (editFormData.due_date) {
        updateData.due_date = editFormData.due_date;
      }
      
      if (editFormData.notes !== undefined) {
        updateData.notes = editFormData.notes;
      }

      const response = await invoicingService.updateInvoice(selectedInvoice.id, updateData);
      
      if (response.success) {
        setActionSuccess('Invoice updated successfully!');
        await fetchInvoices();
        setTimeout(() => {
          setShowEditModal(false);
          setActionSuccess('');
        }, 2000);
      } else {
        setActionError(response.error?.message || 'Failed to update invoice. Please try again.');
      }
    } catch (error: any) {
      console.error('Update invoice error:', error);
      setActionError(error?.message || 'Failed to update invoice. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle send invoice
  const handleSendInvoice = async () => {
    if (!selectedInvoice) return;

    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const response = await invoicingService.sendInvoice(selectedInvoice.id);
      
      if (response.success) {
        setActionSuccess('Invoice sent successfully!');
        await fetchInvoices();
        setTimeout(() => {
          setShowViewModal(false);
          setActionSuccess('');
        }, 2000);
      } else {
        setActionError(response.error?.message || 'Failed to send invoice. Please try again.');
      }
    } catch (error: any) {
      console.error('Send invoice error:', error);
      setActionError(error?.message || 'Failed to send invoice. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle update status
  const handleUpdateStatus = async () => {
    if (!selectedInvoice) return;

    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const response = await invoicingService.updateInvoiceStatus(selectedInvoice.id, {
        status: statusFormData.status,
      });
      
      if (response.success) {
        setActionSuccess('Invoice status updated successfully!');
        await fetchInvoices();
        setTimeout(() => {
          setShowStatusModal(false);
          setActionSuccess('');
        }, 2000);
      } else {
        setActionError(response.error?.message || 'Failed to update invoice status. Please try again.');
      }
    } catch (error: any) {
      console.error('Update status error:', error);
      setActionError(error?.message || 'Failed to update invoice status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Download invoice
  const handleDownloadInvoice = (invoice: any) => {
    // Helper function to get customer name
    const getCustomerName = () => {
      if (invoice.customer?.name) return invoice.customer.name;
      if (invoice.customer?.firstName && invoice.customer?.lastName) {
        return `${invoice.customer.firstName} ${invoice.customer.lastName}`;
      }
      if (invoice.customer?.firstName) return invoice.customer.firstName;
      if (invoice.customer?.lastName) return invoice.customer.lastName;
      if (invoice.customerName) return invoice.customerName;
      if (typeof invoice.customer === 'string') return invoice.customer;
      return 'N/A';
    };

    // Helper function to get customer email
    const getCustomerEmail = () => {
      return invoice.customer?.email || invoice.email || 'N/A';
    };

    // Calculate line items totals
    const lineItemsHTML = invoice.line_items && invoice.line_items.length > 0
      ? invoice.line_items.map((item: any) => {
          const unitPrice = item.unitPrice || item.unit_price || 0;
          const quantity = item.quantity || 0;
          const taxRate = item.taxRate || item.tax_rate || 0;
          const subtotal = unitPrice * quantity;
          const taxAmount = (subtotal * taxRate) / 100;
          const total = subtotal + taxAmount;
          
          return `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description || 'Item'}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${quantity}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(unitPrice, invoice.currency || 'XAF')}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${taxRate > 0 ? `${taxRate}%` : '-'}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(total, invoice.currency || 'XAF')}</td>
            </tr>
          `;
        }).join('')
      : '';

    const invoiceContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.invoiceNumber || invoice.id}</title>
        <style>
          @media print {
            @page { margin: 1cm; size: A4; }
            body { margin: 0; padding: 20px; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #111827;
            background: #ffffff;
            padding: 40px;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 40px;
            text-align: center;
          }
          .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .header .invoice-number {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 500;
          }
          .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            padding: 40px;
            background: #f9fafb;
          }
          .info-box {
            background: white;
            padding: 24px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .info-box h3 {
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }
          .info-box p {
            font-size: 15px;
            color: #111827;
            margin-bottom: 8px;
          }
          .info-box .label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .info-box .value {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 12px;
          }
          .line-items {
            padding: 40px;
          }
          .line-items h3 {
            font-size: 18px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid #e5e7eb;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          thead {
            background: #f3f4f6;
          }
          th {
            padding: 14px 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e5e7eb;
          }
          th.text-right {
            text-align: right;
          }
          td {
            padding: 14px 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #111827;
            font-size: 14px;
          }
          td.text-right {
            text-align: right;
          }
          tfoot {
            background: #f9fafb;
          }
          tfoot td {
            font-weight: 700;
            font-size: 16px;
            padding: 20px 12px;
            border-top: 2px solid #e5e7eb;
          }
          tfoot .total-label {
            text-align: right;
            color: #374151;
          }
          tfoot .total-amount {
            text-align: right;
            color: #10b981;
            font-size: 20px;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-paid { background: #10b981; color: white; }
          .status-sent { background: #3b82f6; color: white; }
          .status-overdue { background: #ef4444; color: white; }
          .status-cancelled { background: #6b7280; color: white; }
          .status-draft { background: #f59e0b; color: white; }
          .notes {
            margin: 40px;
            padding: 20px;
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            border-radius: 4px;
          }
          .notes h4 {
            font-size: 14px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
          }
          .notes p {
            font-size: 14px;
            color: #78350f;
          }
          .footer {
            padding: 30px 40px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          .footer p {
            margin-bottom: 4px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>INVOICE</h1>
            <div class="invoice-number">${invoice.invoiceNumber ? `#${invoice.invoiceNumber}` : `ID: ${invoice.id}`}</div>
          </div>
          
          <div class="info-section">
            <div class="info-box">
              <h3>Bill To</h3>
              <div class="value">${getCustomerName()}</div>
              ${invoice.customer?.email ? `<p><span class="label">Email:</span><br>${getCustomerEmail()}</p>` : ''}
              ${invoice.customer?.phone ? `<p><span class="label">Phone:</span><br>${invoice.customer.phone}</p>` : ''}
              ${invoice.customer?.address ? `<p><span class="label">Address:</span><br>${invoice.customer.address}</p>` : ''}
            </div>
            
            <div class="info-box">
              <h3>Invoice Details</h3>
              ${invoice.date ? `<p><span class="label">Invoice Date:</span><br><span class="value">${formatDate(invoice.date)}</span></p>` : ''}
              ${invoice.due_date || invoice.dueDate ? `<p><span class="label">Due Date:</span><br><span class="value">${formatDate(invoice.due_date || invoice.dueDate)}</span></p>` : ''}
              <p><span class="label">Status:</span><br>
                <span class="status-badge status-${(invoice.status || 'draft').toLowerCase()}">${invoice.status || 'DRAFT'}</span>
              </p>
              <p><span class="label">Currency:</span><br><span class="value">${invoice.currency || 'XAF'}</span></p>
            </div>
          </div>
          
          ${lineItemsHTML ? `
          <div class="line-items">
            <h3>Line Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-right">Quantity</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Tax</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${lineItemsHTML}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="total-label">Total Amount</td>
                  <td class="total-amount">${formatCurrency(invoice.amount || 0, invoice.currency || 'XAF')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          ` : ''}
          
          ${invoice.notes ? `
          <div class="notes">
            <h4>Notes</h4>
            <p>${invoice.notes}</p>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Instanvi Payment Platform</strong></p>
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([invoiceContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice.invoiceNumber || invoice.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Invoices</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Link 
            href="/settings"
            className="w-full sm:w-auto px-4 py-2 text-sm bg-white border-2 border-gray-200 text-gray-700 font-semibold hover:border-green-400 hover:bg-green-50 transition-all flex items-center justify-center gap-2"
          >
            <Gear className="w-4 h-4" />
            Settings
          </Link>
          <button 
            onClick={() => setShowCreateInvoice(true)}
            className="w-full sm:w-auto px-4 sm:px-5 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 sm:mb-6 border-b-2 border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold transition-colors relative whitespace-nowrap
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
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
              <CaretDown className="w-4 h-4 inline-block ml-2" />
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
              <CaretDown className="w-4 h-4 inline-block ml-2" />
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

      {/* Create Invoice Form - Right Slide Modal */}
      {showCreateInvoice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-fade-in"
              onClick={() => {
                setShowCreateInvoice(false);
                setCreateError(null);
                setCreateSuccess(false);
                setFormData({
                profile: organization?.name || '',
                  customer: '',
                  customerId: '',
                  paymentTerm: '',
                  memo: null as any,
                  items: [{ product: '', productId: '', quantity: 1, price: '', vat: 0, total: 0 }],
                  discount: 0,
                  subtotal: 0,
                  total: 0,
                });
              }}
          />
          {/* Modal Content */}
          <div className="relative bg-white h-full w-full max-w-4xl shadow-2xl slide-in-right overflow-y-auto">
            {/* Sticky Header with Gradient */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-4 flex items-center justify-between z-10 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <h1 className="text-xl font-bold">Create Invoice</h1>
                </div>
                <div className="flex gap-1 bg-white/10 backdrop-blur-sm p-0.5 ">
                  <button
                    onClick={() => setInvoiceType('one-off')}
                    className={`px-3 py-1 text-xs font-medium transition-all rounded ${
                      invoiceType === 'one-off'
                        ? 'bg-white text-green-700 shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    One-off
                  </button>
                  <button
                    onClick={() => setInvoiceType('recurring')}
                    className={`px-3 py-1 text-xs font-medium transition-all rounded ${
                      invoiceType === 'recurring'
                        ? 'bg-white text-green-700 shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Recurring
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
              <button 
                onClick={handleCreateInvoice}
                disabled={isCreating}
                  className="px-4 py-1.5 bg-white text-green-700 font-medium hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 rounded text-sm shadow-sm"
              >
                  {isCreating ? (
                    <>
                      <Spinner className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowCreateInvoice(false);
                    setCreateError(null);
                    setCreateSuccess(false);
                    setFormData({
                      profile: organization?.name || '',
                      customer: '',
                      customerId: '',
                      paymentTerm: '',
                      memo: null as any,
                      items: [{ product: '', productId: '', quantity: 1, price: '', vat: 0, total: 0 }],
                      discount: 0,
                      subtotal: 0,
                      total: 0,
                    });
                  }}
                  className="p-1.5 hover:bg-white/10  transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
            {/* Form Content */}
            <div className="p-5">
          {/* Invoice Details Section */}
          <div className="mb-6">
            {/* Sender Information Card */}
                  {organization && (
                    <div className="mb-5 p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 ">
                      <div className="text-right">
                        <h3 className="text-base font-semibold text-gray-900 mb-1.5">{organization.name}</h3>
                <div className="space-y-0.5 text-xs text-gray-700">
                        {(organization as any)?.email && <p>{(organization as any).email}</p>}
                        {(organization as any)?.phone && <p>{(organization as any).phone}</p>}
                        {(organization as any)?.website && <p>{(organization as any).website}</p>}
                </div>
              </div>
                  </div>
                  )}
              
              {/* Form Fields Section */}
              <div className="space-y-4">

                {/* Customer */}
                <div className="p-4 bg-gray-50 border border-gray-200 ">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Customer <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      value={formData.customerId}
                      onChange={(e) => {
                        const selectedCustomer = customers.find(c => c.id === e.target.value);
                        setFormData({ 
                          ...formData, 
                          customerId: e.target.value,
                          customer: selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : ''
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm appearance-none"
                      required
                    >
                      <option value="">Select a customer</option>
                      {loadingCustomers ? (
                        <option disabled>Loading customers...</option>
                      ) : customers.length === 0 ? (
                        <option disabled>No customers found. Create a customer first.</option>
                      ) : (
                        customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.firstName} {customer.lastName} - {customer.email}
                          </option>
                        ))
                      )}
                    </select>
                    <CaretDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Payment term */}
                <div className="p-4 bg-indigo-50 border border-indigo-200 ">
                  <label className="block text-sm font-semibold text-indigo-900 mb-2">Payment Term</label>
                  <div className="relative">
                    <select
                      value={formData.paymentTerm}
                      onChange={(e) => setFormData({ ...formData, paymentTerm: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 text-gray-900  appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm pr-10"
                    >
                      <option value="">Select payment term</option>
                      <option value="net-15">Net 15</option>
                      <option value="net-30">Net 30</option>
                      <option value="net-45">Net 45</option>
                      <option value="net-60">Net 60</option>
                      <option value="due-on-receipt">Due on Receipt</option>
                    </select>
                    <CaretDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Memo */}
                {formData.memo !== null && formData.memo !== undefined ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 ">
                    <label className="block text-sm font-semibold text-yellow-900 mb-2">Memo</label>
                    <textarea
                      value={formData.memo}
                      onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                      placeholder="Add a memo or note"
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-yellow-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, memo: null as any })}
                      className="mt-2 text-xs text-red-600 hover:text-red-700 hover:underline font-medium"
                    >
                      Remove memo
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, memo: '' })}
                    className="text-sm text-green-600 hover:text-green-700 hover:underline font-medium"
                  >
                    + Add memo
                  </button>
                )}
              </div>
            </div>

          {/* Items Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Items</h2>
              <div className="flex gap-1 bg-gray-100 p-0.5 ">
                <button
                  onClick={() => setVatDisplay('including')}
                  className={`px-3 py-1 text-xs font-medium transition-all rounded ${
                    vatDisplay === 'including'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Including VAT
                </button>
                <button
                  onClick={() => setVatDisplay('excluding')}
                  className={`px-3 py-1 text-xs font-medium transition-all rounded ${
                    vatDisplay === 'excluding'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Excluding VAT
                </button>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-gray-200 rounded overflow-x-auto">
              <div className="hidden lg:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700 min-w-[800px]">
                <div className="col-span-5">Product</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">VAT</div>
                <div className="col-span-1">Total</div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {formData.items.map((item, index) => (
                  <div key={index} className="p-3 sm:p-4">
                    {/* Mobile Card Layout */}
                    <div className="lg:hidden space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-600 mb-1">Product</div>
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            className="w-full px-3 py-2 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
                          >
                            <option value="">Select a product</option>
                            {loadingProducts ? (
                              <option disabled>Loading products...</option>
                            ) : products.filter(p => p.isActive).map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} - {formatCurrency(product.price, product.currency)}
                              </option>
                            ))}
                          </select>
                        </div>
                        {formData.items.length > 1 && (
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Quantity</div>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            min="1"
                            className="w-full px-3 py-2 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">VAT</div>
                          <select
                            value={item.vat}
                            onChange={(e) => handleItemChange(index, 'vat', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
                          >
                            <option value={0}>0%</option>
                            <option value={5.5}>5.5%</option>
                            <option value={10}>10%</option>
                            <option value={18}>18%</option>
                            <option value={19.25}>19.25%</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Price (XAF)</div>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-600">Total</span>
                        <span className="text-sm font-semibold text-gray-900">
                          XAF {item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    {/* Desktop Table Layout */}
                    <div className="hidden lg:grid grid-cols-12 gap-4 items-center min-w-[800px]">
                      <div className="col-span-5">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          className="w-full px-4 py-1 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
                        >
                          <option value="">Select a product</option>
                          {loadingProducts ? (
                            <option disabled>Loading products...</option>
                          ) : products.filter(p => p.isActive).map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - {formatCurrency(product.price, product.currency)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-full px-4 py-1 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
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
                          className="flex-1 px-4 py-1 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={item.vat}
                          onChange={(e) => handleItemChange(index, 'vat', parseFloat(e.target.value))}
                          className="w-full px-4 py-1 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
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
              className="mt-4 text-sm text-green-600 hover:text-green-700 hover:underline font-medium"
            >
              + Add item
            </button>
          </div>

          {/* Totals Section */}
          <div className="border border-gray-200  p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <h2 className="text-lg font-semibold text-green-900 mb-3">Totals</h2>
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
            <div className="mt-5 bg-green-50 border border-green-200  p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-800 font-semibold">Invoice created successfully!</p>
                <p className="text-xs text-green-700 mt-1">Your invoice has been created and saved.</p>
              </div>
            </div>
          )}

          {createError && (
            <div className="mt-5 bg-red-50 border border-red-200  p-4 flex items-start gap-3">
              <WarningCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">{createError}</p>
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
          </div>
        </div>
      ) : (
        <div className="fade-in">
          {/* Invoices List */}
          {activeTab === 'invoices' && (
            loading.invoices ? (
              <>
                {/* Skeleton Table */}
                <div className="bg-white border border-gray-200 overflow-hidden fade-in">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
                    <div className="hidden lg:grid grid-cols-6 gap-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                    <div className="lg:hidden h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="lg:hidden space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                            </div>
                            <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="hidden lg:grid grid-cols-6 gap-4 items-center">
                          {[...Array(6)].map((_, j) => (
                            <div key={j} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (() => {
              const filteredInvoices = getFilteredInvoices();
              
              return (
                <div className="bg-white border border-gray-200 overflow-hidden fade-in">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
                    <div className="hidden lg:grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
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
                        <div key={invoice.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                          {/* Mobile Card Layout */}
                          <div className="lg:hidden space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-mono text-xs sm:text-sm text-gray-900 font-semibold truncate">{invoice.invoiceNumber || invoice.id}</div>
                                <div className="text-xs sm:text-sm text-gray-600 mt-1">{formatDate(invoice.date || invoice.createdAt)}</div>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded flex-shrink-0 ml-2 ${
                                invoice.status === 'paid'
                                  ? 'bg-green-100 text-green-700'
                                  : invoice.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {invoice.status}
                              </span>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Customer</div>
                              <div className="text-sm font-medium text-gray-900">
                                {invoice.customer?.name || 
                                 (invoice.customer?.firstName && invoice.customer?.lastName
                                   ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
                                   : invoice.customer?.firstName || 
                                     invoice.customer?.lastName || 
                                     invoice.customerName || 
                                     invoice.customer || 
                                     'N/A')}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                              <div>
                                <div className="text-xs text-gray-600">Amount</div>
                                <div className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.amount, invoice.currency || 'XAF')}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => setSelectedItem({ ...invoice, type: 'invoice' })}
                                  className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 px-3 py-1 border border-green-200 hover:bg-green-50 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </button>
                                <button 
                                  onClick={() => handleDownloadInvoice(invoice)}
                                  className="p-2 text-gray-600 hover:text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors rounded"
                                  title="Download invoice"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          {/* Desktop Table Layout */}
                          <div className="hidden lg:grid grid-cols-6 gap-4 items-center">
                            <div className="font-mono text-sm text-gray-900 font-semibold">{invoice.invoiceNumber || invoice.id}</div>
                            <div className="text-sm text-gray-900">
                              {invoice.customer?.name || 
                               (invoice.customer?.firstName && invoice.customer?.lastName
                                 ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
                                 : invoice.customer?.firstName || 
                                   invoice.customer?.lastName || 
                                   invoice.customerName || 
                                   invoice.customer || 
                                   'N/A')}
                            </div>
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
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  handleViewInvoice(invoice);
                                }}
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
                      <div className="px-4 sm:px-6 py-6 sm:py-8 text-center text-sm text-gray-500">
                        {invoices.length === 0 ? 'No invoices found. Create your first invoice to get started.' : 'No invoices found matching your search criteria.'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}

          {/* Recurring Tab */}
          {activeTab === 'recurring' && (
            loading.recurring ? (
              <>
                {/* Skeleton Table */}
                <div className="bg-white border border-gray-200 overflow-hidden fade-in">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
                    <div className="hidden lg:grid grid-cols-5 gap-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                    <div className="lg:hidden h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="lg:hidden space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                            </div>
                            <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="hidden lg:grid grid-cols-5 gap-4 items-center">
                          {[...Array(5)].map((_, j) => (
                            <div key={j} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white border border-gray-200 overflow-hidden fade-in">
                <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
                  <div className="hidden lg:grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
                    <div>Recurring Invoice</div>
                    <div>Customer</div>
                    <div>Frequency</div>
                    <div>Next Invoice</div>
                    <div>Actions</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {recurringInvoices.length > 0 ? (
                    recurringInvoices.map((recurring) => (
                      <div key={recurring.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                        {/* Mobile Card Layout */}
                        <div className="lg:hidden space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-xs sm:text-sm text-gray-900 font-semibold truncate">{recurring.id || recurring.invoiceNumber}</div>
                              <div className="text-xs sm:text-sm text-gray-600 mt-1">
                                Next: {recurring.nextInvoiceDate || recurring.next || formatDate(recurring.startDate)}
                              </div>
                            </div>
                            <button 
                              onClick={() => setSelectedItem({ ...recurring, type: 'recurring' })}
                              className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 px-3 py-1 border border-green-200 hover:bg-green-50 transition-colors flex-shrink-0"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Customer</div>
                            <div className="text-sm font-medium text-gray-900">
                              {recurring.customerName || recurring.customer?.name || recurring.customer || 'N/A'}
                            </div>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            Frequency: {recurring.frequency || 'N/A'}
                          </div>
                        </div>
                        {/* Desktop Table Layout */}
                        <div className="hidden lg:grid grid-cols-5 gap-4 items-center">
                          <div className="font-mono text-sm text-gray-900 font-semibold">{recurring.id || recurring.invoiceNumber}</div>
                          <div className="text-sm text-gray-900">
                            {recurring.customerName || recurring.customer?.name || recurring.customer || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600">{recurring.frequency || 'N/A'}</div>
                          <div className="text-sm text-gray-600">
                            {recurring.nextInvoiceDate || recurring.next || formatDate(recurring.startDate)}
                          </div>
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
                    ))
                  ) : (
                    <div className="px-4 sm:px-6 py-6 sm:py-8 text-center text-sm text-gray-500">
                      No recurring invoices found.
                    </div>
                  )}
                </div>
              </div>
            )
          )}

        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-white  max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedItem.type === 'invoice' && 'Invoice Details'}
                {selectedItem.type === 'recurring' && 'Recurring Invoice Details'}
              </h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Invoice Details */}
              {selectedItem.type === 'invoice' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Invoice Number</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {selectedItem.invoiceNumber || selectedItem.id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Date</label>
                    <p className="text-lg text-gray-900 mt-1">
                      {formatDate(selectedItem.date || selectedItem.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Customer</label>
                    <p className="text-lg text-gray-900 mt-1">
                      {selectedItem.customerName || selectedItem.customer?.name || selectedItem.customer || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Email</label>
                    <p className="text-lg text-gray-900 mt-1">
                      {selectedItem.customer?.email || selectedItem.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Amount</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {formatCurrency(selectedItem.amount, selectedItem.currency || 'XAF')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Status</label>
                    <div className="mt-1">
                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${
                        selectedItem.status === 'paid' || selectedItem.status === 'PAID'
                          ? 'bg-green-100 text-green-700'
                          : selectedItem.status === 'pending' || selectedItem.status === 'PENDING' || selectedItem.status === 'SENT'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {(selectedItem.status || 'N/A').charAt(0).toUpperCase() + (selectedItem.status || 'N/A').slice(1).toLowerCase()}
                      </span>
                    </div>
                  </div>
                  {selectedItem.dueDate && (
                    <div>
                      <label className="text-sm text-gray-600 font-medium">Due Date</label>
                      <p className="text-lg text-gray-900 mt-1">
                        {formatDate(selectedItem.dueDate)}
                      </p>
                    </div>
                  )}
                  {selectedItem.paymentMethod && (
                    <div>
                      <label className="text-sm text-gray-600 font-medium">Payment Method</label>
                      <p className="text-lg text-gray-900 mt-1">{selectedItem.paymentMethod}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Recurring Invoice Details */}
              {selectedItem.type === 'recurring' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Recurring Invoice ID</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {selectedItem.id || selectedItem.invoiceNumber}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Status</label>
                    <div className="mt-1">
                      <span className="inline-block px-3 py-1 text-sm font-medium rounded bg-green-100 text-green-700">
                        {(selectedItem.status || 'active').charAt(0).toUpperCase() + (selectedItem.status || 'active').slice(1)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Customer</label>
                    <p className="text-lg text-gray-900 mt-1">
                      {selectedItem.customerName || selectedItem.customer?.name || selectedItem.customer || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Email</label>
                    <p className="text-lg text-gray-900 mt-1">
                      {selectedItem.customer?.email || selectedItem.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Frequency</label>
                    <p className="text-lg text-gray-900 mt-1">{selectedItem.frequency || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 font-medium">Next Invoice Date</label>
                    <p className="text-lg text-gray-900 mt-1">
                      {selectedItem.nextInvoiceDate || selectedItem.next || formatDate(selectedItem.startDate) || 'N/A'}
                    </p>
                  </div>
                  {selectedItem.amount && (
                    <div>
                      <label className="text-sm text-gray-600 font-medium">Amount</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {formatCurrency(selectedItem.amount, selectedItem.currency || 'XAF')}
                      </p>
                    </div>
                  )}
                  {selectedItem.startDate && (
                    <div>
                      <label className="text-sm text-gray-600 font-medium">Start Date</label>
                      <p className="text-lg text-gray-900 mt-1">
                        {formatDate(selectedItem.startDate)}
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4 flex-wrap">
              {selectedItem.type === 'invoice' && (
                <>
                  <button
                    onClick={() => {
                      setSelectedItem(null);
                      handleEditInvoice(selectedItem);
                    }}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded flex items-center gap-2"
                  >
                    <PencilSimple className="w-4 h-4" />
                    Edit
                  </button>
                  {selectedItem.status !== 'SENT' && selectedItem.status !== 'sent' && (
                    <button
                      onClick={() => {
                        setSelectedInvoice(selectedItem);
                        handleSendInvoice();
                      }}
                      className="px-4 py-2 bg-gray-500 text-white font-medium hover:bg-gray-600 transition-colors rounded flex items-center gap-2"
                    >
                      <PaperPlaneTilt className="w-4 h-4" />
                      Send
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedInvoice(selectedItem);
                      setStatusFormData({ status: (selectedItem.status || 'DRAFT').toUpperCase() as any });
                      setShowStatusModal(true);
                    }}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded"
                  >
                    Update Status
                  </button>
                  <button
                    onClick={() => handleDownloadInvoice(selectedItem)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </>
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

      {/* View Invoice Modal */}
      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-fade-in">
          <div className="bg-white shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto modal-fade-in">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-0.5">Invoice Details</h2>
                  {selectedInvoice.invoiceNumber && (
                    <p className="text-green-100 text-xs">#{selectedInvoice.invoiceNumber}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 "
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-center gap-2">
                  <WarningCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs">{actionError}</span>
                </div>
              )}
              {actionSuccess && (
                <div className="p-3 bg-green-50 border-l-4 border-green-500 text-green-700 rounded flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs">{actionSuccess}</span>
                </div>
              )}

              {/* Invoice Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 border border-gray-200">
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-1">Invoice ID</div>
                  <div className="text-xs font-mono text-gray-900 break-all">{selectedInvoice.id}</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 border border-gray-200">
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-1">Status</div>
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedInvoice.status === 'PAID' || selectedInvoice.status === 'paid'
                        ? 'bg-green-500 text-white'
                        : selectedInvoice.status === 'SENT' || selectedInvoice.status === 'sent'
                        ? 'bg-gray-500 text-white'
                        : selectedInvoice.status === 'OVERDUE' || selectedInvoice.status === 'overdue'
                        ? 'bg-red-500 text-white'
                        : selectedInvoice.status === 'CANCELLED' || selectedInvoice.status === 'cancelled'
                        ? 'bg-gray-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {selectedInvoice.status || 'DRAFT'}
                    </span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 border border-green-200">
                  <div className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Total Amount</div>
                  <div className="text-lg font-bold text-green-900 mt-1">
                    {formatCurrency(selectedInvoice.amount || 0, selectedInvoice.currency || 'XAF')}
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Customer Information */}
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-300">Bill To</h3>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer Name</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedInvoice.customer?.name || 
                         (selectedInvoice.customer?.firstName && selectedInvoice.customer?.lastName
                           ? `${selectedInvoice.customer.firstName} ${selectedInvoice.customer.lastName}`
                           : selectedInvoice.customer?.firstName || 
                             selectedInvoice.customer?.lastName || 
                             selectedInvoice.customerName || 
                             'N/A')}
                      </div>
                    </div>
                    {selectedInvoice.customer?.email && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <Envelope className="w-3 h-3" />
                          Email
                        </div>
                        <div className="text-sm text-gray-900 break-all">{selectedInvoice.customer.email}</div>
                      </div>
                    )}
                    {selectedInvoice.customer?.phone && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</div>
                        <div className="text-sm text-gray-900">{selectedInvoice.customer.phone}</div>
                      </div>
                    )}
                    {selectedInvoice.customer?.address && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Address</div>
                        <div className="text-sm text-gray-900">{selectedInvoice.customer.address}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="bg-gray-50 p-4 border border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-300">Invoice Details</h3>
                  <div className="space-y-2">
                    {selectedInvoice.date && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Invoice Date</div>
                        <div className="text-sm text-gray-900">{formatDate(selectedInvoice.date)}</div>
                      </div>
                    )}
                    {selectedInvoice.due_date || selectedInvoice.dueDate ? (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Due Date</div>
                        <div className="text-sm text-gray-900">
                          {formatDate(selectedInvoice.due_date || selectedInvoice.dueDate)}
                        </div>
                      </div>
                    ) : null}
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Currency</div>
                      <div className="text-sm font-semibold text-gray-900">{selectedInvoice.currency || 'XAF'}</div>
                    </div>
                    {selectedInvoice.createdAt && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created At</div>
                        <div className="text-xs text-gray-600">{formatDate(selectedInvoice.createdAt)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              {selectedInvoice.line_items && selectedInvoice.line_items.length > 0 && (
                <div className="bg-white border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">Line Items</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Tax</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedInvoice.line_items.map((item: any, index: number) => {
                          const unitPrice = item.unitPrice || item.unit_price || 0;
                          const quantity = item.quantity || 0;
                          const taxRate = item.taxRate || item.tax_rate || 0;
                          const subtotal = unitPrice * quantity;
                          const taxAmount = (subtotal * taxRate) / 100;
                          const total = subtotal + taxAmount;
                          
                          return (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-2 text-xs font-medium text-gray-900">{item.description || 'Item'}</td>
                              <td className="px-3 py-2 text-xs text-right text-gray-600">{quantity}</td>
                              <td className="px-3 py-2 text-xs text-right text-gray-600">{formatCurrency(unitPrice, selectedInvoice.currency || 'XAF')}</td>
                              <td className="px-3 py-2 text-xs text-right text-gray-600">{taxRate > 0 ? `${taxRate}%` : '-'}</td>
                              <td className="px-3 py-2 text-xs font-semibold text-right text-gray-900">{formatCurrency(total, selectedInvoice.currency || 'XAF')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={4} className="px-3 py-2 text-right text-xs font-semibold text-gray-900">Total Amount</td>
                          <td className="px-3 py-2 text-right text-base font-bold text-green-600">
                            {formatCurrency(selectedInvoice.amount || 0, selectedInvoice.currency || 'XAF')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {selectedInvoice.notes && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                  <div className="text-xs font-semibold text-yellow-800 mb-1">Notes</div>
                  <p className="text-xs text-yellow-900">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-wrap">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditInvoice(selectedInvoice);
                }}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded flex items-center gap-1.5"
              >
                <PencilSimple className="w-3.5 h-3.5" />
                Edit
              </button>
              {selectedInvoice.status !== 'SENT' && selectedInvoice.status !== 'sent' && (
                <button
                  onClick={handleSendInvoice}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-gray-500 text-white text-sm font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center gap-1.5"
                >
                      {actionLoading ? (
                    <>
                      <Spinner className="w-3.5 h-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperPlaneTilt className="w-3.5 h-3.5" />
                      Send
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setStatusFormData({ status: (selectedInvoice.status || 'DRAFT').toUpperCase() as any });
                  setShowStatusModal(true);
                }}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded"
              >
                Status
              </button>
              <button
                onClick={() => handleDownloadInvoice(selectedInvoice)}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedInvoice(null);
                }}
                className="px-4 py-1.5 bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal - Right Slide */}
      {showEditModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-fade-in"
            onClick={() => {
              setShowEditModal(false);
              setSelectedInvoice(null);
            }}
          />
          {/* Modal Content */}
          <div className="relative bg-white h-full w-full max-w-2xl shadow-2xl slide-in-right overflow-y-auto">
            {/* Sticky Header with Gradient */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-4 flex items-center justify-between z-10 shadow-lg">
              <div className="flex items-center gap-2">
                <PencilSimple className="w-5 h-5" />
                <h1 className="text-xl font-bold">Edit Invoice</h1>
                {selectedInvoice.invoiceNumber && (
                  <span className="text-xs text-white/80 font-mono">#{selectedInvoice.invoiceNumber}</span>
                )}
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedInvoice(null);
                }}
                className="p-1.5 hover:bg-white/10  transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Form Content */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateInvoice();
              }}
              className="p-5 space-y-5"
            >
              {/* Success/Error Messages */}
              {actionError && (
                <div className="p-4 bg-red-50 border border-red-200  flex items-start gap-3">
                  <WarningCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-medium">{actionError}</p>
                  </div>
                  <button
                    onClick={() => setActionError(null)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {actionSuccess && (
                <div className="p-4 bg-green-50 border border-green-200  flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 font-semibold">Invoice updated successfully!</p>
                    <p className="text-xs text-green-700 mt-1">{actionSuccess}</p>
                  </div>
                </div>
              )}

              {/* Due Date Card */}
              <div className="p-4 bg-gray-50 border border-gray-200 ">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={editFormData.due_date}
                  onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              {/* Notes Card */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 ">
                <label className="block text-sm font-semibold text-yellow-900 mb-2">Notes</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-yellow-200 text-gray-900  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                  rows={4}
                  placeholder="Additional notes or terms..."
                />
                <p className="text-xs text-yellow-700 mt-2">Add any additional information or terms for this invoice.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-white text-green-700 font-medium hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2 text-sm shadow-sm border border-green-200"
                >
                  {actionLoading ? (
                    <>
                      <Spinner className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Update Invoice
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Update Invoice Status</h3>
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
                handleUpdateStatus();
              }}
              className="space-y-4"
            >
              {actionError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2">
                  <WarningCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{actionError}</span>
                </div>
              )}
              {actionSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{actionSuccess}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={statusFormData.status}
                  onChange={(e) => setStatusFormData({ status: e.target.value as any })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="CANCELLED">Cancelled</option>
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
