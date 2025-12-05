'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, User, Search, HelpCircle, Settings, LogOut, Download, MessageSquare, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationTab, setNotificationTab] = useState<'primary' | 'notification'>('primary');
  const [testMode, setTestMode] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    if (showUserMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showNotifications]);

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-6">
      {/* Right side - Search, Help (for invoicing), Notifications, User */}
      <div className="flex items-center gap-4 ml-auto">
       
        
        {pathname === '/invoicing' && (
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
        )}
        
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5" />
          </button>

          {/* Notifications Popup */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white  border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setNotificationTab('primary')}
                    className={`px-3 py-1 text-sm font-medium transition-colors ${
                      notificationTab === 'primary'
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Primary
                  </button>
                  <button 
                    onClick={() => setNotificationTab('notification')}
                    className={`px-3 py-1 text-sm font-medium transition-colors ${
                      notificationTab === 'notification'
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Notifications
                  </button>
                </div>
                <Link
                  href="/notifications"
                  onClick={() => {
                    setShowNotifications(false);
                    // Set the tab in URL or state if needed
                  }}
                  className="text-sm text-green-600 hover:text-green-700 hover:underline font-medium"
                >
                  View all
                </Link>
              </div>
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100  flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">You're all set!</h3>
                <p className="text-sm text-gray-600 mb-4">
                  We keep you updated on any future notifications for your organization or account.
                </p>
                <Link
                  href="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="inline-block px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold hover:from-green-600 hover:to-green-700 transition-all"
                >
                  Go to Notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100  transition-colors"
          >
            <User className="w-5 h-5" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white  border border-gray-200 overflow-hidden z-50">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <p className="font-semibold text-gray-900">
                  {user && user.firstName && user.lastName 
                    ? `${user.firstName.toUpperCase()} ${user.lastName.toUpperCase()}`
                    : user?.email?.split('@')[0]?.toUpperCase() || 'User'}
                </p>
                <p className="text-sm text-gray-600">{user?.email || 'user@example.com'}</p>
              </div>
              <div className="py-2">
                <Link 
                  href="/settings"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Settings</span>
                </Link>
                <button className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-green-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm font-medium">Test mode</span>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${
                      testMode ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTestMode(!testMode);
                    }}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        testMode ? 'translate-x-5' : 'translate-x-1'
                      } mt-1`}
                    />
                  </div>
                </button>
                <Link 
                  href="/help-center"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Help Center</span>
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </Link>
                <Link 
                  href="/support"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">Get support</span>
                </Link>
                <Link 
                  href="/feedback"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">Give feedback</span>
                </Link>
                <Link 
                  href="/download"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Download App</span>
                </Link>
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}



