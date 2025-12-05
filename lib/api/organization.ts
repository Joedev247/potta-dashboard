/**
 * Organization API Service
 */

import { ApiResponse } from './client';

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

// Mock data storage key
const STORAGE_KEY = 'organization_data';

// Initialize default organization if not exists
function initializeOrganization(): Organization {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // If parsing fails, create default
    }
  }
  
  const defaultOrg: Organization = {
    name: 'Codev',
    legalForm: 'SARL',
    registrationNumber: 'RC/DLA/2024/A/12345',
    address: '123 Business Street',
    city: 'Douala',
    region: 'Littoral',
    country: 'CM',
    countryName: 'Cameroon',
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultOrg));
  return defaultOrg;
}

class OrganizationService {
  async getOrganization(): Promise<ApiResponse<Organization>> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const organization = initializeOrganization();
      
      return {
        success: true,
        data: organization,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch organization',
      };
    }
  }

  async updateOrganization(data: UpdateOrganizationData): Promise<ApiResponse<Organization>> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const current = initializeOrganization();
      const updated: Organization = {
        ...current,
        ...data,
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      return {
        success: true,
        data: updated,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update organization',
      };
    }
  }
}

export const organizationService = new OrganizationService();


