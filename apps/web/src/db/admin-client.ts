import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { config } from '../config';

// Supabase Admin Client - bypasses RLS
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
