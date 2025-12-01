'use client';

import { Settings, Info, ArrowUpRight, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function BalancePage() {
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
          <button className="px-5 py-1 bg-gradient-to-br from-green-400 to-green-600 text-white text-sm font-semibold hover:from-gray-800 hover:to-gray-700 transition-all flex items-center gap-2 transform hover:scale-105">
            Request payout
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Payouts Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Payouts</h2>
        </div>
        
        <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 p-6 relative">
          {/* Add Bank Account Link - Top Right */}
          <div className="absolute top-6 right-6">
            <Link href="/" className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              Add bank account
            </Link>
          </div>

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
    </div>
  );
}
