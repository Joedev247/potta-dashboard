'use client';

import { useState } from 'react';
import { TrendUp, DeviceMobile, Check } from '@phosphor-icons/react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { onboardingService } from '@/lib/api';

interface PaymentMethodsProps {
  onNext: () => void;
  onPrevious: () => void;
}

const paymentMethods = [
  { id: 'mtn-momo', name: 'MTN Mobile Money', icon: DeviceMobile, description: 'Mobile payments via MTN MoMo in Cameroon' },
  { id: 'orange-money', name: 'Orange Money', icon: DeviceMobile, description: 'Mobile payments via Orange Money in Cameroon' },
];

export default function PaymentMethods({ onNext, onPrevious }: PaymentMethodsProps) {
  const { organization } = useOrganization();
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleMethod = (methodId: string) => {
    if (selectedMethods.includes(methodId)) {
      setSelectedMethods(selectedMethods.filter(id => id !== methodId));
    } else {
      setSelectedMethods([...selectedMethods, methodId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMethods.length === 0) {
      setError('Please select at least one payment method.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Organization is REQUIRED for onboarding according to backend API
      const organizationId = (organization as any)?.id || localStorage.getItem('currentOrganizationId');
      
      if (!organizationId) {
        setError('Organization is required for onboarding. Please create an organization first.');
        setLoading(false);
        return;
      }

      // Backend expects 'preferredMethods' field name (tested via console)
      const data = {
        preferredMethods: selectedMethods,
      };

      const response = await onboardingService.submitPaymentMethods(data, organizationId);
      
      if (response.success) {
        onNext();
      } else {
        // Check if error is about missing organization
        const errorMessage = response.error?.message || 'Failed to submit payment methods. Please try again.';
        if (errorMessage.includes('Organization is required') || errorMessage.includes('organization')) {
          setError('Organization is required for onboarding. Please go back and create an organization first.');
        } else {
          setError(errorMessage);
        }
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to submit payment methods. Please try again.';
      if (errorMessage.includes('Organization is required') || errorMessage.includes('organization')) {
        setError('Organization is required for onboarding. Please go back and create an organization first.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <TrendUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payment Methods</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Select the payment methods you want to accept</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethods.includes(method.id);
            
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => toggleMethod(method.id)}
                className={`p-3 sm:p-4 border-2  text-left transition-all ${
                  isSelected
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 sm:gap-0 mb-2">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-green-500' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900">{method.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{method.description}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {selectedMethods.length === 0 && !error && (
          <div className="bg-yellow-50 border border-yellow-200  p-4">
            <p className="text-sm text-yellow-800">Please select at least one payment method to continue.</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onPrevious}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-1 text-base bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="submit"
            disabled={selectedMethods.length === 0 || loading}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-1 text-base bg-green-500 text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}

