/**
 * API Client Configuration
 * Centralized API service for Instanvi Payment Platform
 *
 * Development now targets the backend running at https://payments.dev.instanvi.com.
 * When a production endpoint is available, set NEXT_PUBLIC_API_BASE_URL.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://payments.dev.instanvi.com';
const API_VERSION = '/api';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = `${baseURL}${API_VERSION}`;
  }

  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    // Get token from localStorage
    // Note: sign-in returns 32-char session tokens (valid), admin login returns JWT (longer)
    // Both are valid - backend will validate the token
    const token = localStorage.getItem('accessToken');
    
    // Validate token length - should be at least 20 characters
    // Very short tokens (< 10 chars) are likely corrupted or invalid
    if (token && token.length < 10) {
      console.warn(`[API Client] Token appears invalid (length: ${token.length}). Clearing token.`);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      return null;
    }
    
    return token;
  }

  private async getUserApiKey(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    
    // Check if user has API key stored in localStorage
    // API keys are created through the applications service during login
    const storedApiKey = localStorage.getItem('userApiKey');
    return storedApiKey;
  }

  private async ensureApiKey(shouldGenerate: boolean = false): Promise<string | null> {
    // Check environment variable first
    if (API_KEY) {
      return API_KEY;
    }

    // Get API key from localStorage
    const storedKey = await this.getUserApiKey();
    if (storedKey) {
      return storedKey;
    }

    // If no API key in localStorage, try to get it from user's applications
    // Payment endpoints require x-api-key header, so we need to fetch it from applications
    if (shouldGenerate && typeof window !== 'undefined') {
      try {
        const { applicationsService } = await import('./applications');
        const appsResponse = await applicationsService.listApplications({ limit: 1 });
        
        if (appsResponse.success && appsResponse.data?.applications && appsResponse.data.applications.length > 0) {
          const firstApp = appsResponse.data.applications[0];
          if (firstApp.api_key) {
            // Store it for future use
            localStorage.setItem('userApiKey', firstApp.api_key);
            console.log('[API Client] Retrieved API key from applications:', firstApp.api_key.substring(0, 10) + '...');
            return firstApp.api_key;
          }
        }
      } catch (error) {
        console.warn('[API Client] Failed to fetch API key from applications:', error);
      }
    }

    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = await this.getAuthToken();
    
    // Debug: Log token status for troubleshooting (skip logging for public auth endpoints)
    if (!token && typeof window !== 'undefined' && !endpoint.includes('/auth')) {
      const storedToken = localStorage.getItem('accessToken');
      console.warn(`[API Client] No token found for ${endpoint}. localStorage has token: ${!!storedToken}, length: ${storedToken?.length || 0}`);
    }
    
    // Token validation is handled by backend - no need to check length here
    
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    
    // Only add Content-Type for requests with body (POST, PUT, PATCH)
    // Some backends reject GET requests with Content-Type header
    if (options.method !== 'GET' && options.method !== 'HEAD' && options.method !== 'DELETE') {
      headers['Content-Type'] = 'application/json';
    }

    // Identify endpoint types
    // Admin endpoints use `token` header (not Authorization) per Frontend Admin API Guide
    const isAdminEndpoint = endpoint.includes('/admin/') || 
                          endpoint.includes('/organizations/admin/') || 
                          endpoint.includes('/onboarding/admin/');
    
    // Onboarding and Applications endpoints use same auth as organizations (Bearer base64)
    const isOrganizationEndpoint = endpoint.includes('/organizations') || endpoint.includes('/onboarding') || endpoint.includes('/applications');
    const isOnboardingEndpoint = endpoint.includes('/onboarding');
    const isAuthEndpoint = endpoint.includes('/auth');
    const isApplicationsEndpoint = endpoint.includes('/applications');
    const isReportsEndpoint = endpoint.includes('/reports');
    
    // Customer self-service endpoints use `token` header
    const isUserCustomerEndpoint = endpoint.includes('/users/customer');
    
    // For endpoints that require x-api-key (payments, etc.)
    // NOTE: Organizations do NOT need x-api-key per Swagger docs - only Bearer base64(api_user:api_password)
    // Payment endpoints require both Bearer auth (api_user:api_password) AND x-api-key header
    // Balance endpoints also require x-api-key per API_DOCUMENTATION.md
    // Reports endpoints also require x-api-key as they are payment-related
    const needsApiKey = endpoint.includes('/make-payment') || 
              // payment-links endpoints require an API key as well
              endpoint.includes('/payment-links') ||
              endpoint.includes('/payments') ||
                        endpoint.includes('/refunds') ||
                        endpoint.includes('/chargebacks') ||
                        endpoint.includes('/orders') ||
                        endpoint.includes('/invoices') ||
                        endpoint.includes('/products') ||
                        endpoint.includes('/bank-accounts') ||
                        endpoint.includes('/balances') ||
                        endpoint.includes('/reports');
    
    // API key is only needed for payment-related endpoints, NOT organizations
    let apiKey: string | null = null;
    if (needsApiKey) {
      if (typeof window !== 'undefined') {
        apiKey = localStorage.getItem('userApiKey');
      }
      if (!apiKey) {
        apiKey = await this.ensureApiKey(true);
      }
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      } else {
        // Log warning if API key is required but not found
        console.warn(`[API Client] API key required for ${endpoint} but not found in localStorage`);
      }
    }

    // Authentication per Swagger docs and Frontend Admin API Guide:
    // - Admin endpoints (/admin/*, /organizations/admin/*, /onboarding/admin/*): Use `token: <admin_jwt_token>` header
    // - Customer self-service endpoints (/users/customer/*, /auth/*): Use `token: <session_token>` header
    // - Organization endpoints (ALL methods): Use `Authorization: Bearer base64(api_user:api_password)`
    //   The backend may also need `token` header for user context
    // - Other API endpoints: Use Bearer auth with optional x-api-key
    const apiUser = typeof window !== 'undefined' ? localStorage.getItem('apiUser') : null;
    const apiPassword = typeof window !== 'undefined' ? localStorage.getItem('apiPassword') : null;
    
    if (isAdminEndpoint && token) {
      // Admin endpoints use token header (not Authorization) per Frontend Admin API Guide
      headers['token'] = token;
      console.log(`[API Client] Using token header for admin endpoint: ${endpoint}`);
    } else if (isUserCustomerEndpoint && token) {
      // Customer self-service endpoints use raw token header
      headers['token'] = token;
      console.log(`[API Client] Using token header for customer endpoint: ${endpoint}`);
    } else if (isApplicationsEndpoint && apiUser && apiPassword) {
      // Applications endpoints: Use Bearer auth with base64(api_user:api_password)
      const encodedCredentials = btoa(`${apiUser}:${apiPassword}`);
      headers['Authorization'] = `Bearer ${encodedCredentials}`;
      
      // Check if this is a POST/PUT/PATCH request with organization_id in body
      let hasOrganizationIdInBody = false;
      if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method) && options.body) {
        try {
          const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
          hasOrganizationIdInBody = !!(body && typeof body === 'object' && 'organization_id' in body && body.organization_id);
        } catch (e) {
          // If body parsing fails, ignore
        }
      }
      
      // Check if organization_id is in query parameters (workaround for backend bug)
      const hasOrganizationIdInQuery = endpoint.includes('organization_id=');
      
      // For applications endpoints, ALWAYS send token header (required for authentication)
      // WORKAROUND: We send organization_id as query parameter instead of in body to avoid backend conflict
      // The backend currently rejects requests with both token header and organization_id in body
      // TODO: Backend should be fixed to prioritize organization_id in body over token for ownership
      if (token) {
        headers['token'] = token;
      }
      
      console.log(`[API Client] Applications request to ${endpoint}:`, {
        method: options.method || 'GET',
        authorization: `Bearer ${encodedCredentials.substring(0, 30)}...`,
        hasToken: !!token,
        hasOrgIdInBody: hasOrganizationIdInBody,
        hasOrgIdInQuery: hasOrganizationIdInQuery,
        isOrganizationApp: hasOrganizationIdInQuery || hasOrganizationIdInBody,
        note: (hasOrganizationIdInQuery || hasOrganizationIdInBody)
          ? 'Organization app - Bearer auth + token + organization_id in query (WORKAROUND for backend bug)' 
          : 'User app - Bearer auth + token',
      });
    } else if (isReportsEndpoint && apiUser && apiPassword) {
      // Reports endpoints: Use Bearer auth with base64(api_user:api_password) + token header + x-api-key
      // Similar to applications endpoints, reports may need token header for user context
      const encodedCredentials = btoa(`${apiUser}:${apiPassword}`);
      headers['Authorization'] = `Bearer ${encodedCredentials}`;
      
      // Add token header for user context (similar to applications endpoints)
      if (token) {
        headers['token'] = token;
      }
      
      console.log(`[API Client] Reports request to ${endpoint}:`, {
        method: options.method || 'GET',
        authorization: `Bearer ${encodedCredentials.substring(0, 30)}...`,
        hasToken: !!token,
        hasApiKey: needsApiKey,
      });
    } else if (isOrganizationEndpoint && !isAdminEndpoint && apiUser && apiPassword) {
      // Organization endpoints (non-admin) use ONLY Bearer auth with base64(api_user:api_password)
      // Do NOT send token header - backend expects only Authorization header for org endpoints
      // This matches the successful Swagger test: only Authorization: Bearer base64(...) was used
      const encodedCredentials = btoa(`${apiUser}:${apiPassword}`);
      headers['Authorization'] = `Bearer ${encodedCredentials}`;
      
      console.log(`[API Client] Organization request to ${endpoint}:`, {
        method: options.method || 'GET',
        authorization: `Bearer ${encodedCredentials.substring(0, 30)}...`,
      });
    } else if (isOrganizationEndpoint && !isAdminEndpoint && token) {
      // Fallback for organizations: try token header if no api credentials
      // This shouldn't normally happen but provides graceful degradation
      headers['token'] = token;
      console.warn(`[API Client] Organization endpoint ${endpoint} using token header (no api credentials available)`);
    } else if (apiUser && apiPassword) {
      // Other endpoints with api credentials - use ONLY Bearer auth
      const encodedCredentials = btoa(`${apiUser}:${apiPassword}`);
      headers['Authorization'] = `Bearer ${encodedCredentials}`;
      console.log(`[API Client] Using Bearer auth for ${endpoint}`);
    } else if (token) {
      // Fallback: use token header
      headers['token'] = token;
      console.log(`[API Client] Using token header for ${endpoint}`);
    } else {
      if (!isAuthEndpoint) {
        console.warn(`[API Client] No authentication available for ${endpoint}`);
      }
    }

    const url = `${this.baseURL}${endpoint}`;
    
    // Debug: Log what headers are being sent for organization endpoints
    if (isOrganizationEndpoint) {
      console.log(`[API Client] Final headers for ${endpoint}:`, {
        hasAuthorization: !!headers['Authorization'],
        authPreview: headers['Authorization'] ? headers['Authorization'].substring(0, 50) + '...' : 'none',
      });
    }
    // Debug: Log what headers are being sent for reports endpoints (more verbose)
    if (isReportsEndpoint) {
      console.log(`[API Client] Final headers for ${endpoint} (reports):`, {
        hasAuthorization: !!headers['Authorization'],
        hasTokenHeader: !!headers['token'],
        hasApiKey: !!headers['x-api-key'],
        authPreview: headers['Authorization'] ? (headers['Authorization'].length > 30 ? headers['Authorization'].substring(0, 10) + '...' + headers['Authorization'].slice(-10) : headers['Authorization']) : 'none',
        tokenPreview: headers['token'] ? (String(headers['token']).length > 12 ? String(headers['token']).substring(0,8) + '...' : String(headers['token'])) : 'none',
        apiKeyPreview: headers['x-api-key'] ? (String(headers['x-api-key']).length > 12 ? String(headers['x-api-key']).substring(0,8) + '...' : String(headers['x-api-key'])) : 'none',
      });
      // Also log the raw (masked) header values to help diagnosing server-side auth checks
      try {
        const masked = {
          Authorization: headers['Authorization'] ? `${String(headers['Authorization']).substring(0, 15)}...${String(headers['Authorization']).slice(-5)}` : 'none',
          token: headers['token'] ? `${String(headers['token']).substring(0, 8)}...` : 'none',
          'x-api-key': headers['x-api-key'] ? `${String(headers['x-api-key']).substring(0, 8)}...` : 'none',
        };
        console.log('[API Client] Reports headers (masked):', masked);
      } catch (e) {
        // ignore
      }
    }
    
    // Store needsApiKey for use in error handling
    const requestNeedsApiKey = needsApiKey;

    // Implement a small retry/backoff for network-level failures (connection reset, transient network blips)
    const maxRetries = 2;
    let attempt = 0;
    let response: Response | undefined;

    while (attempt <= maxRetries) {
      // Create a fresh AbortController for each attempt (important for retries)
      const controller = new AbortController();
      const timeoutMs = 10000;
      const timeoutId = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);

      try {
        // Log request details for debugging (especially for POST/PUT requests)
        if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
          const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : null;
          console.log(`[API Client] ${options.method} request to ${endpoint}:`, JSON.stringify({
            body: body,
            headers: {
              hasAuthorization: !!headers['Authorization'],
              hasToken: !!headers['token'],
              hasApiKey: !!headers['x-api-key'],
            },
          }, null, 2));
        }
        
        response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        break;
      } catch (error: any) {
        clearTimeout(timeoutId);
        attempt += 1;
        const msg = String(error?.message || error);
        const isNetwork = /ECONNRESET|ECONNREFUSED|Network|network|reset|abort|timeout/i.test(msg) || error instanceof TypeError;
        // If this was an abort (timeout), return a clear timeout error immediately
        if (/abort/i.test(msg) || error?.name === 'AbortError') {
          return {
            success: false,
            error: {
              code: 'TIMEOUT',
              message: `Request to ${url} timed out after ${timeoutMs}ms`,
              details: { attempt, raw: String(error) },
            },
          };
        }

        if (attempt > maxRetries || !isNetwork) {
          console.error('API request failed:', error);
          return {
            success: false,
            error: {
              code: 'NETWORK_ERROR',
              message: `Failed to reach ${url}: ${error?.message || String(error)}. Confirm backend is running and reachable on the network.`,
              details: { attempt, raw: String(error) },
            },
          };
        }

        const delayMs = 300 * Math.pow(2, attempt);
        console.warn(`Network error on request to ${endpoint}; retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    if (!response) {
      return {
        success: false,
        error: { code: 'NO_RESPONSE', message: `No response from ${url}` },
      };
    }

    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      return {
        success: response.ok,
        data: text as unknown as T,
      };
    }

      // Normalize backend response shape -> { status_code, status, message, data }
      const looksLikeBackend =
        data &&
        typeof data === 'object' &&
        'status_code' in data &&
        'status' in data;

      if (looksLikeBackend) {
        const backendSuccess =
          response.ok && (data.status_code as number) >= 200 && (data.status_code as number) < 300;

        return {
          success: backendSuccess,
          data: data.data as T,
          message: data.message,
          error: backendSuccess
            ? undefined
            : {
                code: data.status?.toString() || `HTTP_${response.status}`,
                message: data.message || `Request failed with status ${response.status}`,
                details: data.data,
              },
        };
      }

      if (!response.ok) {
        // Handle 401 Unauthorized - missing or invalid token
        if (response.status === 401) {
          const errorMessage = data && typeof data === 'object' && 'error' in data
            ? (data as any).error.message || (data as any).error
            : (data as any)?.message || 'Authentication required. Please log in again.';
          
          const token = await this.getAuthToken();
          const apiKeySent = headers['x-api-key'] ? true : false;
          
          console.error('401 Unauthorized Error:', {
            url,
            endpoint,
            hasToken: !!token,
            tokenLength: token?.length || 0,
            tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
            hasApiKey: apiKeySent,
            apiKeyPreview: headers['x-api-key'] ? `${(headers['x-api-key'] as string).substring(0, 10)}...` : 'none',
            hasTokenHeader: !!headers['token'],
            responseData: data,
            responseBody: JSON.stringify(data, null, 2),
            message: 'Token may be missing, invalid, or expired. Check backend logs for more details.',
          });
          
          // If we have a token but still get 401, it's likely expired or invalid
          if (token) {
            return {
              success: false,
              error: {
                code: 'AUTH_EXPIRED',
                message: errorMessage || 'Your session has expired. Please log out and log in again.',
                details: { 
                  status: 401, 
                  hasToken: true,
                  hasApiKey: apiKeySent,
                  suggestion: 'Your authentication token may be expired or invalid. Please log out and log in again to refresh your session.',
                },
              },
            };
          }
          
          return {
            success: false,
            error: {
              code: 'AUTH_REQUIRED',
              message: errorMessage || 'Authentication required. Please log in.',
              details: { 
                status: 401, 
                hasToken: false,
                hasApiKey: apiKeySent,
                suggestion: 'No authentication token found. Please log in to continue.',
              },
            },
          };
        }
        
        // Handle 403 Forbidden specifically
        if (response.status === 403) {
          const errorMessage = data && typeof data === 'object' && 'error' in data
            ? (data as any).error.message || (data as any).error
            : (data as any)?.message || 'Access forbidden. Please check your authentication token.';
          
          // Check if token exists
          const token = await this.getAuthToken();
          
          // Check if API key was sent
          const apiKeySent = headers['x-api-key'] ? true : false;
          
          // Log debugging information for 403 errors
          console.error('403 Forbidden Error:', {
            url,
            endpoint,
            hasToken: !!token,
            tokenLength: token?.length || 0,
            hasApiKey: apiKeySent,
            apiKeyLength: headers['x-api-key']?.length || 0,
            responseData: data,
            headers: {
              contentType: response.headers.get('content-type'),
              wwwAuthenticate: response.headers.get('www-authenticate'),
            },
          });

          // Retry once using session token in Authorization header if available
          try {
            const token = await this.getAuthToken();
            const alreadyAuthIsToken = headers['Authorization'] && headers['Authorization'] === `Bearer ${token}`;
            if (token && !alreadyAuthIsToken) {
              console.log('[API Client] Attempting retry for reports endpoint using session token in Authorization header');
              const retryHeaders = { ...headers, Authorization: `Bearer ${token}`, 'x-retry-auth': '1' } as Record<string,string>;
              const retryResponse = await fetch(url, { ...options, headers: retryHeaders });
              const retryContentType = retryResponse.headers.get('content-type');
              let retryData: any = null;
              if (retryContentType && retryContentType.includes('application/json')) {
                retryData = await retryResponse.json();
              } else {
                retryData = await retryResponse.text();
              }
              console.log('[API Client] Retry response status:', retryResponse.status);
              if (retryResponse.ok) {
                // Success on retry - normalize response
                return {
                  success: true,
                  data: (retryData && (retryData.data ?? retryData)) as T,
                  message: retryData?.message,
                };
              } else {
                console.error('[API Client] Retry also failed:', { status: retryResponse.status, data: retryData });
                // continue to return original 403 below with details about retry
                data = data || retryData;
              }
            }
          } catch (retryErr) {
            console.warn('[API Client] Retry with session token failed:', retryErr);
          }
          
          if (!token) {
            return {
              success: false,
              error: {
                code: 'AUTH_REQUIRED',
                message: 'Authentication required. Please log in again.',
                details: { status: 403, hasToken: false, hasApiKey: apiKeySent },
              },
            };
          }
          
          // Check if API key might be the issue
          if (!apiKeySent && requestNeedsApiKey) {
            return {
              success: false,
              error: {
                code: 'API_KEY_REQUIRED',
                message: 'API key is required for this endpoint. Please create an application first to get an API key, or ensure your API key is properly configured.',
                details: { status: 403, hasToken: true, hasApiKey: false, needsApiKey: true },
              },
            };
          }
          
          // Most likely: User doesn't have admin role
          // Check if this is an admin endpoint
          const isAdminEndpoint = endpoint.includes('/admin/') || endpoint.includes('/users/admin/');
          if (isAdminEndpoint) {
            return {
              success: false,
              error: {
                code: 'ADMIN_ACCESS_REQUIRED',
                message: errorMessage || 'Admin access required. Your account does not have admin privileges. Please contact your system administrator to grant admin access.',
                details: { 
                  status: 403, 
                  hasToken: true, 
                  hasApiKey: apiKeySent,
                  endpoint,
                  suggestion: 'This endpoint requires admin role. Your current user role may not have admin permissions. Please ensure you are logged in with an admin account.',
                },
              },
            };
          }
          
          return {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: errorMessage || 'Access forbidden. Your token or API key may be invalid or expired.',
              details: { status: 403, hasToken: true, hasApiKey: apiKeySent, response: data },
            },
          };
        }
        
        // Handle 400 Bad Request with detailed error message
        if (response.status === 400) {
          let errorMessage: string = `Request failed with status ${response.status}`;
          
          if (data && typeof data === 'object') {
            // Handle array of error messages (common in validation errors)
            if (Array.isArray(data)) {
              errorMessage = data.map((err: any) => 
                typeof err === 'string' ? err : err?.message || JSON.stringify(err)
              ).join(', ');
            } else if (Array.isArray((data as any)?.message)) {
              errorMessage = (data as any).message.join(', ');
            } else if (typeof (data as any)?.message === 'string') {
              errorMessage = (data as any).message;
            } else if ((data as any)?.error?.message) {
              if (Array.isArray((data as any).error.message)) {
                errorMessage = (data as any).error.message.join(', ');
              } else {
                errorMessage = (data as any).error.message;
              }
            } else {
              // Try to extract any error messages from the response
              const errorKeys = ['errors', 'error', 'message', 'validation'];
              for (const key of errorKeys) {
                if ((data as any)[key]) {
                  const value = (data as any)[key];
                  if (Array.isArray(value)) {
                    errorMessage = value.join(', ');
                    break;
                  } else if (typeof value === 'string') {
                    errorMessage = value;
                    break;
                  }
                }
              }
            }
          }
          
          // Log full error details for debugging
          const fullErrorDetails = {
            url,
            endpoint,
            status: response.status,
            responseData: data,
            errorMessage,
            fullResponse: JSON.stringify(data, null, 2),
          };
          console.error('400 Bad Request Error:', fullErrorDetails);
          
          // If it's a validation error about username, log additional details
          if (errorMessage && (errorMessage.toLowerCase().includes('username') || errorMessage.toLowerCase().includes('user_name'))) {
            console.error('Username validation error detected. Backend response:', data);
            if ((data as any)?.message && Array.isArray((data as any).message)) {
              console.error('All validation errors:', (data as any).message);
            }
            // Log the actual request body that was sent
            console.error('Request body that was sent:', options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : 'No body');
          }
          
          return {
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: errorMessage,
              details: data,
            },
          };
        }
        
        return {
          success: false,
          error: data && typeof data === 'object' && 'error' in data
            ? (data as any).error
            : {
                code: `HTTP_${response.status}`,
                message: (data as any)?.message || `Request failed with status ${response.status}`,
                details: data,
              },
        };
      }

      // Pass-through for already normalised ApiResponse
      if ((data as ApiResponse<T>).success !== undefined) {
        return data as ApiResponse<T>;
      }

      return {
        success: true,
        data: (data as any)?.data ?? (data as T),
        message: (data as any)?.message,
      };
    
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    // Log the full URL and body for debugging
    if (endpoint.includes('/applications')) {
      console.log('[API Client] POST request details:', {
        fullUrl: url,
        endpoint: endpoint,
        hasParams: !!params,
        params: params,
        bodyKeys: body ? Object.keys(body) : [],
        bodyHasOrgId: body && 'organization_id' in body,
      });
    }
    
    return this.request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async options<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.request<T>(url, { method: 'OPTIONS' });
  }

  async head<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.request<T>(url, { method: 'HEAD' });
  }

  async upload<T>(endpoint: string, formData: FormData, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    
    // Check if this is an organization-related endpoint (onboarding, organizations, applications)
    const isOrganizationEndpoint = endpoint.includes('/organizations') || endpoint.includes('/onboarding') || endpoint.includes('/applications');
    
    if (isOrganizationEndpoint) {
      // Use Bearer auth with base64(api_user:api_password) for organization endpoints
      const apiUser = typeof window !== 'undefined' ? localStorage.getItem('apiUser') : null;
      const apiPassword = typeof window !== 'undefined' ? localStorage.getItem('apiPassword') : null;
      
      if (apiUser && apiPassword) {
        const credentials = btoa(`${apiUser}:${apiPassword}`);
        headers['Authorization'] = `Bearer ${credentials}`;
        console.log('[API Client Upload] Using Bearer auth for', endpoint);
      } else {
        console.warn('[API Client Upload] Missing API credentials for organization endpoint:', endpoint);
      }
    } else {
      // For non-organization endpoints, use session token
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // For non-organization upload endpoints, also ensure API key is present
      const apiKey = await this.ensureApiKey();
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }
    }

    let url = `${this.baseURL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      
      console.log('[API Client Upload] Response:', response.status, response.statusText);

      if (!response.ok) {
        console.error('[API Client Upload] Upload failed:', data);
        return {
          success: false,
          error: data.error || {
            code: `HTTP_${response.status}`,
            message: data.message || `Upload failed with status ${response.status}`,
          },
        };
      }

      // Return normalized response with success flag
      return {
        success: true,
        data: data.data || data,
        message: data.message || 'Upload successful',
      };
    } catch (error) {
      console.error('[API Client Upload] Upload failed:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Upload failed',
        },
      };
    }
  }
}

export const apiClient = new ApiClient();


