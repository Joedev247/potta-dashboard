/**
 * Admin API Service
 * Based on Frontend Admin API Integration Guide v1.0
 * 
 * Base Path: /api/admin
 * Authentication: token header (not Authorization) - Admin JWT token required
 * 
 * All admin endpoints require admin role authentication and use a special `token` header.
 * The token is obtained from the login endpoint and stored in localStorage as 'accessToken'.
 * 
 * Endpoints:
 * - POST /api/admin/register - Register user or service
 * - PUT /api/admin/change-status - Change user status
 * - POST /api/admin/created-provider - Create new provider
 * - PUT /api/admin/activated-provider - Enable/Disable provider for user
 * - GET /api/admin/find - Find user by username, email, or id
 * - GET /api/admin/logs - Get system logs (paginated)
 * - GET /api/admin/logs/:id - Get log by ID
 * - GET /api/admin/queues - Queue monitoring dashboard
 * 
 * Organization Admin Endpoints:
 * - GET /api/organizations/admin/pending - Get pending organizations
 * - PUT /api/organizations/admin/:id/status - Change organization status
 * 
 * Onboarding Admin Endpoints (handled by onboardingService):
 * - GET /api/onboarding/admin/documents/pending
 * - PUT /api/onboarding/admin/documents/:id/verify
 * - GET /api/onboarding/admin/steps/pending
 * - PUT /api/onboarding/admin/steps/:id/approve
 */

import { ApiResponse, PaginationResponse, apiClient } from './client';

export interface LogEntry {
  id: string;
  method: string;
  endpoint: string;
  status: number;
  executionTime?: string;
  userId?: string;
  ipAddress?: string;
  requestBody?: any;
  responseBody?: any;
  createdAt?: string;
}

export interface LogsResponse {
  logs: LogEntry[];
  pagination: PaginationResponse;
}

export interface RegisterUserData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'user' | 'service';
  isInternal?: boolean;
}

