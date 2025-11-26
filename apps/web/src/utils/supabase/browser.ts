import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';
import { Database as DevDatabase } from '@/types/database-dev.types';
import { config } from '@/config';

const isDevelopment = config.environment === 'development';
type DatabaseType = typeof isDevelopment extends true ? DevDatabase : Database;

let client: ReturnType<typeof createBrowserClient<DatabaseType>> | null = null;

export const createClient = () => {
  if (client) return client;

  client = createBrowserClient<DatabaseType>(
    config.supabase.url,
    config.supabase.anonKey,
    {
      auth: {
        // refresh_token_not_found 에러를 조용히 처리
        // 이는 정상적인 세션 만료 상황임
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    }
  );

  return client;
};
