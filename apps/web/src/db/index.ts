// dotenv/config removed - Next.js handles environment variables automatically
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { createClient } from '@/utils/supabase/server';
import { config } from '@/config';
import * as schema from './schema';
import * as imageAppSpaceSchema from './schemas/image-app-space-schema';
import * as xAppSpaceSchema from './schemas/x-app-space-schema';
import * as youtubeAppSpaceSchema from './schemas/youtube-app-space-schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

const isDevelopment = config.environment === 'development';
const isProduction = config.environment === 'production';

// 🔧 Connection URL 전략
// - 모든 환경: POSTGRES_URL (Pooled, Connection Pooler 사용)
// - 이유: Dev/Prod 환경 일관성, Serverless 최적화, 타임아웃 방지
// - 예외: 마이그레이션/스키마 생성은 POSTGRES_URL_NON_POOLING 사용 (별도 스크립트)
const connectionUrl = config.database.url; // POSTGRES_URL (포트 6543)

if (!connectionUrl) {
  console.error('❌ Database configuration error:', {
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
    environment: config.environment,
    usingUrl: 'POSTGRES_URL (Pooled)',
  });
  throw new Error(
    'POSTGRES_URL is not set. Please check your environment variables.'
  );
}

// 데이터베이스 URL 유효성 검사 (디버깅용)
try {
  const url = new URL(connectionUrl);
  const isLocalDatabase =
    url.hostname === '127.0.0.1' ||
    url.hostname === 'localhost' ||
    url.hostname.includes('supabase_');

  if (!url.hostname || !url.port) {
    console.warn('⚠️ Database URL parsing issue:', {
      hostname: url.hostname,
      port: url.port,
      protocol: url.protocol,
      environment: config.environment,
    });
  }

  // Connection Pooler 사용 확인 (프로덕션 + 원격 DB만)
  if (isProduction && !isLocalDatabase && url.port !== '6543') {
    console.warn('⚠️ Production should use Connection Pooler (port 6543):', {
      currentPort: url.port,
      hostname: url.hostname,
      environment: config.environment,
    });
  } else if (isDevelopment && !isLocalDatabase && url.port !== '6543') {
    console.warn(
      '⚠️ Remote database should use Connection Pooler (port 6543):',
      {
        currentPort: url.port,
        hostname: url.hostname,
        environment: config.environment,
      }
    );
  } else if (isDevelopment) {
    console.log('✅ Database Connected:', {
      port: url.port,
      hostname: url.hostname,
      environment: config.environment,
      isLocal: isLocalDatabase,
    });
  }
} catch (error) {
  console.error('❌ Invalid database URL format:', error);
}

// 🔧 Connection Pool 설정
// Development: 작은 풀 크기 (HMR로 인한 누적 방지)
// Production: 적절한 풀 크기
// Local Supabase: SSL 불필요
const isLocalSupabase =
  config.supabase.url.includes('localhost') ||
  config.supabase.url.includes('127.0.0.1');

const connectionConfig = {
  prepare: false,
  max: isDevelopment ? 5 : 10, // Dev: 5, Prod: 10 (연결 풀 크기)
  idle_timeout: 30, // 30초 (연결 유지 시간)
  connect_timeout: 30, // 30초 (네트워크 지연 대응)
  max_lifetime: 60 * 30, // 30분 (연결 재사용 최대 시간)
  connection: {
    // 연결 시도 재시도 설정
    application_name: 'ssota_app',
  },
  // Local Supabase는 SSL 불필요, Production은 SSL 필수
  ssl: isLocalSupabase
    ? false
    : {
        rejectUnauthorized: false,
      },
  // 에러 핸들링 개선
  onnotice: () => {}, // Notice 무시
  debug: isDevelopment ? false : false, // 디버그 모드 (필요시 활성화)
};

// 🔑 Singleton 패턴: Next.js HMR에서도 클라이언트 재사용
// globalThis 사용으로 모듈 reload 시에도 동일 인스턴스 유지
const globalForDb = globalThis as unknown as {
  adminClient: postgres.Sql | undefined;
  rlsClient: postgres.Sql | undefined;
};

// Create admin client for direct database access (Singleton)
// ⚠️ 인증 정보는 connectionUrl에 포함: postgresql://user:password@host:port/db
const adminClient =
  globalForDb.adminClient ?? postgres(connectionUrl, connectionConfig);
if (isDevelopment) globalForDb.adminClient = adminClient;

// Create RLS client for user-scoped operations (Singleton)
const rlsClient =
  globalForDb.rlsClient ?? postgres(connectionUrl, connectionConfig);
if (isDevelopment) globalForDb.rlsClient = rlsClient;

// Create drizzle instances with environment-based schema
// Include image_app_space and youtube_app_space schemas for both dev and prod
// ⚠️ adminClient = postgres.js client (SQL only)
export const adminDb = drizzle(adminClient, {
  schema: {
    ...schema,
    ...imageAppSpaceSchema,
    ...xAppSpaceSchema,
    ...youtubeAppSpaceSchema,
  },
});

export const rlsDb = drizzle(rlsClient, {
  schema: {
    ...schema,
    ...imageAppSpaceSchema,
    ...xAppSpaceSchema,
    ...youtubeAppSpaceSchema,
  },
});

type SupabaseToken = {
  iss?: string;
  sub?: string;
  aud?: string[] | string;
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  role?: string;
};

export function createDrizzle(
  token: SupabaseToken,
  {
    admin,
    client,
  }: {
    admin: PostgresJsDatabase<any>;
    client: PostgresJsDatabase<any>;
  }
) {
  return {
    admin,
    rls: async (
      transaction: (tx: any) => Promise<any>,
      ...rest: any[]
    ): Promise<any> => {
      return await client.transaction(
        async tx => {
          // Supabase exposes auth.uid() and auth.jwt()
          // https://supabase.com/docs/guides/database/postgres/row-level-security#helper-functions
          try {
            await tx.execute(sql`
          -- auth.jwt()
          select set_config('request.jwt.claims', '${sql.raw(
            JSON.stringify(token)
          )}', TRUE);
          -- auth.uid()
          select set_config('request.jwt.claim.sub', '${sql.raw(
            token.sub ?? ''
          )}', TRUE);
          -- set local role
          set local role ${sql.raw(token.role ?? 'anon')};
          `);
            const result = await transaction(tx);
            return result;
          } catch (error) {
            throw error;
          } finally {
            try {
              await tx.execute(sql`
              -- reset
              select set_config('request.jwt.claims', NULL, TRUE);
              select set_config('request.jwt.claim.sub', NULL, TRUE);
              reset role;
              `);
            } catch (resetError) {
              // Don't throw in finally block if transaction already failed
            }
          }
        },
        ...rest
      );
    },
  };
}

function decode(token: string): SupabaseToken {
  if (!token) return {};
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return {};
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(payload, 'base64').toString();
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

export async function createDrizzleSupabaseClient() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? '';
  return createDrizzle(decode(token), {
    admin: adminDb,
    client: rlsDb,
  });
}

// Example usage:
// async function getRooms() {
//   const db = await createDrizzleSupabaseClient();
//   return db.rls((tx) => tx.select().from(rooms));
// }
