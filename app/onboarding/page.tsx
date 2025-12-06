'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import StakeholderInformation from './components/StakeholderInformation';
import BusinessActivity from './components/BusinessActivity';
import PaymentMethods from './components/PaymentMethods';
import IDDocument from './components/IDDocument';

const steps = [
  { id: 'stakeholder', title: 'Stakeholder info', component: StakeholderInformation },
  { id: 'business', title: 'Business activity', component: BusinessActivity },
  { id: 'payment', title: 'Payment methods', component: PaymentMethods },
  { id: 'document', title: 'ID document', component: IDDocument },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const CurrentStepComponent = steps[currentStep].component;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
    } else {
      // Onboarding complete
      router.push('/');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push('/');
    }
  };

  const handleStepClick = (index: number) => {
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
        <CurrentStepComponent onNext={handleNext} onPrevious={handlePrevious} />
      </div>
    </div>
  );
}

