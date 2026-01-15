'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { WarningCircle, Shield, Spinner } from '@phosphor-icons/react';

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Allow access to setup page even when unauthenticated
    const path = window.location.pathname;
    if (path === '/admin/setup') return;

    if (!isAuthenticated) {
      // Redirect unauthenticated users to admin setup so first admin can be created
      router.replace('/admin/setup');
      return;
    }

    // If user is authenticated but not an admin, block access
    if (user && user.role !== 'admin') {
      router.replace('/');
      return;
    }
  }, [user, isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}

