/**
 * Payments API Service
 * MOCK MODE: Using localStorage for payment data (no backend required)
 */

import { ApiResponse, PaginationResponse } from './client';

export interface Payment {
  id: string;
  paymentLinkId?: string;
  amount: number;
  currency: string;
  description?: string;
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';
  paymentMethod?: string;
  customer?: {
    name?: string;
    email?: string;
  };
  createdAt: string;
  paidAt?: string | null;
}

export interface PaymentLink {
  paymentLinkId: string;
  url: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface CreatePaymentLinkData {
  type: 'Fixed' | 'Subscription' | 'Donation';
  amount: number;
  currency: 'XAF' | 'USD';
  description?: string;
  expiryDate?: string | null;
  redirectUrl?: string | null;
  reusable?: boolean;
  paymentMethods: string[];
  saveUrl?: boolean;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description?: string;
  reason?: string;
  createdAt: string;
}

export interface Chargeback {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'open' | 'won' | 'lost';
  reason?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  status: string;
  createdAt: string;
}

export interface PaymentsListResponse {
  payments: Payment[];
  pagination: PaginationResponse;
}

export interface RefundsListResponse {
  refunds: Refund[];
  pagination: PaginationResponse;
}

export interface ChargebacksListResponse {
  chargebacks: Chargeback[];
  pagination: PaginationResponse;
}

export interface OrdersListResponse {
  orders: Order[];
  pagination: PaginationResponse;
  summary?: {
    totalOrders: number;
    paid: number;
    pending: number;
    totalRevenue: number;
  };
}

// Storage keys
const MOCK_PAYMENTS_KEY = 'mock_payments';
const MOCK_PAYMENT_LINKS_KEY = 'mock_payment_links';
const MOCK_REFUNDS_KEY = 'mock_refunds';
const MOCK_CHARGEBACKS_KEY = 'mock_chargebacks';
const MOCK_ORDERS_KEY = 'mock_orders';

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

// Initialize mock data
function initializeMockData() {
  if (typeof window === 'undefined') return;
  
  // Check if data already exists
  if (localStorage.getItem(MOCK_PAYMENTS_KEY)) return;
  
  const now = new Date();
  const customers = [
    { name: 'Jean Paul', email: 'jean.paul@example.com' },
    { name: 'Marie Claire', email: 'marie.claire@example.com' },
    { name: 'Pierre Nkono', email: 'pierre.nkono@example.com' },
    { name: 'Sophie Mbarga', email: 'sophie.mbarga@example.com' },
    { name: 'David Tchoua', email: 'david.tchoua@example.com' },
    { name: 'Amélie Fokou', email: 'amelie.fokou@example.com' },
    { name: 'Marc Essomba', email: 'marc.essomba@example.com' },
    { name: 'Lucie Ngo', email: 'lucie.ngo@example.com' },
  ];
  
  const paymentMethods = ['MTN Mobile Money', 'Orange Money'];
  const statuses: Payment['status'][] = ['paid', 'pending', 'failed', 'expired', 'cancelled'];
  
  // Generate payments
  const payments: Payment[] = [];
  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = Math.floor(Math.random() * 500000) + 1000; // 1,000 - 500,000 XAF
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    const payment: Payment = {
      id: generateId('pay'),
      paymentLinkId: Math.random() > 0.5 ? generateId('link') : undefined,
      amount,
      currency: 'XAF',
      description: [
        'Product purchase',
        'Service payment',
        'Subscription fee',
        'Invoice payment',
        'Donation',
        'Course enrollment',
        'Consultation fee',
        'Event ticket',
      ][Math.floor(Math.random() * 8)],
      status,
      paymentMethod,
      customer,
      createdAt: createdAt.toISOString(),
      paidAt: status === 'paid' ? new Date(createdAt.getTime() + Math.random() * 3600000).toISOString() : null,
    };
    
    payments.push(payment);
  }
  
  // Sort by date (newest first)
  payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  saveStorage(MOCK_PAYMENTS_KEY, payments);
  
