/**
 * Browse API Service (API Keys, Webhooks, Apps, Logs)
 * MOCK MODE: Using localStorage for browse data (no backend required)
 */

import { ApiResponse, PaginationResponse } from './client';

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

// Storage keys
const MOCK_API_KEYS_KEY = 'mock_api_keys';
const MOCK_ACCESS_TOKENS_KEY = 'mock_access_tokens';
const MOCK_WEBHOOKS_KEY = 'mock_webhooks';
const MOCK_API_LOGS_KEY = 'mock_api_logs';
const MOCK_APPS_KEY = 'mock_apps';

// Helper functions
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateApiKey(): string {
  return `live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

function generateToken(): string {
  return `tok_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

function generateClientId(): string {
  return `app_${Math.random().toString(36).substring(2, 15)}`;
}

function generateClientSecret(): string {
  return `secret_${Math.random().toString(36).substring(2, 20)}${Math.random().toString(36).substring(2, 20)}`;
}

function getStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to ${key}:`, error);
  }
}

function getStorageSingle<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveStorageSingle<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to ${key}:`, error);
  }
}

// Initialize mock data
function initializeMockData() {
  if (typeof window === 'undefined') return;
  
  // Initialize API Keys
  if (!localStorage.getItem(MOCK_API_KEYS_KEY)) {
    const now = new Date();
    const apiKeys: ApiKeys = {
      liveApiKey: generateApiKey(),
      testApiKey: `test_${generateApiKey()}`,
      createdAt: now.toISOString(),
      lastUsed: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    };
    saveStorageSingle(MOCK_API_KEYS_KEY, apiKeys);
  }
  
  // Initialize Access Tokens
  if (!localStorage.getItem(MOCK_ACCESS_TOKENS_KEY)) {
    const now = new Date();
    const tokens: AccessToken[] = [
      {
        id: generateId('tok'),
        name: 'Production API Token',
        token: generateToken(),
        scopes: ['payments.read', 'payments.write', 'refunds.read', 'refunds.write'],
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        expiresAt: new Date(now.getTime() + 335 * 24 * 60 * 60 * 1000).toISOString(), // 335 days from now
      },
      {
        id: generateId('tok'),
        name: 'Development Token',
        token: generateToken(),
        scopes: ['payments.read', 'refunds.read'],
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        expiresAt: new Date(now.getTime() + 358 * 24 * 60 * 60 * 1000).toISOString(), // 358 days from now
      },
      {
        id: generateId('tok'),
        name: 'Read-only Token',
        token: generateToken(),
        scopes: ['payments.read', 'refunds.read', 'invoices.read'],
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      },
    ];
    saveStorage(MOCK_ACCESS_TOKENS_KEY, tokens);
  }
  
  // Initialize Webhooks
  if (!localStorage.getItem(MOCK_WEBHOOKS_KEY)) {
    const now = new Date();
    const webhooks: Webhook[] = [
      {
        id: generateId('wh'),
        url: 'https://api.example.com/webhooks/payments',
        events: ['payment.completed', 'payment.failed', 'refund.completed'],
        status: 'active',
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
      },
      {
        id: generateId('wh'),
        url: 'https://myapp.com/webhook-handler',
        events: ['payment.completed', 'chargeback.created'],
        status: 'active',
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      },
      {
        id: generateId('wh'),
        url: 'https://staging.example.com/webhooks',
        events: ['payment.completed'],
        status: 'inactive',
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      },
    ];
    saveStorage(MOCK_WEBHOOKS_KEY, webhooks);
  }
  
  // Initialize API Logs
  if (!localStorage.getItem(MOCK_API_LOGS_KEY)) {
    const now = new Date();
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const endpoints = [
      '/api/payments',
      '/api/payments/123',
      '/api/refunds',
      '/api/invoices',
      '/api/customers',
      '/api/webhooks',
      '/api/balance',
    ];
    const statusCodes = [200, 201, 400, 401, 404, 500];
    const logs: ApiLog[] = [];
    
    // Generate 50 API logs over the last 7 days
    for (let i = 0; i < 50; i++) {
      const hoursAgo = Math.floor(Math.random() * 168); // Last 7 days (168 hours)
      const logTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
      const method = methods[Math.floor(Math.random() * methods.length)];
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const status = statusCodes[Math.floor(Math.random() * statusCodes.length)];
      const responseTime = `${Math.floor(Math.random() * 500) + 50}ms`;
      
      const log: ApiLog = {
        id: generateId('log'),
        time: logTime.toISOString(),
        method,
        endpoint,
        status,
        responseTime,
        requestBody: method === 'POST' || method === 'PUT' ? { amount: 10000, currency: 'XAF' } : undefined,
        responseBody: status < 400 ? { success: true, data: {} } : { success: false, error: { message: 'Error occurred' } },
      };
      
      logs.push(log);
    }
    
    // Sort by time (newest first)
    logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    saveStorage(MOCK_API_LOGS_KEY, logs);
  }
  
  // Initialize Apps
  if (!localStorage.getItem(MOCK_APPS_KEY)) {
    const now = new Date();
    const apps: App[] = [
      {
        id: generateId('app'),
        name: 'E-commerce Integration',
        description: 'Main e-commerce platform integration',
        status: 'active',
        created: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
        redirectUri: 'https://myapp.com/callback',
        clientId: generateClientId(),
        clientSecret: generateClientSecret(),
      },
      {
        id: generateId('app'),
        name: 'Mobile App',
        description: 'Mobile application for payment processing',
        status: 'active',
        created: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
        redirectUri: 'myapp://callback',
        clientId: generateClientId(),
        clientSecret: generateClientSecret(),
      },
      {
        id: generateId('app'),
        name: 'Test Application',
        description: 'Testing and development app',
        status: 'inactive',
        created: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
        redirectUri: 'https://test.example.com/callback',
        clientId: generateClientId(),
        clientSecret: generateClientSecret(),
      },
    ];
    saveStorage(MOCK_APPS_KEY, apps);
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeMockData();
}

// Helper for pagination
function paginate<T>(items: T[], page: number = 1, limit: number = 20): { items: T[]; pagination: PaginationResponse } {
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedItems = items.slice(start, end);
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  
  return {
    items: paginatedItems,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Helper to filter API logs
function filterApiLogs(logs: ApiLog[], params?: {
  startDate?: string;
  endDate?: string;
}): ApiLog[] {
  let filtered = [...logs];
  
  if (params?.startDate) {
    const start = new Date(params.startDate);
    filtered = filtered.filter(log => new Date(log.time) >= start);
  }
  
  if (params?.endDate) {
    const end = new Date(params.endDate);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter(log => new Date(log.time) <= end);
  }
  
  return filtered;
}

class BrowseService {
  // API Keys
  async getApiKeys(): Promise<ApiResponse<ApiKeys>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const apiKeys = getStorageSingle<ApiKeys>(MOCK_API_KEYS_KEY);
    
    if (!apiKeys) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'API keys not found' },
      };
    }
    
    // Mask the keys for display (show only last 4 characters)
    const maskedKeys: ApiKeys = {
      ...apiKeys,
      liveApiKey: apiKeys.liveApiKey ? `${apiKeys.liveApiKey.substring(0, 8)}...${apiKeys.liveApiKey.slice(-4)}` : '',
      testApiKey: apiKeys.testApiKey ? `${apiKeys.testApiKey.substring(0, 8)}...${apiKeys.testApiKey.slice(-4)}` : '',
    };
    
    return { success: true, data: maskedKeys };
  }

  async generateApiKey(type: 'live' | 'test'): Promise<ApiResponse<{ key: string }>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const newKey = generateApiKey();
    const apiKeys = getStorageSingle<ApiKeys>(MOCK_API_KEYS_KEY) || {
      liveApiKey: '',
      testApiKey: '',
      createdAt: new Date().toISOString(),
      lastUsed: null,
    };
    
    if (type === 'live') {
      apiKeys.liveApiKey = newKey;
    } else {
      apiKeys.testApiKey = `test_${newKey}`;
    }
    
    apiKeys.createdAt = new Date().toISOString();
    saveStorageSingle(MOCK_API_KEYS_KEY, apiKeys);
    
    return { success: true, data: { key: newKey } };
  }

  async revokeApiKey(keyId: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return { success: true };
    }
    
    const apiKeys = getStorageSingle<ApiKeys>(MOCK_API_KEYS_KEY);
    if (apiKeys) {
      // In a real app, you'd revoke a specific key
      // For mock, we'll just clear the keys
      apiKeys.liveApiKey = '';
      apiKeys.testApiKey = '';
      saveStorageSingle(MOCK_API_KEYS_KEY, apiKeys);
    }
    
    console.log(`[MOCK] API key revoked: ${keyId}`);
    
    return { success: true };
  }

  async getApiLogs(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<ApiLogsResponse>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (typeof window === 'undefined') {
      return {
        success: true,
        data: { logs: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
      };
    }
    
    let logs = getStorage<ApiLog>(MOCK_API_LOGS_KEY);
    logs = filterApiLogs(logs, params);
    
    const { items, pagination } = paginate(logs, params?.page || 1, params?.limit || 20);
    
    return {
      success: true,
      data: {
        logs: items,
        pagination,
      },
    };
  }

  // Access Tokens
  async createAccessToken(data: {
    name: string;
    scopes: string[];
  }): Promise<ApiResponse<AccessToken>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now
    
    const token: AccessToken = {
      id: generateId('tok'),
      name: data.name,
      token: generateToken(),
      scopes: data.scopes,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    
    const tokens = getStorage<AccessToken>(MOCK_ACCESS_TOKENS_KEY);
    tokens.unshift(token);
    saveStorage(MOCK_ACCESS_TOKENS_KEY, tokens);
    
    return { success: true, data: token };
  }

  async getAccessTokens(): Promise<ApiResponse<AccessToken[]>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return { success: true, data: [] };
    }
    
    const tokens = getStorage<AccessToken>(MOCK_ACCESS_TOKENS_KEY);
    
    // Mask tokens for display (show only first and last few characters)
    const maskedTokens = tokens.map(token => ({
      ...token,
      token: token.token ? `${token.token.substring(0, 8)}...${token.token.slice(-4)}` : '',
    }));
    
    return { success: true, data: maskedTokens };
  }

  async revokeAccessToken(tokenId: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return { success: true };
    }
    
    const tokens = getStorage<AccessToken>(MOCK_ACCESS_TOKENS_KEY);
    const filtered = tokens.filter(t => t.id !== tokenId);
    saveStorage(MOCK_ACCESS_TOKENS_KEY, filtered);
    
    console.log(`[MOCK] Access token revoked: ${tokenId}`);
    
    return { success: true };
  }

  // Webhooks
  async getWebhooks(): Promise<ApiResponse<{ webhooks: Webhook[] }>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return { success: true, data: { webhooks: [] } };
    }
    
    const webhooks = getStorage<Webhook>(MOCK_WEBHOOKS_KEY);
    
    return { success: true, data: { webhooks } };
  }

  async createWebhook(data: {
    url: string;
    events: string[];
  }): Promise<ApiResponse<Webhook>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const webhook: Webhook = {
      id: generateId('wh'),
      url: data.url,
      events: data.events,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    
    const webhooks = getStorage<Webhook>(MOCK_WEBHOOKS_KEY);
    webhooks.unshift(webhook);
    saveStorage(MOCK_WEBHOOKS_KEY, webhooks);
    
    return { success: true, data: webhook };
  }

  async updateWebhook(webhookId: string, data: {
    url?: string;
    events?: string[];
    status?: 'active' | 'inactive';
  }): Promise<ApiResponse<Webhook>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Webhook not found' },
      };
    }
    
    const webhooks = getStorage<Webhook>(MOCK_WEBHOOKS_KEY);
    const webhook = webhooks.find(w => w.id === webhookId);
    
    if (!webhook) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Webhook not found' },
      };
    }
    
    if (data.url) webhook.url = data.url;
    if (data.events) webhook.events = data.events;
    if (data.status) webhook.status = data.status;
    
    saveStorage(MOCK_WEBHOOKS_KEY, webhooks);
    
    return { success: true, data: webhook };
  }

  async deleteWebhook(webhookId: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return { success: true };
    }
    
    const webhooks = getStorage<Webhook>(MOCK_WEBHOOKS_KEY);
    const filtered = webhooks.filter(w => w.id !== webhookId);
    saveStorage(MOCK_WEBHOOKS_KEY, filtered);
    
    console.log(`[MOCK] Webhook deleted: ${webhookId}`);
    
    return { success: true };
  }

  // Apps
  async getApps(): Promise<ApiResponse<{ apps: App[] }>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return { success: true, data: { apps: [] } };
    }
    
    const apps = getStorage<App>(MOCK_APPS_KEY);
    
    // Mask client secrets for display
    const maskedApps = apps.map(app => ({
      ...app,
      clientSecret: app.clientSecret ? `${app.clientSecret.substring(0, 8)}...${app.clientSecret.slice(-4)}` : '',
    }));
    
    return { success: true, data: { apps: maskedApps } };
  }

  async createApp(data: {
    name: string;
    description?: string;
    redirectUri: string;
  }): Promise<ApiResponse<App>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Not available on server' },
      };
    }
    
    const app: App = {
      id: generateId('app'),
      name: data.name,
      description: data.description,
      status: 'active',
      created: new Date().toISOString(),
      redirectUri: data.redirectUri,
      clientId: generateClientId(),
      clientSecret: generateClientSecret(),
    };
    
    const apps = getStorage<App>(MOCK_APPS_KEY);
    apps.unshift(app);
    saveStorage(MOCK_APPS_KEY, apps);
    
    return { success: true, data: app };
  }

  async updateApp(appId: string, data: {
    name?: string;
    description?: string;
    redirectUri?: string;
  }): Promise<ApiResponse<App>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'App not found' },
      };
    }
    
    const apps = getStorage<App>(MOCK_APPS_KEY);
    const app = apps.find(a => a.id === appId);
    
    if (!app) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'App not found' },
      };
    }
    
    if (data.name) app.name = data.name;
    if (data.description !== undefined) app.description = data.description;
    if (data.redirectUri) app.redirectUri = data.redirectUri;
    
    saveStorage(MOCK_APPS_KEY, apps);
    
    return { success: true, data: app };
  }

  async deleteApp(appId: string): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (typeof window === 'undefined') {
      return { success: true };
    }
    
    const apps = getStorage<App>(MOCK_APPS_KEY);
    const filtered = apps.filter(a => a.id !== appId);
    saveStorage(MOCK_APPS_KEY, filtered);
    
    console.log(`[MOCK] App deleted: ${appId}`);
    
    return { success: true };
  }
}

export const browseService = new BrowseService();


