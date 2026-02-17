/**
 * Group-specific secure action wrapper
 *
 * withPageSecureAction을 확장하여 그룹 관련 공통 검증 로직을 추가합니다:
 * - 모든 nodeIds가 존재하는지 확인
 * - 모든 노드가 같은 페이지에 있는지 확인
 * - 검증된 BlockMountAggregate[]를 context에 추가
 *
 * @example
 * ```ts
 * export const myGroupAction = withGroupSecureAction(
 *   MyRequestSchema,
 *   'myGroupAction',
 *   async (req, ctx) => {
 *     // ctx.nodeAggregates는 이미 검증된 BlockMountAggregate[]
 *     return ok(result);
 *   }
 * );
 * ```
 */
import type { z } from 'zod';

import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import { authorizeByPageId, getAuthenticatedUser } from '@/domains/common/auth/helpers';
import type { PageActionContext } from '@/domains/common/auth/types';
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import type { AuthorizeResult } from '@/lib/server-actions/types';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import type { BlockMountAggregate } from '../../shared/aggregates/block-mount.aggregate';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

/**
 * Group Action Context
 * PageActionContext에 검증된 nodeAggregates를 추가
 */
export interface GroupActionContext extends PageActionContext {
  nodeAggregates: BlockMountAggregate[];
}

/**
 * Add Node To Group: child + parent aggregate를 secure action에서 조회해 전달
 */
export interface AddNodeToGroupActionContext extends PageActionContext {
  childBlockMountAggregate: BlockMountAggregate;
  parentBlockMountAggregate: BlockMountAggregate;
}

/**
 * Remove Node From Group: child aggregate만 secure action에서 조회해 전달
 */
export interface RemoveNodeFromGroupActionContext extends PageActionContext {
  childBlockMountAggregate: BlockMountAggregate;
}

/**
 * Secure action builder with project-specific authentication
 */
const secureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

// ---------------------------------------------------------------------------
// Add Node To Group: child + parent 조회 후 context에 담기
// ---------------------------------------------------------------------------
async function authorizeAddNodeToGroup(
  pageId: string,
  childBlockMountId: string,
  parentBlockMountId: string,
  userId: string
): Promise<AuthorizeResult<AddNodeToGroupActionContext>> {
  const pageResult = await authorizeByPageId(pageId, userId);
  if (!pageResult.success || !pageResult.context) {
    return pageResult as AuthorizeResult<AddNodeToGroupActionContext>;
  }

  const blockMountRepository = new DrizzleBlockMountRepository();
  const pageIdVO = new PageId(pageId);
  const [childAgg, parentAgg] = await Promise.all([
    blockMountRepository.findByPageIdAndSlug(pageIdVO, childBlockMountId),
    blockMountRepository.findByPageIdAndSlug(pageIdVO, parentBlockMountId),
  ]);

  if (!childAgg || !parentAgg) {
    return {
      success: false,
      error: 'Child or parent block mount not found',
    };
  }
  if (childAgg.getBlockMount().pageId.value !== pageId) {
    return { success: false, error: 'Child block mount is not on the given page' };
  }
  if (parentAgg.getBlockMount().pageId.value !== pageId) {
    return { success: false, error: 'Parent block mount is not on the given page' };
  }

  return {
    success: true,
    context: {
      ...pageResult.context,
      childBlockMountAggregate: childAgg,
      parentBlockMountAggregate: parentAgg,
    },
  };
}

// ---------------------------------------------------------------------------
// Remove Node From Group: child만 조회 후 context에 담기
// ---------------------------------------------------------------------------
async function authorizeRemoveNodeFromGroup(
  pageId: string,
  childBlockMountId: string,
  userId: string
): Promise<AuthorizeResult<RemoveNodeFromGroupActionContext>> {
  const pageResult = await authorizeByPageId(pageId, userId);
  if (!pageResult.success || !pageResult.context) {
    return pageResult as AuthorizeResult<RemoveNodeFromGroupActionContext>;
  }

  const blockMountRepository = new DrizzleBlockMountRepository();
  const pageIdVO = new PageId(pageId);
  const childAgg = await blockMountRepository.findByPageIdAndSlug(
    pageIdVO,
    childBlockMountId
  );

  if (!childAgg) {
    return { success: false, error: 'Child block mount not found' };
  }
  if (childAgg.getBlockMount().pageId.value !== pageId) {
    return { success: false, error: 'Child block mount is not on the given page' };
  }

  return {
    success: true,
    context: { ...pageResult.context, childBlockMountAggregate: childAgg },
  };
}

