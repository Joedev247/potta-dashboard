/**
 * Orders API Service
 * Base Path: /api/orders
 * Authentication: Bearer Token + x-api-key
 * 
 * Endpoints:
 * - POST /api/orders - Create order
 * - GET /api/orders - List orders
 * - GET /api/orders/{id} - Get order by ID
 * - PUT /api/orders/{id}/status - Update order status
 */

import { ApiResponse, PaginationResponse, apiClient } from './client';

export interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface Order {
  id: string;
  customer_id: string;
  organization_id?: string;
  items: OrderItem[];
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | string;
  metadata?: Record<string, any>;
  payments?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderData {
  customer_id: string;
  organization_id?: string;
  items: Array<{
    productId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
  }>;
  currency: string;
  metadata?: Record<string, any>;
}

export interface UpdateOrderStatusData {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
}

export interface OrdersListResponse {
  orders: Order[];
  pagination: PaginationResponse;
}

class OrdersService {
  /**
   * Create a new order
   * POST /api/orders
   */
  async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    try {
      const response = await apiClient.post<any>('/orders', data);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<Order>;
      }

      // Handle different response structures
      const raw = response.data.data || response.data;
      
      const order: Order = {
        id: raw.id || '',
        customer_id: raw.customer_id || raw.customerId || '',
        organization_id: raw.organization_id || raw.organizationId || undefined,
        items: raw.items || [],
        amount: raw.amount ?? 0,
        currency: raw.currency || data.currency || 'XAF',
        status: raw.status || 'PENDING',
        metadata: raw.metadata || undefined,
        payments: raw.payments || undefined,
        createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
        updatedAt: raw.updatedAt || raw.updated_at,
      };

      return {
        success: true,
        data: order,
      };
    } catch (error: any) {
      console.error('Error creating order:', error);
      return {
        success: false,
        error: {
          code: 'ORDER_CREATE_ERROR',
          message: error?.message || 'Failed to create order',
        },
      };
    }
  }

  /**
   * List all orders
   * GET /api/orders
   */
  async listOrders(params?: { 
    page?: number; 
    limit?: number;
    organization_id?: string;
    status?: string;
  }): Promise<ApiResponse<OrdersListResponse>> {
    try {
      const response = await apiClient.get<any>('/orders', params);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<OrdersListResponse>;
      }

      // Handle different response structures
      const data = response.data.data || response.data;
      const orders = Array.isArray(data.orders) 
        ? data.orders 
        : (Array.isArray(data) ? data : []);

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const total = data.total || data.pagination?.total || orders.length;
      const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

      // Normalize order data
      const normalizedOrders: Order[] = orders.map((order: any) => ({
        id: order.id || '',
        customer_id: order.customer_id || order.customerId || '',
        organization_id: order.organization_id || order.organizationId || undefined,
        items: order.items || [],
        amount: order.amount ?? 0,
        currency: order.currency || 'XAF',
        status: order.status || 'PENDING',
        metadata: order.metadata || undefined,
        payments: order.payments || undefined,
        createdAt: order.createdAt || order.created_at,
        updatedAt: order.updatedAt || order.updated_at,
      }));

      return {
        success: true,
        data: {
          orders: normalizedOrders,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      };
    } catch (error: any) {
      console.error('Error listing orders:', error);
      return {
        success: false,
        error: {
          code: 'ORDERS_LIST_ERROR',
          message: error?.message || 'Failed to load orders',
        },
      };
    }
  }

  /**
   * Get order by ID
   * GET /api/orders/{id}
   */
  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const response = await apiClient.get<any>(`/orders/${orderId}`);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<Order>;
      }

      // Handle different response structures
      const raw = response.data.data || response.data;
      
      const order: Order = {
        id: raw.id || orderId,
        customer_id: raw.customer_id || raw.customerId || '',
        organization_id: raw.organization_id || raw.organizationId || undefined,
        items: raw.items || [],
        amount: raw.amount ?? 0,
        currency: raw.currency || 'XAF',
        status: raw.status || 'PENDING',
        metadata: raw.metadata || undefined,
        payments: raw.payments || undefined,
        createdAt: raw.createdAt || raw.created_at,
        updatedAt: raw.updatedAt || raw.updated_at,
      };

      return {
        success: true,
        data: order,
      };
    } catch (error: any) {
      console.error('Error fetching order:', error);
      return {
        success: false,
        error: {
          code: 'ORDER_FETCH_ERROR',
          message: error?.message || 'Failed to fetch order',
        },
      };
    }
  }

  /**
   * Update order status
   * PUT /api/orders/{id}/status
   */
  async updateOrderStatus(orderId: string, data: UpdateOrderStatusData): Promise<ApiResponse<Order>> {
    try {
      const response = await apiClient.put<any>(`/orders/${orderId}/status`, data);
      
      if (!response.success) {
        return response as ApiResponse<Order>;
      }

      // If response includes updated order data, normalize it
      if (response.data) {
        const raw = response.data.data || response.data;
        const order: Order = {
          id: raw.id || orderId,
          customer_id: raw.customer_id || raw.customerId || '',
          organization_id: raw.organization_id || raw.organizationId || undefined,
          items: raw.items || [],
          amount: raw.amount ?? 0,
          currency: raw.currency || 'XAF',
          status: data.status,
          metadata: raw.metadata || undefined,
          payments: raw.payments || undefined,
          createdAt: raw.createdAt || raw.created_at,
          updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
        };

        return {
          success: true,
          data: order,
        };
      }

      // If no data returned, return success
      return {
        success: true,
        data: {} as Order, // Will be handled by UI refreshing the list
      };
    } catch (error: any) {
      console.error('Error updating order status:', error);
      return {
        success: false,
        error: {
          code: 'ORDER_STATUS_UPDATE_ERROR',
          message: error?.message || 'Failed to update order status',
        },
      };
    }
  }
}

export const ordersService = new OrdersService();
