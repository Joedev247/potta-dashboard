'use client';

import { useState } from 'react';
import { Building, CheckCircle2 } from 'lucide-react';

interface LinkBankAccountProps {
  onNext: () => void;
  onPrevious: () => void;
}

export default function LinkBankAccount({ onNext, onPrevious }: LinkBankAccountProps) {
  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    routingNumber: '',
    bankName: '',
    accountType: '',
  });

  const [isLinked, setIsLinked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLinked(true);
    // Simulate successful linking
    setTimeout(() => {
      onNext();
    }, 1500);
  };

  if (isLinked) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bank account linked!</h1>
          <p className="text-gray-600">Your bank account has been successfully connected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Building className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Link a bank account</h1>
            <p className="text-gray-600 mt-1">Connect your bank account to receive payments</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account holder name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.accountHolderName}
            onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:border-green-500"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:border-green-500"
            placeholder="Bank of America"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:border-green-500"
              placeholder="1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Routing number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.routingNumber}
              onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:border-green-500"
              placeholder="123456789"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            {['Checking', 'Savings'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, accountType: type })}
                className={`p-4 border-2 text-center transition-all ${
                  formData.accountType === type
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <span className={`font-medium ${formData.accountType === type ? 'text-gray-900' : 'text-gray-600'}`}>
                  {type}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200  p-4">
          <p className="text-sm text-blue-800">
            <strong>Security:</strong> Your bank account information is encrypted and securely stored. 
            We use bank-level security to protect your financial data.
          </p>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onPrevious}
            className="px-4 py-1 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <button
            type="submit"
            disabled={!formData.accountHolderName || !formData.accountNumber || !formData.routingNumber || !formData.bankName || !formData.accountType}
            className="px-4 py-1 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Link account
          </button>
        </div>
      </form>
    </div>
  );
}

