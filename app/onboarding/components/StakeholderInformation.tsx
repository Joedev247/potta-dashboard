'use client';

import { useState, useEffect } from 'react';
import { Users, CaretDown } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { onboardingService } from '@/lib/api';

interface StakeholderInformationProps {
  onNext: () => void;
  onPrevious: () => void;
  onSkip?: () => void; // Optional for type compatibility
}

export default function StakeholderInformation({ onNext, onPrevious }: StakeholderInformationProps) {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    address: '',
    city: '',
    region: '',
    country: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill email from user
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const data = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality,
        address: formData.address,
        city: formData.city,
        region: formData.region || null,
        country: formData.country,
      };

      const response = await onboardingService.submitStakeholderInfo(data, organizationId);
      
      if (response.success) {
        onNext();
      } else {
        // Check if error is about missing organization
        const errorMessage = response.error?.message || 'Failed to submit stakeholder information. Please try again.';
        if (errorMessage.includes('Organization is required') || errorMessage.includes('organization')) {
          setError('Organization is required for onboarding. Please go back and create an organization first.');
        } else {
          setError(errorMessage);
        }
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to submit stakeholder information. Please try again.';
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
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stakeholder information</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Please provide your personal information to continue</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
              placeholder="Enter your first name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            placeholder="your.email@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            placeholder="+237 6 12 34 56 78"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nationality <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded appearance-none focus:outline-none focus:border-green-500 pr-10"
              >
                <option value="">Select nationality</option>
                <option value="CM">Cameroon</option>
                <option value="NG">Nigeria</option>
                <option value="TD">Chad</option>
                <option value="CF">Central African Republic</option>
                <option value="CG">Congo</option>
                <option value="CD">Congo (DRC)</option>
                <option value="GA">Gabon</option>
                <option value="GQ">Equatorial Guinea</option>
                <option value="FR">France</option>
                <option value="GB">United Kingdom</option>
                <option value="US">United States</option>
                <option value="DE">Germany</option>
                <option value="OTHER">Other</option>
              </select>
              <CaretDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Street address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
              placeholder="Douala, Yaoundé, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded appearance-none focus:outline-none focus:border-green-500 pr-10"
              >
                <option value="">Select country</option>
                <option value="CM">Cameroon</option>
                <option value="NG">Nigeria</option>
                <option value="TD">Chad</option>
                <option value="CF">Central African Republic</option>
                <option value="CG">Congo</option>
                <option value="CD">Congo (DRC)</option>
                <option value="GA">Gabon</option>
                <option value="GQ">Equatorial Guinea</option>
                <option value="FR">France</option>
                <option value="GB">United Kingdom</option>
                <option value="US">United States</option>
                <option value="DE">Germany</option>
                <option value="OTHER">Other</option>
              </select>
              <CaretDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Region / Province <span className="text-gray-500">(Optional)</span>
          </label>
          <div className="relative">
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded appearance-none focus:outline-none focus:border-green-500 pr-10"
            >
              <option value="">Select region (optional)</option>
              <option value="AD">Adamawa</option>
              <option value="CE">Centre</option>
              <option value="ES">East</option>
              <option value="EN">Far North</option>
              <option value="LT">Littoral</option>
              <option value="NO">North</option>
              <option value="NW">North West</option>
              <option value="SU">South</option>
              <option value="SW">South West</option>
              <option value="OU">West</option>
            </select>
            <CaretDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

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
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-1 text-base bg-green-500 text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}

