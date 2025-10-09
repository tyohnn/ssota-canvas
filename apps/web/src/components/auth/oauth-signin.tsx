'use client';

import { Button } from '@/components/ui/button';
import { Provider } from '@supabase/supabase-js';
import { GoogleIcon } from '@/components/icon';
import { oAuthSignIn } from '@/domains/auth/actions';
import { useSearchParams } from 'next/navigation';

import type { JSX } from 'react';

type OAuthProvider = {
  name: Provider;
  displayName: string;
  icon?: JSX.Element;
};

/**
 * Render OAuth provider buttons that initiate sign-in and optionally display a "최근 로그인" badge.
 *
 * @param lastSignedInMethod - Provider id of the most recently used sign-in method; when it matches a provider (e.g., `'google'`), a "최근 로그인" badge is shown next to that provider's button.
 * @param isRegister - When true, buttons are labeled for sign-up ("회원가입"); otherwise they are labeled for sign-in ("로그인").
 * @returns A JSX element containing a button for each configured OAuth provider. Each button includes the provider icon and display name, and clicking a button starts the provider sign-in flow using an enrollment code read from the URL query string.
 */
export function OAuthButtons({
  lastSignedInMethod,
  isRegister,
}: {
  lastSignedInMethod?: string;
  isRegister?: boolean;
}) {
  const oAuthProviders: OAuthProvider[] = [
    {
      name: 'google',
      displayName: '구글',
      icon: <GoogleIcon />,
    },
  ];
  const searchParams = useSearchParams();
  const enrollmentCode = searchParams.get('enrollment_code');

  return (
    <>
      {oAuthProviders.map(provider => (
        <Button
          key={provider.name}
          className="relative w-full flex items-center justify-center gap-2"
          variant="outline"
          onClick={async () => {
            await oAuthSignIn(provider.name, enrollmentCode);
          }}
        >
          {provider.icon}
          {provider.displayName} 계정으로 {isRegister ? '회원가입' : '로그인'}
          {lastSignedInMethod === 'google' && (
            <div className="absolute top-1/2 -translate-y-1/2 left-full whitespace-nowrap ml-8 bg-accent px-4 py-1 rounded-md text-xs text-foreground/80">
              <div className="absolute -left-5 top-0 border-background border-[12px] border-r-accent" />
              최근 로그인
            </div>
          )}
        </Button>
      ))}
    </>
  );
}