  // Generate refunds
  const refunds: Refund[] = [];
  const paidPayments = payments.filter(p => p.status === 'paid');
  for (let i = 0; i < 8; i++) {
    const payment = paidPayments[Math.floor(Math.random() * paidPayments.length)];
    if (!payment) continue;
    
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    const refundStatuses: Refund['status'][] = ['completed', 'processing', 'pending', 'failed'];
    const status = refundStatuses[Math.floor(Math.random() * refundStatuses.length)];
    const amount = Math.floor(payment.amount * (0.3 + Math.random() * 0.7)); // 30-100% of payment
    
    const refund: Refund = {
      id: generateId('ref'),
      paymentId: payment.id,
      amount,
      currency: payment.currency,
      status,
      description: 'Customer requested refund',
      reason: [
        'Product not as described',
        'Customer changed mind',
        'Duplicate payment',
        'Service not delivered',
        'Quality issue',
      ][Math.floor(Math.random() * 5)],
      createdAt: createdAt.toISOString(),
    };
    
    refunds.push(refund);
  }
  
  refunds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  saveStorage(MOCK_REFUNDS_KEY, refunds);
  
  // Generate chargebacks
  const chargebacks: Chargeback[] = [];
  for (let i = 0; i < 5; i++) {
    const payment = paidPayments[Math.floor(Math.random() * paidPayments.length)];
    if (!payment) continue;
    
    const daysAgo = Math.floor(Math.random() * 60);
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    const chargebackStatuses: Chargeback['status'][] = ['open', 'won', 'lost'];
    const status = chargebackStatuses[Math.floor(Math.random() * chargebackStatuses.length)];
    
    const chargeback: Chargeback = {
      id: generateId('chb'),
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status,
      reason: [
        'Unauthorized transaction',
        'Product not received',
        'Duplicate charge',
        'Fraudulent transaction',
        'Service not as described',
      ][Math.floor(Math.random() * 5)],
      createdAt: createdAt.toISOString(),
    };
    
    chargebacks.push(chargeback);
  }
  
  chargebacks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  saveStorage(MOCK_CHARGEBACKS_KEY, chargebacks);
  
  // Generate orders
  const orders: Order[] = [];
  const orderStatuses = ['pending', 'paid', 'shipped', 'cancelled', 'completed'];
  const products = [
    { name: 'Wireless Headphones', price: 25000 },
    { name: 'Smartphone Case', price: 5000 },
    { name: 'USB Cable', price: 3000 },
    { name: 'Power Bank', price: 15000 },
    { name: 'Screen Protector', price: 3500 },
    { name: 'Laptop Stand', price: 12000 },
    { name: 'Mouse Pad', price: 2500 },
    { name: 'Keyboard', price: 18000 },
  ];
  
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let totalAmount = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      items.push({
        name: product.name,
        quantity,
        price: product.price,
      });
      totalAmount += product.price * quantity;
    }
    
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    
    const order: Order = {
      id: generateId('ord'),
      customer: {
        id: `cust_${customer.email.split('@')[0]}`,
        name: customer.name,
        email: customer.email,
      },
      amount: totalAmount,
      currency: 'XAF',
      items,
      status,
      createdAt: createdAt.toISOString(),
    };
    
    orders.push(order);
  }
  
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  saveStorage(MOCK_ORDERS_KEY, orders);
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeMockData();
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

// Helper for filtering
function filterPayments(payments: Payment[], params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  amountMin?: number;
  amountMax?: number;
}): Payment[] {
  let filtered = [...payments];
  
  if (params?.status) {
    filtered = filtered.filter(p => p.status === params.status);
  }
  
  if (params?.startDate) {
    const start = new Date(params.startDate);
    filtered = filtered.filter(p => new Date(p.createdAt) >= start);
  }
  
  if (params?.endDate) {
    const end = new Date(params.endDate);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter(p => new Date(p.createdAt) <= end);
  }
  
  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(p =>
      p.id.toLowerCase().includes(search) ||
      p.description?.toLowerCase().includes(search) ||
      p.customer?.name?.toLowerCase().includes(search) ||
      p.customer?.email?.toLowerCase().includes(search)
    );
  }
  
  if (params?.amountMin !== undefined) {
    filtered = filtered.filter(p => p.amount >= params.amountMin!);
  }
  
  if (params?.amountMax !== undefined) {
    filtered = filtered.filter(p => p.amount <= params.amountMax!);
  }
  
  return filtered;
}

