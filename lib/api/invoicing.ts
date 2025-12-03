/**
 * Invoicing API Service
 */

import { apiClient, ApiResponse, PaginationResponse } from './client';

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

class InvoicingService {
  async createInvoice(data: CreateInvoiceData): Promise<ApiResponse<Invoice>> {
    return apiClient.post<Invoice>('/invoices', data);
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
    return apiClient.get<InvoicesListResponse>('/invoices', params);
  }

  async getInvoice(invoiceId: string): Promise<ApiResponse<Invoice>> {
    return apiClient.get<Invoice>(`/invoices/${invoiceId}`);
  }

  async sendInvoice(invoiceId: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>(`/invoices/${invoiceId}/send`);
  }

  async downloadInvoice(invoiceId: string): Promise<ApiResponse<Blob>> {
    return apiClient.get<Blob>(`/invoices/${invoiceId}/download`);
  }

  async createRecurringInvoice(data: {
    customerId: string;
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    startDate: string;
    endDate?: string;
    items: any[];
    memo?: string;
  }): Promise<ApiResponse<RecurringInvoice>> {
    return apiClient.post<RecurringInvoice>('/invoices/recurring', data);
  }

  async getRecurringInvoices(): Promise<ApiResponse<RecurringInvoice[]>> {
    return apiClient.get<RecurringInvoice[]>('/invoices/recurring');
  }

  async createCreditNote(invoiceId: string, data: {
    amount: number;
    reason: string;
    items: any[];
  }): Promise<ApiResponse<CreditNote>> {
    return apiClient.post<CreditNote>(`/invoices/${invoiceId}/credit-notes`, data);
  }

  async getCreditNotes(): Promise<ApiResponse<CreditNote[]>> {
    return apiClient.get<CreditNote[]>('/invoices/credit-notes');
  }

  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<{ customers: Customer[]; pagination: PaginationResponse }>> {
    return apiClient.get<{ customers: Customer[]; pagination: PaginationResponse }>('/customers', params);
  }

  async createCustomer(data: {
    name: string;
    email: string;
    phone?: string;
    address?: any;
    taxId?: string;
  }): Promise<ApiResponse<Customer>> {
    return apiClient.post<Customer>('/customers', data);
  }

  async getCustomer(customerId: string): Promise<ApiResponse<Customer>> {
    return apiClient.get<Customer>(`/customers/${customerId}`);
  }

  async getProducts(): Promise<ApiResponse<{ products: Product[] }>> {
    return apiClient.get<{ products: Product[] }>('/products');
  }

  async createProduct(data: {
    name: string;
    description?: string;
    price: number;
    currency: string;
    vatRate: number;
  }): Promise<ApiResponse<Product>> {
    return apiClient.post<Product>('/products', data);
  }
}

export const invoicingService = new InvoicingService();

