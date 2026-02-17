/**
 * Canvas Management - Block Mount Action Utilities
 *
 * BlockMount 도메인 전용 Server Action wrapper와 유틸리티들
 */
import type { z } from 'zod';

import {
  authorizeByPageId,
  getAuthenticatedUser,
  verifyBlockOwnership,
} from '@/domains/common/auth/helpers';
import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import type { PageActionContext } from '@/domains/common/auth/types';
import type { Page } from '@/domains/workspace-management/shared/entities/page.entity';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import type { ActionResult } from '@/lib';
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import type { AuthorizeResult } from '@/lib/server-actions/types';

import type { BlockMountAggregate } from '../../shared/aggregates/block-mount.aggregate';
import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';

// ---------------------------------------------------------------------------
// Block Mount 전용 Action Context 타입 (이 파일에서만 사용, 범용 아님)
// ---------------------------------------------------------------------------

/** 권한 검증 시 이미 조회한 blockMount aggregate를 담아 서비스 재조회 방지 */
export interface BlockMountActionContext extends PageActionContext {
  blockMountAggregate: BlockMountAggregate;
}

/** targetPage + 이미 조회한 blockMount aggregate */
export interface MoveBlockActionContext extends PageActionContext {
  targetPage: Page;
  blockMountAggregate: BlockMountAggregate;
}

/** 다중 block mount 공통: 권한 검증 시 이미 조회한 N개 aggregate (request 순서와 동일) */
export interface MultipleBlockMountsActionContext extends PageActionContext {
  blockMountAggregates: BlockMountAggregate[];
}

// ---------------------------------------------------------------------------
// Block Mount 권한 검증 (단일/다중 통일, 액션별로 정의하지 않음)
// ---------------------------------------------------------------------------

/** 단일: (pageId, blockMountSlug) 조회 후 페이지·블록 소유권 검증. BlockMountActionContext 반환. */
async function authorizeSingleBlockMount(
  pageId: string,
  blockMountSlug: string,
  userId: string
): Promise<AuthorizeResult<BlockMountActionContext>> {
  const pageResult = await authorizeByPageId(pageId, userId);
  if (!pageResult.success || !pageResult.context) {
    return pageResult as AuthorizeResult<BlockMountActionContext>;
  }

  const blockMountRepository = new DrizzleBlockMountRepository();
  const pageIdVO = new PageId(pageId);
  const blockMount = await blockMountRepository.findByPageIdAndSlug(
    pageIdVO,
    blockMountSlug
  );

  if (!blockMount) {
    return { success: false, error: 'Block mount not found' };
  }

  const blockId = blockMount.getBlockMount().blockId.value;
  const workspaceId = pageResult.context.workspace.workspaceId.value;
  const ownershipResult = await verifyBlockOwnership(blockId, workspaceId);
  if (!ownershipResult.isValid) {
    return {
      success: false,
      error:
        ownershipResult.error === 'BLOCK_NOT_FOUND'
          ? 'Block not found'
          : 'Block does not belong to this workspace',
    };
  }

  return {
    success: true,
    context: { ...pageResult.context, blockMountAggregate: blockMount },
  };
}

/** 다중: slugs 순서대로 단일 검증 후 blockMountAggregates 수집. (Duplicate/SoftDelete/UpdatePosition 등 공통) */
async function authorizeMultipleBlockMounts(
  pageId: string,
  slugs: string[],
  userId: string
): Promise<AuthorizeResult<MultipleBlockMountsActionContext>> {
  if (slugs.length === 0) {
    return { success: false, error: 'At least one block mount is required' };
  }

  const blockMountAggregates: BlockMountAggregate[] = [];
  let baseContext: PageActionContext | undefined;

  for (const slug of slugs) {
    const result = await authorizeSingleBlockMount(pageId, slug, userId);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    if (result.context) {
      if (baseContext === undefined) {
        baseContext = result.context;
      }
      blockMountAggregates.push(result.context.blockMountAggregate);
    }
  }

  if (!baseContext) {
    return { success: false, error: 'Page context not found' };
  }
  return {
    success: true,
    context: { ...baseContext, blockMountAggregates },
  };
}

/**
 * Move용: 원본 page + target page 검증, blockMount aggregate 포함 반환
 * Returns MoveBlockActionContext (targetPage + blockMountAggregate)
 */