export interface ChangeUserStatusData {
  id: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CreateProviderData {
  name: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

export interface ActivateProviderData {
  user_id: string;
  provider: string;
  status: boolean;
}

export interface FindUserQuery {
  username?: string;
  email?: string;
  id?: string;
}

export interface User {
  id: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  owner: {
    id: string;
    email: string;
    username: string;
  };
  onboardingStatus?: {
    currentStep: number;
    totalSteps: number;
    completedSteps: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ChangeOrganizationStatusData {
  status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'PENDING';
  reason?: string;
  admin_notes?: string;
}

class AdminService {
  /**
   * Get system logs with pagination
   * GET /api/admin/logs
   */
  async getLogs(params?: { page?: number; limit?: number }): Promise<ApiResponse<LogsResponse>> {
    try {
      const response = await apiClient.get<any>('/admin/logs', params);
      
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || {
            code: 'LOGS_FETCH_ERROR',
            message: 'Failed to fetch logs',
          },
          data: { logs: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
        };
      }

      const data = response.data.data || response.data;
      const logs = data.logs || [];
      const pagination = data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

      // Normalize log entries
      const normalizedLogs: LogEntry[] = logs.map((log: any) => ({
        id: log.id || '',
        method: log.request?.method || log.method || 'GET',
        endpoint: log.request?.url || log.endpoint || '',
        status: log.response?.statusCode || log.status || 200,
        executionTime: log.executionTime,
        userId: log.userId || log.user_id,
        ipAddress: log.ipAddress || log.ip_address,
        requestBody: log.request?.body,
        responseBody: log.response?.body,
        createdAt: log.createdAt || log.created_at,
      }));

      return {
        success: true,
        data: {
          logs: normalizedLogs,
          pagination: {
            page: pagination.page || 1,
            limit: pagination.limit || 20,
            total: pagination.total || 0,
            totalPages: pagination.totalPages || pagination.total_pages || 0,
            hasNext: pagination.hasNext || (pagination.page || 1) < (pagination.totalPages || pagination.total_pages || 0),
            hasPrev: pagination.hasPrev || (pagination.page || 1) > 1,
          },
        },
      };
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      return {
        success: false,
        error: {
          code: 'LOGS_FETCH_ERROR',
          message: error?.message || 'Failed to fetch logs',
        },
        data: { logs: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      };
    }
  }

  /**
   * Get log by ID
   * GET /api/admin/logs/:id
   */
  async getLogById(id: string): Promise<ApiResponse<LogEntry>> {
    try {
      const response = await apiClient.get<any>(`/admin/logs/${id}`);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<LogEntry>;
      }

      const data = response.data.data || response.data;
      const log: LogEntry = {
        id: data.id || id,
        method: data.request?.method || data.method || 'GET',
        endpoint: data.request?.url || data.endpoint || '',
        status: data.response?.statusCode || data.status || 200,
        executionTime: data.executionTime,
        userId: data.userId || data.user_id,
        ipAddress: data.ipAddress || data.ip_address,
        requestBody: data.request?.body,
        responseBody: data.response?.body,
        createdAt: data.createdAt || data.created_at,
      };

      return {
        success: true,
        data: log,
      };
    } catch (error: any) {
      console.error('Error fetching log by ID:', error);
      return {
        success: false,
        error: {
          code: 'LOG_FETCH_ERROR',
          message: error?.message || 'Failed to fetch log',
        },
      };
    }
  }

  /**
   * Register user or service
   * POST /api/admin/register
   */
  async registerUser(data: RegisterUserData): Promise<ApiResponse<User>> {
    try {
      const requestData = {
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'user',
        isInternal: data.isInternal !== undefined ? data.isInternal : true,
      };

      const response = await apiClient.post<any>('/admin/register', requestData);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<User>;
      }

      const raw = response.data.data || response.data;
      const user: User = {
        id: raw.id || '',
        username: raw.username || data.username,
        email: raw.email || data.email,
        firstName: raw.firstName || raw.first_name || data.firstName,
        lastName: raw.lastName || raw.last_name || data.lastName,
        role: raw.role || data.role || 'user',
        status: raw.status || 'ACTIVE',
        createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
        updatedAt: raw.updatedAt || raw.updated_at,
      };

      return {
        success: true,
        data: user,
      };
    } catch (error: any) {
      console.error('Error registering user:', error);
      return {
        success: false,
        error: {
          code: 'USER_REGISTER_ERROR',
          message: error?.message || 'Failed to register user',
        },
      };
    }
  }

  /**
   * Change user status to Enabled or Disabled
   * PUT /api/admin/change-status
   */
  async changeUserStatus(data: ChangeUserStatusData): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.put<any>('/admin/change-status', {
        id: data.id,
        status: data.status,
      });
      
      if (!response.success) {
        return response as ApiResponse<User>;
      }

      // If response includes updated user data, normalize it
      if (response.data) {
        const raw = response.data.data || response.data;
        const user: User = {
          id: raw.id || data.id,
          username: raw.username,
          email: raw.email,
          firstName: raw.firstName || raw.first_name,
          lastName: raw.lastName || raw.last_name,
          role: raw.role,
          status: data.status,
          createdAt: raw.createdAt || raw.created_at,
          updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
        };

        return {
          success: true,
          data: user,
        };
      }

      return {
        success: true,
        data: {} as User, // Will be handled by UI refreshing the list
      };
    } catch (error: any) {
      console.error('Error changing user status:', error);
      return {
        success: false,
        error: {
          code: 'USER_STATUS_CHANGE_ERROR',
          message: error?.message || 'Failed to change user status',
        },
      };
    }
  }

  /**
   * Create new provider
   * POST /api/admin/created-provider
   */
  async createProvider(data: CreateProviderData): Promise<ApiResponse<any>> {
    try {
      const requestData = {
        name: data.name,
        status: data.status || 'PENDING',
      };

      const response = await apiClient.post<any>('/admin/created-provider', requestData);
      
      if (!response.success || !response.data) {
        return response;
      }

      const provider = response.data.data || response.data;
      return {
        success: true,
        data: provider,
      };
    } catch (error: any) {
      console.error('Error creating provider:', error);
      return {
        success: false,
        error: {
          code: 'PROVIDER_CREATE_ERROR',
          message: error?.message || 'Failed to create provider',
        },
      };
    }
  }

  /**
   * Enable or Disable provider for user
   * PUT /api/admin/activated-provider
   */
  async activateProvider(data: ActivateProviderData): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put<any>('/admin/activated-provider', {
        user_id: data.user_id,
        provider: data.provider,
        status: data.status,
      });
      
      if (!response.success) {
        return response;
      }

