/**
 * Organization API Service
 */

import { apiClient, ApiResponse } from './client';

export interface Organization {
  name: string;
  legalForm?: string;
  registrationNumber?: string;
  address?: string;
  region?: string;
  city?: string;
  country?: string;
  countryName?: string;
}

export interface UpdateOrganizationData {
  name?: string;
  address?: string;
  city?: string;
  region?: string;
}

class OrganizationService {
  async getOrganization(): Promise<ApiResponse<Organization>> {
    return apiClient.get<Organization>('/organization');
  }

  async updateOrganization(data: UpdateOrganizationData): Promise<ApiResponse<Organization>> {
    return apiClient.put<Organization>('/organization', data);
  }
}

export const organizationService = new OrganizationService();