async function authorizeMoveBlockToPage(
  pageId: string,
  blockMountSlug: string,
  targetPageId: string,
  userId: string
): Promise<AuthorizeResult<MoveBlockActionContext>> {
  const sourcePageResult = await authorizeByPageId(pageId, userId);
  if (!sourcePageResult.success || !sourcePageResult.context) {
    return sourcePageResult as AuthorizeResult<MoveBlockActionContext>;
  }

  const blockMountRepository = new DrizzleBlockMountRepository();
  const pageIdVO = new PageId(pageId);
  const blockMount = await blockMountRepository.findByPageIdAndSlug(
    pageIdVO,
    blockMountSlug
  );
  if (!blockMount) {
    return { success: false, error: 'Block mount not found' };
  }

  const targetPageResult = await authorizeByPageId(targetPageId, userId);
  if (!targetPageResult.success || !targetPageResult.context) {
    return {
      success: false,
      error: 'Target page access denied',
    } as AuthorizeResult<MoveBlockActionContext>;
  }

  const sourceWorkspaceId =
    sourcePageResult.context.workspace.workspaceId.value;
  const targetWorkspaceId =
    targetPageResult.context.workspace.workspaceId.value;
  if (sourceWorkspaceId !== targetWorkspaceId) {
    return { success: false, error: 'Cannot move block across workspaces' };
  }

  return {
    success: true,
    context: {
      ...sourcePageResult.context,
      targetPage: targetPageResult.context.page,
      blockMountAggregate: blockMount,
    },
  };
}

/**
 * BlockMount 전용 Secure Action Builder
 */
const blockMountSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

/**
 * 단일 block mount 전용 secure action wrapper
 *
 * request에 pageId, blockMountId 있으면 사용. ctx는 BlockMountActionContext (blockMountAggregate 포함).
 */
export const withSingleBlockMountSecureAction = blockMountSecureActionBuilder
  .forContext<BlockMountActionContext>()
  .withAuth(
    (
      req: { pageId: string; blockMountId: string },
      user: AuthenticatedUser
    ) => authorizeSingleBlockMount(req.pageId, req.blockMountId, user.id)
  )
  .build();

/**
 * 다중 block mount 공통 secure action wrapper
 *
 * options.getPageIdAndSlugs로 request에서 pageId, slugs 추출 후 authorizeMultipleBlockMounts 호출.
 * Duplicate (배치), Soft Delete, Update Position 등에서 재사용.
 */
export function withMultipleBlockMountSecureAction<TRequest extends { pageId: string }, TResponse>(
  schema: z.ZodSchema<TRequest>,
  actionName: string,
  handler: (
    req: TRequest,
    ctx: MultipleBlockMountsActionContext
  ) => Promise<ActionResult<TResponse>>,
  options: {
    getPageIdAndSlugs: (req: TRequest) => { pageId: string; slugs: string[] };
    getLogMetadata?: (req: TRequest) => Record<string, unknown>;
  }
) {
  const built = blockMountSecureActionBuilder
    .forContext<MultipleBlockMountsActionContext>()
    .withAuth((req: TRequest, user: AuthenticatedUser) => {
      const { pageId, slugs } = options.getPageIdAndSlugs(req);
      return authorizeMultipleBlockMounts(pageId, slugs, user.id);
    })
    .build();
  return built(schema, actionName, handler, {
    getLogMetadata: options.getLogMetadata,
  });
}

/**
 * Move 전용 secure action wrapper
 *
 * 원본 page + target page 양쪽 모두 검증 (Defense in Depth)
 * - 원본 pageId: blockMount에서 자동 추출
 * - target pageId: 클라이언트에서 제공
 * - cross-workspace move 방지
 *
 * @example
 * ```ts
 * export const moveBlockAction = withMoveBlockSecureAction(
 *   MoveBlockRequestSchema,
 *   'moveBlockAction',
 *   async (req, ctx) => {
 *     // ctx는 PageActionContext & { targetPage: Page }
 *     // 이미 target page 권한 검증됨
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withMoveBlockSecureAction = blockMountSecureActionBuilder
  .forContext<MoveBlockActionContext>()
  .withAuth(
    (
      req: { pageId: string; blockMountId: string; targetPageId: string },
      user: AuthenticatedUser
    ) =>
      authorizeMoveBlockToPage(
        req.pageId,
        req.blockMountId,
        req.targetPageId,
        user.id
      )
  )
  .build();
