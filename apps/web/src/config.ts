// Configuration for environment variables
// Centralized config with type safety and default values
//
// Note: With Supabase Branching, each environment (local/preview/production)
// automatically gets the correct credentials. No need for manual branching logic.

export const config = {
  database: {
    url: process.env.DATABASE_URL || '',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  clerk: {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    secretKey: process.env.CLERK_SECRET_KEY || '',
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET || '',
  },
  ai: {
    openai: process.env.OPENAI_API_KEY || '',
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
    gateway: process.env.AI_GATEWAY_API_KEY || '',
    helicone: process.env.HELICONE_API_KEY || '',
  },
  providers: {
    unsplash: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '',
    youtube: process.env.YOUTUBE_API_KEY || '',
  },
  analytics: {
    mixpanel: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '',
    sentry: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  environment: process.env.NODE_ENV || 'development',
} as const;
