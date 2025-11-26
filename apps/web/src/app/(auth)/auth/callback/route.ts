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

      // 🆕 Ensure profile exists (before beta check)
      // This ensures beta status can be checked
      // Note: createUserProfile handles upsert internally
      const createProfileResult = await userManagementService.createUserProfile(
        {
          userId: user.id,
          email: user.email!,
          name: user.user_metadata?.name || 'User',
          avatarUrl: user.user_metadata?.avatar_url || null,
        }
      );

      if (createProfileResult.isError()) {
        console.error(
          '[auth/callback] Failed to create profile:',
          createProfileResult.error
        );
        return NextResponse.redirect(
          `${origin}${loginUrl}?message=${encodeURIComponent('Failed to create profile')}`
        );
      }

      // Check setup status (now profile exists for sure)
      const setupStatusResult =
        await userManagementService.checkUserSetupStatus(user.id);

      if (setupStatusResult.isSuccess()) {
        const setupStatus = setupStatusResult.value;

        // 🆕 Beta status check - redirect to appropriate beta page
        if (!setupStatus.isBetaApproved) {
          if (!setupStatus.beta_application) {
            // No application yet → redirect to application page
            return NextResponse.redirect(`${origin}/beta/application`);
          } else if (setupStatus.beta_status === 'pending') {
            // Application submitted, waiting for review
            return NextResponse.redirect(`${origin}/beta/pending`);
          }
        }

        // Beta approved - proceed with normal flow
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
