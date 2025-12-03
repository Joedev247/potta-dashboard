'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, X } from 'lucide-react';

export default function FindBusinessPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('fddghd');
  const [hasSearched, setHasSearched] = useState(true);

  const handleSearch = () => {
    setHasSearched(true);
  };

  const handleClear = () => {
    setSearchQuery('');
    setHasSearched(false);
  };

  const handleAddManually = () => {
    // Store the searched business name to pre-fill in confirm-details
    if (searchQuery && searchQuery.trim()) {
      localStorage.setItem('searchedBusinessName', searchQuery.trim());
    }
    router.push('/confirm-details');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b mt-20 border-gray-200 bg-white flex-shrink-0">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="text-sm text-gray-600">step 2 of 3</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-1 bg-gray-200 rounded-full mb-6">
            <div className="w-2/3 h-full bg-green-500 rounded-full"></div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find your business</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="w-full max-w-4xl mx-auto px-8 pt-8 pb-12">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business legal name
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHasSearched(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="Search by business name"
              className="w-full pl-12 pr-12 py-3 border-2 border-green-500  focus:outline-none focus:ring-2 focus:ring-green-200"
            />
            {searchQuery && (
              <button
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* No Results */}
        {hasSearched && searchQuery && (
          <div className="mt-12 flex flex-col items-center justify-center text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No results</h2>
            <p className="text-gray-600 mb-8 max-w-md">
              We couldn't find your company, change your search or add the company manually.
            </p>
            <button
              onClick={handleAddManually}
              className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold  hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              Add Manually
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

