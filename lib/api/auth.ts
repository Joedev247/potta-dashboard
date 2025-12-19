/**
 * Authentication API Service (real backend)
 * Targets dev backend at http://localhost:3005/api
 */

import { ApiResponse, apiClient } from './client';

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
  role?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  username?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  redirect?: boolean;
  verified?: boolean;
}

export interface TwoFactorRequiredResponse {
  twoFactorRequired: true;
  message: string;
  email: string;
}

export interface SignupResponse {
  user: User;
  token: string;
}

class AuthService {
  private persistSession(token: string, user?: User) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', token);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  private clearSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('otp');
  }

  async signup(data: SignupData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>('/auth/sign-up', data);

    if (response.success && response.data) {
      // Ensure role is preserved from signup data if backend doesn't return it
      const user = response.data.user;
      const token = response.data.token;
      
      // Validate token length
      if (!token || token.length < 10) {
        console.error('[AuthService] Invalid token received from signup:', {
          tokenLength: token?.length,
          tokenPreview: token ? token.substring(0, 10) + '...' : 'null',
          userRole: user?.role,
          requestedRole: (data as any).role,
        });
        // Don't persist invalid token
        return {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid authentication token received from server. Please try again or contact support.',
          },
        };
      }
      
      if (data.role && (!user.role || user.role !== data.role)) {
        // Backend might not return the role, so we preserve it from the request
        user.role = data.role;
        console.log('[AuthService] Preserving role from signup data:', data.role);
      }
      
      console.log('[AuthService] Signup successful:', {
        tokenLength: token.length,
        userRole: user.role,
        requestedRole: (data as any).role,
      });
      
      this.persistSession(token, user);
    }

    return response;
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse | TwoFactorRequiredResponse>> {
    const response = await apiClient.post<AuthResponse | TwoFactorRequiredResponse>('/auth/sign-in', credentials);

    // Check if 2FA is required
    if (response.success && response.data && 'twoFactorRequired' in response.data) {
      // 2FA required - don't persist session yet
      return response;
    }

    // Normal login - persist session
    if (response.success && response.data) {
      const authData = response.data as any;
      
      // Debug: Log the full response to see the actual structure
      console.log('[AuthService] ==========================================');
      console.log('[AuthService] LOGIN RESPONSE DEBUG');
      console.log('[AuthService] Full response:', JSON.stringify(response, null, 2));
      console.log('[AuthService] response.data keys:', Object.keys(authData || {}));
      console.log('[AuthService] authData.token:', authData?.token);
      console.log('[AuthService] authData.accessToken:', authData?.accessToken);
      console.log('[AuthService] authData.access_token:', authData?.access_token);
      console.log('[AuthService] authData.data:', authData?.data);
      console.log('[AuthService] authData.user:', authData?.user);
      console.log('[AuthService] ==========================================');
      
      // Try multiple ways to extract token (different backends use different keys)
      const token = authData.token 
        || authData.accessToken 
        || authData.access_token 
        || authData.jwt
        || authData.bearerToken
        || authData.data?.token
        || authData.data?.accessToken
        || authData.data?.access_token
        || (response as any).token
        || (response as any).accessToken;
      
      // Try multiple ways to extract user
      const user = authData.user 
        || authData.data?.user 
        || (response as any).user;
      
      if (token) {
        this.persistSession(token, user);
        console.log(`[AuthService] Token stored after login. Length: ${token.length}, Preview: ${token.substring(0, 20)}...`);
      } else {
        console.error('[AuthService] Login successful but no token found in response. Available keys:', Object.keys(authData));
      }
      
      // Look for Basic Auth credentials (api_user:api_password)
      // Backend uses HTTP Basic Auth: base64(api_user:api_password)
      // NOTE: Do NOT use email or token as fallbacks - they won't work for API auth!
      // The REAL api_user and api_password come from the user profile endpoint
      const apiUser = authData.api_user 
        || authData.apiUser 
        || authData.data?.api_user
        || authData.data?.apiUser
        || authData.user?.api_user;
        
      const apiPassword = authData.api_password 
        || authData.apiPassword 
        || authData.api_secret
        || authData.apiSecret
        || authData.data?.api_password
        || authData.data?.apiPassword
        || authData.data?.api_secret
        || authData.user?.api_password;
      
      if (apiUser && apiPassword) {
        console.log('[AuthService] ==========================================');
        console.log('[AuthService] API CREDENTIALS FOUND IN LOGIN RESPONSE');
        console.log('[AuthService] apiUser:', apiUser);
        console.log('[AuthService] apiPassword length:', apiPassword?.length);
        console.log('[AuthService] Storing for Basic Auth...');
        console.log('[AuthService] ==========================================');
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('apiUser', apiUser);
          localStorage.setItem('apiPassword', apiPassword);
        }
      } else {
        // This is expected - api credentials come from profile fetch, not login response
        console.log('[AuthService] No API credentials in login response (will be fetched from profile)');
      }
    }

    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    this.clearSession();
    // Also clear Basic Auth credentials
    if (typeof window !== 'undefined') {
      localStorage.removeItem('apiUser');
      localStorage.removeItem('apiPassword');
    }
    return { success: true };
  }

  async sendVerificationOTP(email: string, callbackURL?: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/resend-verification', { email, callbackURL });
  }

  async verifyOTP(email: string, otp: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>('/auth/verify-email', { email, otp });
    if (response.success) {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const user = JSON.parse(stored);
            user.isVerified = true;
            localStorage.setItem('user', JSON.stringify(user));
          } catch {
            // ignore parse errors
          }
        }
      }
    }
    return response;
  }

  /**
   * Verify email using token (from email link).
   * Body: { token: string, callbackURL?: string }
   */
  async verifyEmailToken(token: string, callbackURL?: string): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>('/auth/verify-email', { token, callbackURL });

    if (response.success && response.data) {
      // Persist session if backend returned token + user
      if (typeof window !== 'undefined') {
        try {
          if (response.data.token) {
            localStorage.setItem('accessToken', response.data.token);
          }
          if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
        } catch {
          // ignore
        }
      }
    }

    return response;
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    return {
      success: false,
      error: { code: 'REFRESH_UNAVAILABLE', message: 'Refresh token flow not implemented' },
    };
  }

  /**
   * Enable 2FA - sends OTP to email
   */
  async enable2FA(): Promise<ApiResponse<{ email: string; message: string }>> {
    return apiClient.post<{ email: string; message: string }>('/auth/2fa/enable', {});
  }

  /**
   * Verify 2FA code
   * For login flow: no authentication required, just provide code
   * For enable flow: authentication required (token in header)
   */
  async verify2FA(code: string, isLoginFlow: boolean = false): Promise<ApiResponse<AuthResponse | { enabled: boolean; message: string }>> {
    const response = await apiClient.post<AuthResponse | { enabled: boolean; message: string }>('/auth/2fa/verify', { code });
    
    // If login flow and we got a token, persist session
    if (isLoginFlow && response.success && response.data && 'token' in response.data) {
      const authResponse = response.data as AuthResponse;
      if (authResponse.token) {
        this.persistSession(authResponse.token, authResponse.user);
      }
    }
    
    return response;
  }

  /**
   * Resend 2FA OTP for login
   */
  async resend2FAOTP(email: string): Promise<ApiResponse<{ email: string }>> {
    return apiClient.post<{ email: string }>('/auth/2fa/send-otp', { email });
  }

  /**
   * Disable 2FA - requires password verification
   */
  async disable2FA(password: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/2fa/disable', { password });
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/forgot-password', { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/reset-password', { token, password });
  }

  /**
   * Legacy login for internal users
   */
  async legacyLogin(username: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>('/auth/login', { username, password });
    if (response.success && response.data) {
      this.persistSession(response.data.token, response.data.user);
    }
    return response;
  }

  /**
   * Resend verification email with token (alternative name)
   */
  async resendVerificationEmail(email: string, callbackURL?: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/resend-verification', { email, callbackURL });
  }
}

export const authService = new AuthService();


