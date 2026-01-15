'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  UserPlus, 
  Spinner, 
  WarningCircle, 
  CheckCircle,
  Lock,
  Envelope,
  User,
  Key
} from '@phosphor-icons/react';
import { authService, adminService } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminSetupPage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });

  // Check if user is already admin
  useEffect(() => {
    console.log('[AdminSetupPage] Checking access:', { isAuthenticated, userRole: user?.role });
    
    if (isAuthenticated && user?.role === 'admin') {
      // User is already admin, redirect to admin dashboard
      console.log('[AdminSetupPage] User is already admin, redirecting to /admin');
      router.push('/admin');
      return;
    }
    
    // Allow setup if not authenticated or not admin
    // This page is for creating the first admin account
    console.log('[AdminSetupPage] Allowing setup page access');
    setChecking(false);
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      setErrorMessage('Username, email, and password are required');
      setLoading(false);
      return;
    }

    if (formData.password.length < 4) {
      setErrorMessage('Password must be at least 4 characters');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      // Call admin register endpoint directly
      console.log('[AdminSetupPage] Attempting admin register via adminService.registerUser');
      const response = await adminService.registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        role: 'admin',
        isInternal: true,
      });

      console.log('[AdminSetupPage] Admin register response:', { success: response.success, data: response.data, error: response.error });

      if (response.success && response.data) {
        // Try to sign in immediately to obtain token
        try {
          const loginResp = await authService.login({ email: formData.email, password: formData.password });
          console.log('[AdminSetupPage] Login after register response:', loginResp);

          if (loginResp.success && loginResp.data) {
            // Persist role locally if backend didn't set it in user object
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const adminUser = { ...(storedUser || {}), role: 'admin' };
            localStorage.setItem('user', JSON.stringify(adminUser));

            setSuccessMessage('✅ Admin account created and signed in. Redirecting to admin panel...');
            setTimeout(() => window.location.href = '/admin', 1200);
            return;
          }

          // If login didn't return token, still store user locally and instruct backend to set role
          const adminUserLocal = { ...(response.data || {}), role: 'admin' };
          localStorage.setItem('user', JSON.stringify(adminUserLocal));
          setSuccessMessage('Account created. Please ask backend to set admin role or check email for verification.');
          setLoading(false);
        } catch (loginErr) {
          console.error('[AdminSetupPage] Error logging in after register:', loginErr);
          setErrorMessage('Account created but automatic sign-in failed. Please sign in manually after verification.');
          setLoading(false);
        }
      } else {
        // Pass through friendly error messages
        const err = response.error?.message || response.error?.code || 'Failed to create admin account';
        setErrorMessage(String(err));
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Admin setup error:', error);
      setErrorMessage(error?.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Spinner className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create First Admin</h1>
          <p className="text-gray-600">
            Set up your first administrator account to access the admin dashboard
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200  flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200  flex items-start gap-3">
            <WarningCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 ">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 mb-1">First Admin Setup</p>
              <p className="text-xs text-blue-700">
                This will create the first administrator account. After creation, you'll be automatically logged in and redirected to the admin dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white  border border-gray-200 shadow-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200  focus:outline-none focus:border-green-500"
                placeholder="Enter username"
                required
                minLength={4}
                maxLength={30}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Envelope className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200  focus:outline-none focus:border-green-500"
                placeholder="Enter email address"
                required
                maxLength={30}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200  focus:outline-none focus:border-green-500"
                placeholder="First name"
                maxLength={30}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200  focus:outline-none focus:border-green-500"
                placeholder="Last name"
                maxLength={30}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200  focus:outline-none focus:border-green-500"
                placeholder="Enter password (min 4 characters)"
                required
                minLength={4}
                maxLength={30}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200  focus:outline-none focus:border-green-500"
                placeholder="Confirm password"
                required
                minLength={4}
                maxLength={30}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all  flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Spinner className="w-5 h-5 animate-spin" />
                Creating Admin Account...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create Admin Account
              </>
            )}
          </button>

          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Already have an admin account?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Sign in here
              </button>
            </p>
          </div>
        </form>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center mt-6">
          This page is only accessible when no admin accounts exist. After creating the first admin, this page will redirect to the login page.
        </p>
      </div>
    </div>
  );
}

