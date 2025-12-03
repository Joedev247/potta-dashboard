/**
 * Authentication API Service
 */

import { apiClient, ApiResponse } from './client';

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
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface SignupResponse {
  userId: string;
  email: string;
  isVerified: boolean;
}

class AuthService {
  async signup(data: SignupData): Promise<ApiResponse<SignupResponse>> {
    return apiClient.post<SignupResponse>('/auth/signup', data);
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    // Store tokens in localStorage on successful login
    if (response.success && response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    
    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>('/auth/logout');
    
    // Clear tokens from localStorage
    if (response.success) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    
    return response;
  }

  async sendVerificationOTP(email: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/send-verification-otp', { email });
  }

  async verifyOTP(email: string, otp: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/verify-otp', { email, otp });
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    
    // Update tokens in localStorage
    if (response.success && response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    
    return response;
  }

  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/reset-password', { token, newPassword, confirmPassword });
  }
}

export const authService = new AuthService();