/**
 * Add Node To Group 전용 secure action wrapper
 *
 * Request: pageId, childBlockMountId, parentBlockMountId (그 외 safeDto 필드)
 * Context: childBlockMountAggregate, parentBlockMountAggregate (서비스에서 재조회 없음)
 */
export const withAddNodeToGroupSecureAction = secureActionBuilder
  .forContext<AddNodeToGroupActionContext>()
  .withAuth(
    (
      req: { pageId: string; childBlockMountId: string; parentBlockMountId: string },
      user: AuthenticatedUser
    ) =>
      authorizeAddNodeToGroup(
        req.pageId,
        req.childBlockMountId,
        req.parentBlockMountId,
        user.id
      )
  )
  .build();

/**
 * Remove Node From Group 전용 secure action wrapper
 *
 * Request: pageId, childBlockMountId (그 외 safeDto 필드)
 * Context: childBlockMountAggregate (서비스에서 재조회 없음)
 */
export const withRemoveNodeFromGroupSecureAction = secureActionBuilder
  .forContext<RemoveNodeFromGroupActionContext>()
  .withAuth(
    (
      req: { pageId: string; childBlockMountId: string },
      user: AuthenticatedUser
    ) =>
      authorizeRemoveNodeFromGroup(req.pageId, req.childBlockMountId, user.id)
  )
  .build();

// ---------------------------------------------------------------------------
// Group-based secure action (create group from nodes)
// ---------------------------------------------------------------------------

/**
 * Group-based secure action wrapper
 *
 * Request must have:
 * - `pageId: string` - for page authorization
 * - `nodeIds: string[]` - nodes to validate
 *
 * Automatically performs:
 * 1. Page authorization (via authorizeByPageId)
 * 2. Node existence validation
 * 3. Page matching validation
 * 4. Adds validated nodeAggregates to context
 */
export const withGroupSecureAction = secureActionBuilder
  .forContext<GroupActionContext>()
  .withAuth(
    async (
      req: { pageId: string; nodeIds: string[] },
      user: AuthenticatedUser
    ): Promise<AuthorizeResult<GroupActionContext>> => {
      // 1. Page authorization (기존 withPageSecureAction 로직)
      const pageAuthResult = await authorizeByPageId(req.pageId, user.id);

      if (!pageAuthResult.success || !pageAuthResult.context) {
        return {
          success: false,
          error: pageAuthResult.error || 'Page authorization failed',
        };
      }

      // 2. 모든 노드 조회 및 검증 (pageId + slugs)
      const blockMountRepository = new DrizzleBlockMountRepository();
      const pageIdVO = new PageId(req.pageId);
      const nodeAggregates =
        await blockMountRepository.findByPageIdAndSlugs(
          pageIdVO,
          req.nodeIds
        );

      // 3. 존재하지 않는 노드 확인
      const missingNodes = nodeAggregates.filter(agg => !agg);
      if (missingNodes.length > 0) {
        return {
          success: false,
          error: `GROUP_NODE_NOT_FOUND: ${missingNodes.length} nodes not found`,
        };
      }

      const validAggregates = nodeAggregates.filter(
        (agg): agg is BlockMountAggregate => agg !== null
      );

      // 4. 페이지 일치 확인
      const pageMatches = validAggregates.every(
        agg => agg.getBlockMount().pageId.value === req.pageId
      );
      if (!pageMatches) {
        return {
          success: false,
          error: 'GROUP_NODE_PAGE_MISMATCH: All nodes must be on the same page',
        };
      }

      // 5. 검증된 context 반환
      return {
        success: true,
        context: {
          ...pageAuthResult.context,
          nodeAggregates: validAggregates,
        },
      };
    }
  )
  .build();
