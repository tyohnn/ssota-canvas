/**
 * Authentication & Authorization Helpers
 *
 * Server Actions에서 사용하는 인증/권한 확인 헬퍼 함수들
 * - 외부 입력을 신뢰하지 않는 원칙
 * - Defense in Depth (심층 방어)
 */
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { DrizzleBlockMountRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-edge.repository';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { EdgeId } from '@/domains/canvas-management/shared/value-objects/edge-id.vo';
import { DrizzleOrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization-member.repository';
import type {
  MemberRole,
  MemberRoleOrNull,
} from '@/domains/organization-management/shared/types';
import {
  OrganizationId,
  UserId,
} from '@/domains/organization-management/shared/value-objects/ids.vo';
import { DrizzleUserRepository } from '@/domains/user-management/backend/repositories/implementations/drizzle-user.repository';
import type { UserProfile } from '@/domains/user-management/shared/types';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceMemberRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace-member.repository';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import type { Page } from '@/domains/workspace-management/shared/entities/page.entity';
import type { Workspace } from '@/domains/workspace-management/shared/entities/workspace.entity';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import type { AuthorizeResult } from '@/lib/server-actions/types';
import { createClient } from '@/utils/supabase/server';

import type { PageActionContext, WorkspaceActionContext } from './types';

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
  error?:
    | 'UNAUTHORIZED'
    | 'NOT_ORG_MEMBER'
    | 'NOT_WORKSPACE_MEMBER'
    | 'PAGE_NOT_FOUND';
  orgRole?: MemberRole;
  workspace?: Workspace; // 검증된 워크스페이스 entity
  page?: Page; // 검증된 페이지 entity
}

// ============================================
// 1. 인증 확인
// ============================================

/**
 * Supabase 인증된 사용자 가져오기
 *
 * @throws Error - 인증 실패 시
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

  /* Original implementation (commented out):
  // 🆕 Beta access check
  if (userAggregate.entity.betaStatus !== 'approved') {
    throw new Error('BETA_ACCESS_REQUIRED');
  }
  */

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
 * - 일반 workspace: 조직 멤버십 확인 후 명시적 워크스페이스 멤버십 필요
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
  const orgMemberRepo = new DrizzleOrganizationMemberRepository();

  try {
    const wsId = new WorkspaceId(workspaceId);
    const userIdVO = new UserId(userId);

    // 1. Workspace 조회
    const workspace = await workspaceRepo.findById(wsId);
    if (!workspace) {
      return null;
    }

    // 2. Organization ID 추출
    const organizationId = workspace.organizationId.value;
    const orgId = new OrganizationId(organizationId);

    // 3. 조직 멤버십 확인 (모든 workspace 접근 전 필요)
    const isOrgMember = await orgMemberRepo.isMember(orgId, userIdVO);

    if (!isOrgMember) {
      return null; // 조직 멤버가 아니면 접근 불가
    }

    // 4. Default workspace는 조직 멤버면 자동 접근
    if (workspace.isDefault) {
      return workspace; // ✅ entity 반환
    }

    // 5. 일반 workspace는 명시적 워크스페이스 멤버십 확인
    // (조직 멤버십이 이미 확인된 상태에서만 호출)
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

/**
 * Page ID 기반 접근 권한 확인
 *
 * pageId로부터 Page를 조회하고, Page가 속한 Workspace와 Organization을 자동으로 찾아
 * 사용자의 접근 권한을 검증합니다.
 *
 * @param pageId - 페이지 ID
 * @param userId - 사용자 ID
 * @returns 접근 검증 결과
 */
export async function verifyAccessByPageId(
  pageId: string,
  userId: string
): Promise<AccessVerificationResult> {
  try {
    const pageRepo = new DrizzlePageRepository();
    const pageIdVO = new PageId(pageId);

    // 1. Page 조회
    const page = await pageRepo.findById(pageIdVO);
    if (!page) {
      return {
        success: false,
        error: 'PAGE_NOT_FOUND',
      };
    }

    // 2. Page에서 workspaceId 추출
    const workspaceId = page.workspaceId.value;

    // 3. Workspace 조회 (organizationId 얻기 위해)
    const workspaceRepo = new DrizzleWorkspaceRepository();
    const workspaceIdVO = new WorkspaceId(workspaceId);
    const workspace = await workspaceRepo.findById(workspaceIdVO);

    if (!workspace) {
      return {
        success: false,
        error: 'PAGE_NOT_FOUND', // Workspace가 없으면 Page도 접근 불가
      };
    }

    // 4. 조직 멤버십 및 역할 확인 (먼저 검증)
    const organizationId = workspace.organizationId.value;
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

    // 5. Workspace 접근 권한 확인
    // - Default workspace: 조직 멤버면 자동 접근 (이미 확인됨)
    // - 일반 workspace: 명시적 워크스페이스 멤버십 필요
    if (workspace.isDefault) {
      // Default workspace는 조직 멤버면 자동 접근 (이미 확인됨)
      return {
        success: true,
        orgRole: orgMembership.role!,
        workspace,
        page, // ✅ 검증된 page entity 포함
      };
    }

    // 일반 workspace는 명시적 멤버십 확인
    const workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();
    const isMember = await workspaceMemberRepo.isMember(workspaceIdVO, userId);

    if (!isMember) {
      return {
        success: false,
        error: 'NOT_WORKSPACE_MEMBER',
      };
    }

    // 6. 성공 (검증된 workspace entity 및 page entity 포함)
    return {
      success: true,
      orgRole: orgMembership.role!,
      workspace,
      page, // ✅ 검증된 page entity 포함
    };
  } catch (error) {
    console.error('[verifyAccessByPageId] Error:', error);
    return {
      success: false,
      error: 'PAGE_NOT_FOUND',
    };
  }
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

// ============================================
// 6. Authorization Helpers (for withSecureAction)
// ============================================

/**
 * Page-based authorization (for edge, blockMount actions)
 * Verifies page access and returns PageActionContext
 */
export async function authorizeByPageId(
  pageId: string,
  userId: string
): Promise<AuthorizeResult<PageActionContext>> {
  const accessResult = await verifyAccessByPageId(pageId, userId);

  if (!accessResult.success || !accessResult.workspace || !accessResult.page) {
    return { success: false, error: accessResult.error };
  }

  const orgId = accessResult.workspace.organizationId.value;
  const orgMembership = await verifyOrganizationMembership(orgId, userId);

  if (!orgMembership.isMember || !orgMembership.role) {
    return { success: false, error: 'NOT_ORG_MEMBER' };
  }

  return {
    success: true,
    context: {
      workspace: accessResult.workspace,
      organization: { id: orgId, role: orgMembership.role },
      page: accessResult.page,
    } as PageActionContext,
  };
}

/**
 * Workspace-based authorization (for block actions without page validation)
 * Verifies workspace access and returns WorkspaceActionContext
 */
export async function authorizeByWorkspaceId(
  workspaceId: string,
  userId: string
): Promise<AuthorizeResult<WorkspaceActionContext>> {
  const workspace = await verifyWorkspaceAccess(workspaceId, userId);

  if (!workspace) {
    return { success: false, error: 'NOT_WORKSPACE_MEMBER' };
  }

  const orgId = workspace.organizationId.value;
  const orgMembership = await verifyOrganizationMembership(orgId, userId);

  if (!orgMembership.isMember || !orgMembership.role) {
    return { success: false, error: 'NOT_ORG_MEMBER' };
  }

  return {
    success: true,
    context: {
      workspace,
      organization: { id: orgId, role: orgMembership.role },
    } as WorkspaceActionContext,
  };
}

/**
 * Edge-based authorization (for edge update/delete actions)
 * First gets the edge by edgeId to extract pageId,
 * then verifies page access
 * Returns PageActionContext
 */
export async function authorizeByEdgeId(
  edgeId: string,
  userId: string
): Promise<AuthorizeResult<PageActionContext>> {
  // 1. Get edge to extract pageId
  const edgeRepository = new DrizzleEdgeRepository();
  const edgeIdVO = new EdgeId(edgeId);
  const edgeAggregate = await edgeRepository.findById(edgeIdVO);

  if (!edgeAggregate) {
    return {
      success: false,
      error: 'Edge not found',
    };
  }

  const pageId = edgeAggregate.edge.pageId.value;

  // 2. Verify page access
  return await authorizeByPageId(pageId, userId);
}

/**
 * BlockMount-based authorization (for blockMount update/delete actions)
 * First gets the blockMount by blockMountId to extract pageId,
 * then verifies page access
 * Returns PageActionContext
 */
export async function authorizeByBlockMountId(
  blockMountId: string,
  userId: string
): Promise<AuthorizeResult<PageActionContext>> {
  // 1. Get blockMount to extract pageId
  const blockMountRepository = new DrizzleBlockMountRepository();
  const blockMountIdVO = new BlockMountId(blockMountId);
  const aggregate = await blockMountRepository.findById(blockMountIdVO);

  if (!aggregate) {
    return {
      success: false,
      error: 'Block mount not found',
    };
  }

  const pageId = aggregate.getBlockMount().pageId.value;

  // 2. Verify page access
  return await authorizeByPageId(pageId, userId);
}
