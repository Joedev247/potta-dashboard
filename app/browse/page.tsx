'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Copy, Info, RefreshCw, Plus, Trash2, ExternalLink, Search, Filter, Calendar, CheckCircle2, XCircle, Clock, Globe, X, Edit, AlertCircle, Loader2 } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { browseService } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/utils/format';

export default function BrowsePage() {
  const { organization } = useOrganization();
  const [activeTab, setActiveTab] = useState('api-keys');
  const [showLiveKey, setShowLiveKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // API Keys states
  const [apiKeys, setApiKeys] = useState<any>({ liveApiKey: '', testApiKey: '', createdAt: '', lastUsed: null });
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState<string | null>(null);
  
  // Access Tokens states
  const [showCreateToken, setShowCreateToken] = useState(false);
  const [tokens, setTokens] = useState<any[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [tokenFormData, setTokenFormData] = useState({ name: '', expiresIn: '365' });
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenSuccess, setTokenSuccess] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [showRevokeTokenConfirm, setShowRevokeTokenConfirm] = useState<string | null>(null);
  
  // Webhooks states
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<any>(null);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState(false);
  const [webhookFormData, setWebhookFormData] = useState({ url: '', events: [] as string[] });
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState('');
  const [webhookError, setWebhookError] = useState('');
  const [showDeleteWebhookConfirm, setShowDeleteWebhookConfirm] = useState<string | null>(null);
  
  // API Logs states
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('Last 7 days');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  
  // API Logs states
  const [apiLogs, setApiLogs] = useState<any[]>([]);
  const [apiLogsLoading, setApiLogsLoading] = useState(false);
  const [apiLogsPagination, setApiLogsPagination] = useState({ page: 1, limit: 20, total: 0 });
  
  // Your Apps states
  const [showCreateApp, setShowCreateApp] = useState(false);
  const [editingApp, setEditingApp] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appFormData, setAppFormData] = useState({ name: '', description: '', redirectUri: '' });
  const [appLoading, setAppLoading] = useState(false);
  const [appSuccess, setAppSuccess] = useState('');
  const [appError, setAppError] = useState('');
  const [showDeleteAppConfirm, setShowDeleteAppConfirm] = useState<string | null>(null);

  const tabs = [
    { id: 'api-keys', label: 'API keys' },
    { id: 'access-tokens', label: 'Access tokens' },
    { id: 'webhooks', label: 'Webhooks' },
    { id: 'api-logs', label: 'API logs' },
    { id: 'your-apps', label: 'Your apps' },
  ];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch API Keys
  const fetchApiKeys = useCallback(async () => {
    setApiKeysLoading(true);
    try {
      const response = await browseService.getApiKeys();
      if (response.success && response.data) {
        setApiKeys(response.data);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setApiKeysLoading(false);
    }
  }, []);

  // Fetch Access Tokens
  const fetchTokens = useCallback(async () => {
    setTokensLoading(true);
    try {
      const response = await browseService.getAccessTokens();
      if (response.success && response.data) {
        setTokens(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setTokensLoading(false);
    }
  }, []);

  // Fetch Webhooks
  const fetchWebhooks = useCallback(async () => {
    setWebhooksLoading(true);
    try {
      const response = await browseService.getWebhooks();
      if (response.success && response.data) {
        setWebhooks(response.data.webhooks || []);
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setWebhooksLoading(false);
    }
  }, []);

  // Fetch API Logs
  const fetchApiLogs = useCallback(async () => {
    setApiLogsLoading(true);
    try {
      const params: any = {
        page: apiLogsPagination.page,
        limit: apiLogsPagination.limit,
      };
      
      if (selectedDateFilter && selectedDateFilter !== 'All') {
        const today = new Date();
        let startDate: Date = today;
        
        switch (selectedDateFilter) {
          case 'Last 7 days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            break;
          case 'Last 30 days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 30);
            break;
          case 'Last 90 days':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 90);
            break;
        }
        
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = today.toISOString().split('T')[0];
      }
      
      const response = await browseService.getApiLogs(params);
      if (response.success && response.data) {
        setApiLogs(response.data.logs || []);
        if (response.data.pagination) {
          setApiLogsPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching API logs:', error);
    } finally {
      setApiLogsLoading(false);
    }
  }, [selectedDateFilter, apiLogsPagination.page, apiLogsPagination.limit]);

  // Fetch Apps
  const fetchApps = useCallback(async () => {
    setAppsLoading(true);
    try {
      const response = await browseService.getApps();
      if (response.success && response.data) {
        setApps(response.data.apps || []);
      }
    } catch (error) {
      console.error('Error fetching apps:', error);
    } finally {
      setAppsLoading(false);
    }
  }, []);

  // Fetch data on mount and tab change
  useEffect(() => {
    if (activeTab === 'api-keys') {
      fetchApiKeys();
    } else if (activeTab === 'access-tokens') {
      fetchTokens();
    } else if (activeTab === 'webhooks') {
      fetchWebhooks();
    } else if (activeTab === 'api-logs') {
      fetchApiLogs();
    } else if (activeTab === 'your-apps') {
      fetchApps();
    }
  }, [activeTab, fetchApiKeys, fetchTokens, fetchWebhooks, fetchApiLogs, fetchApps]);

  // API Keys handlers
  const handleResetApiKey = async (type: 'live' | 'test') => {
    setShowResetConfirm(null);
    try {
      const response = await browseService.generateApiKey(type);
      if (response.success) {
        // Refresh API keys after reset
        await fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to reset API key:', error);
    }
  };

  // Access Tokens handlers
  const handleCreateToken = async () => {
    setTokenLoading(true);
    setTokenError('');
    setTokenSuccess('');
    
    if (!tokenFormData.name.trim()) {
      setTokenError('Token name is required.');
      setTokenLoading(false);
      return;
    }

    try {
      const scopes = ['payments:read', 'payments:write', 'refunds:read', 'refunds:write'];
      const response = await browseService.createAccessToken({
        name: tokenFormData.name,
        scopes,
      });
      
      if (response.success && response.data) {
        setTokenSuccess(`Token created successfully! Token: ${response.data.token}`);
        await fetchTokens();
        setTokenFormData({ name: '', expiresIn: '365' });
        setTimeout(() => {
          setShowCreateToken(false);
          setTokenSuccess('');
        }, 3000);
      } else {
        setTokenError(response.error?.message || 'Failed to create token. Please try again.');
      }
    } catch (error) {
      console.error('Create token error:', error);
      setTokenError('Failed to create token. Please try again.');
    } finally {
      setTokenLoading(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    setShowRevokeTokenConfirm(tokenId);
  };

  const confirmRevokeToken = async () => {
    if (!showRevokeTokenConfirm) return;
    const tokenId = showRevokeTokenConfirm;
    setShowRevokeTokenConfirm(null);
    try {
      const response = await browseService.revokeAccessToken(tokenId);
      if (response.success) {
        await fetchTokens();
      }
    } catch (error) {
      console.error('Failed to revoke token:', error);
    }
  };

  // Webhooks handlers
  const handleCreateWebhook = async () => {
    setWebhookLoading(true);
    setWebhookError('');
    setWebhookSuccess('');
    
    if (!webhookFormData.url.trim()) {
      setWebhookError('Webhook URL is required.');
      setWebhookLoading(false);
      return;
    }
    if (webhookFormData.events.length === 0) {
      setWebhookError('At least one event must be selected.');
      setWebhookLoading(false);
      return;
    }

    try {
      const response = editingWebhook
        ? await browseService.updateWebhook(editingWebhook.id, {
            url: webhookFormData.url,
            events: webhookFormData.events,
            status: 'active',
          })
        : await browseService.createWebhook({
            url: webhookFormData.url,
            events: webhookFormData.events,
          });
      
      if (response.success) {
        setWebhookSuccess(editingWebhook ? 'Webhook updated successfully!' : 'Webhook created successfully!');
        await fetchWebhooks();
        setWebhookFormData({ url: '', events: [] });
        setTimeout(() => {
          setShowWebhookModal(false);
          setWebhookSuccess('');
          setEditingWebhook(null);
        }, 2000);
      } else {
        setWebhookError(response.error?.message || 'Failed to save webhook. Please try again.');
      }
    } catch (error) {
      console.error('Webhook error:', error);
      setWebhookError('Failed to save webhook. Please try again.');
    } finally {
      setWebhookLoading(false);
    }
  };

  // handleUpdateWebhook is now handled in handleCreateWebhook (combined logic)

  const handleDeleteWebhook = async (webhookId: string) => {
    setShowDeleteWebhookConfirm(webhookId);
  };

  const confirmDeleteWebhook = async () => {
    if (!showDeleteWebhookConfirm) return;
    const webhookId = showDeleteWebhookConfirm;
    setShowDeleteWebhookConfirm(null);
    try {
      const response = await browseService.deleteWebhook(webhookId);
      if (response.success) {
        await fetchWebhooks();
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const handleEditWebhook = (webhook: any) => {
    setEditingWebhook(webhook);
    setWebhookFormData({ url: webhook.url, events: webhook.events });
    setShowWebhookModal(true);
  };

  // API Logs handlers
  const getFilteredLogs = () => {
    let filtered = [...apiLogs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.method.toLowerCase().includes(query) ||
        log.endpoint.toLowerCase().includes(query) ||
        log.status.toString().includes(query)
      );
    }

    if (selectedFilter) {
      if (selectedFilter === 'success') {
        filtered = filtered.filter(log => log.status >= 200 && log.status < 300);
      } else if (selectedFilter === 'error') {
        filtered = filtered.filter(log => log.status >= 400);
      } else if (selectedFilter === 'method') {
        filtered = filtered.sort((a, b) => a.method.localeCompare(b.method));
      }
    }

    if (selectedDateFilter !== 'All') {
      const now = new Date();
      const days = selectedDateFilter === 'Last 7 days' ? 7 : selectedDateFilter === 'Last 30 days' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(log => {
        const logDate = new Date(log.time);
        return logDate >= cutoffDate;
      });
    }

    return filtered;
  };

  // Your Apps handlers
  const handleCreateApp = async () => {
    setAppLoading(true);
    setAppError('');
    setAppSuccess('');
    
    if (!appFormData.name.trim() || !appFormData.redirectUri.trim()) {
      setAppError('Name and redirect URI are required.');
      setAppLoading(false);
      return;
    }

    try {
      const response = editingApp
        ? await browseService.updateApp(editingApp.id, {
            name: appFormData.name,
            description: appFormData.description || undefined,
            redirectUri: appFormData.redirectUri,
          })
        : await browseService.createApp({
            name: appFormData.name,
            description: appFormData.description || undefined,
            redirectUri: appFormData.redirectUri,
          });
      
      if (response.success) {
        setAppSuccess(editingApp ? 'App updated successfully!' : 'App created successfully!');
        await fetchApps();
        setAppFormData({ name: '', description: '', redirectUri: '' });
        setTimeout(() => {
          setShowCreateApp(false);
          setAppSuccess('');
          setEditingApp(null);
        }, 2000);
      } else {
        setAppError(response.error?.message || 'Failed to save app. Please try again.');
      }
    } catch (error) {
      console.error('App error:', error);
      setAppError('Failed to save app. Please try again.');
    } finally {
      setAppLoading(false);
    }
  };

  // handleUpdateApp is now handled in handleCreateApp (combined logic)

  const handleDeleteApp = async (appId: string) => {
    setShowDeleteAppConfirm(appId);
  };

  const confirmDeleteApp = async () => {
    if (!showDeleteAppConfirm) return;
    const appId = showDeleteAppConfirm;
    setShowDeleteAppConfirm(null);
    try {
      const response = await browseService.deleteApp(appId);
      if (response.success) {
        await fetchApps();
      }
    } catch (error) {
      console.error('Failed to delete app:', error);
    }
  };

  const handleEditApp = (app: any) => {
    setEditingApp(app);
    setAppFormData({ name: app.name, description: app.description, redirectUri: app.redirectUri });
    setShowCreateApp(true);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setShowDateDropdown(false);
      }
    };

    if (showFilterDropdown || showDateDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilterDropdown, showDateDropdown]);

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            {activeTab === 'api-keys' ? 'API keys' :
             activeTab === 'access-tokens' ? 'Access tokens' :
             activeTab === 'webhooks' ? 'Webhooks' :
             activeTab === 'api-logs' ? 'API logs' :
             activeTab === 'your-apps' ? 'Your apps' : 'API keys'}
          </h1>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 border-b-2 border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'api-keys' && (
        apiKeysLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : (
        <>
          {/* Your API keys Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your API keys</h2>
            <p className="text-gray-600 mb-6">
              Your API keys are unique to your instanvi account, which is why you should keep them private.
            </p>

            {/* Account Information Box */}
            <div className="bg-gray-50 border border-gray-200  p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {organization?.name ? organization.name.substring(0, 2).toUpperCase() : 'CO'}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{organization?.name || 'Codev'}</div>
                  <div className="text-sm text-gray-600">https://my.instanvi.com/</div>
                </div>
              </div>
            </div>

            {/* API Key Details Box */}
            <div className="bg-gray-50 border border-gray-200  p-6 space-y-6">
              {/* Live API key */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-sm font-medium text-gray-900">Live API key</label>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white border border-gray-200  px-4 py-1 font-mono text-sm text-gray-900">
                    {showLiveKey ? apiKeys.liveApiKey : 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}
                  </div>
                  <button
                    onClick={() => setShowLiveKey(!showLiveKey)}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {showLiveKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleCopy(apiKeys.liveApiKey, 'live')}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedKey === 'live' ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => setShowResetConfirm('live')}
                    className="px-4 py-2 bg-white border border-gray-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </div>

              {/* Test API key */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-sm font-medium text-gray-900">Test API key</label>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white border border-gray-200 rounded px-4 py-1 font-mono text-sm text-gray-900">
                    {apiKeys.testApiKey}
                  </div>
                  <button
                    onClick={() => handleCopy(apiKeys.testApiKey, 'test')}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedKey === 'test' ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => setShowResetConfirm('test')}
                    className="px-4 py-2 bg-white border border-gray-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </div>

              {/* Profile ID */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-sm font-medium text-gray-900">Profile ID</label>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white border border-gray-200 rounded px-4 py-1 font-mono text-sm text-gray-900">
                    pfl_CUowZbca8a
                  </div>
                  <button
                    onClick={() => handleCopy('pfl_CUowZbca8a', 'profile')}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedKey === 'profile' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
        )
      )}

      {/* Reset API Key Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset API Key</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reset your {showResetConfirm === 'live' ? 'live' : 'test'} API key? This action cannot be undone and will invalidate the current key.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(null)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResetApiKey(showResetConfirm as 'live' | 'test')}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors rounded"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Tokens Tab */}
      {activeTab === 'access-tokens' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access tokens</h2>
              <p className="text-gray-600">
                Manage OAuth access tokens for third-party applications.
              </p>
            </div>
            <button
              onClick={() => {
                setShowCreateToken(true);
                setTokenFormData({ name: '', expiresIn: '365' });
                setTokenError('');
                setTokenSuccess('');
              }}
              className="px-4 py-2 bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors rounded flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create token
            </button>
          </div>

          {/* Access Tokens List */}
          <div className="bg-white border border-gray-200  overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
                <div>Name</div>
                <div>Created</div>
                <div>Expires</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {tokens.map((token) => (
                <div key={token.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-5 gap-4 items-center">
                    <div className="font-medium text-gray-900">{token.name}</div>
                    <div className="text-sm text-gray-600">{token.created}</div>
                    <div className="text-sm text-gray-600">{token.expires}</div>
                    <div>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                        {token.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedToken(token)}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleRevokeToken(token.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Token Modal */}
      {showCreateToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Access Token</h3>
              <button
                onClick={() => {
                  setShowCreateToken(false);
                  setTokenFormData({ name: '', expiresIn: '365' });
                  setTokenError('');
                  setTokenSuccess('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {tokenSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
                {tokenSuccess}
              </div>
            )}
            {tokenError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {tokenError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Token Name</label>
                <input
                  type="text"
                  value={tokenFormData.name}
                  onChange={(e) => setTokenFormData({ ...tokenFormData, name: e.target.value })}
                  placeholder="Enter token name"
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expires In (days)</label>
                <select
                  value={tokenFormData.expiresIn}
                  onChange={(e) => setTokenFormData({ ...tokenFormData, expiresIn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-green-500"
                >
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">365 days</option>
                  <option value="730">2 years</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowCreateToken(false);
                  setTokenFormData({ name: '', expiresIn: '365' });
                  setTokenError('');
                  setTokenSuccess('');
                }}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateToken}
                disabled={tokenLoading}
                className="px-4 py-2 bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {tokenLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Token'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Token Modal */}
      {selectedToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Token Details</h3>
              <button
                onClick={() => setSelectedToken(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">{selectedToken.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded font-mono text-sm text-gray-900">
                    {selectedToken.token}
                  </div>
                  <button
                    onClick={() => handleCopy(selectedToken.token, 'token')}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <p className="text-gray-900">{selectedToken.created}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires</label>
                <p className="text-gray-900">{selectedToken.expires}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                  {selectedToken.status}
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setSelectedToken(null)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Webhooks</h2>
              <p className="text-gray-600">
                Configure webhooks to receive real-time notifications about payment events.
              </p>
            </div>
            <button
              onClick={() => {
                setShowWebhookModal(true);
                setEditingWebhook(null);
                setWebhookFormData({ url: '', events: [] });
                setWebhookError('');
                setWebhookSuccess('');
              }}
              className="px-4 py-2 bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors rounded flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add webhook
            </button>
          </div>

          {/* Webhooks List */}
          <div className="bg-white border border-gray-200  overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700">
                <div>URL</div>
                <div>Events</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <div className="font-mono text-sm text-gray-900">{webhook.url}</div>
                    <div className="text-sm text-gray-600">{webhook.events.join(', ')}</div>
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        webhook.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {webhook.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditWebhook(webhook)}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingWebhook ? 'Edit Webhook' : 'Add Webhook'}
              </h3>
              <button
                onClick={() => {
                  setShowWebhookModal(false);
                  setEditingWebhook(null);
                  setWebhookFormData({ url: '', events: [] });
                  setWebhookError('');
                  setWebhookSuccess('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {webhookSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
                {webhookSuccess}
              </div>
            )}
            {webhookError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {webhookError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                <input
                  type="url"
                  value={webhookFormData.url}
                  onChange={(e) => setWebhookFormData({ ...webhookFormData, url: e.target.value })}
                  placeholder="https://api.example.com/webhook"
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
                <div className="space-y-2">
                  {['payment.*', 'payment.paid', 'payment.failed', 'payment.refunded', 'chargeback.*'].map((event) => (
                    <label key={event} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={webhookFormData.events.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWebhookFormData({ ...webhookFormData, events: [...webhookFormData.events, event] });
                          } else {
                            setWebhookFormData({ ...webhookFormData, events: webhookFormData.events.filter(e => e !== event) });
                          }
                        }}
                        className="rounded border-gray-300 text-green-500 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowWebhookModal(false);
                  setEditingWebhook(null);
                  setWebhookFormData({ url: '', events: [] });
                  setWebhookError('');
                  setWebhookSuccess('');
                }}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded"
              >
                Cancel
              </button>
              <button
                onClick={editingWebhook ? handleUpdateWebhook : handleCreateWebhook}
                disabled={webhookLoading}
                className="px-4 py-2 bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {webhookLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {editingWebhook ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingWebhook ? 'Update Webhook' : 'Create Webhook'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Logs Tab */}
      {activeTab === 'api-logs' && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">API logs</h2>
            <p className="text-gray-600 mb-6">
              View and monitor all API requests made to your account.
            </p>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => {
                    setShowFilterDropdown(!showFilterDropdown);
                    setShowDateDropdown(false);
                  }}
                  className={`px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded flex items-center gap-2 ${
                    selectedFilter ? 'border-green-500 bg-green-50' : ''
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  {selectedFilter || 'Filter'}
                </button>
                {showFilterDropdown && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[150px] rounded">
                    {['All', 'success', 'error', 'method'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => {
                          setSelectedFilter(filter === 'All' ? '' : filter);
                          setShowFilterDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative" ref={dateRef}>
                <button
                  onClick={() => {
                    setShowDateDropdown(!showDateDropdown);
                    setShowFilterDropdown(false);
                  }}
                  className={`px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded flex items-center gap-2 ${
                    selectedDateFilter !== 'All' ? 'border-green-500 bg-green-50' : ''
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  {selectedDateFilter}
                </button>
                {showDateDropdown && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 shadow-lg z-50 min-w-[150px] rounded">
                    {['All', 'Last 7 days', 'Last 30 days', 'Last 90 days'].map((period) => (
                      <button
                        key={period}
                        onClick={() => {
                          setSelectedDateFilter(period);
                          setShowDateDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* API Logs Table */}
          <div className="bg-white border border-gray-200  overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                <div>Time</div>
                <div>Method</div>
                <div>Endpoint</div>
                <div>Status</div>
                <div>Response Time</div>
                <div>Actions</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {getFilteredLogs().map((log) => (
                <div key={log.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <div className="text-sm text-gray-600">{log.time}</div>
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        log.method === 'GET' ? 'bg-blue-100 text-blue-700' : 
                        log.method === 'POST' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {log.method}
                      </span>
                    </div>
                    <div className="font-mono text-sm text-gray-900">{log.endpoint}</div>
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        log.status >= 200 && log.status < 300 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">{log.responseTime}</div>
                    <div>
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">API Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <p className="text-gray-900">{selectedLog.time}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  selectedLog.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {selectedLog.method}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                <p className="text-gray-900 font-mono text-sm">{selectedLog.endpoint}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  selectedLog.status >= 200 && selectedLog.status < 300 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {selectedLog.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Response Time</label>
                <p className="text-gray-900">{selectedLog.responseTime}</p>
              </div>
              {selectedLog.requestBody && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Request Body</label>
                  <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-900 overflow-x-auto">
                    {JSON.stringify(selectedLog.requestBody, null, 2)}
                  </pre>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Response Body</label>
                <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-900 overflow-x-auto">
                  {JSON.stringify(selectedLog.responseBody, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Your Apps Tab */}
      {activeTab === 'your-apps' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your apps</h2>
              <p className="text-gray-600">
                Manage OAuth applications that have access to your account.
              </p>
            </div>
            <button
              onClick={() => {
                setShowCreateApp(true);
                setEditingApp(null);
                setAppFormData({ name: '', description: '', redirectUri: '' });
                setAppError('');
                setAppSuccess('');
              }}
              className="px-4 py-2 bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors rounded flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create app
            </button>
          </div>

          {/* Apps List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {apps.map((app) => (
              <div key={app.id} className="bg-white border border-gray-200  p-6 hover:border-green-300 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{app.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{app.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span>Created: {app.created}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600 font-mono">{app.redirectUri}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    app.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {app.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEditApp(app)}
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteApp(app.id)}
                    className="flex-1 px-3 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors rounded flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit App Modal */}
      {showCreateApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingApp ? 'Edit App' : 'Create App'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateApp(false);
                  setEditingApp(null);
                  setAppFormData({ name: '', description: '', redirectUri: '' });
                  setAppError('');
                  setAppSuccess('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {appSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
                {appSuccess}
              </div>
            )}
            {appError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {appError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">App Name</label>
                <input
                  type="text"
                  value={appFormData.name}
                  onChange={(e) => setAppFormData({ ...appFormData, name: e.target.value })}
                  placeholder="Enter app name"
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={appFormData.description}
                  onChange={(e) => setAppFormData({ ...appFormData, description: e.target.value })}
                  placeholder="Enter app description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Redirect URI</label>
                <input
                  type="url"
                  value={appFormData.redirectUri}
                  onChange={(e) => setAppFormData({ ...appFormData, redirectUri: e.target.value })}
                  placeholder="https://app.example.com/callback"
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-green-500"
                />
              </div>
              {editingApp && (
                <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded font-mono text-sm text-gray-900">
                        {editingApp.clientId}
                      </div>
                      <button
                        onClick={() => handleCopy(editingApp.clientId, 'client-id')}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded font-mono text-sm text-gray-900">
                        {editingApp.clientSecret}
                      </div>
                      <button
                        onClick={() => handleCopy(editingApp.clientSecret, 'client-secret')}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowCreateApp(false);
                  setEditingApp(null);
                  setAppFormData({ name: '', description: '', redirectUri: '' });
                  setAppError('');
                  setAppSuccess('');
                }}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded"
              >
                Cancel
              </button>
              <button
                onClick={editingApp ? handleUpdateApp : handleCreateApp}
                disabled={appLoading}
                className="px-4 py-2 bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {appLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {editingApp ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingApp ? 'Update App' : 'Create App'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Token Confirmation Modal */}
      {showRevokeTokenConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Revoke Token</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to revoke this token? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRevokeTokenConfirm(null)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmRevokeToken}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors rounded"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Webhook Confirmation Modal */}
      {showDeleteWebhookConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Webhook</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this webhook?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteWebhookConfirm(null)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteWebhook}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete App Confirmation Modal */}
      {showDeleteAppConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete App</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this app? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteAppConfirm(null)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteApp}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

