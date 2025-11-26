import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';
import { Database as DevDatabase } from '@/types/database-dev.types';
import { config } from '@/config';

const isDevelopment = config.environment === 'development';
type DatabaseType = typeof isDevelopment extends true ? DevDatabase : Database;

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<DatabaseType>(
    config.supabase.url,
    config.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }: {
                name: string;
                value: string;
                options?: any;
              }) => {
                cookieStore.set(name, value, options);
              }
            );
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.

            // refresh_token_not_found 에러는 정상적인 세션 만료이므로
            // 로그를 남기지 않음 (노이즈 방지)
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            if (!errorMessage.includes('refresh_token_not_found')) {
              console.error('[Supabase Server Client] Cookie error:', error);
            }
          }
        },
      },
    }
  );
};
