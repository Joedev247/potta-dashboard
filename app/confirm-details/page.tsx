'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown } from 'lucide-react';

export default function ConfirmDetailsPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: '',
    legalForm: '',
    kvkNumber: '',
    address: '',
    postalCode: '',
    city: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [showLegalFormDropdown, setShowLegalFormDropdown] = useState(false);

  const legalForms = [
    'BV (Besloten Vennootschap)',
    'NV (Naamloze Vennootschap)',
    'VOF (Vennootschap Onder Firma)',
    'Eenmanszaak',
    'Stichting',
    'Vereniging',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleContinue = () => {
    if (agreed && formData.businessName && formData.legalForm && formData.kvkNumber) {
      // Store business details
      localStorage.setItem('businessDetails', JSON.stringify(formData));
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 mt-20 bg-white flex-shrink-0">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="text-sm text-gray-600">step 3 of 3</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-1 bg-gray-200 rounded-full mb-6">
            <div className="w-full h-full bg-green-500 rounded-full"></div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Confirm the details</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="w-full max-w-4xl mx-auto px-8 pt-8 pb-12">
        <div className="bg-white  border-2 border-gray-200 p-8 space-y-6">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business name
            </label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Search by business name"
              className="w-full px-4 py-3 border-2 border-gray-200  focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Legal Form */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Legal form
            </label>
            <button
              type="button"
              onClick={() => setShowLegalFormDropdown(!showLegalFormDropdown)}
              className="w-full px-4 py-3 border-2 border-gray-200  focus:outline-none focus:border-green-500 flex items-center justify-between text-left"
            >
              <span className={formData.legalForm ? 'text-gray-900' : 'text-gray-400'}>
                {formData.legalForm || 'Please select the legal form'}
              </span>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showLegalFormDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showLegalFormDropdown && (
              <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 max-h-60 overflow-y-auto">
                {legalForms.map((form) => (
                  <button
                    key={form}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, legalForm: form });
                      setShowLegalFormDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    {form}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* KvK Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              KvK-number
            </label>
            <input
              type="text"
              name="kvkNumber"
              value={formData.kvkNumber}
              onChange={handleChange}
              placeholder="E.g. 12345678"
              className="w-full px-4 py-3 border-2 border-gray-200  focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter address"
              className="w-full px-4 py-3 border-2 border-gray-200  focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Postal Code and City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postal code
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="1234 AB"
                className="w-full px-4 py-3 border-2 border-gray-200  focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter city"
                className="w-full px-4 py-3 border-2 border-gray-200  focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start gap-3 pt-4 border-t border-gray-200">
            <input
              type="checkbox"
              id="agreement"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 text-green-500 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="agreement" className="text-sm text-gray-700">
              On behalf of the organisation, I agree to the{' '}
              <a href="#" className="text-green-600 hover:text-green-700 underline">User Agreement</a>
              , and acknowledge the{' '}
              <a href="#" className="text-green-600 hover:text-green-700 underline">Privacy Statement</a>
              .
            </label>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!agreed || !formData.businessName || !formData.legalForm || !formData.kvkNumber}
            className="w-full py-3 bg-green-500 text-white font-semibold  hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

