'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Info, RefreshCw, Plus, Trash2, ExternalLink, Search, Filter, Calendar, CheckCircle2, XCircle, Clock, Globe } from 'lucide-react';

export default function BrowsePage() {
  const [activeTab, setActiveTab] = useState('api-keys');
  const [showLiveKey, setShowLiveKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">API keys</h1>
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
                  CO
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Codev</div>
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
                    {showLiveKey ? 'live_25wDKPwhNySv8pwgt35Wh6AJeMfJUc' : 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}
                  </div>
                  <button
                    onClick={() => setShowLiveKey(!showLiveKey)}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {showLiveKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleCopy('live_25wDKPwhNySv8pwgt35Wh6AJeMfJUc', 'live')}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedKey === 'live' ? 'Copied!' : 'Copy'}
                  </button>
                  <button className="px-4 py-2 bg-white border border-gray-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-2">
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
                    test_25wDKPwhNySv8pwgt35Wh6AJeMfJUc
                  </div>
                  <button
                    onClick={() => handleCopy('test_25wDKPwhNySv8pwgt35Wh6AJeMfJUc', 'test')}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedKey === 'test' ? 'Copied!' : 'Copy'}
                  </button>
                  <button className="px-4 py-2 bg-white border border-gray-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-2">
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
            <button className="px-4 py-2 bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors rounded flex items-center gap-2">
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
              {[
                { name: 'My App Token', created: '2024-01-15', expires: '2025-01-15', status: 'active' },
                { name: 'Development Token', created: '2024-01-10', expires: '2024-12-31', status: 'active' },
              ].map((token, index) => (
                <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
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
                      <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                        View
                      </button>
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium">
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
            <button className="px-4 py-2 bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors rounded flex items-center gap-2">
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
              {[
                { url: 'https://api.example.com/webhook', events: 'payment.*', status: 'active' },
                { url: 'https://webhook.example.com/instanvi', events: 'payment.paid', status: 'inactive' },
              ].map((webhook, index) => (
                <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <div className="font-mono text-sm text-gray-900">{webhook.url}</div>
                    <div className="text-sm text-gray-600">{webhook.events}</div>
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
                      <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium">
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded text-sm"
                />
              </div>
              <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Last 7 days
              </button>
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
              {[
                { time: '2024-01-15 14:32:15', method: 'GET', endpoint: '/payments', status: 200, responseTime: '45ms' },
                { time: '2024-01-15 14:31:42', method: 'POST', endpoint: '/payments', status: 201, responseTime: '120ms' },
                { time: '2024-01-15 14:30:18', method: 'GET', endpoint: '/payments/tr_abc123', status: 200, responseTime: '32ms' },
                { time: '2024-01-15 14:29:05', method: 'GET', endpoint: '/methods', status: 200, responseTime: '28ms' },
              ].map((log, index) => (
                <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <div className="text-sm text-gray-600">{log.time}</div>
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        log.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
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
                      <button className="text-green-600 hover:text-green-700 text-sm font-medium">
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
            <button className="px-4 py-2 bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors rounded flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create app
            </button>
          </div>

          {/* Apps List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { 
                name: 'My E-commerce App', 
                description: 'Main application for processing payments',
                status: 'active',
                created: '2024-01-10',
                redirectUri: 'https://app.example.com/callback'
              },
              { 
                name: 'Development App', 
                description: 'Testing and development environment',
                status: 'active',
                created: '2024-01-05',
                redirectUri: 'https://dev.example.com/callback'
              },
            ].map((app, index) => (
              <div key={index} className="bg-white border border-gray-200  p-6 hover:border-green-300 transition-colors">
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
                  <button className="flex-1 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded">
                    Edit
                  </button>
                  <button className="flex-1 px-3 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors rounded flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

