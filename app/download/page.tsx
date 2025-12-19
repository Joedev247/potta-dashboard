'use client';

import { Download, DeviceMobile, Monitor, DeviceTablet, CheckCircle } from '@phosphor-icons/react';

export default function DownloadPage() {
  const platforms = [
    {
      name: 'iOS',
      icon: DeviceMobile,
      description: 'Download for iPhone and iPad',
      version: '2.1.0',
      size: '45.2 MB',
      badge: 'Latest',
      color: 'from-blue-100 to-blue-50',
      borderColor: 'border-blue-100',
      buttonColor: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
    },
    {
      name: 'Android',
      icon: DeviceMobile,
      description: 'Download for Android devices',
      version: '2.1.0',
      size: '52.8 MB',
      badge: 'Latest',
      color: 'from-green-100 to-emerald-50',
      borderColor: 'border-green-100',
      buttonColor: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
    },
    {
      name: 'macOS',
      icon: Monitor,
      description: 'Download for Mac',
      version: '2.1.0',
      size: '128.5 MB',
      badge: 'Latest',
      color: 'from-gray-100 to-gray-50',
      borderColor: 'border-gray-100',
      buttonColor: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
    },
    {
      name: 'Windows',
      icon: Monitor,
      description: 'Download for Windows',
      version: '2.1.0',
      size: '142.3 MB',
      badge: 'Latest',
      color: 'from-blue-100 to-blue-50',
      borderColor: 'border-blue-100',
      buttonColor: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
    },
    {
      name: 'Web App',
      icon: DeviceTablet,
      description: 'Access via browser',
      version: 'Always up to date',
      size: 'No download required',
      badge: 'Available',
      color: 'from-purple-100 to-purple-50',
      borderColor: 'border-purple-100',
      buttonColor: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
    }
  ];

  const features = [
    'Real-time payment notifications',
    'Manage your account on the go',
    'View transaction history',
    'Generate reports',
    'Secure authentication',
    'Offline mode support'
  ];

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Download App</h1>
          </div>
        </div>

        {/* Platforms Grid - iOS, Android, macOS, Windows */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {platforms.slice(0, 4).map((platform, index) => {
            const Icon = platform.icon;
            return (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 p-6 hover:border-green-500 transition-all"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${platform.color} ${platform.borderColor} border-2 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="w-8 h-8 text-gray-700" />
                </div>
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{platform.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{platform.description}</p>
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                    platform.badge === 'Latest' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {platform.badge}
                  </span>
                </div>
                <div className="text-center mb-4 space-y-1">
                  <p className="text-xs text-gray-600">Version: {platform.version}</p>
                  <p className="text-xs text-gray-600">Size: {platform.size}</p>
                </div>
                <button className={`w-full px-4 py-3 bg-gradient-to-r ${platform.buttonColor} text-white font-semibold transition-all flex items-center justify-center gap-2`}>
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            );
          })}
        </div>

        {/* Web App */}
        {platforms[4] && (
          <div className="mb-8">
            <div className="bg-white border-2 border-gray-200 p-8 hover:border-green-500 transition-all">
              <div className={`w-16 h-16 bg-gradient-to-br ${platforms[4].color} ${platforms[4].borderColor} border-2 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <DeviceTablet className="w-8 h-8 text-gray-700" />
              </div>
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{platforms[4].name}</h3>
                <p className="text-sm text-gray-600 mb-2">{platforms[4].description}</p>
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                  platforms[4].badge === 'Latest' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {platforms[4].badge}
                </span>
              </div>
              <div className="text-center mb-4 space-y-1">
                <p className="text-xs text-gray-600">Version: {platforms[4].version}</p>
                <p className="text-xs text-gray-600">Size: {platforms[4].size}</p>
              </div>
              <button className={`w-full px-4 py-3 bg-gradient-to-r ${platforms[4].buttonColor} text-white font-semibold transition-all flex items-center justify-center gap-2`}>
                <Download className="w-4 h-4" />
                Open Web App
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="bg-white border-2 border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">App Features</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Requirements */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-100 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">System Requirements</h3>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">iOS</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• iOS 13.0 or later</li>
                <li>• iPhone, iPad, or iPod touch</li>
                <li>• 100 MB available space</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Android</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Android 8.0 or later</li>
                <li>• 150 MB available space</li>
                <li>• Internet connection required</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">macOS</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• macOS 11.0 or later</li>
                <li>• 200 MB available space</li>
                <li>• Intel or Apple Silicon</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Windows</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Windows 10 or later</li>
                <li>• 250 MB available space</li>
                <li>• 64-bit processor</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

