'use client';

import { Button } from '@/components/ui/button';
import { Provider } from '@supabase/supabase-js';
import { GoogleIcon } from '@/components/icon';
import { oAuthSignIn } from '@/domains/auth/actions';

import type { JSX } from 'react';

type OAuthProvider = {
  name: Provider;
  displayName: string;
  icon?: JSX.Element;
};

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

  return (
    <>
      {oAuthProviders.map(provider => (
        <Button
          key={provider.name}
          className="relative w-full flex items-center justify-center gap-2"
          variant="outline"
          onClick={async () => {
            await oAuthSignIn(provider.name);
          }}
        >
          {provider.icon}
          {provider.displayName} account for {isRegister ? 'register' : 'login'}
          {lastSignedInMethod === 'google' && (
            <div className="absolute top-1/2 -translate-y-1/2 left-full whitespace-nowrap ml-8 bg-accent px-4 py-1 rounded-md text-xs text-foreground/80">
              <div className="absolute -left-5 top-0 border-background border-[10px] border-r-accent" />
              Last login method
            </div>
          )}
        </Button>
      ))}
    </>
  );
}
