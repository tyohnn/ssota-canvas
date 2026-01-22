/**
 * YouTube App Space - Common Action Utilities
 *
 * YouTube 도메인 전용 Server Action wrapper와 유틸리티들
 */
import {
  authorizeByWorkspaceId,
  getAuthenticatedUser,
  verifyOrganizationMembership,
  verifyWorkspaceAccess,
} from '@/domains/common/auth/helpers';
import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import { AuthorizeResult } from '@/lib/server-actions/types';

import { DrizzleBlockRepository } from '../../block-management/backend/repositories/implementations/drizzle-block.repository';
import { Block } from '../../block-management/shared/entities/block.entity';
import { BlockId } from '../../block-management/shared/value-objects/block-id.vo';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '../../block-management/shared/value-objects/block-properties';
import { DrizzleBlockMountRepository } from '../../canvas-management/backend/repositories/implementations/drizzle-block-mount.repository';
import { PublishedPage } from '../../share/shared/entities/published-page.entity';
import { PublishToken } from '../../share/shared/value-objects/publish-token.vo';
import { DrizzlePublishedPageRepository } from '../../share/backend/repositories/implementations/drizzle-published-page.repository';
import { DrizzlePageRepository } from '../../workspace-management/backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceRepository } from '../../workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { PageId } from '../../workspace-management/shared/value-objects/page-id.vo';
import { DrizzleActionTransactionRepository } from '../backend/repositories/implementations/drizzle-action-transaction.repository';

/**
 * YouTube 전용 Secure Action Builder
 */
const youtubeSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

/**
 * YouTube Block Action Context
 *
 * YouTube Block 액션에서 사용하는 컨텍스트
 * Block 정보와 YouTube Properties가 포함됨
 */
export interface YoutubeBlockActionContext extends WorkspaceActionContext {
  block: Block; // 검증된 Block Entity
  youtubeProperties: YoutubeBlockPropertiesVO; // 검증된 YouTube Properties
}

/**
 * Block-based authorization for YouTube actions
 *
 * blockId로 YouTube 블록 권한 검증
 * 1. Block 조회 (권한 검증)
 * 2. 블록 타입 검증 (YouTube 전용)
 * 3. Workspace 권한 검증
 * 4. youtubeId 검증 (요청에 youtubeId가 있는 경우)
 *
 * Returns YoutubeBlockActionContext (Block 정보 포함)
 */
async function authorizeYoutubeBlockById(
  req: { blockId: string; youtubeId?: string },
  userId: string
): Promise<AuthorizeResult<YoutubeBlockActionContext>> {
  // 1. Block 조회 (권한 검증)
  const blockRepository = new DrizzleBlockRepository();
  const block = await blockRepository.findById(new BlockId(req.blockId));

  if (!block) {
    return { success: false, error: 'Block not found' };
  }

  // 2. 블록 타입 검증 (YouTube 전용)
  if (block.blockType.value !== 'youtube') {
    return { success: false, error: 'Block type must be youtube' };
  }

  // 3. Block Properties를 타입 안전하게 변환
  const properties = block.properties;
  let youtubeProperties: YoutubeBlockPropertiesVO;
  try {
    const propertiesJSON = properties.toJSON() as YoutubeBlockProperties;
    youtubeProperties = YoutubeBlockPropertiesVO.fromJSON(propertiesJSON);
  } catch (error) {
    return {
      success: false,
      error: 'Invalid YouTube block properties',
    };
  }

  // 4. youtubeId 검증 (요청에 youtubeId가 있는 경우)
  if (req.youtubeId) {
    const blockYoutubeId = youtubeProperties.youtubeId;
    if (!blockYoutubeId) {
      return {
        success: false,
        error: 'YouTube ID not found in block properties',
      };
    }

    if (blockYoutubeId !== req.youtubeId) {
      return {
        success: false,
        error: 'YouTube ID mismatch',
      };
    }
  }

  // 5. Workspace 권한 검증
  const workspaceAuthResult = await authorizeByWorkspaceId(
    block.workspaceId.value,
    userId
  );

  if (!workspaceAuthResult.success || !workspaceAuthResult.context) {
    return {
      success: false,
      error: workspaceAuthResult.error || 'Workspace access denied',
    };
  }

  // 6. YoutubeBlockActionContext 반환 (Block 정보 포함)
  return {
    success: true,
    context: {
      ...workspaceAuthResult.context,
      block,
      youtubeProperties,
    },
  };
}

