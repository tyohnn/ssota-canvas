import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import {
  createClerkDrizzleSupabaseClient,
  createSupabaseAdminClient,
} from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Sync current user to Supabase DB
export async function syncCurrentUser() {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("No authenticated user");
    }

    // Get user details from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    if (!clerkUser) {
      throw new Error("User not found in Clerk");
    }

    // Check if user exists in Supabase using admin client
    const adminDb = createSupabaseAdminClient();

    const existingUser = await adminDb.rls((tx) =>
      tx.select().from(users).where(eq(users.id, userId)).limit(1)
    );

    if (existingUser.length === 0) {
      // Create new user in Supabase
      await adminDb.rls((tx) =>
        tx.insert(users).values({
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          first_name: clerkUser.firstName || "",
          last_name: clerkUser.lastName || "",
        })
      );

      console.log("User synced to Supabase:", userId);
    } else {
      // Update existing user
      await adminDb.rls((tx) =>
        tx
          .update(users)
          .set({
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            first_name: clerkUser.firstName || "",
            last_name: clerkUser.lastName || "",
            updated_at: new Date(),
          })
          .where(eq(users.id, userId))
      );

      console.log("User updated in Supabase:", userId);
    }

    return { success: true };
  } catch (error) {
    console.error("Error syncing user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get or create user in Supabase
export async function getOrCreateUser() {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("No authenticated user");
    }

    // Sync user first
    await syncCurrentUser();

    // Return user from Supabase using admin client
    const adminDb = createSupabaseAdminClient();

    const user = await adminDb.rls((tx) =>
      tx.select().from(users).where(eq(users.id, userId)).limit(1)
    );

    return user[0] || null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}
