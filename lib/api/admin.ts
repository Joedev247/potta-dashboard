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
  status: 'ACTIVE' | 'STOP' | 'PENDING' | 'INACTIVE';
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
  status?: 'ACTIVE' | 'STOP' | 'PENDING' | 'INACTIVE'; // INACTIVE kept for backward compatibility, maps to STOP
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

export interface OnboardingDocument {
  id: string;
  userId?: string;
  organizationId?: string;
  documentType: string;
  fileName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  fileUrl?: string;
}

export interface PendingDocument {
  id: string;
  userId?: string;
  organizationId?: string;
  user?: { id: string; email: string; username: string };
  organization?: { id: string; name: string };
  documentType: string;
  fileName: string;
  fileUrl?: string;
  uploadedAt?: string;
  createdAt?: string;
}

export interface OnboardingStep {
  id: string;
  userId?: string;
  organizationId?: string;
  stepName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  data?: any;
}

export interface PendingStep {
  id: string;
  userId?: string;
  organizationId?: string;
  user?: { id: string; email: string; username: string };
  organization?: { id: string; name: string };
  stepName: string;
  submittedAt?: string;
  createdAt?: string;
  data?: any;
}

class AdminService {
  /**
   * Get system logs with pagination
   * GET /api/admin/logs
   */
  async getLogs(params?: { page?: number; limit?: number }): Promise<ApiResponse<LogsResponse>> {
    try {
      const response = await apiClient.get<any>('/users/admin/logs', params);
      
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

      // Backend returns: { status_code: 200, data: { data: [...logs...], count, totalPages, currentPage } }
      // API client extracts: response.data = backendResponse.data = { data: [...logs...], count, totalPages, currentPage }
      const responseData = response.data;
      
      // Handle different response structures
      let logs: any[] = [];
      let count = 0;
      let totalPages = 0;
      let currentPage = 1;
      
      if (Array.isArray(responseData)) {
        // If response.data is directly an array
        logs = responseData;
        count = logs.length;
        totalPages = 1;
        currentPage = 1;
      } else if (responseData && typeof responseData === 'object') {
        // Extract logs array from responseData.data (the nested data property)
        logs = Array.isArray(responseData.data) 
          ? responseData.data 
          : (Array.isArray(responseData.logs) ? responseData.logs : []);
        
        count = responseData.count || 0;
        totalPages = responseData.totalPages || responseData.total_pages || 0;
        currentPage = parseInt(String(responseData.currentPage || responseData.current_page || '1'), 10);
      }
      
      const limit = params?.limit || 20;

      // Normalize log entries
      const normalizedLogs: LogEntry[] = logs.map((log: any) => ({
        id: log.id || '',
        method: log.request?.method || log.method || 'GET',
        endpoint: log.request?.url || log.endpoint || '',
        status: log.response?.statusCode || log.status || 200,
        executionTime: log.executionTime,
        userId: log.userId || log.user_id,
        ipAddress: log.request?.ip || log.ipAddress || log.ip_address || '',
        requestBody: log.request?.body,
        responseBody: log.response?.body,
        createdAt: log.createdAt || log.created_at,
      }));

      return {
        success: true,
        data: {
          logs: normalizedLogs,
          pagination: {
            page: currentPage,
            limit: limit,
            total: count,
            totalPages: totalPages,
            hasNext: currentPage < totalPages,
            hasPrev: currentPage > 1,
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
      const response = await apiClient.get<any>(`/users/admin/logs/${id}`);
      
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

      const response = await apiClient.post<any>('/users/admin/register', requestData);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<User>;
      }

      const raw = response.data.data || response.data;
      // Backend returns STOP, map to INACTIVE for frontend display
      let status = raw.status || 'ACTIVE';
      if (status === 'STOP') {
        status = 'INACTIVE';
      }
      
      // Extract role name from object if role is an object
      let role = raw.role || data.role;
      if (role && typeof role === 'object') {
        role = role.name || role.role || role.value || (role.id ? String(role.id) : 'user');
      }
      role = role || 'user';
      
      const user: User = {
        id: raw.id || '',
        username: raw.username || data.username,
        email: raw.email || data.email,
        firstName: raw.firstName || raw.first_name || data.firstName,
        lastName: raw.lastName || raw.last_name || data.lastName,
        role: role as string,
        status: status as 'ACTIVE' | 'INACTIVE' | 'PENDING',
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
      // Backend expects: ACTIVE, STOP, PENDING (all uppercase)
      // Map frontend status values to backend values
      let backendStatus: 'ACTIVE' | 'STOP' | 'PENDING';
      
      // If status is INACTIVE (from frontend), map it to STOP (backend expects)
      if (data.status === 'INACTIVE') {
        backendStatus = 'STOP';
      } else {
        backendStatus = data.status;
      }
      
      const response = await apiClient.put<any>('/users/admin/change-status', {
        id: data.id,
        status: backendStatus,
      });
      
      if (!response.success) {
        return response as ApiResponse<User>;
      }

      // If response includes updated user data, normalize it
      if (response.data) {
        const raw = response.data.data || response.data;
        // Backend returns STOP, map to INACTIVE for frontend display
        let displayStatus = raw.status || backendStatus;
        if (displayStatus === 'STOP') {
          displayStatus = 'INACTIVE';
        }
        
        // Extract role name from object if role is an object
        let role = raw.role;
        if (role && typeof role === 'object') {
          role = role.name || role.role || role.value || (role.id ? String(role.id) : 'user');
        }
        role = role || 'user';
        
        const user: User = {
          id: raw.id || data.id,
          username: raw.username,
          email: raw.email,
          firstName: raw.firstName || raw.first_name,
          lastName: raw.lastName || raw.last_name,
          role: role as string,
          status: displayStatus as 'ACTIVE' | 'INACTIVE' | 'PENDING',
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

      const response = await apiClient.post<any>('/users/admin/created-provider', requestData);
      
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
      const response = await apiClient.put<any>('/users/admin/activated-provider', {
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
      const response = await apiClient.get<any>('/users/admin/find', params);
      
      if (!response.success || !response.data) {
        return { ...response, data: [] };
      }

      const data = response.data.data || response.data;
      const users = Array.isArray(data) ? data : (data.users || []);

      // Normalize user data
      // Backend returns: ACTIVE, STOP, PENDING
      // Map STOP to INACTIVE for frontend display consistency
      const normalizedUsers: User[] = users.map((user: any) => {
        let status = user.status || 'ACTIVE';
        // Map backend STOP to frontend INACTIVE for display
        if (status === 'STOP') {
          status = 'INACTIVE';
        }
        
        // Extract role name from object if role is an object
        let role = user.role;
        if (role && typeof role === 'object') {
          role = role.name || role.role || role.value || (role.id ? String(role.id) : 'user');
        }
        role = role || 'user';
        
        return {
          id: user.id || '',
          username: user.username,
          email: user.email,
          firstName: user.firstName || user.first_name,
          lastName: user.lastName || user.last_name,
          role: role as string,
          status: status as 'ACTIVE' | 'INACTIVE' | 'PENDING',
          createdAt: user.createdAt || user.created_at,
          updatedAt: user.updatedAt || user.updated_at,
        };
      });

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

  /**
   * Get pending onboarding documents
   * GET /api/onboarding/admin/documents/pending
   */
  async getPendingOnboardingDocuments(params?: { page?: number; limit?: number }): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<any>('/onboarding/admin/documents/pending', params);
      
      if (!response.success || !response.data) {
        return { ...response, data: { documents: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } } };
      }

      const data = response.data.data || response.data;
      const documents = (Array.isArray(data) ? data : (data.documents || data.data || [])) as PendingDocument[];

      // Normalize documents
      const normalizedDocs: PendingDocument[] = documents.map((doc: any) => ({
        id: doc.id || '',
        userId: doc.userId || doc.user_id,
        organizationId: doc.organizationId || doc.organization_id,
        user: doc.user ? {
          id: doc.user.id || '',
          email: doc.user.email || '',
          username: doc.user.username || '',
        } : undefined,
        organization: doc.organization ? {
          id: doc.organization.id || '',
          name: doc.organization.name || '',
        } : undefined,
        documentType: doc.documentType || doc.document_type || '',
        fileName: doc.fileName || doc.file_name || '',
        fileUrl: doc.fileUrl || doc.file_url,
        uploadedAt: doc.uploadedAt || doc.uploaded_at,
        createdAt: doc.createdAt || doc.created_at,
      }));

      return {
        success: true,
        data: {
          documents: normalizedDocs,
          pagination: {
            page: (data.pagination?.page || 1),
            limit: (data.pagination?.limit || 20),
            total: (data.pagination?.total || 0),
            totalPages: (data.pagination?.totalPages || data.pagination?.total_pages || 0),
            hasNext: data.pagination?.hasNext || ((data.pagination?.page || 1) < (data.pagination?.totalPages || data.pagination?.total_pages || 0)),
            hasPrev: data.pagination?.hasPrev || ((data.pagination?.page || 1) > 1),
          },
        },
      };
    } catch (error: any) {
      console.error('Error fetching pending onboarding documents:', error);
      return {
        success: false,
        error: {
          code: 'PENDING_DOCS_ERROR',
          message: error?.message || 'Failed to fetch pending documents',
        },
        data: { documents: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      };
    }
  }

  /**
   * Verify onboarding document (approve or reject)
   * PUT /api/onboarding/admin/documents/:id/verify
   */
  async verifyOnboardingDocument(
    docId: string,
    data: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }
  ): Promise<ApiResponse<OnboardingDocument>> {
    try {
      const requestData = {
        status: data.status,
        rejectionReason: data.rejectionReason,
      };

      const response = await apiClient.put<any>(`/onboarding/admin/documents/${docId}/verify`, requestData);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<OnboardingDocument>;
      }

      const raw = response.data.data || response.data;
      const document: OnboardingDocument = {
        id: raw.id || docId,
        userId: raw.userId || raw.user_id,
        organizationId: raw.organizationId || raw.organization_id,
        documentType: raw.documentType || raw.document_type || '',
        fileName: raw.fileName || raw.file_name || '',
        status: raw.status || data.status,
        fileUrl: raw.fileUrl || raw.file_url,
        uploadedAt: raw.uploadedAt || raw.uploaded_at,
        verifiedAt: raw.verifiedAt || raw.verified_at || new Date().toISOString(),
        verifiedBy: raw.verifiedBy || raw.verified_by,
        rejectionReason: raw.rejectionReason || raw.rejection_reason || data.rejectionReason,
      };

      return {
        success: true,
        data: document,
      };
    } catch (error: any) {
      console.error('Error verifying document:', error);
      return {
        success: false,
        error: {
          code: 'DOC_VERIFY_ERROR',
          message: error?.message || 'Failed to verify document',
        },
      };
    }
  }

  /**
   * Get pending onboarding steps
   * GET /api/onboarding/admin/steps/pending
   */
  async getPendingOnboardingSteps(params?: { page?: number; limit?: number }): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<any>('/onboarding/admin/steps/pending', params);
      
      if (!response.success || !response.data) {
        return { ...response, data: { steps: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } } };
      }

      const data = response.data.data || response.data;
      const steps = (Array.isArray(data) ? data : (data.steps || data.data || [])) as PendingStep[];

      // Normalize steps
      const normalizedSteps: PendingStep[] = steps.map((step: any) => ({
        id: step.id || '',
        userId: step.userId || step.user_id,
        organizationId: step.organizationId || step.organization_id,
        user: step.user ? {
          id: step.user.id || '',
          email: step.user.email || '',
          username: step.user.username || '',
        } : undefined,
        organization: step.organization ? {
          id: step.organization.id || '',
          name: step.organization.name || '',
        } : undefined,
        stepName: step.stepName || step.step_name || '',
        submittedAt: step.submittedAt || step.submitted_at,
        createdAt: step.createdAt || step.created_at,
        data: step.data || step.submissionData || step.submission_data,
      }));

      return {
        success: true,
        data: {
          steps: normalizedSteps,
          pagination: {
            page: (data.pagination?.page || 1),
            limit: (data.pagination?.limit || 20),
            total: (data.pagination?.total || 0),
            totalPages: (data.pagination?.totalPages || data.pagination?.total_pages || 0),
            hasNext: data.pagination?.hasNext || ((data.pagination?.page || 1) < (data.pagination?.totalPages || data.pagination?.total_pages || 0)),
            hasPrev: data.pagination?.hasPrev || ((data.pagination?.page || 1) > 1),
          },
        },
      };
    } catch (error: any) {
      console.error('Error fetching pending onboarding steps:', error);
      return {
        success: false,
        error: {
          code: 'PENDING_STEPS_ERROR',
          message: error?.message || 'Failed to fetch pending steps',
        },
        data: { steps: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      };
    }
  }

  /**
   * Approve or reject onboarding step
   * PUT /api/onboarding/admin/steps/:id/approve
   */
  async approveOnboardingStep(
    stepId: string,
    data: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }
  ): Promise<ApiResponse<OnboardingStep>> {
    try {
      const requestData = {
        status: data.status,
        rejectionReason: data.rejectionReason,
      };

      const response = await apiClient.put<any>(`/onboarding/admin/steps/${stepId}/approve`, requestData);
      
      if (!response.success || !response.data) {
        return response as ApiResponse<OnboardingStep>;
      }

      const raw = response.data.data || response.data;
      const step: OnboardingStep = {
        id: raw.id || stepId,
        userId: raw.userId || raw.user_id,
        organizationId: raw.organizationId || raw.organization_id,
        stepName: raw.stepName || raw.step_name || '',
        status: raw.status || data.status,
        submittedAt: raw.submittedAt || raw.submitted_at,
        approvedAt: raw.approvedAt || raw.approved_at || new Date().toISOString(),
        approvedBy: raw.approvedBy || raw.approved_by,
        rejectionReason: raw.rejectionReason || raw.rejection_reason || data.rejectionReason,
        data: raw.data || raw.submissionData || raw.submission_data,
      };

      return {
        success: true,
        data: step,
      };
    } catch (error: any) {
      console.error('Error approving onboarding step:', error);
      return {
        success: false,
        error: {
          code: 'STEP_APPROVE_ERROR',
          message: error?.message || 'Failed to approve onboarding step',
        },
      };
    }
  }
}

export const adminService = new AdminService();
