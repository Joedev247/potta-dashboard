'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  Home,
  CreditCard,
  BarChart3,
  Building2,
  Wallet,
  FileText,
  Receipt,
  Grid3x3,
  Settings,
  UserPlus,
  Plus,
  ChevronDown,
} from 'lucide-react';

const navigationItems = [
  { name: 'Get started', href: '/', icon: Home },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Statistics', href: '/statistics', icon: BarChart3 },
  { name: 'Balance', href: '/balance', icon: Wallet },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Invoicing', href: '/invoicing', icon: Receipt },
  { name: 'Browse', href: '/browse', icon: Grid3x3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const orgMenuRef = useRef<HTMLDivElement>(null);

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
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-40">
      <div className="flex flex-col h-full">
        {/* Logo with Organization Selector */}
        <div className="p-3 border-b border-gray-200 relative" ref={orgMenuRef}>
          <button
            onClick={() => setShowOrgMenu(!showOrgMenu)}
            className="flex items-center gap-3 cursor-pointer group w-full hover:bg-gray-50  p-2 -m-2 transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600  flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">CO</span>
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-gray-900 text-base">Codev</div>
              <div className="text-xs text-gray-500">Organization</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showOrgMenu ? 'rotate-180' : ''}`} />
          </button>

          {showOrgMenu && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-white  border border-gray-200 shadow-lg overflow-hidden z-50">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600  flex items-center justify-center">
                      <span className="text-white text-xs font-bold">CO</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">Codev</div>
                      <div className="text-xs text-gray-500">Organization</div>
                    </div>
                  </div>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-md font-medium">#19395753</span>
                </div>
              </div>
              <div className="py-2">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add team member</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Organization settings</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Create new organization</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname?.startsWith(item.href));
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3  transition-all group relative
                      ${isActive
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-500/20'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                    )}
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
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
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50  border border-green-100">
            <div className="w-8 h-8 bg-green-500  flex items-center justify-center">
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
  );
}
