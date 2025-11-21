// apps/web/src/domains/canvas-management/backend/services/interfaces/canvas-query.service.interface.ts

import type { Result } from '@/utils/result';
import type { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import type { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import type { CanvasViewData } from '../../../shared/dtos';

/**
 * Canvas Query Service Interface
 *
 * 캔버스 데이터 조회를 담당하는 서비스 인터페이스
 * Read Model 패턴 적용, 구현체는 특정 ORM/DB에 의존하지 않도록 설계
 */
export interface ICanvasQueryService {
  /**
   * 캔버스 뷰 데이터 조회 (BlockMount + Block JOIN)
   *
   * @param pageId - 페이지 ID
   * @param userId - 사용자 ID
   * @returns CanvasViewData (성공) | Error (실패)
   */
  getCanvasView(
    pageId: PageId,
    userId: UserId
  ): Promise<Result<CanvasViewData, Error>>;
}
