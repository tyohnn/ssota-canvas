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

/**
 * Handle the Supabase OAuth callback by exchanging the authorization code for a session and redirecting the user.
 *
 * On success, redirects the user to the destination specified by the `next` query parameter (or `/onboarding` by default).
 * On missing or failed code exchange, redirects the user to the login page with an error message.
 *
 * @param request - Incoming request containing the OAuth `code` query parameter and optional `next` query parameter. The `x-forwarded-host` header, if present, is used to reconstruct the redirect URL in production behind a load balancer.
 * @returns A NextResponse that redirects to the onboarding or original destination on successful session exchange, or redirects to the login page with an error message on failure.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // if "next" is in param, use it as the redirect URL
  // 새로운 사용자는 온보딩 페이지로, 기존 사용자는 원래 목적지로
  let next = searchParams.get('next') ?? '/onboarding';

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