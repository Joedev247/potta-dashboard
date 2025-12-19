'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Circle } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { onboardingService } from '@/lib/api';
import OrganizationSetup from './components/OrganizationSetup';
import StakeholderInformation from './components/StakeholderInformation';
import BusinessActivity from './components/BusinessActivity';
import PaymentMethods from './components/PaymentMethods';
import IDDocument from './components/IDDocument';

const steps = [
  { id: 'organization', title: 'Organization', component: OrganizationSetup, optional: false },
  { id: 'stakeholder', title: 'Stakeholder info', component: StakeholderInformation },
  { id: 'business', title: 'Business activity', component: BusinessActivity },
  { id: 'payment', title: 'Payment methods', component: PaymentMethods },
  { id: 'document', title: 'ID document', component: IDDocument },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { organization } = useOrganization();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [onboardingProgress, setOnboardingProgress] = useState<any>(null);

  // Load onboarding progress on mount
  useEffect(() => {
    // Wait for AuthContext to finish loading before checking authentication
    if (authLoading) {
      return;
    }

    const loadProgress = async () => {
      // If not authenticated, ProtectedRoute will handle redirect
      // Don't redirect here to avoid conflicts
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      // Trust AuthContext's isAuthenticated state - don't check token length here
      // ProtectedRoute already handles authentication checks
      try {
        // Get organization ID from context or localStorage
        // According to backend API: Onboarding REQUIRES an organization
        const orgId = organization?.id || localStorage.getItem('currentOrganizationId');
        
        if (!orgId) {
          // No organization exists - must start at organization creation step
          setCurrentStep(0);
          setLoading(false);
          return;
        }
        
        // Organization exists - get organization-specific progress
        const response = await onboardingService.getOrganizationProgress(orgId);
        
        if (response.success && response.data) {
          setOnboardingProgress(response.data);
          
          // Determine current step based on progress
          const progress = response.data;
          if (progress.steps) {
            const completedStepNames = progress.steps
              .filter((s: any) => s.completed)
              .map((s: any) => s.step_name);
            
            // Organization step (0) is always completed if we have orgId
            // Determine which onboarding step to show
            let startStep = 0; // Default to organization step (shouldn't happen if orgId exists, but safe fallback)
            
            if (!completedStepNames.includes('STAKEHOLDER')) {
              startStep = 1; // Start at stakeholder
            } else if (completedStepNames.includes('STAKEHOLDER') && !completedStepNames.includes('BUSINESS')) {
              startStep = 2; // Business activity
            } else if (completedStepNames.includes('BUSINESS') && !completedStepNames.includes('PAYMENT_METHODS')) {
              startStep = 3; // Payment methods
            } else if (completedStepNames.includes('PAYMENT_METHODS') && !completedStepNames.includes('DOCUMENTS')) {
              startStep = 4; // Documents
            } else if (progress.isComplete) {
              // Onboarding complete, redirect to home
              router.push('/');
              return;
            }
            
            setCurrentStep(startStep);
            
            // Mark completed steps (organization step 0 is always completed if orgId exists)
            const completedIndices: number[] = [0]; // Organization step is completed
            if (completedStepNames.includes('STAKEHOLDER')) completedIndices.push(1);
            if (completedStepNames.includes('BUSINESS')) completedIndices.push(2);
            if (completedStepNames.includes('PAYMENT_METHODS')) completedIndices.push(3);
            if (completedStepNames.includes('DOCUMENTS')) completedIndices.push(4);
            setCompletedSteps(completedIndices);

            // Store timestamps for completed steps if they don't already exist
            // This preserves actual completion times while setting defaults for steps loaded from API
            const stepKeyMap: Record<number, string> = {
              0: 'organization',
              1: 'stakeholder',
              2: 'business',
              3: 'payment',
              4: 'document',
            };
            
            completedIndices.forEach((stepIndex) => {
              const stepKey = stepKeyMap[stepIndex];
              if (stepKey) {
                const storageKey = `onboarding_step_${stepKey}_completed_at`;
                // Only set if it doesn't exist (preserve actual completion times)
                if (!localStorage.getItem(storageKey)) {
                  // Estimate completion time based on step order (most recent = now, older = further back)
                  const daysAgo = completedIndices.length - completedIndices.indexOf(stepIndex) - 1;
                  const estimatedDate = new Date();
                  estimatedDate.setDate(estimatedDate.getDate() - daysAgo);
                  localStorage.setItem(storageKey, estimatedDate.toISOString());
                }
              }
            });
          }
        }
      } catch (error) {
        console.error('Error loading onboarding progress:', error);
        // If error loading progress, start at organization step if no org exists
        const orgId = organization?.id || localStorage.getItem('currentOrganizationId');
        if (!orgId) {
          setCurrentStep(0);
        }
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [user, isAuthenticated, authLoading, organization, router]);

  const CurrentStepComponent = steps[currentStep].component;
  const isOptionalStep = steps[currentStep].optional;

  const handleNext = () => {
    // If moving from organization step (0) to stakeholder step (1), verify organization exists
    if (currentStep === 0) {
      const orgId = organization?.id || localStorage.getItem('currentOrganizationId');
      if (!orgId) {
        console.error('Cannot proceed: Organization is required for onboarding');
        return;
      }
    }

    // Store completion timestamp for the current step
    const stepKey = steps[currentStep].id;
    const storageKey = `onboarding_step_${stepKey}_completed_at`;
    const now = new Date().toISOString();
    localStorage.setItem(storageKey, now);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
    } else {
      // Onboarding complete — redirect to home
      localStorage.setItem('onboardingComplete', 'true');
      router.push('/');
    }
  };

  const handleSkip = () => {
    // Organization step is now mandatory - cannot skip
    // This function is kept for compatibility but should not be called
    console.warn('Organization step cannot be skipped - it is required for onboarding');
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading onboarding progress...</p>
        </div>
      </div>
    );
  }

  const handleStepClick = (index: number) => {
    // Prevent accessing onboarding steps (1-4) without an organization
    if (index > 0) {
      const orgId = organization?.id || localStorage.getItem('currentOrganizationId');
      if (!orgId) {
        console.warn('Organization is required before accessing onboarding steps');
        // Force user back to organization step
        setCurrentStep(0);
        return;
      }
    }

    // Allow navigation to completed steps or next step
    if (completedSteps.includes(index) || index === currentStep + 1) {
      setCurrentStep(index);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Progress Bar */}
      <div className="bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button
              onClick={handlePrevious}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{currentStep === 0 ? 'Back to Get Started' : 'Previous'}</span>
              <span className="sm:hidden">{currentStep === 0 ? 'Back' : 'Prev'}</span>
            </button>
            <div className="text-xs sm:text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          
          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(index);
              const isCurrent = index === currentStep;
              const isAccessible = isCompleted || isCurrent || index === currentStep + 1;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => handleStepClick(index)}
                    disabled={!isAccessible}
                    className={`flex flex-col items-center gap-1 sm:gap-2 ${
                      isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isCurrent
                        ? 'bg-green-100 border-green-500 text-green-600'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
                      ) : (
                        <span className="font-semibold text-xs sm:text-sm">{index + 1}</span>
                      )}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-medium text-center max-w-[60px] sm:max-w-[100px] ${
                      isCurrent ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      {step.title}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 sm:mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {currentStep === 0 ? (
          // Organization step - no previous button, but no skip either (mandatory)
          <CurrentStepComponent onNext={handleNext} onSkip={handleSkip} onPrevious={handlePrevious} />
        ) : (
          <CurrentStepComponent onNext={handleNext} onPrevious={handlePrevious} onSkip={handleSkip} />
        )}
      </div>
    </div>
  );
}

