'use client';

import { useEffect } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/browser';
import { initMixpanel, identifyUser, resetUser } from './mixpanelClient';

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Mixpanel on mount
    initMixpanel();

    // Get Supabase user and identify in Mixpanel
    const supabase = createClient();

    const identifyUserInMixpanel = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        identifyUser(user.id, {
          $email: user.email,
          $name: user.user_metadata?.full_name || user.user_metadata?.name,
          $avatar:
            user.user_metadata?.avatar_url || user.user_metadata?.picture,
          created_at: user.created_at,
        });
      }
    };

    identifyUserInMixpanel();

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          identifyUser(session.user.id, {
            $email: session.user.email,
            $name:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name,
            $avatar:
              session.user.user_metadata?.avatar_url ||
              session.user.user_metadata?.picture,
            created_at: session.user.created_at,
          });
        } else if (event === 'SIGNED_OUT') {
          resetUser();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
