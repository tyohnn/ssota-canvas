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

// Create RLS-enabled database client for Clerk
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

// Alternative: Simple client without RLS for testing
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

// Export admin client
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
