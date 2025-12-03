/**
 * Users & Profile API Service
 */

import { apiClient, ApiResponse } from './client';

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

class UsersService {
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get<UserProfile>('/users/me');
  }

  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<UserProfile>> {
    return apiClient.put<UserProfile>('/users/me', data);
  }

  async changePassword(data: ChangePasswordData): Promise<ApiResponse<void>> {
    return apiClient.put<void>('/users/me/password', data);
  }

  async toggle2FA(enabled: boolean): Promise<ApiResponse<void>> {
    return apiClient.put<void>('/users/me/2fa', { enabled });
  }

  async getSettings(): Promise<ApiResponse<AccountSettings>> {
    return apiClient.get<AccountSettings>('/users/me/settings');
  }

  async updateSettings(data: AccountSettings): Promise<ApiResponse<AccountSettings>> {
    return apiClient.put<AccountSettings>('/users/me/settings', data);
  }
}

export const usersService = new UsersService();

