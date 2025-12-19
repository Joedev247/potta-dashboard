/**
 * Products API Service
 * Base Path: /api/products
 * Authentication: Bearer Token + x-api-key
 * 
 * Endpoints:
 * - POST /api/products - Create product
 * - GET /api/products - List products
 * - GET /api/products/{id} - Get product by ID
 * - PUT /api/products/{id} - Update product
 * - DELETE /api/products/{id} - Delete product
 * - PUT /api/products/{id}/activate - Activate product
 * - PUT /api/products/{id}/deactivate - Deactivate product
 */

import { ApiResponse, PaginationResponse, apiClient } from './client';

export interface Product {
  id: string;
  organization_id?: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  sku?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductData {
  organization_id?: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  sku?: string;
  isActive?: boolean;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  sku?: string;
}

export interface ProductsListResponse {
  products: Product[];
  pagination?: PaginationResponse;
}

class ProductsService {
  /**
   * Create a new product
   * POST /api/products
   */
  async createProduct(data: CreateProductData): Promise<ApiResponse<Product>> {
    try {
      const response = await apiClient.post<any>('/products', data);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<Product>;
      }

      // Handle different response structures
      const raw = response.data.data || response.data;
      
      const product: Product = {
        id: raw.id || '',
        name: raw.name || '',
        description: raw.description || undefined,
        price: raw.price ?? 0,
        currency: raw.currency || 'XAF',
        sku: raw.sku || undefined,
        isActive: raw.isActive ?? raw.is_active ?? true,
        organization_id: raw.organization_id || raw.organizationId || undefined,
        createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
        updatedAt: raw.updatedAt || raw.updated_at,
      };

      return {
        success: true,
        data: product,
      };
    } catch (error: any) {
      console.error('Error creating product:', error);
      return {
        success: false,
        error: {
          code: 'PRODUCT_CREATE_ERROR',
          message: error?.message || 'Failed to create product',
        },
      };
    }
  }

  /**
   * List all products
   * GET /api/products
   */
  async listProducts(params?: { 
    organization_id?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Product[]>> {
    try {
      const response = await apiClient.get<any>('/products', params);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<Product[]>;
      }

      // Handle different response structures
      const data = response.data.data || response.data;
      const products = Array.isArray(data.customers) 
        ? data.customers 
        : (Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : []));

      // Normalize product data
      const normalizedProducts: Product[] = products.map((product: any) => ({
        id: product.id || '',
        name: product.name || '',
        description: product.description || undefined,
        price: product.price ?? 0,
        currency: product.currency || 'XAF',
        sku: product.sku || undefined,
        isActive: product.isActive ?? product.is_active ?? true,
        organization_id: product.organization_id || product.organizationId || undefined,
        createdAt: product.createdAt || product.created_at,
        updatedAt: product.updatedAt || product.updated_at,
      }));

      return {
        success: true,
        data: normalizedProducts,
      };
    } catch (error: any) {
      console.error('Error listing products:', error);
      return {
        success: false,
        error: {
          code: 'PRODUCTS_LIST_ERROR',
          message: error?.message || 'Failed to load products',
        },
      };
    }
  }

