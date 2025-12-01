'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight } from 'lucide-react';

interface Country {
  code: string;
  name: string;
}

const countries: Country[] = [
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'AT', name: 'Austria' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
];

export default function SelectCountryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContinue = () => {
    if (selectedCountry) {
      // Store selected country
      localStorage.setItem('selectedCountry', selectedCountry);
      router.push('/find-business');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">step 1 of 2</span>
          </div>
          <div className="w-full h-1 bg-gray-200 rounded-full">
            <div className="w-1/2 h-full bg-green-500 rounded-full"></div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          What country is your business registered in?
        </h1>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </div>

        {/* Country List */}
        <div className="max-h-96 overflow-y-auto mb-6 space-y-2">
          {filteredCountries.map((country) => (
            <button
              key={country.code}
              onClick={() => setSelectedCountry(country.code)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg transition-colors ${
                selectedCountry === country.code
                  ? 'bg-green-50 border-2 border-green-500'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                selectedCountry === country.code
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-700'
              }`}>
                {country.code}
              </div>
              <span className="flex-1 text-left font-medium text-gray-900">{country.name}</span>
              {selectedCountry === country.code && (
                <ChevronRight className="w-5 h-5 text-green-500" />
              )}
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedCountry}
          className="w-full py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

