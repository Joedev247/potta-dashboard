/**
 * Organization API Service (backend)
 */

import { ApiResponse, apiClient } from './client';
import { usersService } from './users';

export interface Organization {
  id?: string;
  name: string;
  legalForm?: string;
  type?: string;
  registration_number?: string;
  registrationNumber?: string;
  vat_number?: string;
  address?: string;
  region?: string;
  city?: string;
  country?: string;
  countryName?: string;
  phone_number?: string;
  email?: string;
  website?: string;
  description?: string;
}

export interface UpdateOrganizationData {
  name?: string;
  address?: string;
  city?: string;
  region?: string;
}

class OrganizationService {
  async listOrganizations(params?: { page?: number; limit?: number }): Promise<ApiResponse<Organization[]>> {
    const response = await apiClient.get<any>('/organizations', params);
    if (!response.success || !response.data) return response as ApiResponse<Organization[]>;
    const data = Array.isArray(response.data) ? response.data : (response.data as any).data || response.data;
    return { success: true, data };
  }

  async getOrganizationById(id: string): Promise<ApiResponse<Organization>> {
    return apiClient.get<Organization>(`/organizations/${id}`);
  }

  async createOrganization(data: Partial<Organization>): Promise<ApiResponse<Organization>> {
    // Try to create organization - API client will attempt to get/generate API key automatically
    // If backend endpoints don't exist (404), we'll proceed without API key and let backend decide
    try {
      const response = await apiClient.post<Organization>('/organizations', data);
      
      // If we get a 403, provide helpful error message
      if (!response.success && response.error?.code === 'FORBIDDEN') {
        const errorDetails = response.error?.details || {};
        
        // Check if API key was the issue
        if (errorDetails.hasApiKey === false) {
          return {
            success: false,
            error: {
              code: 'API_KEY_REQUIRED',
              message: 'API key is required to create an organization. Please contact support to set up your API credentials, or check if your backend has the credentials endpoint implemented.',
              details: {
                ...errorDetails,
                suggestion: 'The backend may need to implement the /customer/genarate-credentials endpoint, or API keys may be provided through a different method.',
              },
            },
          };
        }
      }
      
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error?.message || 'Failed to create organization. Please check your connection and try again.',
        },
      };
    }
  }

  async updateOrganization(id: string | undefined, data: UpdateOrganizationData): Promise<ApiResponse<Organization>> {
    try {
      if (id) {
        return apiClient.put<Organization>(`/organizations/${id}`, data);
      }
      // If no id provided, attempt to update /organizations via PUT
      return apiClient.put<Organization>('/organizations', data);
    } catch (error: any) {
      return { success: false, error: { code: 'NETWORK_ERROR', message: error?.message || 'Failed to update organization' } };
    }
  }

  async deleteOrganization(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/organizations/${id}`);
  }
}

export const organizationService = new OrganizationService();


