// Configuration for environment variables
// Centralized config with type safety and default values
//
// Environment Variables Priority (Vercel-Supabase Integration):
// 1. Integration auto-generated: SUPABASE_URL, POSTGRES_URL
// 2. Client-side public: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
// 3. Local development: 127.0.0.1 addresses
//
// ⚠️ IMPORTANT: Next.js는 process.env.VARIABLE를 정적으로 분석합니다.
// process.env[key] 같은 동적 접근은 브라우저에서 작동하지 않습니다!

export const config = {
  database: {
    // Vercel-Supabase Integration provides POSTGRES_URL (Pooled, 포트 6543)
    // Connection Pooler를 사용하여 Serverless 환경에 최적화
    url: process.env.POSTGRES_URL || '',
    // Direct Connection (포트 5432) - 마이그레이션/스키마 생성 전용
    nonPoolingUrl: process.env.POSTGRES_URL_NON_POOLING || '',
  },
  supabase: {
    // Vercel-Supabase Integration provides SUPABASE_URL (server-side)
    // NEXT_PUBLIC_SUPABASE_URL needed for client-side
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    // SUPABASE_ANON_KEY must be added manually in Vercel Dashboard
    anonKey:
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  ai: {
    openai: process.env.OPENAI_API_KEY || '',
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    google: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
    gateway: process.env.AI_GATEWAY_API_KEY || '',
    helicone: process.env.HELICONE_API_KEY || '',
    xai: process.env.XAI_API_KEY || '',
  },
  providers: {
    unsplash: process.env.UNSPLASH_ACCESS_KEY || '',
    youtube: process.env.YOUTUBE_API_KEY || '',
    zenrows: process.env.ZENROWS_API_KEY || '',
    firecrawl: process.env.FIRECRAWL_API_KEY || '',
  },
  analytics: {
    mixpanel: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '',
    sentry: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    internalApiSecret: process.env.INTERNAL_API_SECRET || '',
  },
  environment: process.env.NODE_ENV || 'development',
} as const;
