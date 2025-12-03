/**
 * Browse API Service (API Keys, Webhooks, Apps, Logs)
 */

import { apiClient, ApiResponse, PaginationResponse } from './client';

export interface ApiKeys {
  liveApiKey: string;
  testApiKey: string;
  createdAt: string;
  lastUsed?: string | null;
}

export interface AccessToken {
  id: string;
  name: string;
  token: string;
  scopes: string[];
  createdAt: string;
  expiresAt?: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ApiLog {
  id: string;
  time: string;
  method: string;
  endpoint: string;
  status: number;
  responseTime: string;
  requestBody?: any;
  responseBody?: any;
}

export interface App {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  created: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}

export interface ApiLogsResponse {
  logs: ApiLog[];
  pagination: PaginationResponse;
}

class BrowseService {
  // API Keys
  async getApiKeys(): Promise<ApiResponse<ApiKeys>> {
    return apiClient.get<ApiKeys>('/api-keys');
  }

  async generateApiKey(type: 'live' | 'test'): Promise<ApiResponse<{ key: string }>> {
    return apiClient.post<{ key: string }>('/api-keys/generate', { type });
  }

  async revokeApiKey(keyId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api-keys/${keyId}`);
  }

  async getApiLogs(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<ApiLogsResponse>> {
    return apiClient.get<ApiLogsResponse>('/api-keys/logs', params);
  }

  // Access Tokens
  async createAccessToken(data: {
    name: string;
    scopes: string[];
  }): Promise<ApiResponse<AccessToken>> {
    // Assuming endpoint structure similar to API keys
    return apiClient.post<AccessToken>('/access-tokens', data);
  }

  async getAccessTokens(): Promise<ApiResponse<AccessToken[]>> {
    return apiClient.get<AccessToken[]>('/access-tokens');
  }

  async revokeAccessToken(tokenId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/access-tokens/${tokenId}`);
  }

  // Webhooks
  async getWebhooks(): Promise<ApiResponse<{ webhooks: Webhook[] }>> {
    return apiClient.get<{ webhooks: Webhook[] }>('/webhooks');
  }

  async createWebhook(data: {
    url: string;
    events: string[];
  }): Promise<ApiResponse<Webhook>> {
    return apiClient.post<Webhook>('/webhooks', data);
  }

  async updateWebhook(webhookId: string, data: {
    url?: string;
    events?: string[];
    status?: 'active' | 'inactive';
  }): Promise<ApiResponse<Webhook>> {
    return apiClient.put<Webhook>(`/webhooks/${webhookId}`, data);
  }

  async deleteWebhook(webhookId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/webhooks/${webhookId}`);
  }

  // Apps (Note: This might need to be in a separate service or adjusted based on actual API)
  async getApps(): Promise<ApiResponse<{ apps: App[] }>> {
    // Placeholder - adjust endpoint as needed
    return apiClient.get<{ apps: App[] }>('/apps');
  }

  async createApp(data: {
    name: string;
    description?: string;
    redirectUri: string;
  }): Promise<ApiResponse<App>> {
    return apiClient.post<App>('/apps', data);
  }

  async updateApp(appId: string, data: {
    name?: string;
    description?: string;
    redirectUri?: string;
  }): Promise<ApiResponse<App>> {
    return apiClient.put<App>(`/apps/${appId}`, data);
  }

  async deleteApp(appId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/apps/${appId}`);
  }
}

export const browseService = new BrowseService();

