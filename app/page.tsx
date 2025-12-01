'use client';

import { Users, FileText, TrendingUp, Building, Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GetStartedPage() {
  const router = useRouter();
  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Welcome Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
         
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">Welcome, JOSEPH!</h1>
            <div className="flex items-center gap-2">
              <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-green-400 rounded-full"></div>
              <h2 className="text-2xl font-semibold text-gray-700">Discover</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards - Grid Layout */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        {/* Business Account Card */}
        <div className="group bg-white p-6 border-2 border-gray-200 hover:border-green-500 hover:shadow-2xl transition-all duration-300 shadow-md  overflow-hidden transform hover:-translate-y-1">
          <div className="mb-4 bg-gradient-to-br from-green-50 to-emerald-50 p-4 h-48 flex items-center justify-center border border-green-100  overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <img 
              src="/images/business-account.jpg" 
              alt="Business Account" 
              className="w-full h-full object-cover  transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">instanvi Business Account</h3>
          <p className="text-sm text-gray-600 leading-relaxed">Speed up your cash flow, grow your business.</p>
        </div>

        {/* Payment Links Card */}
        <div className="group bg-white p-6 border-2 border-gray-200 hover:border-green-500 hover:shadow-2xl transition-all duration-300 shadow-md  overflow-hidden transform hover:-translate-y-1">
          <div className="mb-4 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 h-48 flex items-center justify-center border border-blue-100  overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <img 
              src="/images/payment-links.jpg" 
              alt="Payment Links" 
              className="w-full h-full object-cover  transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Payment links</h3>
          <p className="text-sm text-gray-600 leading-relaxed">Get paid instantly. Sell anywhere.</p>
        </div>

        {/* Online Payments Card */}
        <div className="group bg-white p-6 border-2 border-gray-200 hover:border-green-500 hover:shadow-2xl transition-all duration-300 shadow-md  overflow-hidden transform hover:-translate-y-1">
          <div className="mb-4 bg-gradient-to-br from-purple-50 to-pink-50 p-4 h-48 flex items-center justify-center border border-purple-100  overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <img 
              src="/images/online-payments.jpg" 
              alt="Online Payments" 
              className="w-full h-full object-cover  transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Online payments</h3>
          <p className="text-sm text-gray-600 leading-relaxed">Link instanvi payments to your website or platform.</p>
        </div>

        {/* In Person Payments Card */}
        <div className="group bg-white p-6 border-2 border-gray-200 hover:border-green-500 hover:shadow-2xl transition-all duration-300 shadow-md  overflow-hidden transform hover:-translate-y-1">
          <div className="mb-4 bg-gradient-to-br from-orange-50 to-amber-50 p-4 h-48 flex items-center justify-center border border-orange-100  overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <img 
              src="/images/in-person-payments.jpg" 
              alt="In Person Payments" 
              className="w-full h-full object-cover  transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">In person payments</h3>
          <p className="text-sm text-gray-600 leading-relaxed">Physical payments at your store or on the go.</p>
        </div>
      </div>

      {/* Onboarding Progress */}
      <div className="bg-gradient-to-br from-white to-gray-50 p-8 border-2 border-gray-200 shadow-xl">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Onboarding progress</h3>
            </div>
            <p className="text-sm text-gray-600 ml-12">Finish your setup in order to get access to more instanvi products.</p>
          </div>
          <button 
            onClick={() => router.push('/onboarding')}
            className="px-4 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg flex items-center gap-2 transform hover:scale-105"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="group flex items-center justify-between p-3 bg-white border-2 border-gray-200 hover:border-green-400 hover:shadow-md transition-all duration-300 ">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center group-hover:from-green-100 group-hover:to-green-50 transition-all">
                <Users className="w-5 h-5 text-blue-600 group-hover:text-green-600 transition-colors" />
              </div>
              <span className="text-gray-900 font-semibold">Stakeholder information</span>
            </div>
            <button className="px-4 bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white transition-all rounded-full shadow-sm hover:shadow-md">
              To do
            </button>
          </div>

          <div className="group flex items-center justify-between p-3 bg-white border-2 border-gray-200 hover:border-green-400 hover:shadow-md transition-all duration-300 ">
            <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center group-hover:from-green-100 group-hover:to-green-50 transition-all">
            <FileText className="w-5 h-5 text-purple-600 group-hover:text-green-600 transition-colors" />
              </div>
              <span className="text-gray-900 font-semibold">Business activity</span>
            </div>
            <button className="px-4 bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white transition-all rounded-full shadow-sm hover:shadow-md">
              To do
            </button>
          </div>

          <div className="group flex items-center justify-between p-3 bg-white border-2 border-gray-200 hover:border-green-400 hover:shadow-md transition-all duration-300 ">
            <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center group-hover:from-green-100 group-hover:to-green-50 transition-all">
                <TrendingUp className="w-5 h-5 text-green-600 group-hover:text-green-700 transition-colors" />
              </div>
              <span className="text-gray-900 font-semibold">Payment methods</span>
            </div>
            <button className="px-4 bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white transition-all rounded-full shadow-sm hover:shadow-md">
              To do
            </button>
          </div>

          <div className="group flex items-center justify-between p-3 bg-white border-2 border-gray-200 hover:border-green-400 hover:shadow-md transition-all duration-300 ">
            <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center group-hover:from-green-100 group-hover:to-green-50 transition-all">
                <FileText className="w-5 h-5 text-orange-600 group-hover:text-green-600 transition-colors" />
              </div>
              <span className="text-gray-900 font-semibold">ID document</span>
            </div>
            <button className="px-4 bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white transition-all rounded-full shadow-sm hover:shadow-md">
              To do
            </button>
          </div>

          <div className="group flex items-center justify-between p-3 bg-white border-2 border-gray-200 hover:border-green-400 hover:shadow-md transition-all duration-300 ">
            <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center group-hover:from-green-100 group-hover:to-green-50 transition-all">
                <Building className="w-5 h-5 text-red-600 group-hover:text-green-600 transition-colors" />
              </div>
              <span className="text-gray-900 font-semibold">Link a bank account</span>
            </div>
            <button className="px-4 bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white transition-all rounded-full shadow-sm hover:shadow-md">
              To do
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
