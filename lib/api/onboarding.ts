/**
 * Onboarding API Service
 */

import { apiClient, ApiResponse } from './client';

export interface StakeholderData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  region?: string | null;
  country: string;
}

export interface BusinessActivityData {
  businessName: string;
  businessType: string;
  industry: string;
  businessRegistrationNumber: string;
  vatNumber?: string | null;
  website?: string | null;
  description: string;
}

export interface PaymentMethodsData {
  preferredMethods: string[];
}

export interface OnboardingStep {
  step_name: string;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingProgress {
  completedSteps?: string[];
  currentStep?: string;
  isComplete: boolean;
  progress?: number;
  progressPercentage?: number;
  steps?: OnboardingStep[];
  organizationName?: string;
}

class OnboardingService {
  async submitStakeholderInfo(data: StakeholderData, organizationId?: string): Promise<ApiResponse<void>> {
    const params = organizationId ? { organizationId } : undefined;
    return apiClient.post<void>('/onboarding/stakeholder', data, params);
  }

  async submitBusinessActivity(data: BusinessActivityData, organizationId?: string): Promise<ApiResponse<void>> {
    // Use the correct Swagger endpoint: POST /api/onboarding/business
    const params = organizationId ? { organizationId } : undefined;
    return apiClient.post<void>('/onboarding/business', data, params);
  }

  async submitPaymentMethods(data: PaymentMethodsData, organizationId?: string): Promise<ApiResponse<void>> {
    const params = organizationId ? { organizationId } : undefined;
    return apiClient.post<void>('/onboarding/payment-methods', data, params);
  }

  async uploadIDDocument(formData: FormData, organizationId?: string): Promise<ApiResponse<void>> {
    const params = organizationId ? { organizationId } : undefined;
    return apiClient.upload<void>('/onboarding/id-document', formData, params);
  }

  // Swagger path: POST /onboarding/business
  async submitBusiness(data: BusinessActivityData, organizationId?: string): Promise<ApiResponse<void>> {
    const params = organizationId ? { organizationId } : undefined;
    return apiClient.post<void>('/onboarding/business', data, params);
  }

  // Swagger path: POST /onboarding/documents (multipart)
  async uploadDocument(formData: FormData, organizationId?: string): Promise<ApiResponse<void>> {
    const params = organizationId ? { organizationId } : undefined;
    return apiClient.upload<void>('/onboarding/documents', formData, params);
  }

  // Swagger path: GET /onboarding/documents
  async getDocuments(params?: { page?: number; limit?: number }): Promise<ApiResponse<any>> {
    return apiClient.get<any>('/onboarding/documents', params);
  }

  // Swagger path: DELETE /onboarding/documents/:id
  async deleteDocument(documentId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/onboarding/documents/${documentId}`);
  }

  async getProgress(params?: { organizationId?: string }): Promise<ApiResponse<OnboardingProgress>> {
    return apiClient.get<OnboardingProgress>('/onboarding/progress', params);
  }

  /**
   * Get organization onboarding progress
   * GET /api/onboarding/organizations/:organizationId/progress
   */
  async getOrganizationProgress(organizationId: string): Promise<ApiResponse<OnboardingProgress>> {
    return apiClient.get<OnboardingProgress>(`/onboarding/organizations/${organizationId}/progress`);
  }

  /**
   * Get organization documents
   * GET /api/onboarding/organizations/:organizationId/documents
   */
  async getOrganizationDocuments(organizationId: string): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`/onboarding/organizations/${organizationId}/documents`);
  }

  // ========== ADMIN ENDPOINTS ==========

  /**
   * [Admin] Get all pending documents for review
   * GET /api/onboarding/admin/documents/pending
   */
  async getPendingDocuments(): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get<any>('/onboarding/admin/documents/pending');
      
      if (!response.success || !response.data) {
        return { ...response, data: [] };
      }

      const data = response.data.data || response.data;
      const documents = Array.isArray(data) ? data : (data.documents || []);
      
      return {
        success: true,
        data: documents,
      };
    } catch (error: any) {
      console.error('Error fetching pending documents:', error);
      return {
        success: false,
        error: {
          code: 'PENDING_DOCUMENTS_ERROR',
          message: error?.message || 'Failed to fetch pending documents',
        },
        data: [],
      };
    }
  }

  /**
   * [Admin] Verify document (approve or reject)
   * PUT /api/onboarding/admin/documents/:id/verify
   */
  async verifyDocument(
    documentId: string,
    data: {
      status: 'APPROVED' | 'REJECTED';
      rejection_reason?: string;
      admin_notes?: string;
    }
  ): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put<any>(`/onboarding/admin/documents/${documentId}/verify`, data);
      
      if (!response.success) {
        return response;
      }

      const document = response.data.data || response.data;
      return {
        success: true,
        data: document,
      };
    } catch (error: any) {
      console.error('Error verifying document:', error);
      return {
        success: false,
        error: {
          code: 'DOCUMENT_VERIFY_ERROR',
          message: error?.message || 'Failed to verify document',
        },
      };
    }
  }

  /**
   * [Admin] Get all pending onboarding steps for review
   * GET /api/onboarding/admin/steps/pending
   */
  async getPendingSteps(): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get<any>('/onboarding/admin/steps/pending');
      
      if (!response.success || !response.data) {
        return { ...response, data: [] };
      }

      const data = response.data.data || response.data;
      const steps = Array.isArray(data) ? data : (data.steps || []);
      
      return {
        success: true,
        data: steps,
      };
    } catch (error: any) {
      console.error('Error fetching pending steps:', error);
      return {
        success: false,
        error: {
          code: 'PENDING_STEPS_ERROR',
          message: error?.message || 'Failed to fetch pending steps',
        },
        data: [],
      };
    }
  }

  /**
   * [Admin] Approve or reject onboarding step
   * PUT /api/onboarding/admin/steps/:id/approve
   */
  async approveStep(
    stepId: string,
    data: {
      approved: boolean;
      rejection_reason?: string;
      admin_notes?: string;
    }
  ): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.put<any>(`/onboarding/admin/steps/${stepId}/approve`, data);
      
      if (!response.success) {
        return response;
      }

      const step = response.data.data || response.data;
      return {
        success: true,
        data: step,
      };
    } catch (error: any) {
      console.error('Error approving step:', error);
      return {
        success: false,
        error: {
          code: 'STEP_APPROVE_ERROR',
          message: error?.message || 'Failed to approve/reject step',
        },
      };
    }
  }
}

export const onboardingService = new OnboardingService();


