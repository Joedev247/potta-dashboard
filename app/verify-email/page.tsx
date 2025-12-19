'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, resendVerificationEmail, verifyEmailToken, loading: authLoading } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Verifying your email...');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showWaitingForToken, setShowWaitingForToken] = useState(false);
  const [verificationInProgress, setVerificationInProgress] = useState(false);

  useEffect(() => {
    // Extract token from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const callback = params.get('callbackURL');

    // If token present — run token verification flow
    if (token) {
      setVerificationInProgress(true);
      (async () => {
        setLoading(true);
        setError('');
        try {
          const ok = await verifyEmailToken(token, callback || undefined);
          if (ok) {
            setMessage('Email verified successfully! Redirecting...');

            // Clear accessToken before redirecting to login
            // The backend might return a short verification token during email verification,
            // but we want the user to log in to get a proper long-lived JWT authentication token
            try {
              localStorage.removeItem('accessToken');
              
              // Ensure localStorage user is marked verified to avoid ProtectedRoute redirecting back
              const stored = localStorage.getItem('user');
              if (stored) {
                const u = JSON.parse(stored);
                u.isVerified = true;
                localStorage.setItem('user', JSON.stringify(u));
              }
            } catch (e) {
              // ignore
            }

            // Always redirect to login after email verification
            // User needs to log in to get a proper authentication token for API calls
            setTimeout(() => {
              const defaultNext = callback || '/onboarding';
              router.push(`/login?callbackURL=${encodeURIComponent(defaultNext)}`);
            }, 1500);
            return;
          }
          setError('Verification failed. The token may be invalid or expired.');
        } catch (e: any) {
          setError(e?.message || 'Verification failed. Please try again later.');
        } finally {
          setLoading(false);
        }
      })();
      return; // don't continue to resend flow
    }

    // No token flow: show resend option if we have a logged-in user
    // Wait for auth loading to finish
    if (authLoading) {
      // Let auth provider finish loading
      return;
    }

    // No token and user is not present -> show helpful error and links
    if (!user) {
      setError('No verification token found. Please check your email link or sign in to resend verification.');
      setLoading(false);
      setShowWaitingForToken(false);
      return;
    }

    // We have a user and no token — check if we just came from signup (no prior token check)
    // If yes, show waiting/instruction message instead of resend UI
    const hasCallbackOnly = params.has('callbackURL') && !params.has('token');
    
    if (hasCallbackOnly) {
      // Likely just came from signup - show waiting message
      setShowWaitingForToken(true);
      setLoading(false);
    } else {
      // User landed here with no token and no callback - show resend UI
      setShowWaitingForToken(false);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, verifyEmailToken, router]);

  // Cooldown timer for resend button
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md text-center">
        {loading && !error && (
          <>
            <div className="mb-6">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{message}</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {error && !user && !verificationInProgress && (
          <>
            <div className="mb-6">
              <div className="inline-block">
                <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Verification Failed</h1>
            <p className="text-red-600 text-base mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/signup')}
                className="py-3 px-6 bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
              >
                Create account
              </button>
              <button
                onClick={() => router.push('/login')}
                className="py-3 px-6 border border-green-500 text-green-600 font-semibold hover:bg-green-50 transition-colors"
              >
                Sign in
              </button>
            </div>
          </>
        )}

        {!loading && user && !verificationInProgress && (
          <>
            {showWaitingForToken ? (
              // Waiting for token flow - show instruction message
              <>
                <div className="mb-6">
                  <div className="inline-block">
                    <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Check your email</h1>
                <p className="text-sm sm:text-base text-gray-600 mb-6">We've sent a verification email to <strong>{user.email}</strong>. Click the verification link in the email to confirm your account and complete your registration.</p>
                <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                  <p className="text-xs sm:text-sm text-blue-800">If you don't see the email, check your spam folder or click the button below to resend.</p>
                </div>

                {resendMessage && (
                  <div className="text-green-600 text-sm mb-4">{resendMessage}</div>
                )}

                <button
                  onClick={async () => {
                    setResendLoading(true);
                    setResendMessage('');
                    setError('');
                    setResendCooldown(30); // 30 second cooldown
                    const params = new URLSearchParams(window.location.search);
                    const callback = params.get('callbackURL') || undefined;
                    try {
                      await resendVerificationEmail(user.email, callback);
                      setResendMessage('Verification email sent. Check your inbox.');
                    } catch (e: any) {
                      setError('Failed to resend verification email. Please try again later.');
                      setResendCooldown(0); // Reset cooldown on error
                    } finally {
                      setResendLoading(false);
                    }
                  }}
                  disabled={resendLoading || resendCooldown > 0}
                  className="w-full py-3 bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
                </button>
              </>
            ) : (
              // No token found but user exists - show resend UI
              <>
                <div className="mb-6">
                  <div className="inline-block">
                    <svg className="w-16 h-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">No verification token found</h1>
                <p className="text-sm sm:text-base text-gray-600 mb-6">We can resend the verification email to <strong>{user.email}</strong>. Click the button below and check your inbox.</p>

                {resendMessage && (
                  <div className="text-green-600 text-sm mb-4">{resendMessage}</div>
                )}

                <button
                  onClick={async () => {
                    setResendLoading(true);
                    setResendMessage('');
                    setError('');
                    setResendCooldown(30); // 30 second cooldown
                    const params = new URLSearchParams(window.location.search);
                    const callback = params.get('callbackURL') || undefined;
                    try {
                      await resendVerificationEmail(user.email, callback);
                      setResendMessage('Verification email sent. Check your inbox.');
                    } catch (e: any) {
                      setError('Failed to resend verification email. Please try again later.');
                      setResendCooldown(0); // Reset cooldown on error
                    } finally {
                      setResendLoading(false);
                    }
                  }}
                  disabled={resendLoading || resendCooldown > 0}
                  className="w-full py-3 bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
                </button>
              </>
            )}
          </>
        )}

        {!loading && !error && !user && (
          <>
            <div className="mb-6">
              <div className="inline-block">
                <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{message}</h1>
            <p className="text-sm sm:text-base text-gray-600">
              You can now sign in to your account.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

