// ARCHIVED: Clerk-based Drizzle client (legacy)
// This file is archived as we migrated from Clerk to Supabase Auth
// Kept for reference and potential rollback needs

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { auth } from '@clerk/nextjs/server';
import { sql } from 'drizzle-orm';
import * as schema from './schema';
import * as devSchema from './schema-dev';
import { config } from '@/config';
import { devLog } from '@/utils/dev-logger';

const isDevelopment = process.env.NODE_ENV === 'development';
const connectionString = config.database.url;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres connection
const client = postgres(connectionString, {
  // Connection timeout settings
  connect_timeout: 10,
  idle_timeout: 20,
  max: 10,
  // SSL settings for Supabase
  ssl: {
    rejectUnauthorized: false,
  },
});

// Create drizzle instance with environment-based schema
export const db = drizzle(client, {
  schema: isDevelopment ? devSchema : schema,
});

/**
 * Create a Clerk-authenticated Drizzle client that provides a transaction-scoped RLS helper.
 *
 * @returns An object with:
 *  - `rls`: a function that runs a provided callback inside a database transaction after applying a transaction-local `app.user_id` context so Row-Level Security policies apply to that transaction.
 *  - `direct`: the base Drizzle database instance (no RLS context applied).
 * @throws Error when there is no authenticated user.
 */
export async function createClerkDrizzleSupabaseClient() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Authentication required');
  }

  // Facade returning an RLS helper backed by the shared pool + transaction-scoped SET LOCAL
  return {
    rls: async <T>(fn: (tx: typeof db) => Promise<T>): Promise<T> => {
      try {
        return await db.transaction(async tx => {
          // devLog("🔐 [RLS] Setting user context (SET LOCAL):", { userId });
          // SET LOCAL is scoped to the current transaction only
          await tx.execute(sql.raw(`SET LOCAL "app.user_id" = '${userId}'`));
          const result = await fn(tx as any);
          // devLog("✅ [RLS] Query executed successfully");
          return result;
        });
      } catch (error) {
        // devLog("❌ [RLS] Transaction error:", { error });
        throw error;
      }
    },
    direct: db,
  };
}

/**
 * Create a simple Drizzle client bound to the current authenticated user without applying row-level security.
 *
 * @returns An object containing:
 * - `rls`: a helper that executes a provided function with the base `db` instance (no RLS context).
 * - `direct`: the base `db` instance for direct queries.
 * @throws Error when there is no authenticated user (`userId` is missing).
 */
export async function createSimpleClient() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Authentication required');
  }

  // Use the same client but without RLS
  return {
    rls: async <T>(fn: (tx: typeof db) => Promise<T>): Promise<T> => {
      // Just execute the function without RLS context
      return await fn(db);
    },
    direct: db,
  };
}

// Export schema for migrations
// export * from './schema';

/**
 * Creates an administrative Drizzle client connected to the configured Postgres database.
 *
 * @returns An object with `admin`, a Drizzle instance bound to an admin Postgres connection using the selected schema.
 * @throws If the `DATABASE_URL` environment variable is not set.
 */
export function createSupabaseAdminClient() {
  const connectionString = config.database.url;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Create postgres connection with admin privileges
  const adminClient = postgres(connectionString, {
    // Connection timeout settings
    connect_timeout: 10,
    idle_timeout: 20,
    max: 10,
    // SSL settings for Supabase
    ssl: {
      rejectUnauthorized: false,
    },
    // Admin connection settings
    connection: {
      application_name: 'ssota-admin',
    },
  });

  // Create drizzle instance with schema
  const adminDb = drizzle(adminClient, { schema });
  return { admin: adminDb } as const;
}