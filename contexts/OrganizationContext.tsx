'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Organization {
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
  setOrganization: (org: Organization | null) => void;
  updateOrganization: (updates: Partial<Organization>) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganizationState] = useState<Organization | null>(null);

  // Load organization from localStorage on mount
  useEffect(() => {
    // Check both storage keys for compatibility
    const storedOrg = localStorage.getItem('organization') || localStorage.getItem('organization_data');
    if (storedOrg) {
      try {
        const parsedOrg = JSON.parse(storedOrg);
        setOrganizationState(parsedOrg);
        // Sync to both keys
        localStorage.setItem('organization', storedOrg);
        localStorage.setItem('organization_data', storedOrg);
      } catch (error) {
        console.error('Error parsing stored organization:', error);
        localStorage.removeItem('organization');
        localStorage.removeItem('organization_data');
      }
    }
  }, []);

  const setOrganization = (org: Organization | null) => {
    setOrganizationState(org);
    if (org) {
      const orgJson = JSON.stringify(org);
      localStorage.setItem('organization', orgJson);
      localStorage.setItem('organization_data', orgJson);
    } else {
      localStorage.removeItem('organization');
      localStorage.removeItem('organization_data');
    }
  };

  const updateOrganization = (updates: Partial<Organization>) => {
    if (organization) {
      const updated = { ...organization, ...updates };
      setOrganizationState(updated);
      const orgJson = JSON.stringify(updated);
      localStorage.setItem('organization', orgJson);
      localStorage.setItem('organization_data', orgJson);
    }
  };

  return (
    <OrganizationContext.Provider value={{ organization, setOrganization, updateOrganization }}>
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