/**
 * YouTube Block 전용 secure action wrapper
 *
 * blockId 기반으로 YouTube 블록 액션에 사용합니다.
 * 자동으로 다음을 검증합니다:
 * 1. 사용자 인증
 * 2. Workspace 접근 권한
 * 3. Block 소유권 및 타입 (YouTube 블록인지 확인)
 * 4. youtubeId 검증 (요청에 youtubeId가 있는 경우)
 *
 * @example
 * ```ts
 * export const getYoutubeMetadataAction = withYoutubeBlockSecureAction(
 *   GetYoutubeMetadataRequestSchema,
 *   'getYoutubeMetadataAction',
 *   async (req, ctx) => {
 *     // ctx는 YoutubeBlockActionContext
 *     // ctx.block: 검증된 Block Entity
 *     // ctx.youtubeProperties: 검증된 YouTube Properties
 *     // req.blockId가 YouTube 블록이고 ctx.workspace에 속함이 검증됨
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withYoutubeBlockSecureAction = youtubeSecureActionBuilder
  .forContext<YoutubeBlockActionContext>()
  .withAuth(
    (
      req: { blockId: string; youtubeId?: string },
      user: AuthenticatedUser
    ) => authorizeYoutubeBlockById(req, user.id)
  )
  .build();

/**
 * Action Transaction based authorization (Org-based)
 *
 * actionTransactionId + blockId 이중 보안 검증
 * 1. Transaction 조회
 * 2. Block 조회하여 workspace 추출
 * 3. Transaction-Org 일치 확인 (org 기반)
 * 4. Transaction 상태 확인 (중복 실행 방지)
 * 5. Org 멤버십 확인
 *
 * Returns WorkspaceActionContext
 */
async function authorizeByActionTransaction(
  req: { actionTransactionId: string; blockId: string },
  userId: string
): Promise<AuthorizeResult<WorkspaceActionContext>> {
  // 1. Transaction Aggregate 조회 (Repository 사용)
  const transactionRepository = new DrizzleActionTransactionRepository();
  const transactionAggregate = await transactionRepository.findById(
    req.actionTransactionId
  );

  if (!transactionAggregate) {
    return { success: false, error: 'Transaction not found' };
  }

  const transaction = transactionAggregate.getTransaction();

  // 2. Block 조회하여 workspace 추출
  const blockRepository = new DrizzleBlockRepository();
  const block = await blockRepository.findById(new BlockId(req.blockId));

  if (!block) {
    return { success: false, error: 'Block not found' };
  }

  // 3. Org 기반 검증: Transaction의 orgId와 Block의 workspace의 orgId 일치 확인
  // Block의 workspace를 통해 org를 찾고, transaction의 orgId와 비교
  const workspace = await verifyWorkspaceAccess(
    block.workspaceId.value,
    userId
  );

  if (!workspace) {
    return { success: false, error: 'NOT_WORKSPACE_MEMBER' };
  }

  const blockOrgId = workspace.organizationId.value;

  // Transaction의 orgId와 Block의 orgId 일치 확인
  if (transaction.orgId !== blockOrgId) {
    return { success: false, error: 'Transaction-Org mismatch' };
  }

  // 4. Transaction 상태 확인 (중복 실행 방지)
  if (transaction.isCompleted()) {
    return { success: false, error: 'Transaction already completed' };
  }

  // 5. Org 멤버십 확인 및 WorkspaceActionContext 반환
  const orgMembership = await verifyOrganizationMembership(
    transaction.orgId,
    userId
  );

  if (!orgMembership.isMember || !orgMembership.role) {
    return { success: false, error: 'NOT_ORG_MEMBER' };
  }

  return {
    success: true,
    context: {
      workspace,
      organization: { id: transaction.orgId, role: orgMembership.role },
    } as WorkspaceActionContext,
  };
}

/**
 * Action Transaction 전용 secure action wrapper
 *
 * actionTransactionId + blockId 이중 보안으로 유료 액션에 사용합니다.
 * 자동으로 다음을 검증합니다:
 * 1. 사용자 인증
 * 2. Transaction 존재 확인
 * 3. Transaction-Org 일치 확인 (org 기반)
 * 4. Transaction 상태 확인 (중복 실행 방지)
 * 5. Org 멤버십 확인
 *
 * @example
 * ```ts
 * export const smartSummaryAction = withActionTransactionAuth(
 *   SmartSummaryRequestSchema,
 *   'smartSummaryAction',
 *   async (req, ctx) => {
 *     // ctx는 WorkspaceActionContext
 *     // req.actionTransactionId와 req.blockId가 모두 검증됨
 *     // Transaction의 orgId와 Block의 orgId가 일치하는지 확인됨
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withActionTransactionAuth = youtubeSecureActionBuilder
  .forContext<WorkspaceActionContext>()
  .withAuth(
    (
      req: { actionTransactionId: string; blockId: string },
      user: AuthenticatedUser
    ) => authorizeByActionTransaction(req, user.id)
  )
  .build();

/**
 * Published Page Context
 *
 * Published Page 액션에서 사용하는 컨텍스트
 * 3단계 검증을 통과한 후 제공되는 정보
 */
export interface PublishedPageContext {
  publishedPage: PublishedPage;
  pageId: PageId;
  block: Block; // 검증된 Block Entity
  youtubeProperties: YoutubeBlockPropertiesVO; // 검증된 YouTube Properties
  orgId: string; // Published page의 org ID
}

