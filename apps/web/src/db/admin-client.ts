import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { config } from "../config";

// Supabase Admin Client - bypasses RLS
export function createSupabaseAdminClient() {
  const connectionString = config.database.url;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
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
      application_name: "xbowl-admin",
    },
  });

  // Create drizzle instance with schema
  const adminDb = drizzle(adminClient, { schema });

  return {
    // Direct admin access (bypasses RLS)
    admin: adminDb,

    // Admin wrapper for consistency
    rls: async <T>(fn: (tx: typeof adminDb) => Promise<T>): Promise<T> => {
      // Admin client bypasses RLS, so just execute the function
      return await fn(adminDb);
    },
  };
}
