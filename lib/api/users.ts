/**
 * Users & Profile API Service
 * MOCK MODE: Using localStorage for user data (no backend required)
 */

import { ApiResponse } from './client';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  isVerified: boolean;
  role: string;
}

export interface AccountSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const MOCK_SETTINGS_KEY = 'mock_user_settings';

// Helper to get user from localStorage
function getCurrentUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    const user = JSON.parse(userStr);
    return {
      ...user,
      role: user.role || 'user',
      phone: user.phone || null,
    };
  } catch {
    return null;
  }
}

// Helper to get settings from localStorage
function getSettings(): AccountSettings {
  if (typeof window === 'undefined') {
    return {
      emailNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
    };
  }
  
  const stored = localStorage.getItem(MOCK_SETTINGS_KEY);
  if (!stored) {
    const defaultSettings: AccountSettings = {
      emailNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
    };
    localStorage.setItem(MOCK_SETTINGS_KEY, JSON.stringify(defaultSettings));
    return defaultSettings;
  }
  
  try {
    return JSON.parse(stored);
  } catch {
    return {
      emailNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
    };
  }
}

class UsersService {
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const user = getCurrentUser();
    
    if (!user) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      };
    }
    
    return {
      success: true,
      data: user,
    };
  }

  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<UserProfile>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      };
    }
    
    const updatedUser: UserProfile = {
      ...currentUser,
      ...data,
    };
    
    // Update in localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Also update in mock users storage
    const MOCK_USERS_KEY = 'mock_users';
    const stored = localStorage.getItem(MOCK_USERS_KEY);
    if (stored) {
      try {
        const users = JSON.parse(stored);
        const email = currentUser.email.toLowerCase();
        if (users[email]) {
          users[email].user = updatedUser;
          localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
        }
      } catch {
        // Ignore errors
      }
    }
    
    return {
      success: true,
      data: updatedUser,
    };
  }

  async changePassword(data: ChangePasswordData): Promise<ApiResponse<void>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    if (data.newPassword !== data.confirmPassword) {
      return {
        success: false,
        error: { code: 'PASSWORD_MISMATCH', message: 'Passwords do not match' },
      };
    }
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      };
    }
    
    // Update password in mock users storage
    const MOCK_USERS_KEY = 'mock_users';
    const stored = localStorage.getItem(MOCK_USERS_KEY);
    if (stored) {
      try {
        const users = JSON.parse(stored);
        const email = currentUser.email.toLowerCase();
        if (users[email] && users[email].password === data.currentPassword) {
          users[email].password = data.newPassword;
          localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
          return { success: true };
        } else {
          return {
            success: false,
            error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' },
          };
        }
      } catch {
        return {
          success: false,
          error: { code: 'UPDATE_ERROR', message: 'Error updating password' },
        };
      }
    }
    
    return {
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' },
    };
  }

  async toggle2FA(enabled: boolean): Promise<ApiResponse<void>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return { success: true };
    }
    
    console.log(`[MOCK] 2FA ${enabled ? 'enabled' : 'disabled'}`);
    
    return { success: true };
  }

  async getSettings(): Promise<ApiResponse<AccountSettings>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (typeof window === 'undefined') {
      return {
        success: true,
        data: {
          emailNotifications: true,
          pushNotifications: true,
          marketingEmails: false,
        },
      };
    }
    
    const settings = getSettings();
    
    return {
      success: true,
      data: settings,
    };
  }

  async updateSettings(data: AccountSettings): Promise<ApiResponse<AccountSettings>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    localStorage.setItem(MOCK_SETTINGS_KEY, JSON.stringify(data));
    
    return {
      success: true,
      data,
    };
  }
}

export const usersService = new UsersService();


