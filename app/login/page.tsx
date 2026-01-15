'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Envelope, Eye, EyeSlash, Shield, ArrowLeft } from '@phosphor-icons/react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login, verify2FA, resend2FAOTP } = useAuth();
  // read optional callbackURL from query so we can redirect post-login
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const callbackParam = params ? params.get('callbackURL') : null;
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendingOTP, setResendingOTP] = useState(false);

  useEffect(() => {
    // Simulate page load
    setTimeout(() => {
      setPageLoading(false);
    }, 300);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (typeof result === 'object' && result.requires2FA) {
        // 2FA required
        setRequires2FA(true);
        setTwoFactorEmail(result.email);
        setLoading(false);
        return;
      }
      
      if (result === true) {
        // Login successful
        if (callbackParam) {
          try {
            const decoded = decodeURIComponent(callbackParam);
            router.push(decoded);
            return;
          } catch (e) {
            // ignore decoding errors and fall back to home
          }
        }
        router.push('/');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter a valid 6-digit code');
      setOtpLoading(false);
      return;
    }

    try {
      const success = await verify2FA(otpCode);
      if (success) {
        if (callbackParam) {
          try {
            const decoded = decodeURIComponent(callbackParam);
            router.push(decoded);
            return;
          } catch (e) {
            // ignore decoding errors and fall back to home
          }
        }
        router.push('/');
      } else {
        setOtpError('Invalid verification code. Please try again.');
        setOtpCode('');
      }
    } catch (err) {
      setOtpError('Something went wrong. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendingOTP(true);
    setOtpError('');
    try {
      await resend2FAOTP(twoFactorEmail);
      setOtpError('');
      // Show success message
      alert('Verification code sent to your email');
    } catch (err) {
      setOtpError('Failed to resend code. Please try again.');
    } finally {
      setResendingOTP(false);
    }
  };

  // Show 2FA verification form if required
  if (requires2FA) {
    return (
      <div className="min-h-screen bg-white flex flex-col lg:flex-row fade-in">
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md fade-in">
            <button
              onClick={() => {
                setRequires2FA(false);
                setOtpCode('');
                setOtpError('');
              }}
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>
            
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">
              Two-Factor Authentication
            </h1>
            <p className="text-center text-gray-600 mb-6">
              Enter the verification code sent to <br />
              <span className="font-medium">{twoFactorEmail}</span>
            </p>
            
            <form onSubmit={handle2FAVerify} className="space-y-5">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(value);
                    setOtpError('');
                  }}
                  required
                  maxLength={6}
                  placeholder="000000"
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 focus:outline-none focus:border-green-500 text-center text-2xl tracking-widest"
                />
              </div>

              {otpError && (
                <div className="text-red-600 text-sm">{otpError}</div>
              )}

              <button
                type="submit"
                disabled={otpLoading || otpCode.length !== 6}
                className="w-full py-3 bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpLoading ? 'Verifying...' : 'Verify Code'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendingOTP}
                  className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                >
                  {resendingOTP ? 'Sending...' : "Didn't receive code? Resend"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Testimonial */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-green-400 via-green-500 to-gray-600 items-center justify-center p-8 lg:p-12 relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full -ml-40 -mb-40"></div>
          </div>
          <div className="max-w-md text-white relative z-10 fade-in">
            <div className="mb-6">
              <Shield className="w-12 h-12 text-white/90 mb-4" weight="fill" />
            </div>
            <blockquote className="text-xl lg:text-2xl font-medium leading-relaxed mb-6 text-white">
              "Security is not a product, but a process."
            </blockquote>
           
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-white" weight="fill" />
              </div>
              <div>
                <p className="font-semibold text-base lg:text-lg text-white">Security Team</p>
                <p className="text-green-100 text-xs lg:text-sm">Protecting your account</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row fade-in">
      {/* Left Column - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-white">
        {pageLoading ? (
          <div className="w-full max-w-md fade-in">
            {/* Skeleton Loader */}
            <div className="space-y-5">
              <div className="text-center mb-6 sm:mb-8">
                <div className="h-8 bg-gray-200 rounded w-32 mx-auto mb-4 animate-pulse"></div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md fade-in">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">Sign in</h1>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 pr-12 bg-white hover:border-gray-300 placeholder:text-gray-400"
                  />
                  <Envelope className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 pr-12 bg-white hover:border-gray-300 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-500 transition-colors"
                  >
                    {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-200 text-red-600 text-sm font-medium rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 disabled:transform-none shadow-md hover:shadow-lg"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/signup" className="text-green-600 hover:text-green-700 font-semibold transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Right Column - Testimonial */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 items-center justify-center p-8 lg:p-12 relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full -ml-40 -mb-40"></div>
        </div>
        {pageLoading ? (
          <div className="max-w-md text-white relative z-10 fade-in">
            <div className="space-y-4">
              <div className="h-12 bg-white/20 rounded w-12 mb-6 animate-pulse"></div>
              <div className="h-6 bg-white/20 rounded w-full animate-pulse"></div>
              <div className="h-6 bg-white/20 rounded w-3/4 animate-pulse"></div>
              <div className="h-6 bg-white/20 rounded w-5/6 animate-pulse"></div>
              <div className="flex gap-2 mb-6">
                <div className="w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-white/20 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-white/20 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-md text-white relative z-10 fade-in">
            <div className="mb-6">
              <Shield className="w-12 h-12 text-white/90" weight="fill" />
            </div>
            <blockquote className="text-xl lg:text-2xl font-medium leading-relaxed mb-6 text-white">
              "Fintech is the technology and innovation that aims to compete with traditional financial methods."
            </blockquote>
            <div className="flex gap-2 mb-6">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-white" weight="fill" />
              </div>
              <div>
                <p className="font-semibold text-base lg:text-lg text-white">Walapi Karaka</p>
                <p className="text-green-100 text-xs lg:text-sm">Financial Officer</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

