'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CaretDown } from '@phosphor-icons/react';
import { useOrganization } from '@/contexts/OrganizationContext';

export default function ConfirmDetailsPage() {
  const router = useRouter();
  const { setOrganization } = useOrganization();
  const [formData, setFormData] = useState({
    businessName: '',
    legalForm: '',
    registrationNumber: '',
    address: '',
    region: '',
    city: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [showLegalFormDropdown, setShowLegalFormDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);

  const legalForms = [
    'Sole Proprietorship',
    'SARL (Limited Liability Company)',
    'SA (Public Limited Company)',
    'SNC (General Partnership)',
    'SCS (Limited Partnership)',
    'SCA (Partnership Limited by Shares)',
    'Economic Interest Grouping (GIE)',
    'Association',
  ];

  const cameroonRegions = [
    'Adamaoua',
    'Centre',
    'Est',
    'Extrême-Nord',
    'Littoral',
    'Nord',
    'Nord-Ouest',
    'Ouest',
    'Sud',
    'Sud-Ouest',
  ];

  // Load searched business name on mount
  useEffect(() => {
    const searchedName = localStorage.getItem('searchedBusinessName');
    if (searchedName) {
      setFormData(prev => ({ ...prev, businessName: searchedName }));
      localStorage.removeItem('searchedBusinessName');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleContinue = () => {
    if (agreed && formData.businessName && formData.legalForm && formData.registrationNumber) {
      // Get country from previous step
      const selectedCountry = localStorage.getItem('selectedCountry') || 'CM';
      const countryName = selectedCountry === 'CM' ? 'Cameroon' : 'Other';
      
      // Store business details with organization info
      const organizationData = {
        ...formData,
        country: selectedCountry,
        countryName: countryName,
      };
      
      localStorage.setItem('businessDetails', JSON.stringify(organizationData));
      const orgData = {
        name: formData.businessName,
        legalForm: formData.legalForm,
        registrationNumber: formData.registrationNumber,
        address: formData.address,
        region: formData.region,
        city: formData.city,
        country: selectedCountry,
        countryName: countryName,
      };
      localStorage.setItem('organization', JSON.stringify(orgData));
      setOrganization(orgData);
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 mt-16 sm:mt-20 bg-white flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <span className="text-xs sm:text-sm text-gray-600">step 3 of 3</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-1 bg-gray-200 rounded-full mb-4 sm:mb-6">
            <div className="w-full h-full bg-green-500 rounded-full"></div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Confirm the details</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-8 sm:pb-12">
        <div className="bg-white  border-2 border-gray-200 p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business name *
            </label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Search by business name"
              className="w-full px-4 py-2.5 sm:py-3 text-base border-2 border-gray-200  focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Legal Form */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Legal form *
            </label>
            <button
              type="button"
              onClick={() => setShowLegalFormDropdown(!showLegalFormDropdown)}
              className="w-full px-4 py-3 border-2 border-gray-200  focus:outline-none focus:border-green-500 flex items-center justify-between text-left"
            >
              <span className={formData.legalForm ? 'text-gray-900' : 'text-gray-400'}>
                {formData.legalForm || 'Please select the legal form'}
              </span>
              <CaretDown className={`w-5 h-5 text-gray-400 transition-transform ${showLegalFormDropdown ? 'rotate-180' : ''}`} />
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

          {/* Registration Number (RC) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Number (RC) *
            </label>
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              placeholder="RC/DLA/2024/A/12345"
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

          {/* Region and City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region / Province
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowRegionDropdown(!showRegionDropdown);
                  setShowLegalFormDropdown(false);
                }}
                className="w-full px-4 py-3 border-2 border-gray-200  focus:outline-none focus:border-green-500 flex items-center justify-between text-left"
              >
                <span className={formData.region ? 'text-gray-900' : 'text-gray-400'}>
                  {formData.region || 'Select region'}
                </span>
                <CaretDown className={`w-5 h-5 text-gray-400 transition-transform ${showRegionDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showRegionDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 max-h-60 overflow-y-auto">
                  {cameroonRegions.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, region });
                        setShowRegionDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      {region}
                    </button>
                  ))}
                </div>
              )}
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
            disabled={!agreed || !formData.businessName || !formData.legalForm || !formData.registrationNumber}
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

