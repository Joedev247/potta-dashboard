'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { paymentLinksService } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import {
  Spinner,
  WarningCircle,
  CheckCircle,
  ArrowLeft,
  CreditCard,
  Phone,
} from '@phosphor-icons/react';

export default function PaymentLinkPage() {
  const params = useParams();
  const slug = params.slug as string;

  // Payment link state
  const [paymentLink, setPaymentLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState('MTN_CAM');
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);

  // Fetch payment link
  useEffect(() => {
    const fetchPaymentLink = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await paymentLinksService.getPaymentLinkBySlug(slug);

        if (response.success && response.data) {
          setPaymentLink(response.data);
        } else if (response.error?.code === 'HTTP_410') {
          setError(
            response.error?.message ||
            'This payment link is no longer available (expired, paid, or cancelled)'
          );
        } else if (response.error?.code === 'HTTP_404') {
          setError('Payment link not found');
        } else {
          setError(response.error?.message || 'Failed to load payment link');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load payment link');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPaymentLink();
    }
  }, [slug]);

  // Handle payment redemption
  const handleRedeemPaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    setPaymentSuccess(null);

    if (!phoneNumber.trim()) {
      setPaymentError('Phone number is required');
      return;
    }

    if (!provider) {
      setPaymentError('Payment provider is required');
      return;
    }

    setProcessing(true);
    try {
      // Convert phone number to number
      const phoneNum = parseInt(phoneNumber.replace(/\D/g, ''), 10);

      if (isNaN(phoneNum)) {
        setPaymentError('Invalid phone number');
        setProcessing(false);
        return;
      }

      const response = await paymentLinksService.redeemPaymentLink(slug, {
        phone_number: phoneNum,
        provider: provider,
      });

      if (response.success && response.data) {
        setPaymentSuccess(response.data);
        setPhoneNumber('');
        // Refresh payment link status
        const linkResponse = await paymentLinksService.getPaymentLinkBySlug(slug);
        if (linkResponse.success) {
          setPaymentLink(linkResponse.data);
        }
      } else if (response.error?.code === 'HTTP_410') {
        setError(
          response.error?.message ||
          'This payment link is no longer available'
        );
        setPaymentLink(null);
      } else {
        setPaymentError(response.error?.message || 'Payment failed. Please try again.');
      }
    } catch (err: any) {
      setPaymentError(err?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment link...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !paymentLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white  shadow-lg p-8 max-w-md w-full text-center">
          <WarningCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Not Available</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  // Payment link expired or unavailable
  if (paymentLink && paymentLink.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white  shadow-lg p-8 max-w-md w-full text-center">
          <WarningCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Link Unavailable
          </h1>
          <p className="text-gray-600 mb-6">
            This payment link is no longer active ({paymentLink.status})
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Make Payment</h1>
          </div>
        </div>

        {/* Payment Link Details Card */}
        {paymentLink && (
          <div className="bg-white  shadow-lg p-8 mb-6">
            {paymentLink.description && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-lg font-semibold text-gray-900">
                  {paymentLink.description}
                </p>
              </div>
            )}

            {/* Amount */}
            <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50  border-2 border-green-100">
              <p className="text-sm text-gray-600 mb-2">Amount Due</p>
              <p className="text-4xl font-bold text-green-600">
                {formatCurrency(paymentLink.amount, paymentLink.currency)}
              </p>
            </div>

            {/* Additional Info */}
            <div className="space-y-3 mb-6 p-4 bg-gray-50 ">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Currency:</span>
                <span className="font-semibold text-gray-900">{paymentLink.currency}</span>
              </div>
              {paymentLink.expires_at && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Expires:</span>
                  <span className="font-semibold text-gray-900">
                    {formatDate(paymentLink.expires_at)}
                  </span>
                </div>
              )}
              {paymentLink.max_uses && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Uses Remaining:</span>
                  <span className="font-semibold text-gray-900">
                    {Math.max(0, (paymentLink.max_uses || 1) - (paymentLink.current_uses || 0))}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Success */}
        {paymentSuccess && (
          <div className="bg-white  shadow-lg p-8 mb-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Initiated Successfully!
            </h2>
            <p className="text-gray-600 mb-4">
              Your payment of {formatCurrency(paymentSuccess.payment?.amount, paymentSuccess.payment?.currency)} has been initiated.
            </p>
            {paymentSuccess.payment?.transaction_id && (
              <div className="bg-gray-50  p-4 mb-6 text-left">
                <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                <p className="text-sm font-mono text-gray-900 break-all">
                  {paymentSuccess.payment.transaction_id}
                </p>
              </div>
            )}
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                You will receive a payment prompt on your mobile device shortly.
              </p>
              <button
                onClick={() => {
                  setPaymentSuccess(null);
                  setPhoneNumber('');
                }}
                className="w-full px-6 py-3 bg-green-600 text-white font-semibold  hover:bg-green-700 transition-colors"
              >
                Make Another Payment
              </button>
            </div>
          </div>
        )}

        {/* Payment Form */}
        {!paymentSuccess && paymentLink?.status === 'ACTIVE' && (
          <form
            onSubmit={handleRedeemPaymentLink}
            className="bg-white  shadow-lg p-8"
          >
            {paymentError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700  flex items-start gap-3">
                <WarningCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Phone Number */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200  focus:outline-none focus:border-green-500 text-gray-900"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter the phone number associated with your mobile money account
              </p>
            </div>

            {/* Payment Provider */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Payment Provider <span className="text-red-500">*</span>
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200  focus:outline-none focus:border-green-500 text-gray-900 font-medium"
                required
              >
                <option value="MTN_CAM">MTN Mobile Money</option>
                <option value="ORANGE_CAM">Orange Money</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Select the mobile money service you use
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={processing}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold  hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Spinner className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay {formatCurrency(paymentLink.amount, paymentLink.currency)}
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50  border border-blue-200">
              <p className="text-xs text-blue-700">
                🔒 Your payment is secure. We use industry-standard encryption to protect your data.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
