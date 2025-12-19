'use client';

import { usePathname } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Don't apply admin protection to setup page
  const isSetupPage = pathname === '/admin/setup';
  
  if (isSetupPage) {
    // Setup page doesn't need admin protection or layout
    return <>{children}</>;
  }
  
  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64">
          <AdminHeader />
          <main className="pt-16 min-h-screen p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}

