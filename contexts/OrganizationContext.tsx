'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { organizationService } from '@/lib/api';
import { useAuth } from './AuthContext';

interface Organization {
  id?: string;
  name: string;
  legalForm: string;
  registrationNumber: string;
  address: string;
  region: string;
  city: string;
  country: string;
  countryName: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  loading: boolean;
  setOrganization: (org: Organization | null) => Promise<void>;
  updateOrganization: (updates: Partial<Organization>) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganizationState] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Load organization from backend database on mount - only if authenticated
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Only fetch if user is authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadOrganization = async (retryCount = 0) => {
      const MAX_RETRIES = 10;
      const RETRY_DELAY_MS = 800;
      
      try {
        // Check if token exists before making request
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) {
          console.warn('[OrganizationContext] No access token found, skipping organization fetch');
          setLoading(false);
          return;
        }
        
        // Check for API credentials (api_user and api_password from profile)
        // These are REQUIRED for authenticated requests to /organizations
        const apiUser = localStorage.getItem('apiUser');
        const apiPassword = localStorage.getItem('apiPassword');
        
        if (!apiUser || !apiPassword) {
          if (retryCount < MAX_RETRIES) {
            console.log(`[OrganizationContext] API credentials not found yet (attempt ${retryCount + 1}/${MAX_RETRIES}). Waiting for profile fetch to complete...`);
            // Don't set loading to false yet - we're still waiting
            setTimeout(() => {
              loadOrganization(retryCount + 1);
            }, RETRY_DELAY_MS);
            return;
          } else {
            console.warn('[OrganizationContext] API credentials still not available after retries. User may need to log out and log in again.');
            setLoading(false);
            return;
          }
        }
        
        console.log(`[OrganizationContext] API credentials found (${apiUser.substring(0, 8)}...), fetching organizations...`);

        // Fetch user's organizations from backend
        const response = await organizationService.listOrganizations({ limit: 1 });
        
        if (response.success && response.data && response.data.length > 0) {
          // Use the first organization (or you can implement logic to select the active one)
          const org = response.data[0];
          const orgData: Organization = {
            id: org.id,
            name: org.name,
            legalForm: org.legalForm || org.type || '',
            registrationNumber: org.registrationNumber || '',
            address: org.address || '',
            region: org.region || '',
            city: org.city || '',
            country: org.country || 'CM',
            countryName: org.countryName || 'Cameroon',
          };
          setOrganizationState(orgData);
          
          // Store organization ID for easy access
          if (org.id && typeof window !== 'undefined') {
            localStorage.setItem('currentOrganizationId', org.id);
          }
        } else if (response.error?.code === 'AUTH_REQUIRED' || response.error?.code === 'AUTH_EXPIRED') {
          // Token is invalid or expired - don't log error, just skip loading
          // This is expected if user hasn't logged in yet or token expired
          console.warn('Authentication required for organization fetch - this is normal if no organizations exist yet');
        } else if (response.error) {
          // Other errors (like 401) - might be normal if user has no organizations
          // Only log if it's not an auth error
          if (response.error.code !== 'AUTH_REQUIRED' && response.error.code !== 'AUTH_EXPIRED') {
            console.warn('Could not load organizations:', response.error.message);
          }
        }
      } catch (error) {
        // Only log non-auth errors
        if (error && typeof error === 'object' && 'code' in error && (error as any).code !== 'AUTH_REQUIRED' && (error as any).code !== 'AUTH_EXPIRED') {
          console.error('Error loading organization from backend:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    // Listen for an explicit signal that api credentials have been stored by AuthContext
    const eventHandler = () => {
      if (typeof window !== 'undefined') {
        console.log('[OrganizationContext] Received apiCredentialsAvailable event, attempting to load organization now...');
        loadOrganization(0);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('apiCredentialsAvailable', eventHandler as EventListener);
    }

    // Kick off initial attempt
    loadOrganization(0);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('apiCredentialsAvailable', eventHandler as EventListener);
      }
    };
  }, [isAuthenticated, authLoading]);

  const setOrganization = async (org: Organization | null) => {
    setOrganizationState(org);
    
    // If organization is being set, it should already be saved to backend via API
    // No need to store in localStorage - backend is the source of truth
    if (org && org.id) {
      // Optionally, you can verify the organization exists in backend
      // or update it if needed, but typically it's already saved via createOrganization
      try {
        const response = await organizationService.getOrganizationById(org.id);
        if (response.success && response.data) {
          // Sync with latest data from backend
          const backendOrg = response.data;
          setOrganizationState({
            id: backendOrg.id,
            name: backendOrg.name,
            legalForm: backendOrg.legalForm || backendOrg.type || '',
            registrationNumber: backendOrg.registrationNumber || '',
            address: backendOrg.address || '',
            region: backendOrg.region || '',
            city: backendOrg.city || '',
            country: backendOrg.country || 'CM',
            countryName: backendOrg.countryName || 'Cameroon',
          });
        }
      } catch (error) {
        console.warn('Could not verify organization in backend:', error);
        // Still set the organization state even if verification fails
      }
    }
  };

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (organization && organization.id) {
      try {
        // Update organization in backend database
        const response = await organizationService.updateOrganization(organization.id, {
          name: updates.name,
          address: updates.address,
          city: updates.city,
          region: updates.region,
        });
        
        if (response.success && response.data) {
          // Update state with data from backend
          const updatedOrg = response.data;
          const updated: Organization = {
            id: updatedOrg.id || organization.id,
            name: updatedOrg.name || organization.name,
            legalForm: updatedOrg.legalForm || organization.legalForm,
            registrationNumber: updatedOrg.registrationNumber || organization.registrationNumber,
            address: updatedOrg.address || organization.address,
            region: updatedOrg.region || organization.region,
            city: updatedOrg.city || organization.city,
            country: updatedOrg.country || organization.country,
            countryName: updatedOrg.countryName || organization.countryName,
          };
          setOrganizationState(updated);
        } else {
          // If backend update fails, still update local state optimistically
          const updated = { ...organization, ...updates };
          setOrganizationState(updated);
          console.warn('Failed to update organization in backend:', response.error);
        }
      } catch (error) {
        // If update fails, still update local state optimistically
        const updated = { ...organization, ...updates };
        setOrganizationState(updated);
        console.error('Error updating organization:', error);
      }
    } else if (organization) {
      // If no ID, just update local state (shouldn't happen normally)
      const updated = { ...organization, ...updates };
      setOrganizationState(updated);
    }
  };

  return (
    <OrganizationContext.Provider value={{ organization, loading, setOrganization, updateOrganization }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}

