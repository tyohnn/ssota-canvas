'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { processUserRegistrationAction } from '@/domains/user-management/actions/user-management.actions';

// import { checkBetaRedirectAction } from '@/domains/user-management/actions/beta.actions';

type OnboardingStatus = 'loading' | 'success' | 'error';

export default function OnboardingPage() {
  const [status, setStatus] = useState<OnboardingStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const router = useRouter();

  useEffect(() => {
    async function setupUserProfile() {
      setStatus('loading');

      /* Original implementation (commented out):
      // Beta access check first
      const betaRedirect = await checkBetaRedirectAction();
      if (betaRedirect) {
        // User needs to complete beta application first
        router.push(betaRedirect);
        return;
      }
      */

      // Create user profile + default organization + workspace + Welcome page
      const result = await processUserRegistrationAction();

      if (result.success) {
        setStatus('success');

        // Existing users with complete setup redirect immediately (no countdown)
        // New users see countdown before redirect
        const isExistingUser = result.data.user && result.data.organization;

        if (isExistingUser) {
          // Existing user: redirect immediately
          router.push(result.data.redirectUrl);
        } else {
          // New user: start countdown (3 seconds)
          let count = 3;
          const countdownInterval = setInterval(() => {
            count -= 1;
            setCountdown(count);

            if (count <= 0) {
              clearInterval(countdownInterval);
              router.push(result.data.redirectUrl);
            }
          }, 1000);
        }
      } else {
        console.error('User profile setup failed:', result.error);
        setStatus('error');
        setError(
          typeof result.error === 'string'
            ? result.error
            : 'Unknown error occurred'
        );
      }
    }

    setupUserProfile();
  }, [router]);

  const handleRetry = () => {
    setStatus('loading');
    setError(null);
    // Force re-render to trigger useEffect again
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Setting up your account
              </h2>
              <p className="text-gray-600">Please wait...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="rounded-full h-12 w-12 bg-green-100 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Setup complete!
              </h2>
              <p className="text-gray-600">
                Redirecting to homepage in {countdown} seconds...
              </p>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all duration-1000"
                  style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                />
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="rounded-full h-12 w-12 bg-red-100 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                An error occurred during setup
              </h2>
              <p className="text-gray-600 mb-4">
                {error || 'An unknown error occurred.'}
              </p>
              <button
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
