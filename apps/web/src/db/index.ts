// dotenv/config removed - Next.js handles environment variables automatically
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { createClient } from '@/utils/supabase/server';
import { config } from '@/config';
import * as schema from './schema';
import * as devSchema from './schema-dev';
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
export const adminDb = drizzle(adminClient, {
  schema: isDevelopment ? devSchema : schema,
});

export const rlsDb = drizzle(rlsClient, {
  schema: isDevelopment ? devSchema : schema,
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

/**
 * Create a Drizzle wrapper that exposes a privileged admin handle and an RLS-aware transactional executor.
 *
 * @param token - Supabase-style JWT claims used to populate session-local auth state (`request.jwt.claims`, `request.jwt.claim.sub`) and to determine the local role for the RLS transaction.
 * @param admin - Privileged Postgres client instance for non-RLS/admin operations.
 * @param client - Postgres client instance used to run row-level-security (RLS) transactions.
 * @returns An object with:
 *   - `admin`: the provided admin database instance.
 *   - `rls`: a function that runs a supplied transaction callback inside a database transaction with session-local JWT claims, subject, and role set from `token`; it returns the callback's result and attempts to reset session state in a finally-safe manner (reset errors are swallowed).
 */
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

/**
 * Parse a JWT-like token string and extract its payload as a SupabaseToken.
 *
 * @param token - A JWT or JWT-like access token (three dot-separated parts).
 * @returns The token payload parsed as a `SupabaseToken`, or an empty object if the token is missing, malformed, or cannot be decoded.
 */
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

/**
 * Create a Drizzle-enabled database client configured with the current Supabase session token.
 *
 * @returns An object with `admin` (the admin Drizzle database) and `rls` (a function that runs a transaction with the session's RLS claims and role applied)
 */
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