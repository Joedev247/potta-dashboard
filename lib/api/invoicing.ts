/**
 * Invoicing API Service
 * Base Path: /api/invoices
 * Authentication: Bearer Token + x-api-key
 * 
 * Endpoints:
 * - POST /api/invoices - Create invoice
 * - GET /api/invoices - List invoices
 * - GET /api/invoices/{id} - Get invoice by ID
 * - PUT /api/invoices/{id} - Update invoice
 * - PUT /api/invoices/{id}/send - Send invoice
 * - PUT /api/invoices/{id}/status - Update invoice status
 */

import { ApiResponse, PaginationResponse, apiClient } from './client';

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  customer_id?: string;
  organization_id?: string;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
  };
  amount?: number;
  currency?: string;
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | string;
  date?: string;
  dueDate?: string;
  due_date?: string;
  line_items?: Array<{
    productId?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    discountRate?: number;
  }>;
  notes?: string;
  payments?: any[];
  createdAt?: string;
  updatedAt?: string;
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
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  currency?: string;
}

export interface InvoicesListResponse {
  invoices: Invoice[];
  pagination: PaginationResponse;
}

export interface CreateInvoiceData {
  customer_id: string;
  organization_id?: string;
  line_items: Array<{
    productId?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    discountRate?: number;
  }>;
  due_date?: string;
  currency?: string;
  notes?: string;
}

