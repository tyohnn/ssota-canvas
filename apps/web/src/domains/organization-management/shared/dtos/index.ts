// apps/web/src/domains/organization-management/shared/dtos/index.ts

import { z } from 'zod';

export interface OrganizationSummary {
  id: string;
  name: string;
  organizationType: string;
  isDefault: boolean;
  role?: 'owner' | 'admin' | 'member';
  createdAt: string;
  iconUrl?: string | null;
}

export const GetOrganizationRequestSchema = z.object({
  organizationId: z.string().uuid(),
});
export type GetOrganizationRequest = z.infer<typeof GetOrganizationRequestSchema>;

export const UpdateOrganizationRequestSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  iconUrl: z.string().url().nullable().optional(),
});
export type UpdateOrganizationRequest = z.infer<
  typeof UpdateOrganizationRequestSchema
>;

export interface CreateOrganizationRequest {
  name: string;
  organizationType:
    | 'personal'
    | 'education'
    | 'startup'
    | 'agency'
    | 'company'
    | 'n/a';
}

export interface CreateOrganizationResult {
  success: boolean;
  organization?: {
    id: string;
    name: string;
    organizationType: string;
    isDefault: boolean;
    createdAt: string;
  };
  workspace?: {
    id: string;
    name: string;
    isDefault: boolean;
  };
  page?: {
    id: string;
    title: string;
    icon: string | null;
  };
  personalWorkspace?: {
    // v1.2
    id: string;
    name: string;
    isDefault: boolean;
  };
  personalPage?: {
    // v1.2
    id: string;
    title: string;
    icon: string | null;
  };
  error?: string;
}

export interface InviteMemberRequest {
  organizationId: string;
  inviteeEmail: string;
  role: 'admin' | 'member';
}

export interface RespondToInvitationRequest {
  invitationId: string;
  accept: boolean;
}

export interface OrganizationMemberView {
  organizationId: string;
  currentMembers: MemberSummary[];
  pendingInvitations: InvitationSummary[];
  userRole: 'owner' | 'admin' | 'member';
}

export interface MemberSummary {
  userId: string;
  name: string;
  email: string;
  profileImageUrl?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface InvitationSummary {
  id: string;
  inviteeEmail: string;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  inviterName: string;
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  profileImageUrl?: string;
}
