'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { processUserRegistrationAction } from '@/domains/user-management/actions/user-management.actions';

type OnboardingStatus = 'loading' | 'success' | 'error';

export default function OnboardingPage() {
  const [status, setStatus] = useState<OnboardingStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function setupUserProfile() {
      setStatus('loading');

      // 사용자 프로필 + 기본 조직 + 워크스페이스 + Welcome 페이지 생성
      const result = await processUserRegistrationAction();

      if (result.success) {
        setStatus('success');

        // 성공 시 잠시 후 Welcome 페이지로 리다이렉트 (사용자가 성공 메시지를 볼 수 있도록)
        setTimeout(() => {
          router.push(result.data.redirectUrl);
        }, 1500);
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
    // useEffect가 다시 실행되도록 강제로 리렌더링
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
                계정을 설정하고 있습니다
              </h2>
              <p className="text-gray-600">잠시만 기다려주세요...</p>
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
                설정이 완료되었습니다!
              </h2>
              <p className="text-gray-600">잠시 후 홈페이지로 이동합니다...</p>
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
                설정 중 오류가 발생했습니다
              </h2>
              <p className="text-gray-600 mb-4">
                {error || '알 수 없는 오류가 발생했습니다.'}
              </p>
              <button
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                다시 시도
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
