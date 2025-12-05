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
  paymentMethods: string[];
}

export interface OnboardingProgress {
  completedSteps: string[];
  currentStep: string;
  isComplete: boolean;
  progressPercentage: number;
}

class OnboardingService {
  async submitStakeholderInfo(data: StakeholderData): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/onboarding/stakeholder', data);
  }

  async submitBusinessActivity(data: BusinessActivityData): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/onboarding/business-activity', data);
  }

  async submitPaymentMethods(data: PaymentMethodsData): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/onboarding/payment-methods', data);
  }

  async uploadIDDocument(formData: FormData): Promise<ApiResponse<void>> {
    return apiClient.upload<void>('/onboarding/id-document', formData);
  }

  async getProgress(): Promise<ApiResponse<OnboardingProgress>> {
    return apiClient.get<OnboardingProgress>('/onboarding/progress');
  }
}

export const onboardingService = new OnboardingService();


