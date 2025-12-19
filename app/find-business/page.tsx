'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MagnifyingGlass, X } from '@phosphor-icons/react';

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
      <div className="border-b mt-16 sm:mt-20 border-gray-200 bg-white flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <span className="text-xs sm:text-sm text-gray-600">step 2 of 3</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-1 bg-gray-200 rounded-full mb-4 sm:mb-6">
            <div className="w-2/3 h-full bg-green-500 rounded-full"></div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Find your business</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-8 sm:pb-12">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business legal name
          </label>
          <div className="relative">
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
              className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 text-base border-2 border-green-500  focus:outline-none focus:ring-2 focus:ring-green-200"
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
          <div className="mt-8 sm:mt-12 flex flex-col items-center justify-center text-center py-8 sm:py-16 px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">No results</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md">
              We couldn't find your company, change your search or add the company manually.
            </p>
            <button
              onClick={handleAddManually}
              className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 text-gray-700 font-semibold  hover:bg-gray-50 transition-colors flex items-center gap-2"
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

