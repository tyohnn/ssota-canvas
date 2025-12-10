'use server';

import { CanvasViewData } from '../shared/dtos/index';
import { ActionResult, ok, err } from '@/lib/action-result';
import { checkAuth } from '@/domains/auth/server/auth-guard';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';

import { DrizzleBlockMountRepository } from '../backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '../backend/repositories/implementations/drizzle-edge.repository';
import { DrizzleViewportRepository } from '../backend/repositories/implementations/drizzle-viewport.repository';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceMemberRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace-member.repository';
import { DrizzleOrganizationMemberRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization-member.repository';
import { DefaultWorkspaceNavigationService } from '@/domains/workspace-management/backend/services/workspace-navigation.service';
import { CanvasQueryService } from '../backend/services/canvas-query.service';
import { isTempPageId } from '@/domains/workspace-management/shared/utils/temp-page-id.utils';

/**
 * 캔버스 뷰 데이터 조회 Server Action
 * CanvasQueryService를 사용하여 페이지의 전체 캔버스 데이터를 조회
 *
 * @param pageId - 페이지 ID
 * @param orgId - 조직 ID (권한 검증용)
 * @param workspaceId - 워크스페이스 ID (권한 검증용)
 * @returns CanvasViewData (성공) | Error (실패)
 */
export async function getCanvasViewAction(
  pageId: string,
  orgId?: string,
  workspaceId?: string
): Promise<ActionResult<CanvasViewData>> {
  try {
    // 1. 인증 확인
    const authResult = await checkAuth('getCanvasViewAction');
    if (!authResult.success) {
      return err(authResult.error!, { code: authResult.errorCode! });
    }
    const user = authResult.user!;

    // 2. 입력 검증
    if (!pageId || pageId.trim().length === 0) {
      return err('Page ID is required', { code: 'INVALID_PAGE_ID' });
    }

    // 2.5. 임시 페이지 ID 감지 및 처리
    if (isTempPageId(pageId)) {
      // 임시 페이지는 빈 캔버스 데이터 반환
      return ok({
        pageId,
        blocks: [],
        edges: [],
        viewport: {
          x: 0,
          y: 0,
          zoom: 1,
        },
      });
    }

    // 3. Value Objects 생성
    const pageIdVO = new PageId(pageId);
    const userIdVO = new UserId(user.id);

    // 4. 권한 검증 (orgId와 workspaceId가 제공된 경우)
    if (orgId && workspaceId) {
      const orgIdVO = new OrganizationId(orgId);
      const workspaceIdVO = new WorkspaceId(workspaceId);

      // Workspace Navigation Service를 사용한 권한 검증
      const workspaceRepo = new DrizzleWorkspaceRepository();
      const pageRepo = new DrizzlePageRepository();
      const workspaceMemberRepo = new DrizzleWorkspaceMemberRepository();
      const orgMemberRepo = new DrizzleOrganizationMemberRepository();

      const navigationService = new DefaultWorkspaceNavigationService(
        workspaceRepo,
        pageRepo,
        workspaceMemberRepo,
        orgMemberRepo
      );

      const accessResult = await navigationService.verifyPageAccess(
        orgIdVO,
        workspaceIdVO,
        pageIdVO,
        user.id
      );

      if (!accessResult.success) {
        return err(`Access denied: ${accessResult.error}`, {
          code: 'ACCESS_DENIED',
        });
      }
    }

    // 5. 의존성 주입 (Repository 및 Service)
    const blockMountRepository = new DrizzleBlockMountRepository();
    const edgeRepository = new DrizzleEdgeRepository();
    const viewportRepository = new DrizzleViewportRepository();

    // 6. CanvasQueryService 인스턴스 생성 및 실행
    const canvasQueryService = new CanvasQueryService(
      blockMountRepository,
      edgeRepository,
      viewportRepository
    );

    const result = await canvasQueryService.getCanvasView(pageIdVO, userIdVO);

    // 7. 결과 처리 (Result 타입을 ActionResult로 변환)
    if (result.isError()) {
      return err(String(result.error), {
        code: 'CANVAS_VIEW_ERROR',
        meta: {
          originalError: result.error,
        },
      });
    }

    // 8. 성공적으로 CanvasViewData 반환
    return ok(result.value);
  } catch (error) {
    console.error('[getCanvasViewAction] Error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
