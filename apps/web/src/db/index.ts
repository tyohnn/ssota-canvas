import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { auth } from "@clerk/nextjs/server";
import * as schema from "./schema";
import { config } from "@/config";

// Database connection configuration
const connectionString = config.database.url;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
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

// Create drizzle instance
export const db = drizzle(client, { schema });

// Create RLS-enabled database client for Clerk
export async function createClerkDrizzleSupabaseClient() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Authentication required");
  }

  // Create postgres connection with user context
  const rlsClient = postgres(connectionString, {
    // Set user context for RLS
    prepare: false,
    // Add user context to connection
    connection: {
      application_name: `xbowl-${userId}`,
    },
    // Connection timeout settings
    connect_timeout: 10,
    idle_timeout: 20,
    max: 10,
    // SSL settings for Supabase
    ssl: {
      rejectUnauthorized: false,
    },
  });

  // Create drizzle instance with schema
  const rlsDb = drizzle(rlsClient, { schema });

  // Return RLS wrapper
  return {
    rls: async <T>(fn: (tx: typeof rlsDb) => Promise<T>): Promise<T> => {
      try {
        // Set user context for this connection
        console.log("🔐 [RLS] Setting user context:", userId);
        await rlsClient.unsafe(`SET "app.user_id" = '${userId}'`);

        const result = await fn(rlsDb);
        console.log("✅ [RLS] Query executed successfully");
        return result;
      } catch (error) {
        console.error("❌ [RLS] Transaction error:", error);
        throw error;
      } finally {
        try {
          // Reset context
          await rlsClient.unsafe(`RESET "app.user_id"`);
          console.log("🔄 [RLS] User context reset");
        } catch (resetError) {
          console.error("Error resetting user context:", resetError);
        }
      }
    },

    // Direct access (use with caution)
    direct: rlsDb,
  };
}

// Alternative: Simple client without RLS for testing
export async function createSimpleClient() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Authentication required");
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
export * from "./schema";

// Export admin client
export { createSupabaseAdminClient } from "./admin-client";