class InvoicingService {
  /**
   * Create invoice
   * POST /api/invoices
   */
  async createInvoice(data: CreateInvoiceData): Promise<ApiResponse<Invoice>> {
    try {
      const response = await apiClient.post<any>('/invoices', data);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<Invoice>;
      }

      // Handle different response structures
      const raw = response.data.data || response.data;
      
      const invoice: Invoice = {
        id: raw.id || '',
        invoiceNumber: raw.invoiceNumber || raw.invoice_number || undefined,
        customer_id: raw.customer_id || raw.customerId || undefined,
        organization_id: raw.organization_id || raw.organizationId || undefined,
        customer: raw.customer || undefined,
        amount: raw.amount ?? 0,
        currency: raw.currency || data.currency || 'XAF',
        status: raw.status || 'DRAFT',
        date: raw.date || raw.createdAt || raw.created_at,
        dueDate: raw.dueDate || raw.due_date,
        due_date: raw.due_date || raw.dueDate,
        line_items: raw.line_items || raw.lineItems || [],
        notes: raw.notes || undefined,
        payments: raw.payments || undefined,
        createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
        updatedAt: raw.updatedAt || raw.updated_at,
      };

      return {
        success: true,
        data: invoice,
      };
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      return {
        success: false,
        error: {
          code: 'INVOICE_CREATE_ERROR',
          message: error?.message || 'Failed to create invoice',
        },
      };
    }
  }

  /**
   * List invoices
   * GET /api/invoices
   */
  async getInvoices(params?: { 
    page?: number; 
    limit?: number; 
    organization_id?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<Invoice[]>> {
    try {
      const response = await apiClient.get<any>('/invoices', params);
      
      if (!response.success || !response.data) {
        return { ...response, data: [] };
      }

      // Handle different response structures
      const data = response.data.data || response.data;
      const invoices = Array.isArray(data.invoices) 
        ? data.invoices 
        : (Array.isArray(data) ? data : []);

      // Normalize invoice data
      const normalizedInvoices: Invoice[] = invoices.map((invoice: any) => ({
        id: invoice.id || '',
        invoiceNumber: invoice.invoiceNumber || invoice.invoice_number || undefined,
        customer_id: invoice.customer_id || invoice.customerId || undefined,
        organization_id: invoice.organization_id || invoice.organizationId || undefined,
        customer: invoice.customer || undefined,
        amount: invoice.amount ?? 0,
        currency: invoice.currency || 'XAF',
        status: invoice.status || 'DRAFT',
        date: invoice.date || invoice.createdAt || invoice.created_at,
        dueDate: invoice.dueDate || invoice.due_date,
        due_date: invoice.due_date || invoice.dueDate,
        line_items: invoice.line_items || invoice.lineItems || [],
        notes: invoice.notes || undefined,
        payments: invoice.payments || undefined,
        createdAt: invoice.createdAt || invoice.created_at,
        updatedAt: invoice.updatedAt || invoice.updated_at,
      }));
    
      return {
        success: true,
        data: normalizedInvoices,
      };
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      return {
        success: false,
        error: {
          code: 'INVOICES_LIST_ERROR',
          message: error?.message || 'Failed to load invoices',
        },
        data: [],
      };
    }
  }

  /**
   * Get invoice by ID
   * GET /api/invoices/{id}
   */
  async getInvoice(invoiceId: string): Promise<ApiResponse<Invoice>> {
    try {
      const response = await apiClient.get<any>(`/invoices/${invoiceId}`);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<Invoice>;
      }

      // Handle different response structures
      const raw = response.data.data || response.data;
      
      const invoice: Invoice = {
        id: raw.id || invoiceId,
        invoiceNumber: raw.invoiceNumber || raw.invoice_number || undefined,
        customer_id: raw.customer_id || raw.customerId || undefined,
        organization_id: raw.organization_id || raw.organizationId || undefined,
        customer: raw.customer || undefined,
        amount: raw.amount ?? 0,
        currency: raw.currency || 'XAF',
        status: raw.status || 'DRAFT',
        date: raw.date || raw.createdAt || raw.created_at,
        dueDate: raw.dueDate || raw.due_date,
        due_date: raw.due_date || raw.dueDate,
        line_items: raw.line_items || raw.lineItems || [],
        notes: raw.notes || undefined,
        payments: raw.payments || undefined,
        createdAt: raw.createdAt || raw.created_at,
        updatedAt: raw.updatedAt || raw.updated_at,
      };

      return {
        success: true,
        data: invoice,
      };
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      return {
        success: false,
        error: {
          code: 'INVOICE_FETCH_ERROR',
          message: error?.message || 'Failed to fetch invoice',
        },
      };
    }
  }

  /**
   * Send invoice
   * PUT /api/invoices/{id}/send
   */
  async sendInvoice(invoiceId: string): Promise<ApiResponse<Invoice>> {
    try {
      const response = await apiClient.put<any>(`/invoices/${invoiceId}/send`, {});
      
      if (!response.success) {
        return response as ApiResponse<Invoice>;
      }

      // If response includes updated invoice data, normalize it
      if (response.data) {
        const raw = response.data.data || response.data;
        const invoice: Invoice = {
          id: raw.id || invoiceId,
          invoiceNumber: raw.invoiceNumber || raw.invoice_number || undefined,
          customer_id: raw.customer_id || raw.customerId || undefined,
          organization_id: raw.organization_id || raw.organizationId || undefined,
          customer: raw.customer || undefined,
          amount: raw.amount ?? 0,
          currency: raw.currency || 'XAF',
          status: 'SENT',
          date: raw.date || raw.createdAt || raw.created_at,
          dueDate: raw.dueDate || raw.due_date,
          due_date: raw.due_date || raw.dueDate,
          line_items: raw.line_items || raw.lineItems || [],
          notes: raw.notes || undefined,
          payments: raw.payments || undefined,
          createdAt: raw.createdAt || raw.created_at,
          updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
        };

        return {
          success: true,
          data: invoice,
        };
      }

      return {
        success: true,
        data: {} as Invoice, // Will be handled by UI refreshing the list
      };
    } catch (error: any) {
      console.error('Error sending invoice:', error);
      return {
        success: false,
        error: {
          code: 'INVOICE_SEND_ERROR',
          message: error?.message || 'Failed to send invoice',
        },
      };
    }
  }

  async downloadInvoice(invoiceId: string): Promise<ApiResponse<Blob>> {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://payments.dev.instanvi.com';
      const apiVersion = '/api';
      const url = `${base}${apiVersion}/invoices/${invoiceId}/download`;

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const text = await res.text();
        return { success: false, error: { code: `HTTP_${res.status}`, message: text || 'Download failed' } };
      }

      const blob = await res.blob();
      return { success: true, data: blob };
    } catch (error: any) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: error?.message || 'Network error' } };
    }
  }

  async getRecurringInvoices(): Promise<ApiResponse<RecurringInvoice[]>> {
    const response = await apiClient.get<any>('/invoices/recurring');
    if (!response.success || !response.data) {
      return { ...response, data: [] };
    }

    // Handle both array response and object with recurring property
    const recurring = Array.isArray(response.data) 
      ? response.data 
      : (response.data.recurring || []);
    
    return {
      success: true,
      data: recurring,
    };
  }

  async createCreditNote(invoiceId: string, data: { amount: number; reason: string; items: any[] }): Promise<ApiResponse<CreditNote>> {
    return apiClient.post<CreditNote>(`/invoices/${invoiceId}/credit-notes`, data);
  }

  async getCreditNotes(): Promise<ApiResponse<CreditNote[]>> {
    return apiClient.get<CreditNote[]>('/invoices/credit-notes');
  }

  async getCustomers(params?: any): Promise<ApiResponse<{ customers: Customer[] }>> {
    return apiClient.get<{ customers: Customer[] }>('/customers', params);
  }

  async createCustomer(data: { firstName?: string; lastName?: string; email: string; phone?: string }): Promise<ApiResponse<Customer>> {
    return apiClient.post<Customer>('/customers', data);
  }

  async getCustomer(customerId: string): Promise<ApiResponse<Customer>> {
    return apiClient.get<Customer>(`/customers/${customerId}`);
  }

  /**
   * Update invoice (modify line items, due date, notes)
   * PUT /api/invoices/{id}
   */
  async updateInvoice(invoiceId: string, data: { line_items?: any[]; due_date?: string; notes?: string }): Promise<ApiResponse<Invoice>> {
    try {
      const response = await apiClient.put<any>(`/invoices/${invoiceId}`, data);
      
      if (!response.success) {
        return response as ApiResponse<Invoice>;
      }

      // If response includes updated invoice data, normalize it
      if (response.data) {
        const raw = response.data.data || response.data;
        const invoice: Invoice = {
          id: raw.id || invoiceId,
          invoiceNumber: raw.invoiceNumber || raw.invoice_number || undefined,
          customer_id: raw.customer_id || raw.customerId || undefined,
          organization_id: raw.organization_id || raw.organizationId || undefined,
          customer: raw.customer || undefined,
          amount: raw.amount ?? 0,
          currency: raw.currency || 'XAF',
          status: raw.status || 'DRAFT',
          date: raw.date || raw.createdAt || raw.created_at,
          dueDate: raw.dueDate || raw.due_date || data.due_date,
          due_date: raw.due_date || raw.dueDate || data.due_date,
          line_items: raw.line_items || raw.lineItems || data.line_items || [],
          notes: raw.notes !== undefined ? raw.notes : data.notes,
          payments: raw.payments || undefined,
          createdAt: raw.createdAt || raw.created_at,
          updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
        };

        return {
          success: true,
          data: invoice,
        };
      }

      return {
        success: true,
        data: {} as Invoice, // Will be handled by UI refreshing the list
      };
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      return {
        success: false,
        error: {
          code: 'INVOICE_UPDATE_ERROR',
          message: error?.message || 'Failed to update invoice',
        },
      };
    }
  }

  /**
   * Update invoice status
   * PUT /api/invoices/{id}/status
   */
  async updateInvoiceStatus(invoiceId: string, data: { status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' }): Promise<ApiResponse<Invoice>> {
    try {
      const response = await apiClient.put<any>(`/invoices/${invoiceId}/status`, data);
      
      if (!response.success) {
        return response as ApiResponse<Invoice>;
      }

      // If response includes updated invoice data, normalize it
      if (response.data) {
        const raw = response.data.data || response.data;
        const invoice: Invoice = {
          id: raw.id || invoiceId,
          invoiceNumber: raw.invoiceNumber || raw.invoice_number || undefined,
          customer_id: raw.customer_id || raw.customerId || undefined,
          organization_id: raw.organization_id || raw.organizationId || undefined,
          customer: raw.customer || undefined,
          amount: raw.amount ?? 0,
          currency: raw.currency || 'XAF',
          status: data.status,
          date: raw.date || raw.createdAt || raw.created_at,
          dueDate: raw.dueDate || raw.due_date,
          due_date: raw.due_date || raw.dueDate,
          line_items: raw.line_items || raw.lineItems || [],
          notes: raw.notes || undefined,
          payments: raw.payments || undefined,
          createdAt: raw.createdAt || raw.created_at,
          updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
        };

        return {
          success: true,
          data: invoice,
        };
      }

      return {
        success: true,
        data: {} as Invoice, // Will be handled by UI refreshing the list
      };
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      return {
        success: false,
        error: {
          code: 'INVOICE_STATUS_UPDATE_ERROR',
          message: error?.message || 'Failed to update invoice status',
        },
      };
    }
  }

  async getProducts(): Promise<ApiResponse<{ products: Product[] }>> {
    return apiClient.get<{ products: Product[] }>('/products');
  }
  
  async createProduct(data: { name: string; description?: string; price: number; currency: string; vatRate?: number }): Promise<ApiResponse<Product>> {
    return apiClient.post<Product>('/products', data);
  }
}

export const invoicingService = new InvoicingService();


