'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building, X, Spinner } from '@phosphor-icons/react';
import { organizationService } from '@/lib/api';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

interface OrganizationSetupProps {
  onNext: () => void;
  onSkip: () => void;
  onPrevious?: () => void; // Optional for type compatibility
}

export default function OrganizationSetup({ onNext, onSkip }: OrganizationSetupProps) {
  const { setOrganization } = useOrganization();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    registration_number: '',
    region: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdOrg, setCreatedOrg] = useState<any>(null);
  const [credentialsReady, setCredentialsReady] = useState(false);
  const [checkingCredentials, setCheckingCredentials] = useState(true);

  // Wait for API credentials to be available (they come from profile fetch after login)
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkCredentials = () => {
      const apiUser = localStorage.getItem('apiUser');
      const apiPassword = localStorage.getItem('apiPassword');
      const token = localStorage.getItem('accessToken');
      
      if (apiUser && apiPassword && token) {
        console.log('[OrganizationSetup] Credentials ready:', {
          hasApiUser: !!apiUser,
          apiUserPreview: apiUser?.substring(0, 8) + '...',
          hasApiPassword: !!apiPassword,
          hasToken: !!token,
        });
        setCredentialsReady(true);
        setCheckingCredentials(false);
        setError('');
        return true;
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        console.warn('[OrganizationSetup] API credentials not available after', maxAttempts, 'attempts');
        setCheckingCredentials(false);
        if (!token) {
          setError('You must be logged in to create an organization. Please log in and try again.');
        } else {
          setError('API credentials are loading. Please wait a moment and try again.');
        }
        return false;
      }
      
      console.log(`[OrganizationSetup] Waiting for credentials (attempt ${attempts}/${maxAttempts})...`);
      return false;
    };
    
    // Check immediately
    if (!checkCredentials()) {
      // Then poll every 500ms
      const interval = setInterval(() => {
        if (checkCredentials()) {
          clearInterval(interval);
        }
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check authentication before making request
    const token = localStorage.getItem('accessToken');
    const apiUser = localStorage.getItem('apiUser');
    const apiPassword = localStorage.getItem('apiPassword');
    
    console.log('[OrganizationSetup] Submit - checking credentials:', {
      hasToken: !!token,
      hasApiUser: !!apiUser,
      apiUserPreview: apiUser?.substring(0, 8) + '...',
      hasApiPassword: !!apiPassword,
      apiPasswordLength: apiPassword?.length,
    });
    
    if (!token) {
      setError('Authentication required. Please log in and try again.');
      return;
    }
    
    // Check for API credentials (needed for organization creation)
    if (!apiUser || !apiPassword) {
      setError('API credentials not loaded yet. Please wait a moment and try again, or log out and log in again.');
      return;
    }
    
    // Verify credentials look valid (should be 32-char hex strings, not email)
    if (apiUser.includes('@')) {
      console.error('[OrganizationSetup] Invalid apiUser detected (contains @, likely email):', apiUser);
      setError('Invalid API credentials detected. Please log out and log in again to refresh your session.');
      return;
    }
    
    setLoading(true);

    try {
      // Send data in exact format that backend accepts (tested via console)
      const response = await organizationService.createOrganization({
        name: formData.name,
        registration_number: formData.registration_number || formData.type || 'N/A',
        region: formData.region || 'N/A',
        city: formData.city || 'N/A',
        address: formData.address || 'N/A',
        phone_number: formData.phone || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
        description: formData.description || `${formData.name} organization`,
      });

      if (response.success && response.data) {
        const org = response.data;
        setCreatedOrg(org);
        
        // Organization is already saved to backend database via the API call
        // Update organization context with the data from backend
        const orgData = {
          id: org.id,
          name: org.name,
          legalForm: org.type || org.legalForm || '',
          registrationNumber: org.registrationNumber || '',
          address: org.address || '',
          region: org.region || '',
          city: org.city || '',
          country: org.country || 'CM',
          countryName: org.countryName || 'Cameroon',
        };
        
        // Set organization in context (context will handle backend sync if needed)
        await setOrganization(orgData);
        
        // Store organization ID in localStorage for onboarding steps
        if (org.id && typeof window !== 'undefined') {
          localStorage.setItem('currentOrganizationId', org.id);
        }
        
        onNext();
      } else {
        // Enhanced error handling
        const errorCode = response.error?.code;
        let errorMessage = response.error?.message || 'Failed to create organization. Please try again.';
        
        // Provide more specific error messages
        if (errorCode === 'AUTH_REQUIRED' || errorCode === 'AUTH_EXPIRED' || response.error?.details?.status === 401) {
          errorMessage = 'Your session has expired or authentication failed. Please log out and log in again, then try creating the organization.';
        } else if (errorCode === 'FORBIDDEN' || errorCode === 'HTTP_403') {
          errorMessage = 'Access forbidden. Please check your authentication token or contact support.';
        } else if (errorCode === 'NETWORK_ERROR') {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (errorCode === 'API_KEY_REQUIRED') {
          errorMessage = 'API key is required. The backend may need to implement the credentials endpoint, or you may need to set up API credentials manually.';
        }
        
        console.error('Organization creation failed:', {
          error: response.error,
          code: errorCode,
          details: response.error?.details,
        });
        
        setError(errorMessage);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Building className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Organization</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Create an organization to get started. This is required for onboarding and payment processing.
            </p>
          </div>
        </div>
      </div>

      {checkingCredentials && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded flex items-center gap-2">
          <Spinner className="w-4 h-4 animate-spin" />
          Loading authentication credentials...
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            placeholder="Enter your business name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Type <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
          >
            <option value="">Select business type</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
            <option value="SARL">SARL (Limited Liability Company)</option>
            <option value="SA">SA (Public Limited Company)</option>
            <option value="SNC">SNC (General Partnership)</option>
            <option value="SCS">SCS (Limited Partnership)</option>
            <option value="SCA">SCA (Partnership Limited by Shares)</option>
            <option value="GIE">Economic Interest Grouping (GIE)</option>
            <option value="Association">Association</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Region <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            >
              <option value="">Select region</option>
              <option value="Adamaoua">Adamaoua</option>
              <option value="Centre">Centre</option>
              <option value="East">East</option>
              <option value="Far North">Far North</option>
              <option value="Littoral">Littoral</option>
              <option value="North">North</option>
              <option value="Northwest">Northwest</option>
              <option value="South">South</option>
              <option value="Southwest">Southwest</option>
              <option value="West">West</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
              placeholder="Enter city"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            placeholder="Enter business address"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
              placeholder="+237 6 12 34 56 78"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
              placeholder="business@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            placeholder="https://www.example.com"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-0 pt-4 sm:pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || checkingCredentials || !credentialsReady}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-1 text-base bg-green-500 text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {(loading || checkingCredentials) && <Spinner className="w-4 h-4 animate-spin" />}
            {checkingCredentials ? 'Initializing...' : loading ? 'Creating...' : 'Create Organization & Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}



