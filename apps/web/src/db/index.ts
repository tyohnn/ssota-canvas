import 'dotenv/config';
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

// Create admin client for direct database access
const adminClient = postgres(config.database.url, {
  prepare: false,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Create RLS client for user-scoped operations
const rlsClient = postgres(config.database.url, {
  prepare: false,
  ssl: {
    rejectUnauthorized: false,
  },
});

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
            return await transaction(tx);
          } finally {
            await tx.execute(sql`
            -- reset
            select set_config('request.jwt.claims', NULL, TRUE);
            select set_config('request.jwt.claim.sub', NULL, TRUE);
            reset role;
            `);
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
