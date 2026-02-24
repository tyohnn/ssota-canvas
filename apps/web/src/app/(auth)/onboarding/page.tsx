import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/domains/common/auth/server-auth.helpers';
import { loginUrl, onBoardingUrl } from '@/domains/auth/constant';

import { OnboardingWizard } from './_components/onboarding-wizard';

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`${loginUrl}?redirect=${encodeURIComponent(onBoardingUrl)}`);
  }

  return (
    <div className="min-h-svh w-full">
      <OnboardingWizard />
    </div>
  );
}
