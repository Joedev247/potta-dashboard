/**
 * Customers API Service
 * Base Path: /api/customers
 * Authentication: Bearer Token + x-api-key
 * 
 * Endpoints:
 * - POST /api/customers - Create customer
 * - GET /api/customers - List customers
 * - GET /api/customers/{id} - Get customer by ID
 * - PUT /api/customers/{id} - Update customer
 * - DELETE /api/customers/{id} - Delete customer
 */

import { ApiResponse, PaginationResponse, apiClient } from './client';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  organization_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerData {
  organization_id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomerData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface CustomersListResponse {
  customers: Customer[];
  pagination?: PaginationResponse;
}

class CustomersService {
  /**
   * Create a new customer
   * POST /api/customers
   */
  async createCustomer(data: CreateCustomerData): Promise<ApiResponse<Customer>> {
    try {
      // Convert camelCase to snake_case for backend API
      const requestData: any = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        organization_id: data.organization_id,
      };
      
      if (data.phone) {
        requestData.phone_number = data.phone;
      }
      
      if (data.address) {
        requestData.address = data.address;
      }
      
      const response = await apiClient.post<any>('/customers', requestData);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<Customer>;
      }

      // Handle different response structures
      const raw = response.data.data || response.data;
      
      const phoneValue = raw.phone || raw.phone_number;
      const customer: Customer = {
        id: raw.id || '',
        firstName: raw.firstName || raw.first_name || '',
        lastName: raw.lastName || raw.last_name || '',
        email: raw.email || '',
        phone: phoneValue && phoneValue.trim() ? phoneValue.trim() : undefined,
        address: raw.address || undefined,
        organization_id: raw.organization_id || raw.organizationId || undefined,
        createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
        updatedAt: raw.updatedAt || raw.updated_at,
      };

      return {
        success: true,
        data: customer,
      };
    } catch (error: any) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        error: {
          code: 'CUSTOMER_CREATE_ERROR',
          message: error?.message || 'Failed to create customer',
        },
      };
    }
  }

  /**
   * List all customers
   * GET /api/customers
   */
  async listCustomers(params?: { 
    organization_id?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Customer[]>> {
    try {
      const response = await apiClient.get<any>('/customers', params);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<Customer[]>;
      }

      // Handle different response structures
      const data = response.data.data || response.data;
      const customers = Array.isArray(data.customers) 
        ? data.customers 
        : (Array.isArray(data) ? data : []);

      // Normalize customer data
      const normalizedCustomers: Customer[] = customers.map((customer: any) => {
        const phoneValue = customer.phone || customer.phone_number;
        return {
          id: customer.id || '',
          firstName: customer.firstName || customer.first_name || '',
          lastName: customer.lastName || customer.last_name || '',
          email: customer.email || '',
          phone: phoneValue && phoneValue.trim() ? phoneValue.trim() : undefined,
          address: customer.address || undefined,
          organization_id: customer.organization_id || customer.organizationId || undefined,
          createdAt: customer.createdAt || customer.created_at,
          updatedAt: customer.updatedAt || customer.updated_at,
        };
      });

      return {
        success: true,
        data: normalizedCustomers,
      };
    } catch (error: any) {
      console.error('Error listing customers:', error);
      return {
        success: false,
        error: {
          code: 'CUSTOMERS_LIST_ERROR',
          message: error?.message || 'Failed to load customers',
        },
      };
    }
  }

  /**
   * Get customer by ID
   * GET /api/customers/{id}
   */
  async getCustomer(customerId: string): Promise<ApiResponse<Customer>> {
    try {
      const response = await apiClient.get<any>(`/customers/${customerId}`);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<Customer>;
      }

      // Handle different response structures
      const raw = response.data.data || response.data;
      
      const phoneValue = raw.phone || raw.phone_number;
      const customer: Customer = {
        id: raw.id || customerId,
        firstName: raw.firstName || raw.first_name || '',
        lastName: raw.lastName || raw.last_name || '',
        email: raw.email || '',
        phone: phoneValue && phoneValue.trim() ? phoneValue.trim() : undefined,
        address: raw.address || undefined,
        organization_id: raw.organization_id || raw.organizationId || undefined,
        createdAt: raw.createdAt || raw.created_at,
        updatedAt: raw.updatedAt || raw.updated_at,
      };

      return {
        success: true,
        data: customer,
      };
    } catch (error: any) {
      console.error('Error fetching customer:', error);
      return {
        success: false,
        error: {
          code: 'CUSTOMER_FETCH_ERROR',
          message: error?.message || 'Failed to fetch customer',
        },
      };
    }
  }

  /**
   * Update customer
   * PUT /api/customers/{id}
   */
  async updateCustomer(customerId: string, data: UpdateCustomerData): Promise<ApiResponse<Customer>> {
    try {
      // Convert camelCase to snake_case for backend API
      const requestData: any = {};
      
      if (data.firstName !== undefined) {
        requestData.first_name = data.firstName;
      }
      
      if (data.lastName !== undefined) {
        requestData.last_name = data.lastName;
      }
      
      if (data.email !== undefined) {
        requestData.email = data.email;
      }
      
      if (data.phone !== undefined) {
        requestData.phone_number = data.phone;
      }
      
      if (data.address !== undefined) {
        requestData.address = data.address;
      }
      
      const response = await apiClient.put<any>(`/customers/${customerId}`, requestData);
      
      if (!response.success) {
        return response as ApiResponse<Customer>;
      }

      // If response includes updated customer data, normalize it
      if (response.data) {
        const raw = response.data.data || response.data;
        const phoneValue = raw.phone || raw.phone_number || data.phone;
        const customer: Customer = {
          id: raw.id || customerId,
          firstName: raw.firstName || raw.first_name || data.firstName || '',
          lastName: raw.lastName || raw.last_name || data.lastName || '',
          email: raw.email || data.email || '',
          phone: phoneValue && phoneValue.trim() ? phoneValue.trim() : undefined,
          address: raw.address || data.address || undefined,
          organization_id: raw.organization_id || raw.organizationId || undefined,
          createdAt: raw.createdAt || raw.created_at,
          updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
        };

        return {
          success: true,
          data: customer,
        };
      }

      // If no data returned, return success
      return {
        success: true,
        data: {} as Customer, // Will be handled by UI refreshing the list
      };
    } catch (error: any) {
      console.error('Error updating customer:', error);
      return {
        success: false,
        error: {
          code: 'CUSTOMER_UPDATE_ERROR',
          message: error?.message || 'Failed to update customer',
        },
      };
    }
  }

  /**
   * Delete customer
   * DELETE /api/customers/{id}
   */
  async deleteCustomer(customerId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<void>(`/customers/${customerId}`);
      return response;
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      return {
        success: false,
        error: {
          code: 'CUSTOMER_DELETE_ERROR',
          message: error?.message || 'Failed to delete customer',
        },
      };
    }
  }
}

export const customersService = new CustomersService();
