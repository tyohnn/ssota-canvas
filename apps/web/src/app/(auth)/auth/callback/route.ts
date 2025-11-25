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
} from '@/domains/auth/constant';
// user-management service
import { UserManagementService } from '@/domains/user-management/backend/services/user-management.service';
import { DrizzleUserRepository } from '@/domains/user-management/backend/repositories/implementations/drizzle-user.repository';
import { SupabaseAuthService } from '@/domains/user-management/backend/anti-corruption-layers/supabase-auth-acl';
import { config } from '@/config';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

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

    // Check if user already has profile and organization (via domain service)
    const user = sessionData.user;
    if (user) {
      // Initialize service
      const userRepository = new DrizzleUserRepository();
      const supabaseAuthService = new SupabaseAuthService(supabase);
      const userManagementService = new UserManagementService(
        userRepository,
        supabaseAuthService
      );

      // Check setup status
      const setupStatusResult =
        await userManagementService.checkUserSetupStatus(user.id);

      if (setupStatusResult.isSuccess()) {
        const setupStatus = setupStatusResult.value;

        if (setupStatus.isSetupComplete) {
          // Existing user with complete setup - redirect to home or their last page
          const forwardedHost = request.headers.get('x-forwarded-host');
          const isLocalEnv = config.environment === 'development';

          const targetPath = setupStatus.redirectUrl || appDefaultUrl;

          let redirectUrl: string;
          if (isLocalEnv) {
            redirectUrl = `${origin}${targetPath}`;
          } else if (forwardedHost) {
            redirectUrl = `https://${forwardedHost}${targetPath}`;
          } else {
            redirectUrl = `${origin}${targetPath}`;
          }

          return NextResponse.redirect(redirectUrl);
        }
      }
    }

    // New user or user without complete setup - go to onboarding
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = config.environment === 'development';

    let redirectUrl: string;
    if (isLocalEnv) {
      redirectUrl = `${origin}${onBoardingUrl}`;
    } else if (forwardedHost) {
      redirectUrl = `https://${forwardedHost}${onBoardingUrl}`;
    } else {
      redirectUrl = `${origin}${onBoardingUrl}`;
    }

    return NextResponse.redirect(redirectUrl);
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}${loginUrl}?message=${encodeURIComponent(loginErrorMessage)}`
  );
}
