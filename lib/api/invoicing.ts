/**
 * Invoicing API Service
 * MOCK MODE: Using localStorage for invoicing data (no backend required)
 */

import { ApiResponse, PaginationResponse } from './client';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  date: string;
  dueDate: string;
}

export interface RecurringInvoice {
  id: string;
  customerId: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  items: any[];
  memo?: string;
}

export interface CreditNote {
  id: string;
  invoiceId: string;
  amount: number;
  reason: string;
  items: any[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalInvoices?: number;
  totalAmount?: number;
  currency?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  usedIn?: number;
  createdAt: string;
}

export interface InvoicesListResponse {
  invoices: Invoice[];
  pagination: PaginationResponse;
}

export interface CreateInvoiceData {
  type: 'one-off' | 'recurring';
  profileId?: string;
  customerId: string;
  paymentTerm?: string;
  memo?: string;
  items: Array<{
    productId?: string;
    name: string;
    quantity: number;
    price: number;
    vatRate: number;
  }>;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  } | null;
  vatDisplay: 'including' | 'excluding';
}

// Storage keys
const MOCK_INVOICES_KEY = 'mock_invoices';
const MOCK_CUSTOMERS_KEY = 'mock_customers';
const MOCK_PRODUCTS_KEY = 'mock_products';

// Helper functions
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to ${key}:`, error);
  }
}

// Initialize mock invoices data
function initializeMockInvoices() {
  if (typeof window === 'undefined') return;
  
  // Check if data already exists
  if (localStorage.getItem(MOCK_INVOICES_KEY)) return;
  
  const now = new Date();
  const customers = [
    { id: 'cust_1', name: 'Tech Solutions Ltd', email: 'contact@techsolutions.cm' },
    { id: 'cust_2', name: 'Digital Marketing Agency', email: 'info@digitalmarketing.cm' },
    { id: 'cust_3', name: 'E-commerce Store', email: 'billing@ecommerce.cm' },
    { id: 'cust_4', name: 'Consulting Services', email: 'admin@consulting.cm' },
    { id: 'cust_5', name: 'Software Development Co', email: 'finance@softwaredev.cm' },
    { id: 'cust_6', name: 'Marketing Pro', email: 'hello@marketingpro.cm' },
    { id: 'cust_7', name: 'Business Solutions', email: 'contact@businesssolutions.cm' },
    { id: 'cust_8', name: 'Creative Agency', email: 'info@creativeagency.cm' },
  ];
  
  const statuses: Invoice['status'][] = ['draft', 'sent', 'paid', 'overdue'];
  const invoices: Invoice[] = [];
  
  // Generate invoices for the last 4 months
  for (let i = 0; i < 20; i++) {
    const monthsAgo = Math.floor(i / 5); // 5 invoices per month
    const invoiceDate = new Date(now);
    invoiceDate.setMonth(invoiceDate.getMonth() - monthsAgo);
    invoiceDate.setDate(Math.floor(Math.random() * 28) + 1);
    
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = Math.floor(Math.random() * 1000000) + 50000; // 50,000 - 1,000,000 XAF
    
    // Calculate due date (typically 30 days after invoice date)
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);
    
    // Generate invoice number (e.g., INV-2024-001)
    const year = invoiceDate.getFullYear();
    const invoiceNumber = `INV-${year}-${String(i + 1).padStart(3, '0')}`;
    
    const invoice: Invoice = {
      id: generateId('inv'),
      invoiceNumber,
      customer,
      amount,
      currency: 'XAF',
      status,
      date: invoiceDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
    };
    
    invoices.push(invoice);
  }
  
  // Sort by date (newest first)
  invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  saveStorage(MOCK_INVOICES_KEY, invoices);
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeMockInvoices();
}

// Helper for pagination
function paginate<T>(items: T[], page: number = 1, limit: number = 20): { items: T[]; pagination: PaginationResponse } {
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedItems = items.slice(start, end);
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  
  return {
    items: paginatedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Helper to filter invoices
function filterInvoices(invoices: Invoice[], params?: {
  status?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}): Invoice[] {
  let filtered = [...invoices];
  
  if (params?.status) {
    filtered = filtered.filter(i => i.status === params.status);
  }
  
  if (params?.customerId) {
    filtered = filtered.filter(i => i.customer.id === params.customerId);
  }
  
  if (params?.startDate) {
    const start = new Date(params.startDate);
    filtered = filtered.filter(i => new Date(i.date) >= start);
  }
  
  if (params?.endDate) {
    const end = new Date(params.endDate);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter(i => new Date(i.date) <= end);
  }
  
  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(i =>
      i.invoiceNumber.toLowerCase().includes(search) ||
      i.customer.name.toLowerCase().includes(search) ||
      i.customer.email.toLowerCase().includes(search) ||
      i.id.toLowerCase().includes(search)
    );
  }
  
  return filtered;
}

class InvoicingService {
  async createInvoice(data: CreateInvoiceData): Promise<ApiResponse<Invoice>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    // Get customer
    const customers = getStorage<Customer>(MOCK_CUSTOMERS_KEY);
    const customer = customers.find(c => c.id === data.customerId);
    
    if (!customer) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Customer not found' },
      };
    }
    
    // Calculate total amount
    const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discountAmount = 0;
    
    if (data.discount) {
      if (data.discount.type === 'percentage') {
        discountAmount = (subtotal * data.discount.value) / 100;
      } else {
        discountAmount = data.discount.value;
      }
    }
    
    const totalAfterDiscount = subtotal - discountAmount;
    const vatAmount = data.items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      return sum + (itemTotal * item.vatRate / 100);
    }, 0);
    
    const totalAmount = data.vatDisplay === 'including' ? totalAfterDiscount : totalAfterDiscount + vatAmount;
    
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + (data.paymentTerm ? parseInt(data.paymentTerm) : 30));
    
    // Generate invoice number
    const year = now.getFullYear();
    const invoices = getStorage<Invoice>(MOCK_INVOICES_KEY);
    const invoiceNumber = `INV-${year}-${String(invoices.length + 1).padStart(3, '0')}`;
    
    const invoice: Invoice = {
      id: generateId('inv'),
      invoiceNumber,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
      amount: Math.round(totalAmount),
      currency: 'XAF',
      status: 'draft',
      date: now.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
    };
    
    invoices.unshift(invoice);
    saveStorage(MOCK_INVOICES_KEY, invoices);
    
    return { success: true, data: invoice };
  }

  async getInvoices(params?: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<ApiResponse<InvoicesListResponse>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (typeof window === 'undefined') {
      return {
        success: true,
        data: { invoices: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      };
    }
    
    let invoices = getStorage<Invoice>(MOCK_INVOICES_KEY);
    invoices = filterInvoices(invoices, params);
    
    const { items, pagination } = paginate(invoices, params?.page || 1, params?.limit || 20);
    
    return {
      success: true,
      data: {
        invoices: items,
        pagination,
      },
    };
  }

  async getInvoice(invoiceId: string): Promise<ApiResponse<Invoice>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' },
      };
    }
    
    const invoices = getStorage<Invoice>(MOCK_INVOICES_KEY);
    const invoice = invoices.find(i => i.id === invoiceId);
    
    if (!invoice) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' },
      };
    }
    
    return { success: true, data: invoice };
  }

  async sendInvoice(invoiceId: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return { success: true };
    }
    
    const invoices = getStorage<Invoice>(MOCK_INVOICES_KEY);
    const invoice = invoices.find(i => i.id === invoiceId);
    
    if (invoice && invoice.status === 'draft') {
      invoice.status = 'sent';
      saveStorage(MOCK_INVOICES_KEY, invoices);
    }
    
    console.log(`[MOCK] Invoice ${invoiceId} sent`);
    
    return { success: true };
  }

  async downloadInvoice(invoiceId: string): Promise<ApiResponse<Blob>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const invoices = getStorage<Invoice>(MOCK_INVOICES_KEY);
    const invoice = invoices.find(i => i.id === invoiceId);
    
    if (!invoice) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice not found' },
      };
    }
    
    // Mock PDF blob
    const content = `Invoice: ${invoice.invoiceNumber}\nCustomer: ${invoice.customer.name}\nAmount: ${invoice.amount} ${invoice.currency}\nDate: ${invoice.date}\n\n[MOCK] This is a mock PDF. In production, this would be a real PDF file.`;
    const blob = new Blob([content], { type: 'application/pdf' });
    
    return { success: true, data: blob };
  }

  async createRecurringInvoice(data: {
    customerId: string;
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    startDate: string;
    endDate?: string;
    items: any[];
    memo?: string;
  }): Promise<ApiResponse<RecurringInvoice>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const recurringInvoice: RecurringInvoice = {
      id: generateId('rec'),
      customerId: data.customerId,
      frequency: data.frequency,
      startDate: data.startDate,
      endDate: data.endDate,
      items: data.items,
      memo: data.memo,
    };
    
    console.log(`[MOCK] Recurring invoice created:`, recurringInvoice);
    
    return { success: true, data: recurringInvoice };
  }

  async getRecurringInvoices(): Promise<ApiResponse<RecurringInvoice[]>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return { success: true, data: [] };
    }
    
    // Mock recurring invoices
    return { success: true, data: [] };
  }

  async createCreditNote(invoiceId: string, data: {
    amount: number;
    reason: string;
    items: any[];
  }): Promise<ApiResponse<CreditNote>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const creditNote: CreditNote = {
      id: generateId('cn'),
      invoiceId,
      amount: data.amount,
      reason: data.reason,
      items: data.items,
    };
    
    console.log(`[MOCK] Credit note created:`, creditNote);
    
    return { success: true, data: creditNote };
  }

  async getCreditNotes(): Promise<ApiResponse<CreditNote[]>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return { success: true, data: [] };
    }
    
    // Mock credit notes
    return { success: true, data: [] };
  }

  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<{ customers: Customer[]; pagination: PaginationResponse }>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return {
        success: true,
        data: {
          customers: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        },
      };
    }
    
    let customers = getStorage<Customer>(MOCK_CUSTOMERS_KEY);
    
    // Initialize default customers if empty
    if (customers.length === 0) {
      customers = [
        { id: 'cust_1', name: 'Tech Solutions Ltd', email: 'contact@techsolutions.cm', phone: '+237 6 12 34 56 78', totalInvoices: 5, totalAmount: 2500000, currency: 'XAF' },
        { id: 'cust_2', name: 'Digital Marketing Agency', email: 'info@digitalmarketing.cm', phone: '+237 6 23 45 67 89', totalInvoices: 3, totalAmount: 1800000, currency: 'XAF' },
        { id: 'cust_3', name: 'E-commerce Store', email: 'billing@ecommerce.cm', phone: '+237 6 34 56 78 90', totalInvoices: 8, totalAmount: 4200000, currency: 'XAF' },
        { id: 'cust_4', name: 'Consulting Services', email: 'admin@consulting.cm', phone: '+237 6 45 67 89 01', totalInvoices: 2, totalAmount: 1200000, currency: 'XAF' },
        { id: 'cust_5', name: 'Software Development Co', email: 'finance@softwaredev.cm', phone: '+237 6 56 78 90 12', totalInvoices: 6, totalAmount: 3500000, currency: 'XAF' },
        { id: 'cust_6', name: 'Marketing Pro', email: 'hello@marketingpro.cm', phone: '+237 6 67 89 01 23', totalInvoices: 4, totalAmount: 2100000, currency: 'XAF' },
        { id: 'cust_7', name: 'Business Solutions', email: 'contact@businesssolutions.cm', phone: '+237 6 78 90 12 34', totalInvoices: 3, totalAmount: 1500000, currency: 'XAF' },
        { id: 'cust_8', name: 'Creative Agency', email: 'info@creativeagency.cm', phone: '+237 6 89 01 23 45', totalInvoices: 5, totalAmount: 2800000, currency: 'XAF' },
      ];
      saveStorage(MOCK_CUSTOMERS_KEY, customers);
    }
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      customers = customers.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.phone?.toLowerCase().includes(search)
      );
    }
    
    const { items, pagination } = paginate(customers, params?.page || 1, params?.limit || 20);
    
    return {
      success: true,
      data: {
        customers: items,
        pagination,
      },
    };
  }

  async createCustomer(data: {
    name: string;
    email: string;
    phone?: string;
    address?: any;
    taxId?: string;
  }): Promise<ApiResponse<Customer>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const customer: Customer = {
      id: generateId('cust'),
      name: data.name,
      email: data.email,
      phone: data.phone,
      totalInvoices: 0,
      totalAmount: 0,
      currency: 'XAF',
    };
    
    const customers = getStorage<Customer>(MOCK_CUSTOMERS_KEY);
    customers.push(customer);
    saveStorage(MOCK_CUSTOMERS_KEY, customers);
    
    return { success: true, data: customer };
  }

  async getCustomer(customerId: string): Promise<ApiResponse<Customer>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Customer not found' },
      };
    }
    
    const customers = getStorage<Customer>(MOCK_CUSTOMERS_KEY);
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Customer not found' },
      };
    }
    
    return { success: true, data: customer };
  }

  async getProducts(): Promise<ApiResponse<{ products: Product[] }>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return { success: true, data: { products: [] } };
    }
    
    let products = getStorage<Product>(MOCK_PRODUCTS_KEY);
    
    // Initialize default products if empty
    if (products.length === 0) {
      const now = new Date();
      products = [
        { id: 'prod_1', name: 'Web Development Service', price: 500000, currency: 'XAF', usedIn: 5, createdAt: now.toISOString() },
        { id: 'prod_2', name: 'Mobile App Development', price: 800000, currency: 'XAF', usedIn: 3, createdAt: now.toISOString() },
        { id: 'prod_3', name: 'SEO Optimization', price: 200000, currency: 'XAF', usedIn: 8, createdAt: now.toISOString() },
        { id: 'prod_4', name: 'Graphic Design', price: 150000, currency: 'XAF', usedIn: 12, createdAt: now.toISOString() },
        { id: 'prod_5', name: 'Content Writing', price: 100000, currency: 'XAF', usedIn: 15, createdAt: now.toISOString() },
        { id: 'prod_6', name: 'Consulting Hours', price: 50000, currency: 'XAF', usedIn: 20, createdAt: now.toISOString() },
        { id: 'prod_7', name: 'Hosting Service', price: 30000, currency: 'XAF', usedIn: 25, createdAt: now.toISOString() },
        { id: 'prod_8', name: 'Domain Registration', price: 15000, currency: 'XAF', usedIn: 30, createdAt: now.toISOString() },
      ];
      saveStorage(MOCK_PRODUCTS_KEY, products);
    }
    
    return { success: true, data: { products } };
  }

  async createProduct(data: {
    name: string;
    description?: string;
    price: number;
    currency: string;
    vatRate: number;
  }): Promise<ApiResponse<Product>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const product: Product = {
      id: generateId('prod'),
      name: data.name,
      price: data.price,
      currency: data.currency,
      usedIn: 0,
      createdAt: new Date().toISOString(),
    };
    
    const products = getStorage<Product>(MOCK_PRODUCTS_KEY);
    products.push(product);
    saveStorage(MOCK_PRODUCTS_KEY, products);
    
    return { success: true, data: product };
  }
}

export const invoicingService = new InvoicingService();


