'use client';

import { useState } from 'react';
import { TrendingUp, Smartphone, Check } from 'lucide-react';

interface PaymentMethodsProps {
  onNext: () => void;
  onPrevious: () => void;
}

const paymentMethods = [
  { id: 'mtn-momo', name: 'MTN Mobile Money', icon: Smartphone, description: 'Mobile payments via MTN MoMo in Cameroon' },
  { id: 'orange-money', name: 'Orange Money', icon: Smartphone, description: 'Mobile payments via Orange Money in Cameroon' },
];

export default function PaymentMethods({ onNext, onPrevious }: PaymentMethodsProps) {
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

  const toggleMethod = (methodId: string) => {
    if (selectedMethods.includes(methodId)) {
      setSelectedMethods(selectedMethods.filter(id => id !== methodId));
    } else {
      setSelectedMethods([...selectedMethods, methodId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMethods.length > 0) {
      onNext();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
            <p className="text-gray-600 mt-1">Select the payment methods you want to accept</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethods.includes(method.id);
            
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => toggleMethod(method.id)}
                className={`p-4 border-2  text-left transition-all ${
                  isSelected
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-green-500' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{method.name}</h3>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {selectedMethods.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200  p-4">
            <p className="text-sm text-yellow-800">Please select at least one payment method to continue.</p>
          </div>
        )}

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
            disabled={selectedMethods.length === 0}
            className="px-4 py-1 bg-green-500 text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

