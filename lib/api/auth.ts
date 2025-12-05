/**
 * Authentication API Service
 * MOCK MODE: Using localStorage for authentication (no backend required)
 */

import { ApiResponse } from './client';

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

// Mock data storage key
const MOCK_USERS_KEY = 'mock_users';
const MOCK_OTP_KEY = 'mock_otp';

// Helper functions for localStorage
function getMockUsers(): Map<string, { password: string; user: User }> {
  if (typeof window === 'undefined') return new Map();
  
  const stored = localStorage.getItem(MOCK_USERS_KEY);
  if (!stored) return new Map();
  
  try {
    const data = JSON.parse(stored);
    return new Map(Object.entries(data));
  } catch {
    return new Map();
  }
}

function saveMockUsers(users: Map<string, { password: string; user: User }>) {
  if (typeof window === 'undefined') return;
  
  const data = Object.fromEntries(users);
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(data));
}

function generateToken(): string {
  return 'mock_token_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateUserId(): string {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

// Initialize with a default test user
function initializeMockUsers() {
  if (typeof window === 'undefined') return;
  
  const users = getMockUsers();
  if (users.size === 0) {
    // Create default test user
    const defaultUser: User = {
      id: 'user_default',
      email: 'test@mollie-test.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      isVerified: true,
      role: 'user',
    };
    
    users.set('test@mollie-test.com', {
      password: 'password123', // Store plain text for mock (not secure, but fine for development)
      user: defaultUser,
    });
    
    saveMockUsers(users);
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeMockUsers();
}

class AuthService {
  async signup(data: SignupData): Promise<ApiResponse<SignupResponse>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const users = getMockUsers();
    
    // Check if user already exists
    if (users.has(data.email.toLowerCase())) {
      return {
        success: false,
        error: { code: 'USER_EXISTS', message: 'An account with this email already exists' },
      };
    }
    
    // Check if username is taken
    for (const [, userData] of users) {
      if (userData.user.username === data.username) {
        return {
          success: false,
          error: { code: 'USERNAME_EXISTS', message: 'This username is already taken' },
        };
      }
    }
    
    // Create new user
    const newUser: User = {
      id: generateUserId(),
      email: data.email.toLowerCase(),
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      isVerified: false,
      role: 'user',
    };
    
    users.set(data.email.toLowerCase(), {
      password: data.password, // Store plain text for mock
      user: newUser,
    });
    
    saveMockUsers(users);
    
    return {
      success: true,
      data: {
        userId: newUser.id,
        email: newUser.email,
        isVerified: false,
      },
    };
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const users = getMockUsers();
    const email = credentials.email.toLowerCase();
    const userData = users.get(email);
    
    if (!userData || userData.password !== credentials.password) {
      return {
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      };
    }
    
    // Generate mock tokens
    const accessToken = generateToken();
    const refreshToken = generateToken();
    
    // Store tokens in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: userData.user,
      },
    };
  }

  async logout(): Promise<ApiResponse<void>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (typeof window === 'undefined') {
      return { success: true };
    }
    
    // Clear tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    return { success: true };
  }

  async sendVerificationOTP(email: string): Promise<ApiResponse<void>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return { success: true };
    }
    
    // Generate and store mock OTP (123456 for easy testing)
    const otp = '123456';
    localStorage.setItem(MOCK_OTP_KEY, JSON.stringify({ email, otp, timestamp: Date.now() }));
    
    console.log(`[MOCK] OTP sent to ${email}: ${otp}`);
    
    return { success: true };
  }

  async verifyOTP(email: string, otp: string): Promise<ApiResponse<void>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return { success: true };
    }
    
    const stored = localStorage.getItem(MOCK_OTP_KEY);
    if (!stored) {
      return {
        success: false,
        error: { code: 'OTP_NOT_FOUND', message: 'OTP not found or expired' },
      };
    }
    
    try {
      const { email: storedEmail, otp: storedOtp, timestamp } = JSON.parse(stored);
      
      // OTP expires after 10 minutes
      if (Date.now() - timestamp > 10 * 60 * 1000) {
        localStorage.removeItem(MOCK_OTP_KEY);
        return {
          success: false,
          error: { code: 'OTP_EXPIRED', message: 'OTP has expired' },
        };
      }
      
      if (storedEmail.toLowerCase() !== email.toLowerCase() || storedOtp !== otp) {
        return {
          success: false,
          error: { code: 'INVALID_OTP', message: 'Invalid OTP' },
        };
      }
      
      // Mark user as verified
      const users = getMockUsers();
      const userData = users.get(email.toLowerCase());
      if (userData) {
        userData.user.isVerified = true;
        saveMockUsers(users);
      }
      
      localStorage.removeItem(MOCK_OTP_KEY);
      
      return { success: true };
    } catch {
      return {
        success: false,
        error: { code: 'OTP_ERROR', message: 'Error verifying OTP' },
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
      return {
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' },
      };
    }
    
    // Get user from token (simplified - in real app, decode token)
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      };
    }
    
    try {
      const user: User = JSON.parse(userStr);
      const newAccessToken = generateToken();
      const newRefreshToken = generateToken();
      
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      return {
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          user,
        },
      };
    } catch {
      return {
        success: false,
        error: { code: 'PARSE_ERROR', message: 'Error parsing user data' },
      };
    }
  }

  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return { success: true };
    }
    
    const users = getMockUsers();
    if (!users.has(email.toLowerCase())) {
      // Don't reveal if user exists (security best practice)
      return { success: true };
    }
    
    // In a real app, send password reset email
    console.log(`[MOCK] Password reset email sent to ${email}`);
    
    return { success: true };
  }

  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<ApiResponse<void>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return { success: true };
    }
    
    if (newPassword !== confirmPassword) {
      return {
        success: false,
        error: { code: 'PASSWORD_MISMATCH', message: 'Passwords do not match' },
      };
    }
    
    // In a real app, validate token and update password
    // For mock, we'll just return success
    console.log(`[MOCK] Password reset completed`);
    
    return { success: true };
  }
}

export const authService = new AuthService();


