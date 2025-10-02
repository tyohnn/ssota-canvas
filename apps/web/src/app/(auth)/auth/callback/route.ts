// OAuth login callback route for Supabase
// next
import { NextResponse } from 'next/server';
// utils
import { createClient } from '@/utils/supabase/server';
// constants
import {
  appDefaultUrl,
  loginErrorMessage,
  loginUrl,
  onBoardingUrl,
} from '../../constant';
// user-management actions
import { processUserRegistrationAction } from '@/domains/user-management/actions/user-management.actions';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? appDefaultUrl;

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error('Session exchange error:', sessionError);
      return NextResponse.redirect(
        `${origin}${loginUrl}?message=${encodeURIComponent(loginErrorMessage)}`
      );
    }

    // 🎯 User Management Domain: 로그인 성공 후 프로필 및 기본 조직 생성
    try {
      const result = await processUserRegistrationAction();
      console.log('User registration completed:', result);
    } catch (error) {
      // 프로필이 이미 있는 경우 무시 (재로그인 시)
      console.log('User registration skipped (already exists):', error);
    }

    // 리다이렉트
    const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
    const isLocalEnv = process.env.NODE_ENV === 'development';

    if (isLocalEnv) {
      // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
      return NextResponse.redirect(`${origin}${next}`);
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`);
    } else {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}${loginUrl}?message=${encodeURIComponent(loginErrorMessage)}`
  );
}
