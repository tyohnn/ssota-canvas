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
import type { BaseActionContext, PageActionContext } from '@/domains/common/auth/types';
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import type { AuthorizeResult } from '@/lib/server-actions/types';

import { DrizzleBlockMountRepository } from '../../backend/repositories/implementations/drizzle-block-mount.repository';
import type { BlockMountAggregate } from '../../shared/aggregates/block-mount.aggregate';
import { BlockMountId } from '../../shared/value-objects/block-mount-id.vo';

/**
 * Group Action Context
 * PageActionContext에 검증된 nodeAggregates를 추가
 */
export interface GroupActionContext extends PageActionContext {
  nodeAggregates: BlockMountAggregate[];
}

/**
 * Secure action builder with project-specific authentication
 */
const secureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

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
  .forContext<GroupActionContext, BaseActionContext>()
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

      // 2. 모든 노드 조회 및 검증 (그룹 전용 로직)
      const blockMountRepository = new DrizzleBlockMountRepository();
      const nodeAggregates = await Promise.all(
        req.nodeIds.map(id =>
          blockMountRepository.findById(new BlockMountId(id))
        )
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
