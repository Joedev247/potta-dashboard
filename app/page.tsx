'use client';

import { Users, FileText, TrendingUp, Building, Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function GetStartedPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const userName = user?.firstName 
    ? `${user.firstName.toUpperCase()}${user.lastName ? ' ' + user.lastName.toUpperCase() : ''}` 
    : user?.username?.toUpperCase() || 'USER';
  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Welcome Section */}
      <div className="mb-8 sm:mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">Welcome, {userName}!</h1>
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-green-500 to-green-400 rounded-full"></div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">Discover</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards - Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
        {/* Business Account Card */}
        <div className="group bg-white p-4 sm:p-6 border-2 border-gray-200 hover:border-green-500 transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
          <div className="mb-3 sm:mb-4 bg-gradient-to-br from-green-50 to-emerald-50 p-3 sm:p-4 h-40 sm:h-48 flex items-center justify-center border border-green-100 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <img 
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=300&fit=crop&q=80" 
              alt="Business Account" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Business Account instanvi</h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Accelerate your cash flow, grow your business.</p>
        </div>

        {/* Payment Links Card */}
        <div className="group bg-white p-4 sm:p-6 border-2 border-gray-200 hover:border-green-500 transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
          <div className="mb-3 sm:mb-4 bg-gradient-to-br from-blue-50 to-cyan-50 p-3 sm:p-4 h-40 sm:h-48 flex items-center justify-center border border-blue-100 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <img 
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop&q=80" 
              alt="Payment Links" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Payment Links</h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Receive payments instantly. Sell anywhere in Cameroon.</p>
        </div>

        {/* Online Payments Card */}
        <div className="group bg-white p-4 sm:p-6 border-2 border-gray-200 hover:border-green-500 transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
          <div className="mb-3 sm:mb-4 bg-gradient-to-br from-purple-50 to-pink-50 p-3 sm:p-4 h-40 sm:h-48 flex items-center justify-center border border-purple-100 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&q=80" 
              alt="Online Payments" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Online Payments</h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Integrate instanvi payments into your website or platform.</p>
        </div>

        {/* In Person Payments Card */}
        <div className="group bg-white p-4 sm:p-6 border-2 border-gray-200 hover:border-green-500 transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
          <div className="mb-3 sm:mb-4 bg-gradient-to-br from-orange-50 to-amber-50 p-3 sm:p-4 h-40 sm:h-48 flex items-center justify-center border border-orange-100 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <img 
              src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=400&h=300&fit=crop&q=80" 
              alt="In Person Payments" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">In Person Payments</h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Physical payments in your store or on the go.</p>
        </div>
      </div>

      {/* Onboarding Progress */}
      <div className="bg-gradient-to-br from-white to-gray-50 p-4 sm:p-6 lg:p-8 border-2 border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Onboarding Progress</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 ml-0 sm:ml-12">Complete your setup to access more instanvi products.</p>
          </div>
          <button 
            onClick={() => router.push('/onboarding')}
            className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="group flex items-center justify-between p-3 bg-white border-2 border-gray-200 hover:border-green-400 transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:from-green-100 group-hover:to-green-50 transition-all">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 group-hover:text-green-600 transition-colors" />
              </div>
              <span className="text-sm sm:text-base text-gray-900 font-semibold truncate">Stakeholder Information</span>
            </div>
            <button className="px-3 sm:px-4 py-1 text-xs sm:text-sm bg-gray-200 text-gray-700 font-semibold hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white transition-all rounded-full flex-shrink-0">
              To do
            </button>
          </div>

          <div className="group flex items-center justify-between p-3 bg-white border-2 border-gray-200 hover:border-green-400 transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:from-green-100 group-hover:to-green-50 transition-all">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 group-hover:text-green-600 transition-colors" />
              </div>
              <span className="text-sm sm:text-base text-gray-900 font-semibold truncate">Business Activity</span>
            </div>
            <button className="px-3 sm:px-4 py-1 text-xs sm:text-sm bg-gray-200 text-gray-700 font-semibold hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white transition-all rounded-full flex-shrink-0">
              To do
            </button>
          </div>

          <div className="group flex items-center justify-between p-3 bg-white border-2 border-gray-200 hover:border-green-400 transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:from-green-100 group-hover:to-green-50 transition-all">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 group-hover:text-green-700 transition-colors" />
              </div>
              <span className="text-sm sm:text-base text-gray-900 font-semibold truncate">Payment Methods</span>
            </div>
            <button className="px-3 sm:px-4 py-1 text-xs sm:text-sm bg-gray-200 text-gray-700 font-semibold hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white transition-all rounded-full flex-shrink-0">
              To do
            </button>
          </div>

          <div className="group flex items-center justify-between p-3 bg-white border-2 border-gray-200 hover:border-green-400 transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:from-green-100 group-hover:to-green-50 transition-all">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 group-hover:text-green-600 transition-colors" />
              </div>
              <span className="text-sm sm:text-base text-gray-900 font-semibold truncate">ID Document</span>
            </div>
            <button className="px-3 sm:px-4 py-1 text-xs sm:text-sm bg-gray-200 text-gray-700 font-semibold hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white transition-all rounded-full flex-shrink-0">
              To do
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
