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
import { authService } from '@/lib/api';
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
      // Use regular signup endpoint with admin role
      // This endpoint doesn't require admin authentication
      console.log('[AdminSetupPage] Attempting signup with role: admin');
      const response = await authService.signup({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        role: 'admin', // Set role to admin
      });

      console.log('[AdminSetupPage] Signup response:', {
        success: response.success,
        hasData: !!response.data,
        user: response.data?.user,
        userRole: response.data?.user?.role,
        error: response.error,
      });

      if (response.success && response.data) {
        const user = response.data.user;
        const token = response.data.token;
        
        // Validate token before storing
        if (!token || token.length < 10) {
          console.error('[AdminSetupPage] Invalid token received from backend:', {
            tokenLength: token?.length,
            tokenPreview: token ? token.substring(0, 10) + '...' : 'null',
          });
          setErrorMessage('Invalid token received from server. Please try again or contact support.');
          setLoading(false);
          return;
        }
        
        console.log('[AdminSetupPage] Token received:', {
          tokenLength: token.length,
          tokenPreview: token.substring(0, 20) + '...',
        });
        
        // Ensure role is set to admin in the user object
        // Backend might not return role, so we set it explicitly
        const adminUser = {
          ...user,
          role: user?.role || 'admin', // Use role from response or default to admin
        };
        
        console.log('[AdminSetupPage] Setting user with role:', adminUser.role);
        
        // Update localStorage with admin role
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(adminUser));
        localStorage.setItem('isAuthenticated', 'true');
        
        // Update AuthContext state immediately
        if (updateUser) {
          try {
            await updateUser({ role: 'admin' });
            console.log('[AdminSetupPage] Updated AuthContext with admin role');
          } catch (err) {
            console.warn('[AdminSetupPage] Could not update AuthContext, will reload page:', err);
          }
        }
        
        // Force refresh AuthContext by reloading the page
        // This ensures the AuthContext picks up the new user with admin role
        setSuccessMessage('Admin account created successfully! Redirecting...');
        
        // Wait a moment to show success message, then reload to refresh AuthContext
        setTimeout(() => {
          // Use window.location.href to force full page reload and refresh AuthContext
          window.location.href = '/admin';
        }, 1500);
      } else {
        // Handle specific error cases
        if (response.error?.code === 'USER_EXISTS' || response.error?.message?.toLowerCase().includes('already exists')) {
          setErrorMessage('An account with this email or username already exists. Please use different credentials.');
        } else if (response.error?.code === 'VALIDATION_ERROR') {
          setErrorMessage(response.error.message || 'Please check your input and try again.');
        } else {
          setErrorMessage(response.error?.message || 'Failed to create admin account. Please try again.');
        }
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

