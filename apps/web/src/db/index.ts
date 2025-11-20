// dotenv/config removed - Next.js handles environment variables automatically
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { createClient } from '@/utils/supabase/server';
import { config } from '@/config';
import * as schema from './schema';
import * as imageAppSpaceSchema from './schemas/image-app-space-schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

const isDevelopment = process.env.NODE_ENV === 'development';

if (!config.database.url) {
  throw new Error('DATABASE_URL is not set in environment variables.');
}

// 🔧 Connection Pool 설정
// Development: 작은 풀 크기 (HMR로 인한 누적 방지)
// Production: 적절한 풀 크기
const connectionConfig = {
  prepare: false,
  max: isDevelopment ? 3 : 10, // Dev: 3, Prod: 10
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: {
    rejectUnauthorized: false,
  },
};

// 🔑 Singleton 패턴: Next.js HMR에서도 클라이언트 재사용
// globalThis 사용으로 모듈 reload 시에도 동일 인스턴스 유지
const globalForDb = globalThis as unknown as {
  adminClient: postgres.Sql | undefined;
  rlsClient: postgres.Sql | undefined;
};

// Create admin client for direct database access (Singleton)
const adminClient =
  globalForDb.adminClient ?? postgres(config.database.url, connectionConfig);
if (isDevelopment) globalForDb.adminClient = adminClient;

// Create RLS client for user-scoped operations (Singleton)
const rlsClient =
  globalForDb.rlsClient ?? postgres(config.database.url, connectionConfig);
if (isDevelopment) globalForDb.rlsClient = rlsClient;

// Create drizzle instances with environment-based schema
// Include image_app_space schema for both dev and prod
export const adminDb = drizzle(adminClient, {
  schema: { ...schema, ...imageAppSpaceSchema },
});

export const rlsDb = drizzle(rlsClient, {
  schema: { ...schema, ...imageAppSpaceSchema },
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
