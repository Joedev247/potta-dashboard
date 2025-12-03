'use client';

import { Settings, Info, ArrowUpRight, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function BalancePage() {
  const [showRequestPayout, setShowRequestPayout] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutData, setPayoutData] = useState({
    amount: '',
    currency: 'XAF',
    description: '',
  });

  const availableBalance = 0.00;
  const pendingBalance = 0.00;

  const handleRequestPayout = async () => {
    setPayoutError(null);
    setPayoutSuccess(false);

    // Validation
    if (!payoutData.amount || parseFloat(payoutData.amount) <= 0) {
      setPayoutError('Please enter a valid amount');
      return;
    }

    const requestedAmount = parseFloat(payoutData.amount);
    
    if (requestedAmount > availableBalance) {
      setPayoutError(`Insufficient balance. Available: ${payoutData.currency} ${availableBalance.toFixed(2)}`);
      return;
    }

    setIsRequesting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPayoutSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setPayoutSuccess(false);
        setPayoutData({
          amount: '',
          currency: 'XAF',
          description: '',
        });
        setShowRequestPayout(false);
      }, 3000);
    } catch (err) {
      setPayoutError('Failed to request payout. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Top Section - Balance Summary and Actions */}
      <div className="flex items-start justify-between mb-8">
        {/* Balance Display */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">XAF</span>
            </div>
            <span className="text-sm text-gray-600 font-medium">XAF</span>
          </div>
          <div className="text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">XAF 0.00</div>
          <div className="text-sm text-gray-600 font-medium">Pending: XAF 0.00</div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link 
            href="/settings"
            className="px-5 py-1 text-gray-700 text-sm font-semibold hover:text-gray-900 transition-colors"
          >
            Settings
          </Link>
          <button 
            onClick={() => setShowRequestPayout(true)}
            className="px-5 py-1 bg-gradient-to-br from-green-400 to-green-600 text-white text-sm font-semibold hover:from-green-500 hover:to-green-700 transition-all flex items-center gap-2 transform hover:scale-105"
          >
            Request payout
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Payouts Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Payouts</h2>
        </div>
        
        <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 p-6">
          {/* Next Payout Amount */}
          <div className="text-4xl font-bold text-gray-900 mb-2">XAF 0.00</div>
          <div className="text-sm text-gray-600 mb-6">Next payout - Blocked</div>

          {/* Information Banner */}
          <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-200 p-4 mb-6 flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center rounded-full flex-shrink-0">
              <Info className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-gray-700 font-medium">
              Your payouts are not enabled. Please view our{' '}
              <Link href="/" className="text-green-600 hover:text-green-700 underline font-semibold">
                Get Started
              </Link>{' '}
              page for more details.
            </p>
          </div>

          {/* Balance Reserve and Setup */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">XAF 0 balance reserve</div>
            <Link href="/" className="text-green-600 hover:text-green-700 text-sm font-medium">
              Set up
            </Link>
          </div>
        </div>
      </div>

      {/* Transactions Section - Placeholder */}
      <div className="bg-white border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Placeholder Graphic - Three Stacked Rectangles */}
          <div className="mb-6 space-y-2">
            <div className="w-32 h-12 bg-gray-100 border border-gray-200">
              <div className="h-full flex items-center px-3">
                <div className="w-full h-0.5 bg-gray-300"></div>
              </div>
            </div>
            <div className="w-32 h-12 bg-gray-100 rounded border border-gray-200">
              <div className="h-full flex items-center px-3">
                <div className="w-full h-0.5 bg-gray-300"></div>
              </div>
            </div>
            <div className="w-32 h-12 bg-gray-100 rounded border border-gray-200">
              <div className="h-full flex items-center px-3">
                <div className="w-full h-0.5 bg-gray-300"></div>
              </div>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
          <p className="text-sm text-gray-600">Transactions on this balance will appear here</p>
        </div>
      </div>

      {/* Request Payout Modal */}
      {showRequestPayout && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!isRequesting) {
              setShowRequestPayout(false);
              setPayoutError(null);
              setPayoutSuccess(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Request Payout</h2>
              <button
                onClick={() => {
                  if (!isRequesting) {
                    setShowRequestPayout(false);
                    setPayoutError(null);
                    setPayoutSuccess(false);
                    setPayoutData({
                      amount: '',
                      currency: 'XAF',
                      description: '',
                    });
                  }
                }}
                disabled={isRequesting}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Balance Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Available Balance</span>
                  <span className="text-lg font-bold text-gray-900">{payoutData.currency} {availableBalance.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="text-sm text-gray-900">{payoutData.currency} {pendingBalance.toFixed(2)}</span>
                </div>
              </div>

              {/* Success Message */}
              {payoutSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 font-medium">Payout request submitted successfully!</p>
                    <p className="text-xs text-green-700 mt-1">Your payout will be processed within 1-3 business days.</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {payoutError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{payoutError}</p>
                  </div>
                  <button
                    onClick={() => setPayoutError(null)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Currency Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select
                  value={payoutData.currency}
                  onChange={(e) => setPayoutData({ ...payoutData, currency: e.target.value })}
                  disabled={isRequesting || payoutSuccess}
                  className="w-full px-4 py-2 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="XAF">XAF (Central African CFA Franc)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">
                    {payoutData.currency}
                  </span>
                  <input
                    type="number"
                    value={payoutData.amount}
                    onChange={(e) => setPayoutData({ ...payoutData, amount: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={isRequesting || payoutSuccess}
                    className="w-full pl-16 pr-4 py-2 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Maximum: {payoutData.currency} {availableBalance.toFixed(2)}</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <textarea
                  value={payoutData.description}
                  onChange={(e) => setPayoutData({ ...payoutData, description: e.target.value })}
                  placeholder="Add a note for this payout"
                  rows={3}
                  disabled={isRequesting || payoutSuccess}
                  className="w-full px-4 py-2 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-800 font-medium mb-1">Payout Processing</p>
                    <p className="text-xs text-blue-700">
                      Payouts are typically processed within 1-3 business days. You'll receive a notification once the payout is completed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  if (!isRequesting) {
                    setShowRequestPayout(false);
                    setPayoutError(null);
                    setPayoutSuccess(false);
                    setPayoutData({
                      amount: '',
                      currency: 'XAF',
                      description: '',
                    });
                  }
                }}
                disabled={isRequesting}
                className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestPayout}
                disabled={isRequesting || payoutSuccess || !payoutData.amount}
                className="px-6 py-2 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRequesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Request Payout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
