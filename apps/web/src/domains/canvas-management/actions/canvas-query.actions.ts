'use server';

import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';
import {
  authorizeByPageId,
  getAuthenticatedUser,
} from '@/domains/common/auth/helpers';
import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import type { PageActionContext } from '@/domains/common/auth/types';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { isTempPageId } from '@/domains/workspace-management/shared/utils/temp-page-id.utils';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleBlockMountRepository } from '../backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '../backend/repositories/implementations/drizzle-edge.repository';
import { DrizzleViewportRepository } from '../backend/repositories/implementations/drizzle-viewport.repository';
import { CanvasQueryService } from '../backend/services/canvas-query.service';
import {
  type GetCanvasViewPayload,
  CanvasViewData,
} from '../shared/dtos/index';
import {
  GetCanvasViewRequestSchema,
  type GetCanvasViewRequest,
} from '../shared/dtos/requests/canvas.requests';

/**
 * 임시 페이지: 사이드바에서 "새 페이지 추가" 후 서버 저장 전까지 사용하는 ID.
 * 형식: 00000000-xxxx-4xxx-xxxx-xxxxxxxxxxxx (temp-page-id.utils).
 * DB에 없으므로 authorizeByPageId 대신 인증만 하고 빈 캔버스를 반환할 때 사용.
 */
type TempPageContext = {
  isTempPage: true;
  authenticatedUser: AuthenticatedUser;
};

const emptyCanvasView = (pageId: string): CanvasViewData => ({
  pageId,
  blocks: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
});

const canvasViewSecureActionBuilder = createSecureActionBuilder<AuthenticatedUser>(
  getAuthenticatedUser
)
  .forContext<PageActionContext | TempPageContext>()
  .withAuth(
    (req: { pageId: string }, user: AuthenticatedUser) =>
      isTempPageId(req.pageId)
        ? Promise.resolve({
            success: true as const,
            context: { isTempPage: true as const, authenticatedUser: user },
          })
        : authorizeByPageId(req.pageId, user.id)
  )
  .build();

/**
 * 캔버스 뷰 데이터 조회 Server Action
 *
 * 패턴: secure action + internal
 * - orgId, workspaceId는 전달하지 않고, pageId만 전달 후 authorize로 검증된 context 사용
 * - 성공 시 GetCanvasViewPayload(캔버스 데이터 + orgId, workspaceId) 반환해 호출부에서 재검증 불필요
 * - 임시 페이지(temp)는 authorize에서 통과 후 handler에서 빈 캔버스 + orgId/workspaceId 빈 문자열 반환
 *
 * @param request - { pageId: string }
 * @returns GetCanvasViewPayload (성공) | Error (실패)
 */
export const getCanvasViewAction = canvasViewSecureActionBuilder(
  GetCanvasViewRequestSchema,
  'getCanvasView',
  getCanvasViewHandler,
  { getLogMetadata: req => ({ pageId: req.pageId }) }
);

async function getCanvasViewHandler(
  req: GetCanvasViewRequest,
  context: PageActionContext | TempPageContext
): Promise<ActionResult<GetCanvasViewPayload>> {
  if ('isTempPage' in context && context.isTempPage) {
    return ok({
      ...emptyCanvasView(req.pageId),
      orgId: '',
      workspaceId: '',
    });
  }
  return getCanvasViewInternal(req, context as PageActionContext);
}

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * context는 authorizeByPageId로 검증된 PageActionContext (workspace, organization, page 포함).
 */
async function getCanvasViewInternal(
  _req: GetCanvasViewRequest,
  context: PageActionContext
): Promise<ActionResult<GetCanvasViewPayload>> {
  try {
    const pageIdVO = new PageId(context.page.pageId.value);
    const userIdVO = new UserId(context.authenticatedUser.id);

    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const viewportRepository = new DrizzleViewportRepository();

    const canvasQueryService = new CanvasQueryService(
      blockMountRepository,
      edgeRepository,
      viewportRepository
    );

    const result = await canvasQueryService.getCanvasView(pageIdVO, userIdVO);

    if (result.isError()) {
      return err(String(result.error), {
        code: 'CANVAS_VIEW_ERROR',
        meta: { originalError: result.error },
      });
    }

    return ok({
      ...result.value,
      orgId: context.workspace.organizationId.value,
      workspaceId: context.workspace.workspaceId.value,
    });
  } catch (error) {
    console.error('[getCanvasViewInternal] Error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
