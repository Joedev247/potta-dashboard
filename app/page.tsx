"use client";

import React, { useEffect, useState } from 'react';
import { Users, FileText, TrendUp, Building, Sparkle, ArrowRight } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import OnboardingSummary from '@/components/OnboardingSummary';
import { onboardingService } from '@/lib/api/onboarding';
import { balanceService } from '@/lib/api/balance';
import { ordersService } from '@/lib/api/orders';

export default function GetStartedPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [progressData, setProgressData] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState(0);
  const [paymentsToday, setPaymentsToday] = useState(0);
  
  const userName = user?.firstName 
    ? `${user.firstName.toUpperCase()}${user.lastName ? ' ' + user.lastName.toUpperCase() : ''}` 
    : user?.username?.toUpperCase() || 'USER';

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await onboardingService.getProgress();
        console.log('Onboarding progress response:', res);
        
        if (!mounted) return;
        
        if (res && res.success && res.data) {
          console.log('Onboarding data:', res.data);
          setProgressData(res.data);
          // If backend says onboarding is complete, use it. If backend says incomplete,
          // allow a client-side completed state (saved in localStorage) to override so
          // users immediately see the completed UI after finishing onboarding.
          if (res.data.isComplete) {
            setOnboardingComplete(true);
          } else {
            const stored = typeof window !== 'undefined' ? localStorage.getItem('onboardingProgress') : null;
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.isComplete) {
                  console.debug('onboarding: overriding API with localStorage completed state', parsed);
                  setProgressData(parsed);
                  setOnboardingComplete(true);
                } else {
                  setOnboardingComplete(false);
                }
              } catch (e) {
                setOnboardingComplete(false);
              }
            } else {
              setOnboardingComplete(false);
            }
          }
        } else {
          // Fallback: check localStorage for onboarding completion flag
            const stored = typeof window !== 'undefined' ? localStorage.getItem('onboardingProgress') : null;
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                setProgressData(parsed);
                setOnboardingComplete(Boolean(parsed.isComplete));
                console.debug('onboarding: loaded from localStorage fallback', parsed);
              } catch (e) {
                setProgressData(null);
                setOnboardingComplete(false);
              }
            } else {
              setProgressData(null);
              setOnboardingComplete(false);
            }
        }
      } catch (err) {
        console.error('Failed to fetch onboarding progress:', err);
        // Fallback to localStorage
          const stored = typeof window !== 'undefined' ? localStorage.getItem('onboardingProgress') : null;
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setProgressData(parsed);
              setOnboardingComplete(Boolean(parsed.isComplete));
              console.debug('onboarding: loaded from localStorage after error', parsed);
            } catch (e) {
              setProgressData(null);
              setOnboardingComplete(false);
            }
          } else {
            setProgressData(null);
            setOnboardingComplete(false);
          }
      } finally {
        if (mounted) setOnboardingLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Fetch balance and transactions data when onboarding is complete
  useEffect(() => {
    if (!onboardingComplete) return;

    let mounted = true;

    async function fetchLiveData() {
      try {
        // Fetch balance
        try {
          const balanceRes = await balanceService.getBalance();
          if (mounted && balanceRes && balanceRes.data) {
            setBalance(balanceRes.data.available || 0);
          }
        } catch (e) {
          console.warn('Failed to fetch balance:', e);
        }

        // Fetch total transactions
        try {
          const ordersRes = await ordersService.listOrders();
          if (mounted && ordersRes && ordersRes.data && Array.isArray(ordersRes.data.orders)) {
            setTransactions(ordersRes.data.orders.length || 0);
            // Count payments processed today (rough estimate)
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const todayPayments = ordersRes.data.orders.filter((order: any) => {
              return order.createdAt && order.createdAt.startsWith(todayStr);
            }).length;
            setPaymentsToday(todayPayments);
          }
        } catch (e) {
          console.warn('Failed to fetch transactions:', e);
        }
      } catch (err) {
        console.error('Failed to fetch live data:', err);
      }
    }

    fetchLiveData();
    return () => { mounted = false; };
  }, [onboardingComplete]);

  // While we are loading onboarding state, avoid showing the old Get Started UI to prevent flicker
  if (onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="animate-pulse">
          <div className="h-6 w-56 bg-gray-200  mb-2" />
          <div className="h-4 w-40 bg-gray-200 " />
        </div>
      </div>
    );
  }

  // If onboarding completed, show the improved summary UI instead of the original Get Started page
  if (onboardingComplete) {
    return (
      <div className="p-6 sm:p-8 lg:p-10 min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userName}!</h1>
            <p className="text-sm text-gray-600 mt-1">Your organization has completed onboarding — here is the summary.</p>
          </div>
          <OnboardingSummary
            completedSteps={
              // Transform API response: if steps array exists, extract completed step keys
              // API returns steps like [{step_name: 'STAKEHOLDER_INFO', completed: true}, ...]
              Array.isArray(progressData?.steps) 
                ? progressData.steps
                    .filter((s: any) => s.completed)
                    .map((s: any) => {
                      // Map API step_name to component keys
                      const stepNameMap: Record<string, string> = {
                        'STAKEHOLDER_INFO': 'stakeholder',
                        'BUSINESS_ACTIVITY': 'business',
                        'PAYMENT_METHODS': 'methods',
                        'ID_DOCUMENT': 'id',
                        'ORGANIZATION': 'organization',
                      };
                      return stepNameMap[s.step_name] || s.step_name?.toLowerCase();
                    })
                    .filter(Boolean)
                : Array.isArray(progressData?.completedSteps) 
                  ? progressData.completedSteps 
                  : []
            }
            currentStep={progressData?.currentStep}
            isComplete={Boolean(progressData?.isComplete)}
            progressPercentage={progressData?.progress ?? progressData?.progressPercentage ?? 100}
            orgName={organization?.name || progressData?.organizationName || 'Your Organization'}
            stats={{
              balance: balance,
              paymentsToday: paymentsToday,
              transactions: transactions,
            }}
          />
        </div>
      </div>
    );
  }

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
          <div className="mb-3 sm:mb-4 bg-gradient-to-br from-gray-50 to-cyan-50 p-3 sm:p-4 h-40 sm:h-48 flex items-center justify-center border border-gray-100 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
          <div className="mb-3 sm:mb-4 bg-gradient-to-br from-gray-50 to-pink-50 p-3 sm:p-4 h-40 sm:h-48 flex items-center justify-center border border-gray-100 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
                <TrendUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
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
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:from-green-100 group-hover:to-green-50 transition-all">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-green-600 transition-colors" />
              </div>
              <span className="text-sm sm:text-base text-gray-900 font-semibold truncate">Stakeholder Information</span>
            </div>
            <button className="px-3 sm:px-4 py-1 text-xs sm:text-sm bg-gray-200 text-gray-700 font-semibold hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white transition-all rounded-full flex-shrink-0">
              To do
            </button>
          </div>

          <div className="group flex items-center justify-between p-3 bg-white border-2 border-gray-200 hover:border-green-400 transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:from-green-100 group-hover:to-green-50 transition-all">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-green-600 transition-colors" />
              </div>
              <span className="text-sm sm:text-base text-gray-900 font-semibold truncate">Business Activity</span>
            </div>
            <button className="px-3 sm:px-4 py-1 text-xs sm:text-sm bg-gray-200 text-gray-700 font-semibold hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white transition-all rounded-full flex-shrink-0">
              To do
            </button>
          </div>

          <div className="group flex items-center justify-between p-3 bg-white border-2 border-gray-200 hover:border-green-400 transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:from-green-100 group-hover:to-green-50 transition-all">
                <TrendUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 group-hover:text-green-700 transition-colors" />
              </div>
              <span className="text-sm sm:text-base text-gray-900 font-semibold truncate">Payment Methods</span>
            </div>
            <button className="px-3 sm:px-4 py-1 text-xs sm:text-sm bg-gray-200 text-gray-700 font-semibold hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white transition-all rounded-full flex-shrink-0">
              To do
            </button>
          </div>

          <div className="group flex items-center justify-between p-3 bg-white border-2 border-gray-200 hover:border-green-400 transition-all duration-300">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:from-green-100 group-hover:to-green-50 transition-all">
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
