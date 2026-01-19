// Signup, Email magic link confirmatiom route for Supabase
// next
import { redirect } from 'next/navigation';
import { NextResponse, type NextRequest } from 'next/server';

// supabase
import { type EmailOtpType } from '@supabase/supabase-js';

import { config } from '@/config';
// constants
import {
  appDefaultUrl,
  emailVerificationErrorMessage,
  loginUrl,
} from '@/domains/auth/constant';
// utils
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? appDefaultUrl;

  if (token_hash && type) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error && data?.user) {
      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer // 로드 밸런서 이전의 원래 원본
      const isLocalEnv = config.environment === 'development';
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // redirect the user to an error page with some instructions
  redirect(
    `${loginUrl}?message=${encodeURIComponent(emailVerificationErrorMessage)}`
  );
}
