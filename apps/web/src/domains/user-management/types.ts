// Software Design의 Aggregate 속성을 기반으로 정의
export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  status: 'active' | 'soft_deleted' | 'permanently_deleted';
  metadata: Record<string, any>;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  clerkId: string;
  name: string;
  slug: string;
  ownerId: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Membership {
  id: string;
  organizationId: string;
  userId?: string; // NULL for pending invitations
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'active' | 'removed';
  invitedBy?: string;
  inviteeEmail?: string;
  invitedAt?: Date;
  joinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}