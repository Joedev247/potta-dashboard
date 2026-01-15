'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, usersService } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isVerified: boolean;
  role?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

interface SignupData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean | { requires2FA: true; email: string }>;
  verify2FA: (code: string) => Promise<boolean>;
  resend2FAOTP: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (data: SignupData) => Promise<boolean>;
  resendVerificationEmail: (email: string, callbackURL?: string) => Promise<void>;
  verifyEmailToken: (token: string, callbackURL?: string) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount (mock mode)
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          // Try to get user from localStorage first (faster)
          const storedUser = JSON.parse(userStr);
          setUser(storedUser);
          setIsAuthenticated(true);
          
          // Skip profile refresh on app load to avoid blocking startup if backend is slow/timeout
          // User data from localStorage is sufficient for initial render; can refresh later if needed.
        } catch (error) {
          console.error('Error loading user:', error);
          // Clear invalid data
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      } else {
        // No token or user, clear everything
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean | { requires2FA: true; email: string }> => {
    try {
      const response = await authService.login({ email, password });
      
      if (response.success && response.data) {
        // Check if 2FA is required
        if ('twoFactorRequired' in response.data && response.data.twoFactorRequired) {
          return { requires2FA: true, email: response.data.email };
        }
        
        // Normal login success
        const authData = response.data as any;
        const token = authData.token || (response as any).data?.token;
        const user = authData.user || (response as any).data?.user;
        
        if (user && token) {
          // Store token and user immediately
          localStorage.setItem('accessToken', token);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('isAuthenticated', 'true');
          
          // Update state
          setUser(user);
          setIsAuthenticated(true);
          
          console.log(`[AuthContext] Token stored successfully. Length: ${token.length}`);
          
          // IMPORTANT: Fetch user profile to get api_user and api_password
          // These are required for Bearer auth on most endpoints
          // Profile endpoint uses `token` header, other endpoints use `Bearer base64(api_user:api_password)`
          try {
            console.log('[AuthContext] Fetching profile to get API credentials...');
            const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://payments.dev.instanvi.com';
            const profileResponse = await fetch(`${apiBase}/api/users/customer/profile`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'token': token,  // Profile endpoint uses token header
              },
            });
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              console.log('[AuthContext] Profile response:', profileData);
              
              const profile = profileData.data || profileData;
              
              // Update user status if available in profile
              if (profile.status && user) {
                const updatedUser = { ...user, status: profile.status };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }
              
              if (profile.api_user && profile.api_password) {
                localStorage.setItem('apiUser', profile.api_user);
                localStorage.setItem('apiPassword', profile.api_password);
                console.log('[AuthContext] ==========================================');
                console.log('[AuthContext] API CREDENTIALS OBTAINED FROM PROFILE');
                console.log('[AuthContext] api_user:', profile.api_user);
                console.log('[AuthContext] api_password:', profile.api_password);
                console.log('[AuthContext] Base64 encoded:', btoa(`${profile.api_user}:${profile.api_password}`));
                console.log('[AuthContext] ==========================================');
                if (typeof window !== 'undefined') {
                  try {
                    window.dispatchEvent(new CustomEvent('apiCredentialsAvailable'));
                    console.log('[AuthContext] Dispatched apiCredentialsAvailable event');
                  } catch (e) {
                    // ignore
                  }
                }
              } else {
                console.warn('[AuthContext] Profile response missing api_user or api_password:', profile);
              }
            } else {
              console.error('[AuthContext] Failed to fetch profile:', profileResponse.status, profileResponse.statusText);
            }
          } catch (profileError) {
            console.error('[AuthContext] Error fetching profile for API credentials:', profileError);
          }
          
          // Note: Organization creation is now required before onboarding
          // Users must explicitly create an organization during the onboarding flow
          // This matches the backend API requirement that onboarding requires an organizationId
          
          return true;
        } else {
          console.error('Login response missing token or user:', { hasToken: !!token, hasUser: !!user, responseData: authData });
        }
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const verify2FA = async (code: string): Promise<boolean> => {
    try {
      const response = await authService.verify2FA(code, true);
      
      if (response.success && response.data) {
        const authData = response.data as any;
        if (authData.token && authData.user) {
          setUser(authData.user);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(authData.user));
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('accessToken', authData.token);
          
          // IMPORTANT: Fetch user profile to get api_user and api_password
          // These are required for Bearer auth on organization endpoints
          try {
            console.log('[AuthContext] Fetching profile to get API credentials (2FA)...');
            const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://payments.dev.instanvi.com';
            const profileResponse = await fetch(`${apiBase}/api/users/customer/profile`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'token': authData.token,
              },
            });
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              const profile = profileData.data || profileData;
              
              // Update user status if available in profile
              if (profile.status && user) {
                const updatedUser = { ...user, status: profile.status };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }
              
              if (profile.api_user && profile.api_password) {
                localStorage.setItem('apiUser', profile.api_user);
                localStorage.setItem('apiPassword', profile.api_password);
                console.log('[AuthContext] API credentials obtained from profile (2FA):', profile.api_user.substring(0, 8) + '...');
                if (typeof window !== 'undefined') {
                  try {
                    window.dispatchEvent(new CustomEvent('apiCredentialsAvailable'));
                    console.log('[AuthContext] Dispatched apiCredentialsAvailable event (2FA)');
                  } catch (e) {
                    // ignore
                  }
                }
              } else {
                console.warn('[AuthContext] Profile response missing api_user or api_password (2FA)');
              }
            } else {
              console.error('[AuthContext] Failed to fetch profile (2FA):', profileResponse.status);
            }
          } catch (profileError) {
            console.error('[AuthContext] Error fetching profile for API credentials (2FA):', profileError);
          }
          
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('2FA verification error:', error);
      return false;
    }
  };

  const resend2FAOTP = async (email: string): Promise<void> => {
    try {
      await authService.resend2FAOTP(email);
    } catch (error) {
      console.error('Resend 2FA OTP error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userApiKey');  // Clear API key on logout
      localStorage.removeItem('currentOrganizationId');  // Clear organization selection
      localStorage.removeItem('apiUser');  // Clear Basic Auth credentials
      localStorage.removeItem('apiPassword');  // Clear Basic Auth credentials
    }
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    const response = await authService.signup(data);

    if (response.success && response.data) {
      const newUser = response.data.user;
      const token = response.data.token;

      if (token) {
          localStorage.setItem('accessToken', token);
        }

        if (newUser) {
          setUser(newUser);
          // Only mark authenticated if we actually received a token
          if (token) {
            setIsAuthenticated(true);
            localStorage.setItem('isAuthenticated', 'true');
          } else {
            setIsAuthenticated(false);
            localStorage.removeItem('isAuthenticated');
          }
          localStorage.setItem('user', JSON.stringify(newUser));

        // Try to create application for API key if possible
        // This may fail if user needs to verify email first, but that's okay
        if (token) {
          try {
            const { applicationsService } = await import('@/lib/api');
            const existingApiKey = localStorage.getItem('userApiKey');

            if (!existingApiKey) {
              const appsResponse = await applicationsService.listApplications();
              const applications = appsResponse.data?.applications;

              if (appsResponse.success && applications && applications.length > 0) {
                const app = applications[0];
                if (app.api_key) {
                  localStorage.setItem('userApiKey', app.api_key);
                  console.log('[AuthContext] API key retrieved from existing application (signup)');
                }
              } else {
                const createResponse = await applicationsService.createApplication({
                  name: 'Default Application',
                  description: 'Auto-created application for API access',
                  environment: 'SANDBOX',
                });

                if (createResponse.success && createResponse.data?.api_key) {
                  localStorage.setItem('userApiKey', createResponse.data.api_key);
                  console.log('[AuthContext] Default application created with API key (signup)');
                }
              }
            }
          } catch (appError) {
            // Expected to fail if email verification is required first
            console.log('[AuthContext] Could not create application during signup (may need email verification first)');
          }
        }

        return true;
      }
    }

    // If we reach here signup failed - surface API error to caller for better UX
    const errMsg = response.error?.message || 'Signup failed';
    console.error('Signup failed:', { endpoint: '/auth/sign-up', error: response.error });
    throw new Error(errMsg);
  };

  const resendVerificationEmail = async (email: string, callbackURL?: string): Promise<void> => {
    try {
      await authService.sendVerificationOTP(email, callbackURL);
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  };

  const verifyEmailToken = async (token: string, callbackURL?: string): Promise<boolean> => {
    try {
      const response = await authService.verifyEmailToken(token, callbackURL);
      if (response.success && response.data) {
        const newUser = response.data.user;
        if (response.data.token) {
          localStorage.setItem('accessToken', response.data.token);
        }
        if (newUser) {
          setUser(newUser);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(newUser));
        } else if (response.data.token) {
          // Backend returned a token but not the user object. Fetch profile to populate user.
          try {
            const profile = await usersService.getProfile();
            if (profile.success && profile.data) {
              const profileData = profile.data as any;
              setUser(profileData);
              setIsAuthenticated(true);
              localStorage.setItem('user', JSON.stringify(profileData));
            }
          } catch (err) {
            // ignore — token is persisted and user can re-fetch later
          }
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Verify email token error:', error);
      return false;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    
    try {
      const response = await usersService.updateProfile(userData);
      if (response.success && response.data) {
        const normalizedUser: User = {
          ...response.data,
          phone: response.data.phone || undefined,
          status: response.data.status || user.status, // Preserve status from profile or existing user
        };
        setUser(normalizedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
      }
    } catch (error) {
      console.error('Update user error:', error);
      // Fallback to local update if API fails
      const updatedUser: User = {
        ...user,
        ...userData,
        status: user.status, // Preserve existing status
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        verify2FA,
        resend2FAOTP,
        logout,
        signup,
        resendVerificationEmail,
        verifyEmailToken,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

