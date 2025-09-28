// Configuration for environment variables
const isDevelopment = process.env.NODE_ENV === 'development';

export const config = {
  database: {
    url: isDevelopment
      ? process.env.DEV_DATABASE_URL || process.env.DATABASE_URL || ''
      : process.env.DATABASE_URL || '',
  },
  supabase: {
    url: isDevelopment
      ? process.env.NEXT_PUBLIC_SUPABASE_URL_DEV ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        ''
      : process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: isDevelopment
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        ''
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: isDevelopment
      ? process.env.SUPABASE_SERVICE_ROLE_KEY_DEV ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        ''
      : process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  clerk: {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    secretKey: process.env.CLERK_SECRET_KEY || '',
  },
  environment: process.env.NODE_ENV || 'development',
} as const;
