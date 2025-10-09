// ============================================
// DTOs for Client-Server Communication
// ============================================
// These are plain objects that can be serialized across the Next.js boundary
// Used in Server Actions and Client Components

// User-related DTOs
export interface UserProfileView {
  userId: string; // Serialized from UserId
  email: string;
  name: string;
  profileImageUrl?: string;
  defaultOrganization: {
    id: string; // Serialized from OrganizationId
    name: string;
  };
  lastLoginAt?: string; // ISO 8601 string (serialized from Date)
  createdAt: string; // ISO 8601 string (serialized from Date)
}
