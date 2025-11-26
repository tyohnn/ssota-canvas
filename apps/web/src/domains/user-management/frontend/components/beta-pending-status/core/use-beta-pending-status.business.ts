/**
 * Beta Pending Status - Business Logic Hook
 *
 * Engineer Domain: Business logic only
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/browser';

export interface BetaPendingStatusBusinessLogic {
  onSignOut: () => Promise<void>;
}

/**
 * Production Business Logic
 *
 * Actual sign-out implementation
 */
export function useBetaPendingStatusBusiness(): BetaPendingStatusBusinessLogic {
  const router = useRouter();

  const onSignOut = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('[BetaPendingStatus] Sign out error:', error);
      throw error;
    }
  }, [router]);

  return { onSignOut };
}

/**
 * Mock Business Logic (for no-code tools)
 */
export function useMockBetaPendingStatusBusiness(): BetaPendingStatusBusinessLogic {
  const onSignOut = useCallback(async () => {
    console.log('[Mock] Signing out...');
    await new Promise(resolve => setTimeout(resolve, 300));
  }, []);

  return { onSignOut };
}
