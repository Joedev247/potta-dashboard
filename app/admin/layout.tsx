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
  
  // ⚠️ TEMPORARILY DISABLED: All pages now have open access for testing
  // Auth protection will be re-enabled later
  const isSetupPage = pathname === '/admin/setup';
  
  if (isSetupPage) {
    // Setup page doesn't need layout
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

