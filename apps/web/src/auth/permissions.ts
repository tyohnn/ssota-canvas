import { auth } from "./clerk";

// Permission types
export type Permission = "read" | "write" | "delete" | "admin";

// Resource types
export type ResourceType = "project" | "organization" | "user";

// Permission checking interface
export interface PermissionCheck {
  resourceType: ResourceType;
  resourceId: string;
  permission: Permission;
  userId?: string;
}

// Permission checking function
export async function checkPermission(
  check: PermissionCheck
): Promise<boolean> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return false;
    }

    // Use the provided userId or the authenticated user's ID
    const targetUserId = check.userId || userId;

    switch (check.resourceType) {
      case "project":
        return await checkProjectPermission(
          check.resourceId,
          targetUserId,
          check.permission
        );
      case "organization":
        return await checkOrganizationPermission(
          check.resourceId,
          targetUserId,
          check.permission
        );
      case "user":
        return await checkUserPermission(
          check.resourceId,
          targetUserId,
          check.permission
        );
      default:
        return false;
    }
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
}

// Project permission checking
async function checkProjectPermission(
  projectId: string,
  userId: string,
  permission: Permission
): Promise<boolean> {
  // This will be implemented with database checks and RLS policies
  // For now, return true for basic functionality
  return true;
}

// Organization permission checking
async function checkOrganizationPermission(
  organizationId: string,
  userId: string,
  permission: Permission
): Promise<boolean> {
  // This will be implemented with Clerk organization checks
  // For now, return true for basic functionality
  return true;
}

// User permission checking
async function checkUserPermission(
  targetUserId: string,
  requestingUserId: string,
  permission: Permission
): Promise<boolean> {
  // Users can only access their own data
  if (permission === "read" || permission === "write") {
    return targetUserId === requestingUserId;
  }

  // Admin permissions require special handling
  if (permission === "admin") {
    // This will be implemented with role-based checks
    return false;
  }

  return false;
}

// Helper function to require authentication
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Authentication required");
  }

  return userId;
}

// Helper function to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { userId } = await auth();
    return !!userId;
  } catch {
    return false;
  }
}