class PaymentsService {
  async createPaymentLink(data: CreatePaymentLinkData): Promise<ApiResponse<PaymentLink>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const linkId = generateId('link');
    const link: PaymentLink = {
      paymentLinkId: linkId,
      url: `${window.location.origin}/pay/${linkId}`,
      amount: data.amount,
      currency: data.currency,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    
    const links = getStorage<PaymentLink>(MOCK_PAYMENT_LINKS_KEY);
    links.push(link);
    saveStorage(MOCK_PAYMENT_LINKS_KEY, links);
    
    return { success: true, data: link };
  }

  async getPaymentLinks(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<PaymentLink[]>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return { success: true, data: [] };
    }
    
    let links = getStorage<PaymentLink>(MOCK_PAYMENT_LINKS_KEY);
    
    if (params?.status) {
      links = links.filter(l => l.status === params.status);
    }
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      links = links.filter(l =>
        l.paymentLinkId.toLowerCase().includes(search) ||
        l.url.toLowerCase().includes(search)
      );
    }
    
    return { success: true, data: links };
  }

  async getPaymentLink(linkId: string): Promise<ApiResponse<PaymentLink>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Link not found' },
      };
    }
    
    const links = getStorage<PaymentLink>(MOCK_PAYMENT_LINKS_KEY);
    const link = links.find(l => l.paymentLinkId === linkId);
    
    if (!link) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Payment link not found' },
      };
    }
    
    return { success: true, data: link };
  }

  async getPayments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    amountMin?: number;
    amountMax?: number;
  }): Promise<ApiResponse<PaymentsListResponse>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (typeof window === 'undefined') {
      return {
        success: true,
        data: { payments: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      };
    }
    
    let payments = getStorage<Payment>(MOCK_PAYMENTS_KEY);
    payments = filterPayments(payments, params);
    
    const { items, pagination } = paginate(payments, params?.page || 1, params?.limit || 20);
    
    return {
      success: true,
      data: {
        payments: items,
        pagination,
      },
    };
  }

  async getPayment(paymentId: string): Promise<ApiResponse<Payment>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Payment not found' },
      };
    }
    
    const payments = getStorage<Payment>(MOCK_PAYMENTS_KEY);
    const payment = payments.find(p => p.id === paymentId);
    
    if (!payment) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Payment not found' },
      };
    }
    
    return { success: true, data: payment };
  }

  async cancelPayment(paymentId: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return { success: true };
    }
    
    const payments = getStorage<Payment>(MOCK_PAYMENTS_KEY);
    const payment = payments.find(p => p.id === paymentId);
    
    if (payment && payment.status === 'pending') {
      payment.status = 'cancelled';
      saveStorage(MOCK_PAYMENTS_KEY, payments);
    }
    
    return { success: true };
  }

  async createRefund(paymentId: string, data: {
    amount: number;
    description?: string;
    reason?: string;
  }): Promise<ApiResponse<Refund>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const payments = getStorage<Payment>(MOCK_PAYMENTS_KEY);
    const payment = payments.find(p => p.id === paymentId);
    
    if (!payment) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Payment not found' },
      };
    }
    
    if (payment.status !== 'paid') {
      return {
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Can only refund paid payments' },
      };
    }
    
    if (data.amount > payment.amount) {
      return {
        success: false,
        error: { code: 'INVALID_AMOUNT', message: 'Refund amount cannot exceed payment amount' },
      };
    }
    
    const refund: Refund = {
      id: generateId('ref'),
      paymentId,
      amount: data.amount,
      currency: payment.currency,
      status: 'pending',
      description: data.description,
      reason: data.reason,
      createdAt: new Date().toISOString(),
    };
    
    const refunds = getStorage<Refund>(MOCK_REFUNDS_KEY);
    refunds.unshift(refund);
    saveStorage(MOCK_REFUNDS_KEY, refunds);
    
    return { success: true, data: refund };
  }

  async getRefunds(params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentId?: string;
  }): Promise<ApiResponse<RefundsListResponse>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return {
        success: true,
        data: { refunds: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      };
    }
    
    let refunds = getStorage<Refund>(MOCK_REFUNDS_KEY);
    
    if (params?.status) {
      refunds = refunds.filter(r => r.status === params.status);
    }
    
    if (params?.paymentId) {
      refunds = refunds.filter(r => r.paymentId === params.paymentId);
    }
    
    const { items, pagination } = paginate(refunds, params?.page || 1, params?.limit || 20);
    
    return {
      success: true,
      data: {
        refunds: items,
        pagination,
      },
    };
  }

  async getRefund(refundId: string): Promise<ApiResponse<Refund>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Refund not found' },
      };
    }
    
    const refunds = getStorage<Refund>(MOCK_REFUNDS_KEY);
    const refund = refunds.find(r => r.id === refundId);
    
    if (!refund) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Refund not found' },
      };
    }
    
    return { success: true, data: refund };
  }

  async getChargebacks(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<ChargebacksListResponse>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return {
        success: true,
        data: { chargebacks: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      };
    }
    
    let chargebacks = getStorage<Chargeback>(MOCK_CHARGEBACKS_KEY);
    
    if (params?.status) {
      chargebacks = chargebacks.filter(c => c.status === params.status);
    }
    
    const { items, pagination } = paginate(chargebacks, params?.page || 1, params?.limit || 20);
    
    return {
      success: true,
      data: {
        chargebacks: items,
        pagination,
      },
    };
  }

  async getChargeback(chargebackId: string): Promise<ApiResponse<Chargeback>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Chargeback not found' },
      };
    }
    
    const chargebacks = getStorage<Chargeback>(MOCK_CHARGEBACKS_KEY);
    const chargeback = chargebacks.find(c => c.id === chargebackId);
    
    if (!chargeback) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Chargeback not found' },
      };
    }
    
    return { success: true, data: chargeback };
  }

  async submitChargebackEvidence(chargebackId: string, data: {
    documents: string[];
    description: string;
    additionalInfo?: string;
  }): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return { success: true };
    }
    
    const chargebacks = getStorage<Chargeback>(MOCK_CHARGEBACKS_KEY);
    const chargeback = chargebacks.find(c => c.id === chargebackId);
    
    if (!chargeback) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Chargeback not found' },
      };
    }
    
    console.log(`[MOCK] Chargeback evidence submitted for ${chargebackId}:`, data);
    
    return { success: true };
  }

  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
  }): Promise<ApiResponse<OrdersListResponse>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return {
        success: true,
        data: {
          orders: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        },
      };
    }
    
    let orders = getStorage<Order>(MOCK_ORDERS_KEY);
    
    if (params?.status) {
      orders = orders.filter(o => o.status === params.status);
    }
    
    if (params?.customerId) {
      orders = orders.filter(o => o.customer.id === params.customerId);
    }
    
    const { items, pagination } = paginate(orders, params?.page || 1, params?.limit || 20);
    
    // Calculate summary
    const paidOrders = orders.filter(o => o.status === 'paid' || o.status === 'completed');
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);
    
    return {
      success: true,
      data: {
        orders: items,
        pagination,
        summary: {
          totalOrders: orders.length,
          paid: paidOrders.length,
          pending: pendingOrders.length,
          totalRevenue,
        },
      },
    };
  }

  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      };
    }
    
    const orders = getStorage<Order>(MOCK_ORDERS_KEY);
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      };
    }
    
    return { success: true, data: order };
  }
}

export const paymentsService = new PaymentsService();


