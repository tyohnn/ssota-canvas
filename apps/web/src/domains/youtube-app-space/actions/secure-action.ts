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
import { WorkspaceId } from '../../workspace-management/shared/value-objects/workspace-id.vo';
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
 * workspaceId + blockId(slug)로 YouTube 블록 권한 검증
 * 1. Block 조회 (findByWorkspaceIdAndSlug)
 * 2. 블록 타입 검증 (YouTube 전용)
 * 3. Workspace 권한 검증
 * 4. youtubeId 검증 (요청에 youtubeId가 있는 경우)
 *
 * Returns YoutubeBlockActionContext (Block 정보 포함)
 */
async function authorizeYoutubeBlockById(
  req: { workspaceId: string; blockId: string; youtubeId?: string },
  userId: string
): Promise<AuthorizeResult<YoutubeBlockActionContext>> {
  // 1. Block 조회 (workspaceId + slug)
  const blockRepository = new DrizzleBlockRepository();
  const block = await blockRepository.findByWorkspaceIdAndSlug(
    new WorkspaceId(req.workspaceId),
    req.blockId
  );

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
      req: { workspaceId: string; blockId: string; youtubeId?: string },
      user: AuthenticatedUser
    ) => authorizeYoutubeBlockById(req, user.id)
  )
  .build();

// authorizeByActionTransaction and withActionTransactionAuth removed:
// youtube_app_space.action_transactions table dropped in migration cleanup.
// Use source-management source_action_transactions for new flows.

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

  // Layer 2: Page 조회 → workspaceId 확보 후 Block 조회 (req.blockId = slug)
  const pageRepo = new DrizzlePageRepository();
  const pageId = new PageId(publishedPage.pageId);
  const page = await pageRepo.findById(pageId);

  if (!page) {
    return {
      success: false,
      error: 'Page not found',
    };
  }

  const workspaceIdValue = page.workspaceId.value;

  const blockRepository = new DrizzleBlockRepository();
  const block = await blockRepository.findByWorkspaceIdAndSlug(
    new WorkspaceId(workspaceIdValue),
    req.blockId
  );

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

  // Block 소속 확인 (mount의 block_id는 UUID)
  const blockMountRepo = new DrizzleBlockMountRepository();
  const blockMounts = await blockMountRepo.findByPageId(pageId);
  const blockInPage = blockMounts.some(
    mount => mount.getBlockMount().blockId.value === block.id.value
  );

  if (!blockInPage) {
    return {
      success: false,
      error: 'Block not in published page',
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
  const workspaceRepo = new DrizzleWorkspaceRepository();
  const workspace = await workspaceRepo.findById(new WorkspaceId(workspaceIdValue));

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
