/**
 * Notifications API Service
 */

import { apiClient, ApiResponse, PaginationResponse } from './client';

export interface Notification {
  id: string;
  type: string;
  category: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string | null;
  createdAt: string;
}

export interface NotificationsListResponse {
  notifications: Notification[];
  unreadCount: {
    primary: number;
    notification: number;
  };
  pagination: PaginationResponse;
}

class NotificationsService {
  async getNotifications(params?: {
    type?: 'primary' | 'notification';
    filter?: 'all' | 'unread';
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<NotificationsListResponse>> {
    return apiClient.get<NotificationsListResponse>('/notifications', params);
  }

  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`/notifications/${notificationId}/read`);
  }

  async markAllAsRead(type?: 'primary' | 'notification'): Promise<ApiResponse<void>> {
    return apiClient.put<void>('/notifications/read-all', type ? { type } : undefined);
  }
}

export const notificationsService = new NotificationsService();


