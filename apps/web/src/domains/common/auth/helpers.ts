/**
 * Authentication & Authorization Helpers
 *
 * Server Actions에서 사용하는 인증/권한 확인 헬퍼 함수들
 * - 외부 입력을 신뢰하지 않는 원칙
 * - Defense in Depth (심층 방어)
 */

import { createClient } from '@/utils/supabase/server';
import { DrizzleUserRepository } from '@/domains/user-management/backend/repositories/implementations/drizzle-user.repository';
import { DrizzleOrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization-member.repository';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { DrizzleWorkspaceMemberRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace-member.repository';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import {
  OrganizationId,
  UserId,
} from '@/domains/organization-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import type {
  MemberRole,
  MemberRoleOrNull,
} from '@/domains/organization-management/shared/types';
import type { Workspace } from '@/domains/workspace-management/shared/entities/workspace.entity';
import type { UserProfile } from '@/domains/user-management/shared/types';

// ============================================
// Types
// ============================================

export interface AuthenticatedUser {
  id: string;
  profile: UserProfile;
}

export interface OrganizationMembership {
  isMember: boolean;
  role: MemberRoleOrNull;
}

export interface AccessVerificationResult {
  success: boolean;
  error?: 'UNAUTHORIZED' | 'NOT_ORG_MEMBER' | 'NOT_WORKSPACE_MEMBER';
  orgRole?: MemberRole;
  workspace?: Workspace; // 검증된 워크스페이스 entity
}

// ============================================
// 1. 인증 확인
// ============================================

/**
 * Supabase 인증된 사용자 가져오기
 *
 * ⚠️ Beta Access Check: 베타 승인되지 않은 사용자는 차단됩니다
 *
 * @throws Error - 인증 실패 또는 베타 미승인 시
 * @returns 인증된 사용자 정보
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('UNAUTHORIZED: User not authenticated');
  }

  const userRepository = new DrizzleUserRepository();
  const userAggregate = await userRepository.findById(new UserId(user.id));

  if (!userAggregate) {
    throw new Error('USER_PROFILE_NOT_FOUND');
  }

  // 🆕 Beta access check
  if (userAggregate.entity.betaStatus !== 'approved') {
    throw new Error('BETA_ACCESS_REQUIRED');
  }

  const userProfile = await userRepository.getUserProfile(new UserId(user.id));
  if (!userProfile) {
    throw new Error('USER_PROFILE_NOT_FOUND');
  }

  return {
    id: user.id,
    profile: userProfile,
  };
}

// ============================================
// 2. 조직 멤버십 확인
// ============================================

/**
 * 조직 멤버십 및 역할 확인
 *
 * @param organizationId - 조직 ID
 * @param userId - 사용자 ID
 * @returns 멤버십 정보
 */
export async function verifyOrganizationMembership(
  organizationId: string,
  userId: string
): Promise<OrganizationMembership> {
  const orgMemberRepo = new DrizzleOrganizationMemberRepository();
  const orgId = new OrganizationId(organizationId);
  const userIdVO = new UserId(userId);

  try {
    const role = await orgMemberRepo.findMemberRole(orgId, userIdVO);

    if (!role) {
      return { isMember: false, role: null };
    }

    return {
      isMember: true,
      role: role.value as MemberRole,
    };
  } catch (error) {
    console.error('[verifyOrganizationMembership] Error:', error);
    return { isMember: false, role: null };
  }
}

// ============================================
// 3. 워크스페이스 접근 권한 확인
// ============================================

/**
 * 워크스페이스 접근 권한 확인
 *
 * 로직:
 * - Default workspace: 조직 멤버면 자동 접근
 * - 일반 workspace: 명시적 멤버십 필요
 *
 * @param workspaceId - 워크스페이스 ID
 * @param userId - 사용자 ID
 * @returns 검증된 Workspace entity (접근 가능 시) 또는 null
 */
export async function verifyWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<Workspace | null> {
  const workspaceRepo = new DrizzleWorkspaceRepository();
  const workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();

  try {
    const wsId = new WorkspaceId(workspaceId);

    // 1. Workspace 조회
    const workspace = await workspaceRepo.findById(wsId);
    if (!workspace) {
      return null;
    }

    // 2. Default workspace는 조직 멤버면 자동 접근
    if (workspace.isDefault) {
      return workspace; // ✅ entity 반환
    }

    // 3. 일반 workspace는 멤버십 확인
    const isMember = await workspaceMemberRepo.isMember(wsId, userId);
    return isMember ? workspace : null; // ✅ entity 반환
  } catch (error) {
    console.error('[verifyWorkspaceAccess] Error:', error);
    return null;
  }
}

// ============================================
// 4. 통합 권한 확인 (조직 + 워크스페이스)
// ============================================

/**
 * 조직 + 워크스페이스 통합 권한 확인
 *
 * @param organizationId - 조직 ID
 * @param workspaceId - 워크스페이스 ID
 * @param userId - 사용자 ID
 * @returns 접근 검증 결과
 */
export async function verifyAccess(
  organizationId: string,
  workspaceId: string,
  userId: string
): Promise<AccessVerificationResult> {
  // 1. 조직 멤버십 확인
  const orgMembership = await verifyOrganizationMembership(
    organizationId,
    userId
  );

  if (!orgMembership.isMember) {
    return {
      success: false,
      error: 'NOT_ORG_MEMBER',
    };
  }

  // 2. 워크스페이스 접근 권한 확인
  const workspace = await verifyWorkspaceAccess(workspaceId, userId);

  if (!workspace) {
    return {
      success: false,
      error: 'NOT_WORKSPACE_MEMBER',
    };
  }

  // 3. 성공 (검증된 workspace entity 포함)
  return {
    success: true,
    orgRole: orgMembership.role!,
    workspace, // ✅ 검증된 workspace entity
  };
}

// ============================================
// 5. 블록 소유권 확인
// ============================================

export interface BlockOwnershipVerification {
  isValid: boolean;
  error?: 'BLOCK_NOT_FOUND' | 'WORKSPACE_MISMATCH';
}

/**
 * 블록 소유권 확인
 *
 * 블록이 특정 워크스페이스에 속하는지 확인합니다.
 *
 * @param blockId - 블록 ID
 * @param expectedWorkspaceId - 예상되는 워크스페이스 ID
 * @returns 소유권 검증 결과
 */
export async function verifyBlockOwnership(
  blockId: string,
  expectedWorkspaceId: string
): Promise<BlockOwnershipVerification> {
  const blockRepo = new DrizzleBlockRepository();

  try {
    const blockIdVO = new BlockId(blockId);
    const block = await blockRepo.findById(blockIdVO);

    if (!block) {
      return {
        isValid: false,
        error: 'BLOCK_NOT_FOUND',
      };
    }

    // 블록의 workspaceId와 예상 workspaceId 비교
    if (block.workspaceId.value !== expectedWorkspaceId) {
      return {
        isValid: false,
        error: 'WORKSPACE_MISMATCH',
      };
    }

    return {
      isValid: true,
    };
  } catch (error) {
    console.error('[verifyBlockOwnership] Error:', error);
    return {
      isValid: false,
      error: 'BLOCK_NOT_FOUND',
    };
  }
}
