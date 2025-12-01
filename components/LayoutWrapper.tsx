'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import TestModeBanner from '@/components/TestModeBanner';
import ProtectedRoute from './ProtectedRoute';

const publicRoutes = ['/login', '/signup', '/verify-email', '/select-country', '/find-business', '/confirm-details'];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <main className="pt-16 min-h-screen">
            {children}
          </main>
          <TestModeBanner />
        </div>
      </div>
    </ProtectedRoute>
  );
}

