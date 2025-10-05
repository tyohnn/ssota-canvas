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

// Organization-related DTOs
export interface OrganizationSummary {
  id: string; // Serialized from OrganizationId
  name: string;
  isDefault: boolean;
  role?: 'owner' | 'admin' | 'member';
  createdAt: string; // ISO 8601 string (serialized from Date)
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
}

export interface UpdateOrganizationRequest {
  id: string;
  name?: string;
  description?: string;
}

// Action Response DTOs
export interface UserRegistrationResult {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
  defaultOrganization: {
    id: string;
    name: string;
    isDefault: boolean;
  };
}
