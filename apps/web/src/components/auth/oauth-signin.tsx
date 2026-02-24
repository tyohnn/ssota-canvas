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
  redirectUrl,
}: {
  lastSignedInMethod?: string;
  isRegister?: boolean;
  redirectUrl?: string;
}) {
  const oAuthProviders: OAuthProvider[] = [
    {
      name: 'google',
      displayName: 'Google',
      icon: <GoogleIcon />,
    },
  ];

  return (
    <>
      {oAuthProviders.map(provider => (
        <div key={provider.name} className="flex flex-col items-center gap-1.5">
          <Button
            className="w-full flex items-center justify-center gap-2"
            variant="outline"
            onClick={async () => {
              await oAuthSignIn(provider.name, redirectUrl);
            }}
          >
            {provider.icon}
            {provider.displayName} account for {isRegister ? 'register' : 'login'}
          </Button>
          {lastSignedInMethod === 'google' && (
            <span className="text-xs text-muted-foreground">
              Last login method
            </span>
          )}
        </div>
      ))}
    </>
  );
}
