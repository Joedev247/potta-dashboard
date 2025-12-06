'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, verifyOTP, sendOTP } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/signup');
      return;
    }
    setEmail(user.email);
    // Auto-send OTP on mount
    sendOTP(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp);
    
    // Focus last input
    const lastInput = document.getElementById(`otp-${pastedData.length - 1}`);
    lastInput?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await verifyOTP(otpString);
      if (success) {
        router.push('/select-country');
      } else {
        setError('Invalid verification code. Please try again.');
        setOtp(['', '', '', '', '', '']);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    await sendOTP(email);
    setOtp(['', '', '', '', '', '']);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">Verify email</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 text-center px-4">
          The code will be sent to {email || 'your email'}.
        </p>
        
        <div className="space-y-4 sm:space-y-6">
          {/* OTP Input */}
          <div className="flex gap-2 sm:gap-3 justify-center px-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-semibold border-2 border-gray-200  focus:outline-none focus:border-green-500"
              />
            ))}
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length !== 6}
            className="w-full py-3 bg-green-500 text-white font-semibold  hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify email'}
          </button>

          <div className="text-center">
            <button
              onClick={handleResend}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Resend code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

