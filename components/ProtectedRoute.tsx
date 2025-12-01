'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user && !user.isVerified) {
      router.push('/verify-email');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user && !user.isVerified)) {
    return null;
  }

  return <>{children}</>;
}

