'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Copy, 
  Eye, 
  EyeSlash, 
  PencilSimple, 
  Trash, 
  ArrowClockwise, 
  CheckCircle, 
  XCircle, 
  X,
  WarningCircle,
  Spinner,
  Building,
  User,
  Globe,
  Code,
  Calendar,
  TrendUp,
  ShieldCheck
} from '@phosphor-icons/react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { applicationsService, type Application } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/utils/format';

export default function ApplicationsPage() {
  const { organization } = useOrganization();
  
  // State
  const [userApps, setUserApps] = useState<Application[]>([]);
  const [orgApps, setOrgApps] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [showApiSecret, setShowApiSecret] = useState<string | null>(null);
  const [apiSecretStore, setApiSecretStore] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState<string | null>(null);
  const [appLoading, setAppLoading] = useState(false);
  const [appError, setAppError] = useState('');
  const [appSuccess, setAppSuccess] = useState('');
  
  const [appFormData, setAppFormData] = useState({
    name: '',
    description: '',
    environment: 'SANDBOX' as 'SANDBOX' | 'PROD',
    organization_id: undefined as string | undefined,
    webhookUrl: '',
    defaultCurrency: '',
  });

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    setAppsLoading(true);
    setAppError(''); // Clear previous errors
    try {
      console.log('[Applications] Starting fetch...', { hasOrganization: !!organization?.id, orgId: organization?.id });
      
      // WORKAROUND: Backend filtering by organization_id is broken - it returns wrong apps
      // Solution: Fetch ALL apps and filter by 'type' field on frontend
      // This ensures we get all apps regardless of backend filtering issues
      
      // Fetch all applications (no organization_id filter - backend filtering is broken)
      const allAppsResponse = await applicationsService.listApplications();
      console.log('[Applications] All apps response:', {
        success: allAppsResponse.success,
        hasData: !!allAppsResponse.data,
        dataType: typeof allAppsResponse.data,
        error: allAppsResponse.error,
        fullResponse: allAppsResponse,
      });
      
      // Also try fetching with organization_id (for debugging - backend may fix this later)
      const orgResponse = organization?.id 
        ? await applicationsService.listApplications({ organization_id: organization.id })
        : null;
      
      if (orgResponse) {
        console.log('[Applications] Org query response (for debugging):', {
          success: orgResponse.success,
          hasData: !!orgResponse.data,
          dataType: typeof orgResponse.data,
          error: orgResponse.error,
          fullResponse: orgResponse,
        });
      }

      // Get raw application arrays - handle different response structures
      // WORKAROUND: Use allAppsResponse as primary source since backend filtering is broken
      let allAppsRaw: Application[] = [];
      if (allAppsResponse.success && allAppsResponse.data) {
        if (Array.isArray(allAppsResponse.data)) {
          // Backend returned array directly
          allAppsRaw = allAppsResponse.data;
        } else if (allAppsResponse.data.applications && Array.isArray(allAppsResponse.data.applications)) {
          // Backend returned { applications: [...] }
          allAppsRaw = allAppsResponse.data.applications;
        } else if ((allAppsResponse.data as any)?.data && Array.isArray((allAppsResponse.data as any).data)) {
          // Backend returned nested { data: { applications: [...] } }
          allAppsRaw = (allAppsResponse.data as any).data;
        }
      } else if (allAppsResponse.error) {
        console.error('[Applications] Apps fetch failed:', allAppsResponse.error);
        setAppError(`Failed to load applications: ${allAppsResponse.error.message || 'Unknown error'}`);
      }
      
      // Also collect apps from org query for comparison/debugging
      let orgAppsRaw: Application[] = [];
      if (organization?.id && orgResponse?.success && orgResponse.data) {
        if (Array.isArray(orgResponse.data)) {
          orgAppsRaw = orgResponse.data;
        } else if (orgResponse.data.applications && Array.isArray(orgResponse.data.applications)) {
          orgAppsRaw = orgResponse.data.applications;
        } else if ((orgResponse.data as any)?.data && Array.isArray((orgResponse.data as any).data)) {
          orgAppsRaw = (orgResponse.data as any).data;
        }
      }
      
      // Use allAppsRaw as the primary source (backend filtering is broken)
      const userAppsRaw = allAppsRaw; // For logging compatibility

      console.log('[Applications] Raw apps extracted:', {
        allAppsRaw: allAppsRaw.length,
        orgQueryApps: orgAppsRaw.length,
        allAppsSample: allAppsRaw[0] || null,
        orgQuerySample: orgAppsRaw[0] || null,
        note: 'Using allAppsRaw as primary source (backend filtering by organization_id is broken)',
      });

      // Filter applications by type field (NEW: Backend now includes 'type' field)
      // Personal apps: type === 'PERSONAL'
      // Organization apps: type === 'ORGANIZATION'
      
      // WORKAROUND: Backend filtering is broken, so we use allAppsRaw and filter by type
      // Collect all unique apps (combine allAppsRaw and orgAppsRaw to catch any differences)
      const allAppsMap = new Map<string, Application>();
      [...allAppsRaw, ...orgAppsRaw].forEach(app => {
        if (!allAppsMap.has(app.id)) {
          allAppsMap.set(app.id, app);
        }
      });
      
      const allApps = Array.from(allAppsMap.values());
      
      // Log raw API responses to see what the backend is actually returning
      console.log('[Applications] Raw API responses:', {
        userAppsRawCount: userAppsRaw.length,
        orgAppsRawCount: orgAppsRaw.length,
        userAppsRawIds: userAppsRaw.map(a => ({ id: a.id, name: a.name, type: a.type })),
        orgAppsRawIds: orgAppsRaw.map(a => ({ id: a.id, name: a.name, type: a.type })),
        userAppsRawSample: userAppsRaw[0] ? {
          id: userAppsRaw[0].id,
          name: userAppsRaw[0].name,
          type: userAppsRaw[0].type,
          allKeys: Object.keys(userAppsRaw[0]),
          fullApp: userAppsRaw[0],
        } : null,
        orgAppsRawSample: orgAppsRaw[0] ? {
          id: orgAppsRaw[0].id,
          name: orgAppsRaw[0].name,
          type: orgAppsRaw[0].type,
          allKeys: Object.keys(orgAppsRaw[0]),
          fullApp: orgAppsRaw[0],
        } : null,
      });
      
      // Helper to normalize type field (handle case variations)
      const normalizeType = (type: any): string | null => {
        if (!type) return null;
        const normalized = String(type).toUpperCase().trim();
        return normalized === 'PERSONAL' || normalized === 'ORGANIZATION' ? normalized : null;
      };
      
      // Check if backend is returning wrong apps (backend filtering issue)
      const orgAppsInUserQuery = userAppsRaw.filter(app => normalizeType(app.type) === 'ORGANIZATION');
      const personalAppsInOrgQuery = orgAppsRaw.filter(app => normalizeType(app.type) === 'PERSONAL');
      
      if (orgAppsInUserQuery.length > 0) {
        console.warn('[Applications] BACKEND ISSUE: Organization apps found in user query (should not happen):', orgAppsInUserQuery.map(a => ({ id: a.id, name: a.name, type: a.type })));
      }
      
      if (personalAppsInOrgQuery.length > 0) {
        console.warn('[Applications] BACKEND ISSUE: Personal apps found in org query (backend not filtering correctly):', personalAppsInOrgQuery.map(a => ({ id: a.id, name: a.name, type: a.type })));
      }
      
      // Log apps with their type for debugging
      console.log('[Applications] Type field analysis:', {
        totalUniqueApps: allApps.length,
        currentOrgId: organization?.id,
        appsWithType: allApps.map(app => ({
          id: app.id,
          name: app.name,
          type: app.type,
          typeType: typeof app.type,
          hasType: !!app.type,
          typeEqualsPersonal: app.type === 'PERSONAL',
          typeEqualsOrganization: app.type === 'ORGANIZATION',
          allKeys: Object.keys(app),
        })),
      });
      
      // Filter personal apps: type === 'PERSONAL'
      // Also check if type is missing - in that case, apps from user query without org_id are personal
      const allUserApps = allApps.filter((app: Application) => {
        const normalizedType = normalizeType(app.type);
        
        // Primary check: use type field if available
        if (normalizedType === 'PERSONAL') {
          console.log(`[Applications] App ${app.name} (${app.id}): type=${app.type} (normalized: ${normalizedType}), isPersonal=true (from type field)`);
          return true;
        }
        
        // Fallback: if type is missing or invalid, assume personal (safer default)
        if (!normalizedType) {
          console.log(`[Applications] App ${app.name} (${app.id}): type=${app.type} (invalid/missing), defaulting to PERSONAL`);
          return true; // Default to personal if type is missing
        }
        
        console.log(`[Applications] App ${app.name} (${app.id}): type=${app.type} (normalized: ${normalizedType}), isPersonal=false`);
        return false;
      });
      
      // Filter organization apps: type === 'ORGANIZATION'
      // Also check if type is missing - in that case, apps from org query are organization apps
      const allOrgApps = allApps.filter((app: Application) => {
        if (!organization?.id) {
          return false;
        }
        
        const normalizedType = normalizeType(app.type);
        
        // Primary check: use type field if available
        if (normalizedType === 'ORGANIZATION') {
          console.log(`[Applications] App ${app.name} (${app.id}): type=${app.type} (normalized: ${normalizedType}), isOrganization=true (from type field)`);
          return true;
        }
        
        // Fallback: if type is missing or invalid, cannot determine - skip it
        if (!normalizedType) {
          console.log(`[Applications] App ${app.name} (${app.id}): type=${app.type} (invalid/missing), cannot determine organization app without type field`);
          return false; // Skip if type is missing (cannot determine if it's an org app)
        }
        
        console.log(`[Applications] App ${app.name} (${app.id}): type=${app.type} (normalized: ${normalizedType}), isOrganization=false`);
        return false;
      });

      console.log('[Applications] Final filtered apps:', {
        userAppsRaw: userAppsRaw.length,
        orgAppsRaw: orgAppsRaw.length,
        filteredUserApps: allUserApps.length,
        filteredOrgApps: allOrgApps.length,
        sampleUserApp: allUserApps[0] ? {
          id: allUserApps[0].id,
          name: allUserApps[0].name,
          type: allUserApps[0].type,
        } : null,
        sampleOrgApp: allOrgApps[0] ? {
          id: allOrgApps[0].id,
          name: allOrgApps[0].name,
          type: allOrgApps[0].type,
        } : null,
      });

      // Check if type field is missing or invalid from any apps (backend issue)
      const appsWithoutValidType = allApps.filter(app => {
        const normalizedType = normalizeType(app.type);
        return !normalizedType;
      });
      
      if (appsWithoutValidType.length > 0) {
        console.warn('[Applications] WARNING: Some apps are missing or have invalid type field:', appsWithoutValidType.map(app => ({ 
          id: app.id, 
          name: app.name,
          type: app.type,
          typeType: typeof app.type,
        })));
        if (!appError && appsWithoutValidType.length === allApps.length) {
          // Only show error if ALL apps are missing type (likely backend issue)
          setAppError('Warning: Applications are missing type information. The backend may not be returning the type field. Using fallback logic based on query source.');
        }
      }
      
      // Final summary log
      console.log('[Applications] Filtering Summary:', {
        totalAppsFromBackend: allApps.length,
        personalAppsFound: allUserApps.length,
        organizationAppsFound: allOrgApps.length,
        note: 'Using type field for filtering (backend organization_id filter is broken)',
        allAppIds: allApps.map(a => ({ id: a.id, name: a.name, type: a.type })),
        personalAppIds: allUserApps.map(a => ({ id: a.id, name: a.name, type: a.type })),
        organizationAppIds: allOrgApps.map(a => ({ id: a.id, name: a.name, type: a.type })),
      });

      setUserApps(allUserApps);
      setOrgApps(allOrgApps);
    } catch (error: any) {
      console.error('[Applications] Error fetching applications:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to load applications. Please try again.';
      setAppError(errorMessage);
    } finally {
      setAppsLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Handlers
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateApp = async () => {
    setAppLoading(true);
    setAppError('');
    setAppSuccess('');
    
    if (!appFormData.name.trim()) {
      setAppError('Application name is required.');
      setAppLoading(false);
      return;
    }

    try {
      // Build config object only if it has values
      const config: { webhook_url?: string; default_currency?: string } = {};
      if (appFormData.webhookUrl?.trim()) {
        config.webhook_url = appFormData.webhookUrl.trim();
      }
      if (appFormData.defaultCurrency?.trim()) {
        // Validate currency code (should be 3 uppercase letters)
        const currencyCode = appFormData.defaultCurrency.trim().toUpperCase();
        if (currencyCode.length === 3 && /^[A-Z]{3}$/.test(currencyCode)) {
          config.default_currency = currencyCode;
        } else {
          setAppError('Default currency must be a valid 3-letter currency code (e.g., XAF, USD, EUR).');
          setAppLoading(false);
          return;
        }
      }

      const appData: any = {
        name: appFormData.name.trim(),
        environment: appFormData.environment,
      };

      // Only add optional fields if they have values
      if (appFormData.description?.trim()) {
        appData.description = appFormData.description.trim();
      }
      
      // Include organization_id in body if it's set (for organization apps)
      // Backend uses this to determine ownership (organization vs user)
      if (appFormData.organization_id !== undefined && appFormData.organization_id !== null) {
        appData.organization_id = appFormData.organization_id;
      }
      
      if (Object.keys(config).length > 0) {
        appData.config = config;
      }

      // Log the payload being sent for debugging
      console.log('[Applications] Creating application with payload:', JSON.stringify(appData, null, 2));
      console.log('[Applications] Form data organization_id:', appFormData.organization_id);
      console.log('[Applications] Current organization:', organization?.id);
      console.log('[Applications] Will send organization_id in body:', appData.organization_id !== undefined);

      const response = editingApp
        ? await applicationsService.updateApplication(
            editingApp.id,
            {
              name: appFormData.name,
              description: appFormData.description || undefined,
              environment: appFormData.environment,
              config: {
                webhook_url: appFormData.webhookUrl || undefined,
                default_currency: appFormData.defaultCurrency || undefined,
              },
            },
            editingApp.type === 'ORGANIZATION' ? organization?.id : undefined // Use type field to determine org context
          )
        : await applicationsService.createApplication(appData);
      
      // Log the response to see what type the backend returned
      if (response.success && response.data) {
        const createdApp = response.data;
        console.log('[Applications] Created app response:', {
          id: createdApp.id,
          name: createdApp.name,
          type: createdApp.type,
          expectedOrgId: appFormData.organization_id,
          expectedType: appFormData.organization_id ? 'ORGANIZATION' : 'PERSONAL',
        });
        
        // Check if this was supposed to be an organization app but type wasn't set correctly
        if (appFormData.organization_id && createdApp.type !== 'ORGANIZATION') {
          console.warn('[Applications] WARNING: Organization app created but type is not ORGANIZATION. Expected ORGANIZATION, got:', createdApp.type);
          setAppError('Application created but type was not set correctly. This may be a backend issue. Please check the backend logs.');
        } else if (!appFormData.organization_id && createdApp.type !== 'PERSONAL') {
          console.warn('[Applications] WARNING: Personal app created but type is not PERSONAL. Expected PERSONAL, got:', createdApp.type);
          setAppError('Application created but type was not set correctly. This may be a backend issue. Please check the backend logs.');
        }
      }
      
      if (response.success && response.data) {
        const app = response.data;
        setAppSuccess(editingApp ? 'Application updated successfully!' : 'Application created successfully!');
        
        // If new app and has api_secret, store it and show it
        if (!editingApp && app.api_secret) {
          setApiSecretStore(prev => ({ ...prev, [app.id]: app.api_secret! }));
          setShowApiSecret(app.id);
        }
        
        await fetchApplications();
        resetForm();
        setTimeout(() => {
          setShowCreateModal(false);
          setAppSuccess('');
          setEditingApp(null);
        }, editingApp ? 2000 : 8000); // Longer timeout for new apps to show secret
      } else {
        // Log detailed error for debugging
        console.error('Application creation failed:', JSON.stringify({
          error: response.error,
          details: response.error?.details,
          fullResponse: response,
        }, null, 2));
        
        // Extract error message from response
        let errorMessage = 'Failed to save application. Please try again.';
        if (response.error) {
          if (typeof response.error === 'string') {
            errorMessage = response.error;
          } else if (response.error.message) {
            // Handle array of error messages
            if (Array.isArray(response.error.message)) {
              errorMessage = response.error.message.join(', ');
            } else if (typeof response.error.message === 'string') {
              errorMessage = response.error.message;
            } else {
              errorMessage = JSON.stringify(response.error.message);
            }
          } else if (response.error.details) {
            // Check if details is an array
            if (Array.isArray(response.error.details)) {
              errorMessage = response.error.details.map((d: any) => 
                typeof d === 'string' ? d : d?.message || JSON.stringify(d)
              ).join(', ');
            } else if (typeof response.error.details === 'object') {
              // Check for nested message
              if (response.error.details.message) {
                if (Array.isArray(response.error.details.message)) {
                  errorMessage = response.error.details.message.join(', ');
                } else {
                  errorMessage = response.error.details.message;
                }
              } else {
                // Try to extract any meaningful error from the details object
                const detailStr = JSON.stringify(response.error.details);
                if (detailStr !== '{}') {
                  errorMessage = detailStr;
                }
              }
            } else if (typeof response.error.details === 'string') {
              errorMessage = response.error.details;
            }
          } else if (response.error.code) {
            errorMessage = `${response.error.code}: ${errorMessage}`;
          }
        }
        
        setAppError(errorMessage);
      }
    } catch (error: any) {
      console.error('App error:', error);
      setAppError(error.message || error.toString() || 'Failed to save application. Please try again.');
    } finally {
      setAppLoading(false);
    }
  };

  const handleEditApp = (app: Application) => {
    setEditingApp(app);
    setAppFormData({
      name: app.name,
      description: app.description || '',
      environment: app.environment,
      organization_id: undefined, // Don't allow changing ownership
      webhookUrl: app.config?.webhook_url || '',
      defaultCurrency: app.config?.default_currency || '',
    });
    setShowCreateModal(true);
  };

  const handleDeleteApp = async (appId: string) => {
    setShowDeleteConfirm(appId);
  };

  const confirmDeleteApp = async () => {
    if (!showDeleteConfirm) return;
    const appId = showDeleteConfirm;
    setShowDeleteConfirm(null);
    setAppLoading(true);
    setAppError('');
    
    try {
      // Determine if app belongs to organization or user based on type field
      const app = [...userApps, ...orgApps].find(a => a.id === appId);
      const orgId = app?.type === 'ORGANIZATION' ? organization?.id : undefined;
      
      const response = await applicationsService.deleteApplication(appId, orgId);
      if (response.success) {
        setAppSuccess('Application deleted successfully!');
        await fetchApplications();
        setTimeout(() => setAppSuccess(''), 3000);
      } else {
        setAppError(response.error?.message || 'Failed to delete application.');
      }
    } catch (error) {
      console.error('Failed to delete app:', error);
      setAppError('Failed to delete application. Please try again.');
    } finally {
      setAppLoading(false);
    }
  };

  const handleRegenerateCredentials = async (appId: string) => {
    setShowRegenerateConfirm(appId);
  };

  const confirmRegenerateCredentials = async () => {
    if (!showRegenerateConfirm) return;
    const appId = showRegenerateConfirm;
    setShowRegenerateConfirm(null);
    setAppLoading(true);
    setAppError('');
    
    try {
      // Determine if app belongs to organization or user based on type field
      const app = [...userApps, ...orgApps].find(a => a.id === appId);
      const orgId = app?.type === 'ORGANIZATION' ? organization?.id : undefined;
      
      const response = await applicationsService.regenerateCredentials(appId, orgId);
      if (response.success && response.data) {
        const app = response.data;
        if (app.api_secret) {
          setApiSecretStore(prev => ({ ...prev, [app.id]: app.api_secret! }));
          setShowApiSecret(app.id);
        }
        setAppSuccess('API credentials regenerated successfully!');
        await fetchApplications();
        setTimeout(() => {
          setAppSuccess('');
        }, 8000);
      } else {
        setAppError(response.error?.message || 'Failed to regenerate credentials.');
      }
    } catch (error) {
      console.error('Failed to regenerate credentials:', error);
      setAppError('Failed to regenerate credentials. Please try again.');
    } finally {
      setAppLoading(false);
    }
  };

  const resetForm = () => {
    setAppFormData({
      name: '',
      description: '',
      environment: 'SANDBOX',
      organization_id: undefined,
      webhookUrl: '',
      defaultCurrency: '',
    });
    setEditingApp(null);
  };

  const openCreateModal = (forOrganization: boolean = false) => {
    resetForm();
    setAppFormData(prev => ({
      ...prev,
      organization_id: forOrganization ? organization?.id : undefined,
    }));
    setShowCreateModal(true);
  };

  const getEnvironmentBadge = (env: string) => {
    const colors = {
      SANDBOX: 'bg-blue-100 text-blue-700 border-blue-200',
      PROD: 'bg-green-100 text-green-700 border-green-200',
    };
    return colors[env as keyof typeof colors] || colors.SANDBOX;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-700 border-green-200',
      INACTIVE: 'bg-gray-100 text-gray-700 border-gray-200',
      SUSPENDED: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status as keyof typeof colors] || colors.INACTIVE;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Code className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Applications</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your API applications and credentials</p>
            </div>
          </div>
          <div className="flex gap-2">
            {organization && (
              <button
                onClick={() => openCreateModal(true)}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Organization App</span>
                <span className="sm:hidden">Org App</span>
              </button>
            )}
            <button
              onClick={() => openCreateModal(false)}
              className="px-4 py-2 text-sm font-medium bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Personal App</span>
              <span className="sm:hidden">Personal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {appSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700  flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{appSuccess}</span>
        </div>
      )}
      {appError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700  flex items-center gap-2">
          <WarningCircle className="w-5 h-5 flex-shrink-0" />
          <span>{appError}</span>
        </div>
      )}

      {/* Loading State */}
      {appsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Organization Applications */}
          {organization && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Building className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">Organization Applications</h2>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                  {orgApps.length}
                </span>
              </div>
              {orgApps.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orgApps.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      app={app}
                      onEdit={handleEditApp}
                      onDelete={handleDeleteApp}
                      onRegenerate={handleRegenerateCredentials}
                      onCopy={handleCopy}
                      copiedKey={copiedKey}
                      showApiSecret={showApiSecret === app.id}
                      apiSecret={apiSecretStore[app.id]}
                      onToggleSecret={() => setShowApiSecret(showApiSecret === app.id ? null : app.id)}
                      getEnvironmentBadge={getEnvironmentBadge}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-gray-200  p-8 text-center">
                  <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No organization applications yet</p>
                  <button
                    onClick={() => openCreateModal(true)}
                    className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all"
                  >
                    Create Organization Application
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Personal Applications */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Personal Applications</h2>
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                {userApps.length}
              </span>
            </div>
            {userApps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onEdit={handleEditApp}
                    onDelete={handleDeleteApp}
                    onRegenerate={handleRegenerateCredentials}
                    onCopy={handleCopy}
                    copiedKey={copiedKey}
                    showApiSecret={showApiSecret === app.id}
                    apiSecret={apiSecretStore[app.id]}
                    onToggleSecret={() => setShowApiSecret(showApiSecret === app.id ? null : app.id)}
                    getEnvironmentBadge={getEnvironmentBadge}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-gray-200  p-8 text-center">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No personal applications yet</p>
                <button
                  onClick={() => openCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all"
                >
                  Create Personal Application
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Modal - Right Slide Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
            onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}
          />
          {/* Modal Content */}
          <div className="relative bg-white h-full w-full max-w-2xl shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0 overflow-y-auto">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Code className="w-6 h-6" />
                  {editingApp ? 'Edit Application' : 'Create New Application'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {editingApp 
                    ? 'Update your application settings'
                    : appFormData.organization_id 
                      ? 'Create a new application for your organization'
                      : 'Create a new personal application'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            {/* Form Content */}
            <div className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateApp();
                }}
                className="space-y-4"
              >
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={appFormData.name}
                  onChange={(e) => setAppFormData({ ...appFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 focus:outline-none focus:border-green-500 "
                  placeholder="My Application"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={appFormData.description}
                  onChange={(e) => setAppFormData({ ...appFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 focus:outline-none focus:border-green-500 "
                  placeholder="Brief description of your application"
                  rows={3}
                />
              </div>

              {/* Environment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Environment <span className="text-red-500">*</span>
                </label>
                <select
                  value={appFormData.environment}
                  onChange={(e) => setAppFormData({ ...appFormData, environment: e.target.value as 'SANDBOX' | 'PROD' })}
                  className="w-full px-4 py-2 border-2 border-gray-200 focus:outline-none focus:border-green-500 "
                  required
                >
                  <option value="SANDBOX">Sandbox</option>
                  <option value="PROD">Production</option>
                </select>
              </div>

              {/* Webhook URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={appFormData.webhookUrl}
                  onChange={(e) => setAppFormData({ ...appFormData, webhookUrl: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 focus:outline-none focus:border-green-500 "
                  placeholder="https://example.com/webhook"
                />
              </div>

              {/* Default Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Currency
                </label>
                <input
                  type="text"
                  value={appFormData.defaultCurrency}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                    setAppFormData({ ...appFormData, defaultCurrency: value });
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-200 focus:outline-none focus:border-green-500 "
                  placeholder="XAF (3-letter code)"
                  maxLength={3}
                  pattern="[A-Z]{3}"
                />
                <p className="text-xs text-gray-500 mt-1">Enter a 3-letter ISO currency code (e.g., XAF, USD, EUR)</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors "
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={appLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed  flex items-center justify-center gap-2"
                >
                  {appLoading ? (
                    <>
                      <Spinner className="w-4 h-4 animate-spin" />
                      {editingApp ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingApp ? 'Update Application' : 'Create Application'
                  )}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* API Secret Modal */}
      {showApiSecret && apiSecretStore[showApiSecret] && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-lg w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <WarningCircle className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-bold text-gray-900">API Secret</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Important:</strong> This secret will only be shown once. Make sure to copy it and store it securely.
            </p>
            <div className="bg-gray-50 border-2 border-gray-200 p-4  mb-4">
              <div className="font-mono text-sm text-gray-900 break-all">
                {apiSecretStore[showApiSecret]}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleCopy(apiSecretStore[showApiSecret], 'secret')}
                className="flex-1 px-4 py-2 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors  flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {copiedKey === 'secret' ? 'Copied!' : 'Copy Secret'}
              </button>
              <button
                onClick={() => {
                  setShowApiSecret(null);
                  delete apiSecretStore[showApiSecret];
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors "
              >
                I've Saved It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <WarningCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900">Delete Application</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this application? This action cannot be undone and will invalidate all API credentials.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors "
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteApp}
                disabled={appLoading}
                className="flex-1 px-4 py-2 bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed "
              >
                {appLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Confirmation Modal */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white  max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <WarningCircle className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-bold text-gray-900">Regenerate Credentials</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to regenerate the API credentials? The old credentials will be invalidated immediately.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRegenerateConfirm(null)}
                className="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors "
              >
                Cancel
              </button>
              <button
                onClick={confirmRegenerateCredentials}
                disabled={appLoading}
                className="flex-1 px-4 py-2 bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed "
              >
                {appLoading ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Application Card Component
interface ApplicationCardProps {
  app: Application;
  onEdit: (app: Application) => void;
  onDelete: (appId: string) => void;
  onRegenerate: (appId: string) => void;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
  showApiSecret: boolean;
  apiSecret?: string;
  onToggleSecret: () => void;
  getEnvironmentBadge: (env: string) => string;
  getStatusBadge: (status: string) => string;
}

function ApplicationCard({
  app,
  onEdit,
  onDelete,
  onRegenerate,
  onCopy,
  copiedKey,
  showApiSecret,
  apiSecret,
  onToggleSecret,
  getEnvironmentBadge,
  getStatusBadge,
}: ApplicationCardProps) {
  return (
    <div className="group relative bg-white border border-gray-200  p-6 hover:shadow-xl hover:border-green-300 transition-all duration-300 overflow-hidden">
      {/* Gradient Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600"></div>
      
      {/* Header Section */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600  flex items-center justify-center flex-shrink-0 shadow-md">
              <Code className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-green-600 transition-colors">
                {app.name}
              </h3>
              {app.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{app.description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 ml-3">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(app.status)} shadow-sm`}>
            {app.status}
          </span>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getEnvironmentBadge(app.environment)} shadow-sm`}>
            {app.environment}
          </span>
        </div>
      </div>

      {/* API Key Section - Enhanced */}
      <div className="mb-5 p-4 bg-gradient-to-br from-gray-50 to-gray-100  border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            API Key
          </label>
          <button
            onClick={() => onCopy(app.api_key, `key-${app.id}`)}
            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-white  transition-all duration-200"
            title="Copy API Key"
          >
            {copiedKey === `key-${app.id}` ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-300  px-3 py-2.5 font-mono text-xs text-gray-900 overflow-x-auto shadow-inner">
          <span className="text-gray-400 select-none">••••</span>
          <span className="flex-1 truncate">{app.api_key}</span>
        </div>
        {copiedKey === `key-${app.id}` && (
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-medium">
            <CheckCircle className="w-3 h-3" />
            Copied to clipboard!
          </p>
        )}
      </div>

      {/* Stats Section - Enhanced with Actions */}
      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-200">
        {/* Stats */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          {app.total_payments !== undefined && (
            <div className="p-3 bg-gradient-to-br from-green-50 to-green-100/50  border border-green-200/50">
              <div className="flex items-center gap-2 mb-1">
                <TrendUp className="w-4 h-4 text-green-600" />
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Payments</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{app.total_payments.toLocaleString()}</p>
            </div>
          )}
          {app.last_used_at && (
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100/50  border border-blue-200/50">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Last Used</p>
              </div>
              <p className="text-sm font-bold text-gray-900">{formatDate(app.last_used_at)}</p>
            </div>
          )}
          {app.total_payments === undefined && !app.last_used_at && (
            <div className="col-span-2"></div>
          )}
        </div>
        
        {/* Actions Section - Enhanced */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(app)}
            className="px-3 py-2.5 text-sm rounded-full font-semibold bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 border border-gray-300  transition-all duration-200 shadow-sm hover:shadow-md group/btn"
            title="Edit Application"
          >
            <PencilSimple className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => onRegenerate(app.id)}
            className="px-3 py-2.5 text-sm rounded-full font-semibold bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 hover:from-amber-100 hover:to-amber-200 border border-amber-300  transition-all duration-200 shadow-sm hover:shadow-md group/btn"
            title="Regenerate Credentials"
          >
            <ArrowClockwise className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" />
          </button>
          <button
            onClick={() => onDelete(app.id)}
            className="px-3 py-2.5 text-sm rounded-full font-semibold bg-gradient-to-r from-red-50 to-red-100 text-red-700 hover:from-red-100 hover:to-red-200 border border-red-300  transition-all duration-200 shadow-sm hover:shadow-md group/btn"
            title="Delete Application"
          >
            <Trash className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

