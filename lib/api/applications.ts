/**
 * Applications API Service
 * Base Path: /api/applications
 * Authentication: Bearer Token or Token Header
 * Description: Manage applications with API credentials
 */

import { ApiResponse, PaginationResponse, apiClient } from './client';

export interface ApplicationConfig {
  webhook_url?: string;
  default_currency?: string;
}

export interface Application {
  id: string;
  name: string;
  description?: string;
  api_key: string;
  api_secret?: string; // Only returned on creation and regeneration
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  environment: 'SANDBOX' | 'PROD'; // Updated to match backend
  type?: 'PERSONAL' | 'ORGANIZATION'; // NEW: Automatically set by backend based on ownership (optional for backward compatibility)
  config?: ApplicationConfig;
  total_payments?: number;
  total_volume?: number;
  last_used_at?: string;
  created_at: string;
  updated_at?: string;
  owner_user_id?: string | null; // Legacy field (deprecated, use type instead)
  owner_organization_id?: string | null; // Legacy field (deprecated, use type instead)
}

export interface CreateApplicationData {
  name: string;
  description?: string;
  environment?: 'SANDBOX' | 'PROD'; // Updated to match backend
  organization_id?: string; // If provided, app type will be 'ORGANIZATION', otherwise 'PERSONAL'
  config?: {
    webhook_url?: string;
    default_currency?: string;
  };
  // Note: 'type' field is NOT sent - it's automatically determined by backend based on organization_id
}

export interface UpdateApplicationData {
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  environment?: 'SANDBOX' | 'PROD'; // Updated to match backend
  config?: {
    webhook_url?: string;
    default_currency?: string;
  };
}

export interface ApplicationsListResponse {
  applications: Application[];
  pagination?: PaginationResponse;
}

class ApplicationsService {
  /**
   * Create a new application
   * Note: api_secret is only returned once. Store it securely.
   * 
   * The backend expects organization_id in the request body to determine ownership:
   * - If organization_id is provided: app belongs to the organization
   * - If organization_id is not provided: app belongs to the authenticated user
   */
  async createApplication(data: CreateApplicationData): Promise<ApiResponse<Application>> {
    // Log what we're sending
    console.log('[ApplicationsService] createApplication called with:', {
      hasOrganizationId: !!data.organization_id,
      organizationId: data.organization_id,
      dataKeys: Object.keys(data),
    });
    
    // Send organization_id in the body (backend now supports this)
    console.log('[ApplicationsService] Sending request with:', {
      endpoint: '/applications',
      bodyData: data,
      note: data.organization_id ? 'Creating organization app' : 'Creating personal app',
    });
    
    return apiClient.post<Application>('/applications', data);
  }

  /**
   * List all applications
   */
  async listApplications(params?: { organization_id?: string; page?: number; limit?: number }): Promise<ApiResponse<ApplicationsListResponse>> {
    const response = await apiClient.get<any>('/applications', params);
    
    // Log the raw response for debugging
    console.log('[ApplicationsService] listApplications response:', {
      success: response.success,
      hasData: !!response.data,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      error: response.error,
      params,
    });
    
    if (!response.success) {
      // Return error response as-is
      return {
        success: false,
        error: response.error,
        data: undefined,
      } as ApiResponse<ApplicationsListResponse>;
    }

    // Handle different response structures
    let applications: Application[] = [];
    
    if (!response.data) {
      // No data returned - return empty list
      applications = [];
    } else if (Array.isArray(response.data)) {
      // Backend returned array directly: [...]
      applications = response.data;
    } else if (response.data.applications && Array.isArray(response.data.applications)) {
      // Backend returned: { applications: [...] }
      applications = response.data.applications;
    } else if (response.data.data) {
      // Backend returned nested: { data: { applications: [...] } } or { data: [...] }
      if (Array.isArray(response.data.data)) {
        applications = response.data.data;
      } else if (response.data.data.applications && Array.isArray(response.data.data.applications)) {
        applications = response.data.data.applications;
      }
    }
    
    console.log('[ApplicationsService] Extracted applications:', {
      count: applications.length,
      sample: applications[0] || null,
    });

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const total = (response.data as any)?.total || (response.data as any)?.pagination?.total || applications.length;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        applications,
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
  }

  /**
   * Get application by ID
   */
  async getApplication(applicationId: string, organizationId?: string): Promise<ApiResponse<Application>> {
    const params = organizationId ? { organization_id: organizationId } : undefined;
    return apiClient.get<Application>(`/applications/${applicationId}`, params);
  }

  /**
   * Update application
   */
  async updateApplication(applicationId: string, data: UpdateApplicationData, organizationId?: string): Promise<ApiResponse<Application>> {
    let endpoint = `/applications/${applicationId}`;
    if (organizationId) {
      endpoint += `?organization_id=${organizationId}`;
    }
    return apiClient.put<Application>(endpoint, data);
  }

  /**
   * Regenerate API credentials
   * Warning: Old credentials will be invalidated
   * Note: api_secret is only returned once. Store it securely.
   */
  async regenerateCredentials(applicationId: string, organizationId?: string): Promise<ApiResponse<Application>> {
    let endpoint = `/applications/${applicationId}/regenerate-credentials`;
    if (organizationId) {
      endpoint += `?organization_id=${organizationId}`;
    }
    return apiClient.put<Application>(endpoint, {});
  }

  /**
   * Delete application
   * Warning: This will invalidate all API credentials
   */
  async deleteApplication(applicationId: string, organizationId?: string): Promise<ApiResponse<void>> {
    let endpoint = `/applications/${applicationId}`;
    if (organizationId) {
      endpoint += `?organization_id=${organizationId}`;
    }
    return apiClient.delete<void>(endpoint);
  }
}

export const applicationsService = new ApplicationsService();
