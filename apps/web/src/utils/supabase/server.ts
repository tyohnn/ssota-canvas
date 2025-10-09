import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';
import { Database as DevDatabase } from '@/types/database-dev.types';
import { config } from '@/config';

const isDevelopment = process.env.NODE_ENV === 'development';
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
          }
        },
      },
    }
  );
};
