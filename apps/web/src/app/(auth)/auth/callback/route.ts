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
import { config } from '@/config';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // if "next" is in param, use it as the redirect URL
  // 새로운 사용자는 온보딩 페이지로, 기존 사용자는 원래 목적지로
  const next = searchParams.get('next') ?? '/onboarding';

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

    // 🎯 User Management Domain: 온보딩 페이지에서 프로필 생성 처리
    // 클라이언트 사이드에서 쿠키가 완전히 설정된 후 실행하도록 온보딩 페이지로 리다이렉트

    // 리다이렉트
    const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
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

  // return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}${loginUrl}?message=${encodeURIComponent(loginErrorMessage)}`
  );
}
