'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  Shield,
  FileText,
  SignOut,
  List,
  X,
  ClipboardText,
} from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';

const adminNavigationItems = [
  { name: 'Dashboard', href: '/admin', icon: Shield },
  { name: 'Onboarding Review', href: '/admin/onboarding', icon: FileText },
  { name: 'Logs', href: '/admin/logs', icon: ClipboardText },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const userInitials = user && user.firstName && user.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.email?.split('@')[0]?.substring(0, 2).toUpperCase() || 'AD';

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (window.innerWidth < 1024 && isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside 
        ref={sidebarRef}
        className={`
          fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-green-50 to-emerald-50 border-r border-green-100 z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Close Button - Mobile Only */}
          <div className="lg:hidden flex items-center justify-between p-3 border-b border-green-100">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logo - Desktop */}
          <div className="hidden lg:flex items-center gap-3 p-3 border-b border-green-100">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-gray-900 text-base">Admin Panel</div>
              <div className="text-xs text-gray-500">Management</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {adminNavigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname?.startsWith(item.href));
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        // Close sidebar on mobile when link is clicked
                        if (window.innerWidth < 1024) {
                          setIsOpen(false);
                        }
                      }}
                      className={`
                        flex items-center gap-3 px-4 py-3 transition-all group relative
                        ${isActive
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                          : 'text-gray-700 hover:bg-green-100/70 hover:text-gray-900'
                        }
                      `}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                      )}
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                      <span className="text-sm font-medium">{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-green-100">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{userInitials}</span>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-900">
                  {user && user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email?.split('@')[0] || 'Admin'}
                </div>
                <div className="text-xs text-gray-600">{user?.email || 'admin@example.com'}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button - Only show when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white border border-gray-200  shadow-md hover:bg-gray-50 transition-colors"
        >
          <List className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </>
  );
}

