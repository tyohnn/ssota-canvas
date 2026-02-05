'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { processUserRegistrationAction } from '@/domains/user-management/actions/process-user-registration.action';
import { DashboardLoadingSkeleton } from '@/app/(dashboard)/components/skeletons';
import { LanguageStep } from './language-step';
import { NameStep } from './name-step';
import { OrgStep } from './org-step';

export type OnboardingData = {
  language: string;
  name: string;
  organizationName: string;
};

export type OnboardingStep = 'language' | 'name' | 'organization';

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('language');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    language: 'en',
    name: '',
    organizationName: '',
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleLanguageComplete = (language: string) => {
    updateData({ language });
    setCurrentStep('name');
  };

  const handleNameComplete = (name: string) => {
    updateData({ name });
    setCurrentStep('organization');
  };

  const handleOrgComplete = async (organizationName: string) => {
    updateData({ organizationName });
    setIsSubmitting(true);

    try {
      const result = await processUserRegistrationAction({
        language: data.language,
        name: data.name,
        organizationName,
      });

      if (result.success) {
        const redirectUrl = result.data.createdNewOrganization
          ? result.data.redirectUrl +
            (result.data.redirectUrl.includes('?') ? '&' : '?') +
            'tutorial=true'
          : result.data.redirectUrl;

        router.push(redirectUrl);
      } else {
        console.error('Onboarding failed:', result.error);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="min-h-svh w-full">
        <DashboardLoadingSkeleton loadingMessage="Setting up your workspace..." />
      </div>
    );
  }

  return (
    <div className="min-h-svh w-full flex">
      {currentStep === 'language' && (
        <LanguageStep
          initialLanguage={data.language}
          onComplete={handleLanguageComplete}
        />
      )}
      {currentStep === 'name' && (
        <NameStep
          language={data.language}
          onComplete={handleNameComplete}
          onBack={() => setCurrentStep('language')}
        />
      )}
      {currentStep === 'organization' && (
        <OrgStep
          language={data.language}
          name={data.name}
          onComplete={handleOrgComplete}
          onBack={() => setCurrentStep('name')}
        />
      )}
    </div>
  );
}
