import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';
import { Database as DevDatabase } from '@/types/database-dev.types';
import { config } from '@/config';

const isDevelopment = config.environment === 'development';
type DatabaseType = typeof isDevelopment extends true ? DevDatabase : Database;

/**
 * User-scoped Supabase Client
 *
 * 사용자 세션 기반, RLS 적용
 */
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

/**
 * Admin Supabase Client (Singleton)
 *
 * Service Role Key 사용, RLS 우회 가능
 * Storage, Auth Admin 등 Supabase API 사용
 *
 * 용도:
 * - Storage: Signed URL 생성 (비즈니스 로직 기반 권한)
 * - Auth Admin: 사용자 관리
 *
 * ⚠️ 주의: 비즈니스 로직으로 권한 체크 필수!
 */
const globalForSupabase = globalThis as unknown as {
  supabaseAdmin:
    | ReturnType<typeof createSupabaseClient<DatabaseType>>
    | undefined;
};

const createSupabaseAdminClient = () => {
  const supabaseUrl = config.supabase.url;
  const serviceRoleKey = config.supabase.serviceRoleKey;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables for Admin Client (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)'
    );
  }

  return createSupabaseClient<DatabaseType>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const supabaseAdmin =
  globalForSupabase.supabaseAdmin ?? createSupabaseAdminClient();
if (isDevelopment) globalForSupabase.supabaseAdmin = supabaseAdmin;
