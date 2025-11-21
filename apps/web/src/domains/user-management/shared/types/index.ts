// apps/web/src/domains/user-management/types/index.ts

// User management types
// Organization-related types moved to organization-management domain

export interface UserProfile {
  userId: string;
  email: string | null;
  name: string | null;
  profileImageUrl: string | null;
}