      return {
        success: true,
        data: response.data || {},
      };
    } catch (error: any) {
      console.error('Error activating provider:', error);
      return {
        success: false,
        error: {
          code: 'PROVIDER_ACTIVATE_ERROR',
          message: error?.message || 'Failed to activate/deactivate provider',
        },
      };
    }
  }

  /**
   * Find user by username, email, or id
   * GET /api/admin/find
   */
  async findUsers(params?: FindUserQuery): Promise<ApiResponse<User[]>> {
    try {
      const response = await apiClient.get<any>('/admin/find', params);
      
      if (!response.success || !response.data) {
        return { ...response, data: [] };
      }

      const data = response.data.data || response.data;
      const users = Array.isArray(data) ? data : (data.users || []);

      // Normalize user data
      const normalizedUsers: User[] = users.map((user: any) => ({
        id: user.id || '',
        username: user.username,
        email: user.email,
        firstName: user.firstName || user.first_name,
        lastName: user.lastName || user.last_name,
        role: user.role,
        status: user.status || 'ACTIVE',
        createdAt: user.createdAt || user.created_at,
        updatedAt: user.updatedAt || user.updated_at,
      }));

      return {
        success: true,
        data: normalizedUsers,
      };
    } catch (error: any) {
      console.error('Error finding users:', error);
      return {
        success: false,
        error: {
          code: 'USER_FIND_ERROR',
          message: error?.message || 'Failed to find users',
        },
        data: [],
      };
    }
  }

  /**
   * Get pending organizations awaiting admin review
   * GET /api/organizations/admin/pending
   */
  async getPendingOrganizations(): Promise<ApiResponse<Organization[]>> {
    try {
      const response = await apiClient.get<any>('/organizations/admin/pending');
      
      if (!response.success || !response.data) {
        return { ...response, data: [] };
      }

      const data = response.data.data || response.data;
      const organizations = Array.isArray(data) ? data : (data.organizations || []);

      // Normalize organization data
      const normalizedOrgs: Organization[] = organizations.map((org: any) => ({
        id: org.id || '',
        name: org.name || '',
        status: org.status || 'PENDING',
        owner: {
          id: org.owner?.id || org.owner_id || '',
          email: org.owner?.email || '',
          username: org.owner?.username || '',
        },
        onboardingStatus: org.onboardingStatus || org.onboarding_status ? {
          currentStep: org.onboardingStatus?.currentStep || org.onboarding_status?.current_step || 0,
          totalSteps: org.onboardingStatus?.totalSteps || org.onboarding_status?.total_steps || 0,
          completedSteps: org.onboardingStatus?.completedSteps || org.onboarding_status?.completed_steps || 0,
        } : undefined,
        createdAt: org.createdAt || org.created_at,
        updatedAt: org.updatedAt || org.updated_at,
      }));

      return {
        success: true,
        data: normalizedOrgs,
      };
    } catch (error: any) {
      console.error('Error fetching pending organizations:', error);
      return {
        success: false,
        error: {
          code: 'PENDING_ORGS_ERROR',
          message: error?.message || 'Failed to fetch pending organizations',
        },
        data: [],
      };
    }
  }

  /**
   * Change organization status
   * PUT /api/organizations/admin/:id/status
   */
  async changeOrganizationStatus(
    orgId: string,
    data: ChangeOrganizationStatusData
  ): Promise<ApiResponse<Organization>> {
    try {
      const response = await apiClient.put<any>(`/organizations/admin/${orgId}/status`, {
        status: data.status,
        reason: data.reason,
        admin_notes: data.admin_notes,
      });
      
      if (!response.success || !response.data) {
        return response as ApiResponse<Organization>;
      }

      const raw = response.data.data || response.data;
      const organization: Organization = {
        id: raw.id || orgId,
        name: raw.name || '',
        status: raw.status || data.status,
        owner: {
          id: raw.owner?.id || raw.owner_id || '',
          email: raw.owner?.email || '',
          username: raw.owner?.username || '',
        },
        onboardingStatus: raw.onboardingStatus || raw.onboarding_status ? {
          currentStep: raw.onboardingStatus?.currentStep || raw.onboarding_status?.current_step || 0,
          totalSteps: raw.onboardingStatus?.totalSteps || raw.onboarding_status?.total_steps || 0,
          completedSteps: raw.onboardingStatus?.completedSteps || raw.onboarding_status?.completed_steps || 0,
        } : undefined,
        createdAt: raw.createdAt || raw.created_at,
        updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
      };

      return {
        success: true,
        data: organization,
      };
    } catch (error: any) {
      console.error('Error changing organization status:', error);
      return {
        success: false,
        error: {
          code: 'ORG_STATUS_CHANGE_ERROR',
          message: error?.message || 'Failed to change organization status',
        },
      };
    }
  }

  /**
   * Get queue monitoring dashboard
   * GET /api/admin/queues
   * Note: This endpoint serves a web-based dashboard UI
   */
  async getQueues(params?: { page?: number; limit?: number }): Promise<ApiResponse<any>> {
    return apiClient.get<any>('/admin/queues', params);
  }
}

export const adminService = new AdminService();
