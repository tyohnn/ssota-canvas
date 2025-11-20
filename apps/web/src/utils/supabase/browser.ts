import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';
import { Database as DevDatabase } from '@/types/database-dev.types';
import { config } from '@/config';

const isDevelopment = config.environment === 'development';
type DatabaseType = typeof isDevelopment extends true ? DevDatabase : Database;

export const createClient = () =>
  createBrowserClient<DatabaseType>(
    config.supabase.url,
    config.supabase.anonKey
  );
