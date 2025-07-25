import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/nextjs/server";

// Clerk configuration for authentication
export const clerkConfig = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in",
  signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up",
  afterSignInUrl:
    process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "/dashboard",
  afterSignUpUrl:
    process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || "/dashboard",
};

// Export auth utilities for use in server actions
export { auth, clerkClient };

// Helper function to get current user
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

// Helper function to get user's organizations
export async function getUserOrganizations() {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    // For now, return empty array - organization support will be implemented later
    return [];
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    return [];
  }
}

// Helper function to validate user session
export async function validateUserSession() {
  console.log("=== [validateUserSession] 시작 ===");
  const { userId } = await auth();
  console.log("=== [validateUserSession] auth() 결과 userId:", userId);

  if (!userId) {
    console.log("=== [validateUserSession] 인증 없음, 에러 throw ===");
    throw new Error("Authentication required");
  }

  console.log("=== [validateUserSession] 성공, userId 반환:", userId);
  return userId;
}