/**
 * Published Page 기반 인증 (3단계 검증)
 *
 * ⚠️ Security: Publish Token 기반 인증 (비로그인 유저 지원)
 * 1. Publish Token 검증
 * 2. Block 소속 확인 (해당 published page에 속하는지)
 * 3. YouTube ID 일치 확인
 *
 * Returns PublishedPageContext
 */
async function authorizeByPublishedPage(
  req: {
    publishToken: string;
    blockId: string;
    youtubeId: string;
  }
): Promise<AuthorizeResult<PublishedPageContext>> {
  // Layer 1: Publish Token 검증
  const publishRepo = new DrizzlePublishedPageRepository();
  let publishToken: PublishToken;
  try {
    publishToken = new PublishToken(req.publishToken);
  } catch (error) {
    return {
      success: false,
      error: 'Invalid publish token format',
    };
  }

  const publishedPage = await publishRepo.findByToken(publishToken);

  if (!publishedPage) {
    return {
      success: false,
      error: 'Invalid or expired publish token',
    };
  }

  if (!publishedPage.isPublished()) {
    return {
      success: false,
      error: 'Page is not published',
    };
  }

  // Layer 2: Block 소속 확인
  const blockMountRepo = new DrizzleBlockMountRepository();
  const pageId = new PageId(publishedPage.pageId);
  const blockMounts = await blockMountRepo.findByPageId(pageId);

  const blockInPage = blockMounts.some(
    mount => mount.getBlockMount().blockId.value === req.blockId
  );

  if (!blockInPage) {
    return {
      success: false,
      error: 'Block not in published page',
    };
  }

  // Block 조회 및 검증
  const blockRepository = new DrizzleBlockRepository();
  const blockId = new BlockId(req.blockId);
  const block = await blockRepository.findById(blockId);

  if (!block) {
    return {
      success: false,
      error: 'Block not found',
    };
  }

  if (block.blockType.value !== 'youtube') {
    return {
      success: false,
      error: 'Block is not a YouTube block',
    };
  }

  // Block Properties를 타입 안전하게 변환
  const properties = block.properties;
  let youtubeProperties: YoutubeBlockPropertiesVO;
  try {
    const propertiesJSON = properties.toJSON() as YoutubeBlockProperties;
    youtubeProperties = YoutubeBlockPropertiesVO.fromJSON(propertiesJSON);
  } catch (error) {
    return {
      success: false,
      error: 'Invalid YouTube block properties',
    };
  }

  // Layer 3: YouTube ID 일치 확인
  const blockYoutubeId = youtubeProperties.youtubeId;
  if (!blockYoutubeId) {
    return {
      success: false,
      error: 'YouTube ID not found in block properties',
    };
  }

  if (blockYoutubeId !== req.youtubeId) {
    return {
      success: false,
      error: 'YouTube ID mismatch',
    };
  }

  // Org ID 조회 (Layer 4에서 사용)
  const pageRepo = new DrizzlePageRepository();
  const page = await pageRepo.findById(pageId);

  if (!page) {
    return {
      success: false,
      error: 'Page not found',
    };
  }

  const workspaceRepo = new DrizzleWorkspaceRepository();
  const workspace = await workspaceRepo.findById(page.workspaceId);

  if (!workspace) {
    return {
      success: false,
      error: 'Workspace not found',
    };
  }

  const orgId = workspace.organizationId.value;

  return {
    success: true,
    context: {
      publishedPage,
      pageId,
      block, // 검증된 Block Entity 직접 제공
      youtubeProperties,
      orgId,
    },
  };
}

/**
 * Published Page 전용 Secure Action Builder
 *
 * ⚠️ 인증 불필요: 비로그인 유저도 접근 가능
 */
const publishedPageSecureActionBuilder = createSecureActionBuilder<null>(
  async () => null // 인증 불필요 (비로그인 유저 지원)
);

/**
 * Published Page 전용 secure action wrapper
 *
 * Publish Token 기반으로 Published Page 액션에 사용합니다.
 * 자동으로 다음을 검증합니다:
 * 1. Publish Token 검증
 * 2. Block 소속 확인 (해당 published page에 속하는지)
 * 3. YouTube ID 일치 확인
 *
 * ⚠️ 인증 불필요: 비로그인 유저도 접근 가능
 *
 * @example
 * ```ts
 * export const processVideoScriptForPublishedPageAction = withPublishedPageSecureAction(
 *   ProcessVideoScriptForPublishedPageRequestSchema,
 *   'processVideoScriptForPublishedPageAction',
 *   async (req, ctx) => {
 *     // ctx는 PublishedPageContext
 *     // req.publishToken, req.blockId, req.youtubeId가 모두 검증됨
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withPublishedPageSecureAction = publishedPageSecureActionBuilder
  .forContext<PublishedPageContext>()
  .withAuth(
    (
      req: { publishToken: string; blockId: string; youtubeId: string },
      _user: null
    ) => authorizeByPublishedPage(req)
  )
  .build();
