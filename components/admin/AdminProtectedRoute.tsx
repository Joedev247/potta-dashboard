'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { WarningCircle, Shield, Spinner } from '@phosphor-icons/react';

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading before checking authentication
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      
      // Check if user has admin role
      if (user && user.role !== 'admin') {
        // User is authenticated but not an admin
        // We'll show an error message instead of redirecting
        console.warn('[AdminProtectedRoute] User does not have admin role:', user.role);
      }
    }
  }, [isAuthenticated, loading, user, router]);

  // Show nothing while auth is loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Check if user has admin role
  if (user && user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white  shadow-lg border border-red-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin dashboard. Admin access is required.
          </p>
          <div className="bg-yellow-50 border border-yellow-200  p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <WarningCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 mb-1">Current Role: {user.role || 'user'}</p>
                <p className="text-xs text-yellow-700">
                  To access admin features, your account must have the <strong>admin</strong> role. 
                  Please contact your system administrator to grant admin privileges.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Link
              href="/admin/setup"
              className="block w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all  text-center"
            >
              Create First Admin Account
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                router.push('/');
              }}
              className="w-full px-4 py-2 border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all "
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

