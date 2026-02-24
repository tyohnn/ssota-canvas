/**
 * Canvas Management - Edge Action Utilities
 *
 * Edge 도메인 전용 Server Action wrapper (Aggregate 조회·전달 패턴)
 */
import {
  authorizeByPageId,
  getAuthenticatedUser,
} from '@/domains/common/auth/helpers';
import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import type { PageActionContext } from '@/domains/common/auth/types';
import type { ActionResult } from '@/lib';
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import type { AuthorizeResult } from '@/lib/server-actions/types';

import type { EdgeAggregate } from '../../shared/aggregates/edge.aggregate';
import { DrizzleEdgeRepository } from '../../backend/repositories/implementations/drizzle-edge.repository';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

// ---------------------------------------------------------------------------
// Edge 전용 Action Context
// ---------------------------------------------------------------------------

/** 권한 검증 시 이미 조회한 edge aggregate를 담아 서비스 재조회 방지 */
export interface EdgeActionContext extends PageActionContext {
  edgeAggregate: EdgeAggregate;
}

// ---------------------------------------------------------------------------
// Edge 권한 검증 (단일)
// ---------------------------------------------------------------------------

/** 단일: (pageId, edgeSlug) 조회 후 페이지 권한 검증. EdgeActionContext 반환. */
async function authorizeSingleEdge(
  pageId: string,
  edgeSlug: string,
  userId: string
): Promise<AuthorizeResult<EdgeActionContext>> {
  const pageResult = await authorizeByPageId(pageId, userId);
  if (!pageResult.success || !pageResult.context) {
    return pageResult as AuthorizeResult<EdgeActionContext>;
  }

  const edgeRepository = new DrizzleEdgeRepository();
  const pageIdVO = new PageId(pageId);
  const edgeAggregate = await edgeRepository.findByPageIdAndSlug(
    pageIdVO,
    edgeSlug
  );

  if (!edgeAggregate) {
    return { success: false, error: 'Edge not found' };
  }

  return {
    success: true,
    context: { ...pageResult.context, edgeAggregate },
  };
}

// ---------------------------------------------------------------------------
// Edge Secure Action Builder
// ---------------------------------------------------------------------------

const edgeSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

/**
 * 단일 edge 전용 secure action wrapper
 *
 * request에 pageId, edgeId(slug) 있으면 사용. ctx는 EdgeActionContext (edgeAggregate 포함).
 * 서비스는 safeEdgeAggregate만 받고 내부에서 findByPageIdAndSlug 호출하지 않음.
 */
export const withSingleEdgeSecureAction = edgeSecureActionBuilder
  .forContext<EdgeActionContext>()
  .withAuth(
    (
      req: { pageId: string; edgeId: string },
      user: AuthenticatedUser
    ) => authorizeSingleEdge(req.pageId, req.edgeId, user.id)
  )
  .build();