  /**
   * Get product by ID
   * GET /api/products/{id}
   */
  async getProduct(productId: string): Promise<ApiResponse<Product>> {
    try {
      const response = await apiClient.get<any>(`/products/${productId}`);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<Product>;
      }

      // Handle different response structures
      const raw = response.data.data || response.data;
      
      const product: Product = {
        id: raw.id || productId,
        name: raw.name || '',
        description: raw.description || undefined,
        price: raw.price ?? 0,
        currency: raw.currency || 'XAF',
        sku: raw.sku || undefined,
        isActive: raw.isActive ?? raw.is_active ?? true,
        organization_id: raw.organization_id || raw.organizationId || undefined,
        createdAt: raw.createdAt || raw.created_at,
        updatedAt: raw.updatedAt || raw.updated_at,
      };

      return {
        success: true,
        data: product,
      };
    } catch (error: any) {
      console.error('Error fetching product:', error);
      return {
        success: false,
        error: {
          code: 'PRODUCT_FETCH_ERROR',
          message: error?.message || 'Failed to fetch product',
        },
      };
    }
  }

  /**
   * Update product
   * PUT /api/products/{id}
   */
  async updateProduct(productId: string, data: UpdateProductData): Promise<ApiResponse<Product>> {
    try {
      const response = await apiClient.put<any>(`/products/${productId}`, data);
      
      if (!response.success) {
        return response as ApiResponse<Product>;
      }

      // If response includes updated product data, normalize it
      if (response.data) {
        const raw = response.data.data || response.data;
        const product: Product = {
          id: raw.id || productId,
          name: raw.name || data.name || '',
          description: raw.description !== undefined ? raw.description : data.description,
          price: raw.price ?? data.price ?? 0,
          currency: raw.currency || data.currency || 'XAF',
          sku: raw.sku !== undefined ? raw.sku : data.sku,
          isActive: raw.isActive ?? raw.is_active ?? true,
          organization_id: raw.organization_id || raw.organizationId || undefined,
          createdAt: raw.createdAt || raw.created_at,
          updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
        };

        return {
          success: true,
          data: product,
        };
      }

      // If no data returned, return success
      return {
        success: true,
        data: {} as Product, // Will be handled by UI refreshing the list
      };
    } catch (error: any) {
      console.error('Error updating product:', error);
      return {
        success: false,
        error: {
          code: 'PRODUCT_UPDATE_ERROR',
          message: error?.message || 'Failed to update product',
        },
      };
    }
  }

  /**
   * Delete product
   * DELETE /api/products/{id}
   */
  async deleteProduct(productId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<void>(`/products/${productId}`);
      return response;
    } catch (error: any) {
      console.error('Error deleting product:', error);
      return {
        success: false,
        error: {
          code: 'PRODUCT_DELETE_ERROR',
          message: error?.message || 'Failed to delete product',
        },
      };
    }
  }

  /**
   * Activate product
   * PUT /api/products/{id}/activate
   */
  async activateProduct(productId: string): Promise<ApiResponse<Product>> {
    try {
      const response = await apiClient.put<any>(`/products/${productId}/activate`);
      
      if (!response.success) {
        return response as ApiResponse<Product>;
      }

      // If response includes updated product data, normalize it
      if (response.data) {
        const raw = response.data.data || response.data;
        const product: Product = {
          id: raw.id || productId,
          name: raw.name || '',
          description: raw.description || undefined,
          price: raw.price ?? 0,
          currency: raw.currency || 'XAF',
          sku: raw.sku || undefined,
          isActive: true,
          organization_id: raw.organization_id || raw.organizationId || undefined,
          createdAt: raw.createdAt || raw.created_at,
          updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
        };

        return {
          success: true,
          data: product,
        };
      }

      return {
        success: true,
        data: {} as Product, // Will be handled by UI refreshing the list
      };
    } catch (error: any) {
      console.error('Error activating product:', error);
      return {
        success: false,
        error: {
          code: 'PRODUCT_ACTIVATE_ERROR',
          message: error?.message || 'Failed to activate product',
        },
      };
    }
  }

  /**
   * Deactivate product
   * PUT /api/products/{id}/deactivate
   */
  async deactivateProduct(productId: string): Promise<ApiResponse<Product>> {
    try {
      const response = await apiClient.put<any>(`/products/${productId}/deactivate`);
      
      if (!response.success) {
        return response as ApiResponse<Product>;
      }

      // If response includes updated product data, normalize it
      if (response.data) {
        const raw = response.data.data || response.data;
        const product: Product = {
          id: raw.id || productId,
          name: raw.name || '',
          description: raw.description || undefined,
          price: raw.price ?? 0,
          currency: raw.currency || 'XAF',
          sku: raw.sku || undefined,
          isActive: false,
          organization_id: raw.organization_id || raw.organizationId || undefined,
          createdAt: raw.createdAt || raw.created_at,
          updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
        };

        return {
          success: true,
          data: product,
        };
      }

      return {
        success: true,
        data: {} as Product, // Will be handled by UI refreshing the list
      };
    } catch (error: any) {
      console.error('Error deactivating product:', error);
      return {
        success: false,
        error: {
          code: 'PRODUCT_DEACTIVATE_ERROR',
          message: error?.message || 'Failed to deactivate product',
        },
      };
    }
  }
}

export const productsService = new ProductsService();
