'use client';

import { useState } from 'react';
import { FileText, ChevronDown } from 'lucide-react';

interface BusinessActivityProps {
  onNext: () => void;
  onPrevious: () => void;
}

export default function BusinessActivity({ onNext, onPrevious }: BusinessActivityProps) {
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    industry: '',
    registrationNumber: '',
    vatNumber: '',
    website: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Business Activity</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Tell us about your business</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            placeholder="Your business name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              required
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded appearance-none focus:outline-none focus:border-green-500 pr-10"
            >
              <option value="">Select business type</option>
              <option value="entreprise-individuelle">Sole Proprietorship</option>
              <option value="sarl">SARL (Limited Liability Company)</option>
              <option value="sa">SA (Public Limited Company)</option>
              <option value="snc">SNC (General Partnership)</option>
              <option value="association">Association</option>
              <option value="autre">Other</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry Sector <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              required
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded appearance-none focus:outline-none focus:border-green-500 pr-10"
            >
              <option value="">Select industry sector</option>
              <option value="agriculture">Agriculture</option>
              <option value="commerce">Commerce / Retail</option>
              <option value="ecommerce">E-commerce</option>
              <option value="services">Services</option>
              <option value="technologie">Technology</option>
              <option value="telecom">Telecommunications</option>
              <option value="transport">Transport</option>
              <option value="sante">Health</option>
              <option value="education">Education</option>
              <option value="tourisme">Tourism / Hospitality</option>
              <option value="bancaire">Banking / Financial Services</option>
              <option value="extraction">Extraction / Mines</option>
              <option value="autre">Other</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Number
            </label>
            <input
              type="text"
              value={formData.registrationNumber}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
              placeholder="Ex: RC/DLA/2024/A/12345"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VAT Number (optional)
            </label>
            <input
              type="text"
              value={formData.vatNumber}
              onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
              className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
              placeholder="Ex: M123456789"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            placeholder="https://www.exemple.cm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2.5 text-base bg-white border border-gray-200 text-gray-900 rounded focus:outline-none focus:border-green-500"
            placeholder="Describe what your business does..."
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onPrevious}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-1 text-base bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2.5 sm:py-1 text-base bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

