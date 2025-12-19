'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ProtectedRoute from './ProtectedRoute';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';

const publicRoutes = ['/login', '/signup', '/verify-email', '/select-country', '/find-business', '/confirm-details'];

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
          <Header />
          <main className="pt-16 min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAdminRoute = pathname?.startsWith('/admin');

  // Don't wrap admin routes with user dashboard layout
  if (isAdminRoute) {
    return <>{children}</>;
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}

