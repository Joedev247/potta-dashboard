'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  House,
  CreditCard,
  ChartBar,
  Building,
  Wallet,
  FileText,
  Receipt,
  SquaresFour,
  Gear,
  UserPlus,
  Plus,
  CaretDown,
  X,
  Users,
  Package,
  Shield,
} from '@phosphor-icons/react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSidebar } from '@/contexts/SidebarContext';

const navigationItems = [
  { name: 'Get started', href: '/', icon: House },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Statistics', href: '/statistics', icon: ChartBar },
  { name: 'Balance', href: '/balance', icon: Wallet },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Invoicing', href: '/invoicing', icon: Receipt },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Applications', href: '/applications', icon: SquaresFour },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { organization } = useOrganization();
  const { isOpen, closeSidebar } = useSidebar();
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const orgMenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Check if onboarding is complete from localStorage
  useEffect(() => {
    const onboardingData = localStorage.getItem('onboardingProgress');
    if (onboardingData) {
      try {
        const parsed = JSON.parse(onboardingData);
        setOnboardingComplete(parsed.isComplete || false);
      } catch (error) {
        console.error('Failed to parse onboarding data:', error);
      }
    }
  }, []);

  // Filter navigation items based on onboarding completion
  const filteredNavItems = onboardingComplete 
    ? navigationItems.filter(item => item.name !== 'Get started')
    : navigationItems;

  const orgInitials = organization?.name ? organization.name.substring(0, 2).toUpperCase() : 'CO';
  const orgName = organization?.name || 'Codev';

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (window.innerWidth < 1024 && isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        closeSidebar();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeSidebar]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node)) {
        setShowOrgMenu(false);
      }
    }

    if (showOrgMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOrgMenu]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={closeSidebar}
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
              <span className="text-white text-sm font-bold">{orgInitials}</span>
            </div>
            <button
              onClick={closeSidebar}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logo with Organization Selector - Desktop */}
          <div className="p-3 border-b border-green-100 relative hidden lg:block" ref={orgMenuRef}>
            <button
              onClick={() => setShowOrgMenu(!showOrgMenu)}
              className={`flex items-center gap-3 cursor-pointer group w-full p-2 -m-2  transition-all duration-200 ${
                showOrgMenu 
                  ? 'bg-green-100/70 shadow-sm' 
                  : 'hover:bg-green-100/50'
              }`}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white">
                <span className="text-white text-sm font-bold">{orgInitials}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="font-bold text-gray-900 text-base truncate">{orgName}</div>
                <div className="text-xs text-gray-500">Organization</div>
              </div>
              <CaretDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showOrgMenu ? 'rotate-180' : ''}`} />
            </button>

            {showOrgMenu && (
              <div className="absolute left-full top-0 ml-2 w-72 bg-white border border-gray-200  shadow-xl overflow-hidden z-50 transform transition-all duration-200 ease-out">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                      <span className="text-white text-sm font-bold">{orgInitials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">{orgName}</div>
                      <div className="text-xs text-gray-600 mt-0.5">Organization</div>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <Link
                    href="/team-member"
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-200 group/item"
                    onClick={() => setShowOrgMenu(false)}
                  >
                    <div className="w-8 h-8  bg-green-100 group-hover/item:bg-green-200 flex items-center justify-center transition-colors">
                      <UserPlus className="w-4 h-4 text-green-600 group-hover/item:text-green-700" />
                    </div>
                    <span className="text-sm font-medium">Add team member</span>
                  </Link>
                  <Link
                    href="/settings?tab=organization"
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-200 group/item"
                    onClick={() => setShowOrgMenu(false)}
                  >
                    <div className="w-8 h-8  bg-gray-100 group-hover/item:bg-green-200 flex items-center justify-center transition-colors">
                      <Gear className="w-4 h-4 text-gray-600 group-hover/item:text-green-700" />
                    </div>
                    <span className="text-sm font-medium">Organization settings</span>
                  </Link>
                </div>
              </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname?.startsWith(item.href));
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      // Close sidebar on mobile when link is clicked
                      if (window.innerWidth < 1024) {
                        closeSidebar();
                      }
                    }}
                    className={`
                      flex items-center gap-3 px-4 py-3  transition-all group relative
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
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50  border border-green-100">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-900">Need help?</div>
              <div className="text-xs text-gray-600">Contact support</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
