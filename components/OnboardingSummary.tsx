"use client";

import React from 'react';
import {
  CheckCircle,
  Circle,
  FileText,
  Users,
  CreditCard,
  Wallet,
  ChartBar,
  Link,
  UserCheck,
  Headphones,
  Code,
  Lightning,
  BookOpen,
  ShieldCheck,
  ArrowUpRight,
  TrendUp,
  Clock,
  Building,
  CaretRight,
  Pulse,
  Globe,
  Bell,
  Gear,
  Plus,
  ArrowSquareOut,
  CurrencyDollar,
  Receipt,
  PaperPlaneTilt,
} from '@phosphor-icons/react';

export interface OnboardingProgressProps {
  completedSteps?: string[];
  currentStep?: string;
  isComplete?: boolean;
  progressPercentage?: number;
  orgName?: string;
  stats?: {
    balance?: number;
    paymentsToday?: number;
    transactions?: number;
  };
  recentActivity?: { id: string; text: string; timeAgo: string }[];
}

export default function OnboardingSummary({
  completedSteps = [],
  currentStep = 'Stakeholder Information',
  isComplete = false,
  progressPercentage = 0,
  orgName = 'Your Organization',
  stats = { balance: 0, paymentsToday: 0, transactions: 0 },
  recentActivity = [],
}: OnboardingProgressProps) {
  const steps = [
    { key: 'organization', title: 'Organization Setup', icon: Building },
    { key: 'stakeholder', title: 'Stakeholder Info', icon: UserCheck },
    { key: 'business', title: 'Business Activity', icon: FileText },
    { key: 'methods', title: 'Payment Methods', icon: CreditCard },
    { key: 'id', title: 'ID Verification', icon: ShieldCheck },
  ];

  const safeCompletedSteps = Array.isArray(completedSteps) ? completedSteps : [];

  const quickActions = [
    { 
      title: 'Add Bank Account', 
      desc: 'Enable payouts', 
      icon: Wallet, 
      href: '/settings/bank',
    },
    { 
      title: 'Payment Link', 
      desc: 'Send invoices', 
      icon: Link, 
      href: '/payments/links',
    },
    { 
      title: 'View Reports', 
      desc: 'Analytics', 
      icon: ChartBar, 
      href: '/reports',
    },
  ];

  // Utility function to calculate relative time (timeAgo)
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInMonths < 12) {
      return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    } else {
      return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
    }
  };

  // Generate dynamic activity list from completed steps
  const generateActivityList = (): { id: string; text: string; timeAgo: string }[] => {
    const activities: { id: string; text: string; timeAgo: string; date: Date }[] = [];
    const now = new Date();

    // Step key normalization: map aliases to primary keys to avoid duplicates
    const stepKeyNormalization: Record<string, string> = {
      'methods': 'payment', // Normalize 'methods' to 'payment'
      'id': 'document', // Normalize 'id' to 'document'
    };

    // Step activity mappings (using primary keys only)
    const stepActivityMap: Record<string, { text: string; order: number }> = {
      'organization': { text: 'You created your organization', order: 1 },
      'stakeholder': { text: 'Stakeholder information saved', order: 2 },
      'business': { text: 'Business activity information saved', order: 3 },
      'payment': { text: 'Payment methods configured', order: 4 },
      'document': { text: 'ID document uploaded and verified', order: 5 },
    };

    // Normalize step key (convert aliases to primary keys)
    const normalizeStepKey = (stepKey: string): string => {
      return stepKeyNormalization[stepKey] || stepKey;
    };

    // Get completion dates from localStorage or calculate based on order
    const getCompletionDate = (stepKey: string, order: number): Date => {
      const storageKey = `onboarding_step_${stepKey}_completed_at`;
      const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      
      if (stored) {
        try {
          const date = new Date(stored);
          if (!isNaN(date.getTime())) {
            return date;
          }
        } catch (e) {
          // Invalid date, fall through to calculated date
        }
      }

      // Calculate date based on order (most recent step is most recent date)
      // Start from 7 days ago and work backwards
      const daysAgo = 7 - (order - 1);
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      return date;
    };

    // Collect all completed steps from multiple sources
    const stepsToCheckSet = new Set<string>();
    
    // 1. Add steps from completedSteps prop (normalize keys)
    if (safeCompletedSteps.length > 0) {
      safeCompletedSteps.forEach(stepKey => {
        stepsToCheckSet.add(normalizeStepKey(stepKey));
      });
    }
    
    // 2. If onboarding is complete but no steps, check all possible steps
    if (stepsToCheckSet.size === 0 && isComplete) {
      Object.keys(stepActivityMap).forEach(key => stepsToCheckSet.add(key));
    }
    
    // 3. Also check localStorage for any completed steps (normalize and deduplicate)
    if (typeof window !== 'undefined') {
      // Check all possible step keys and their aliases
      const allStepKeys = ['organization', 'stakeholder', 'business', 'payment', 'methods', 'document', 'id'];
      allStepKeys.forEach(stepKey => {
        const storageKey = `onboarding_step_${stepKey}_completed_at`;
        if (localStorage.getItem(storageKey)) {
          // Normalize the key to avoid duplicates
          const normalizedKey = normalizeStepKey(stepKey);
          stepsToCheckSet.add(normalizedKey);
        }
      });
    }

    // Convert Set to array and build activities (now deduplicated)
    const stepsToCheck = Array.from(stepsToCheckSet);
    const seenActivityTexts = new Set<string>();

    stepsToCheck.forEach((stepKey) => {
      const activityInfo = stepActivityMap[stepKey];
      if (activityInfo && !seenActivityTexts.has(activityInfo.text)) {
        seenActivityTexts.add(activityInfo.text);
        
        // When getting completion date, check both primary key and aliases
        const primaryKey = stepKey;
        const aliases = Object.keys(stepKeyNormalization).filter(k => stepKeyNormalization[k] === primaryKey);
        const allKeysToCheck = [primaryKey, ...aliases];
        
        // Find the earliest completion date among primary key and aliases
        let earliestDate: Date | null = null;
        allKeysToCheck.forEach(key => {
          const storageKey = `onboarding_step_${key}_completed_at`;
          const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
          
          if (stored) {
            try {
              const date = new Date(stored);
              if (!isNaN(date.getTime())) {
                if (!earliestDate || date.getTime() < earliestDate.getTime()) {
                  earliestDate = date;
                }
              }
            } catch (e) {
              // Invalid date, skip
            }
          }
        });
        
        // If no date found in localStorage, calculate based on order
        const completionDate = earliestDate || getCompletionDate(primaryKey, activityInfo.order);
        
        activities.push({
          id: `activity_${stepKey}`,
          text: activityInfo.text,
          timeAgo: getTimeAgo(completionDate),
          date: completionDate,
        });
      }
    });

    // Don't generate mock activities - only show real data from localStorage or props

    // Sort by date (most recent first)
    activities.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Return only timeAgo and text (remove date from final result)
    return activities.map(({ id, text, timeAgo }) => ({ id, text, timeAgo }));
  };

  // Use provided recentActivity if available, otherwise generate dynamically
  const activityList = recentActivity.length > 0 
    ? recentActivity.map(activity => ({
        ...activity,
        timeAgo: activity.timeAgo || 'recently'
      }))
    : generateActivityList();

  return (
    <div className="space-y-6">
      {/* Hero Section - Green Gradient matching app theme */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left - Organization Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm flex rounded-full items-center justify-center text-2xl font-bold text-white">
              {(orgName || 'O').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{orgName}</h1>
              <p className="text-green-100 flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" /> Business Account • Onboarding Complete
              </p>
            </div>
          </div>

          {/* Right - Progress */}
          <div className="text-right">
            <div className="text-sm text-green-100 mb-1">Overall Progress</div>
            <div className="text-4xl font-bold text-white mb-2">{Math.min(100, Math.max(0, progressPercentage))}%</div>
            <div className="w-48 lg:w-64 bg-white/20 h-2 overflow-hidden ml-auto">
              <div 
                className="h-full bg-white transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 p-5 hover:border-green-200 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Available Balance</span>
            <CurrencyDollar className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{new Intl.NumberFormat().format(stats.balance || 0)} XAF</div>
          <p className="text-xs text-gray-500 mt-1">Ready for withdrawal</p>
        </div>

        <div className="bg-white border border-gray-200 p-5 hover:border-green-200 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payments Today</span>
            <TrendUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.paymentsToday ?? 0}</div>
          <p className="text-xs text-gray-500 mt-1">Transactions processed</p>
        </div>

        <div className="bg-white border border-gray-200 p-5 hover:border-green-200 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Transactions</span>
            <Link className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.transactions ?? 0}</div>
          <p className="text-xs text-gray-500 mt-1">All-time records</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 p-9">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lightning className="w-5 h-5 text-amber-500" /> Quick Actions
              </h2>
              <span className="text-xs text-gray-400">Next steps</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <a
                    key={action.title}
                    href={action.href}
                    className="group flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 hover:border-green-300 hover:shadow-sm transition-all"
                  >
                    <Icon className="w-6 h-6 text-green-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{action.title}</div>
                      <div className="text-xs text-gray-500">{action.desc}</div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Powerful Features */}
          <div className="bg-white border border-gray-200 p-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Powerful Features</h2>
            
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Code className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">API Integration</h4>
                  <p className="text-xs text-gray-500">Seamless integration with REST APIs</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Lightning className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Instant Payments</h4>
                  <p className="text-xs text-gray-500">Multi-channel payment acceptance</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Enterprise Security</h4>
                  <p className="text-xs text-gray-500">Bank-level PCI compliance</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <ChartBar className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Real-time Analytics</h4>
                  <p className="text-xs text-gray-500">Detailed transaction insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Onboarding Checklist */}
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" /> Onboarding Complete
            </h2>
            
            <div className="space-y-2">
              {steps.map((step) => {
                const Icon = step.icon;
                const done = safeCompletedSteps.includes(step.title) || safeCompletedSteps.includes(step.key);
                return (
                  <div 
                    key={step.key}
                    className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 hover:bg-green-50/50 transition-colors"
                  >
                    <div className={`w-8 h-8 flex items-center rounded-full justify-center flex-shrink-0 ${done ? 'bg-green-100' : 'bg-white border border-gray-200'}`}>
                      <Icon className={`w-4 h-4 ${done ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{step.title}</div>
                      <div className="text-xs text-gray-500">
                        {done ? <span className="text-green-600 font-medium">Completed</span> : 'Pending'}
                      </div>
                    </div>
                    {done && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pro Tips */}
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" /> Pro Tips
          </h2>
          
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 border border-gray-100">
              <div className="text-xs font-semibold text-gray-700 mb-1">Tip #1: Optimize Your Profile</div>
              <p className="text-xs text-gray-600">Complete all profile sections for faster transaction approvals and higher limits.</p>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-100">
              <div className="text-xs font-semibold text-green-700 mb-1">Tip #2: Link Bank Account</div>
              <p className="text-xs text-green-600">Connect your bank for automatic daily settlements and instant payouts.</p>
            </div>
            
            <div className="p-3 bg-violet-50 border border-violet-100">
              <div className="text-xs font-semibold text-violet-700 mb-1">Tip #3: Use Payment Links</div>
              <p className="text-xs text-violet-600">Create and share payment links via email or SMS for instant invoice collection.</p>
            </div>
            
            <div className="p-3 bg-amber-50 border border-amber-100">
              <div className="text-xs font-semibold text-amber-700 mb-1">Tip #4: Integrate Our API</div>
              <p className="text-xs text-amber-600">Implement our REST API for seamless payments in your application.</p>
            </div>
          </div>
        </div>

        {/* Support & Team */}
        <div className="space-y-6">
          {/* Support */}
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Headphones className="w-5 h-5 text-green-600" /> Support & Resources
            </h2>
            
            <div className="space-y-2">
              <a href="/help-center" className="flex items-center justify-between p-2 hover:bg-green-50 transition-colors border-b border-gray-100">
                <span className="text-sm text-gray-700">Documentation</span>
                <span className="text-xs text-green-600 font-medium">View →</span>
              </a>
              <a href="/support" className="flex items-center justify-between p-2 hover:bg-green-50 transition-colors border-b border-gray-100">
                <span className="text-sm text-gray-700">Video Tutorials</span>
                <span className="text-xs text-green-600 font-medium">Watch →</span>
              </a>
              <a href="/help-center/api" className="flex items-center justify-between p-2 hover:bg-green-50 transition-colors border-b border-gray-100">
                <span className="text-sm text-gray-700">API Reference</span>
                <span className="text-xs text-green-600 font-medium">Explore →</span>
              </a>
              <a href="/support" className="flex items-center justify-between p-2 hover:bg-green-50 transition-colors">
                <span className="text-sm text-gray-700">Contact Support</span>
                <span className="text-xs text-green-600 font-medium">View →</span>
              </a>
            </div>
          </div>

          {/* Team Management */}
          <div className="bg-white border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" /> Team Management
            </h2>
            <p className="text-xs text-gray-500 mb-4">Invite team members and assign roles for collaborative account management.</p>
            <a 
              href="/team-member"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add team member
            </a>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" /> Recent Activity
        </h2>
        
        {activityList.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {activityList.map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-100 rounded-full to-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Pulse className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.timeAgo}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Pulse className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No recent activity to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
