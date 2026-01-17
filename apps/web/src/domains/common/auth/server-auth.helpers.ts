/**
 * Server Authentication Helpers
 *
 * Common authentication helpers for Server Components
 */
import { redirect } from 'next/navigation';

import type { User } from '@supabase/supabase-js';

import { createClient } from '@/utils/supabase/server';

/**
 * Get Authenticated User or Redirect
 *
 * Helper for Server Components that need authentication
 * Automatically redirects to login if not authenticated
 *
 * @param redirectMessage - Message to show on login page
 * @returns User object
 */
export async function getAuthenticatedUserOrRedirect(
  redirectMessage?: string
): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const message = redirectMessage || 'Please login to continue';
    redirect(`/login?message=${encodeURIComponent(message)}`);
  }

  return user;
}
