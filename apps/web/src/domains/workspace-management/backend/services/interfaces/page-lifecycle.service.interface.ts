// apps/web/src/domains/workspace-management/backend/services/interfaces/page-lifecycle.service.interface.ts

import type { PageId } from '../../../shared/value-objects/page-id.vo';
import type { PageAggregate } from '../../../shared/aggregates/page.aggregate';
import type { Result } from './common.types';

/**
 * Page Lifecycle Service Interface (Scenario 7)
 *
 * Page 삭제, 복제를 담당
 */
export interface PageLifecycleService {
  /**
   * Page 삭제 (Soft Delete)
   *
   * @param params - 삭제 파라미터
   * @returns PageAggregate (성공) | Error code (실패)
   */
  deletePage(params: {
    pageId: PageId;
    userId: string;
  }): Promise<Result<PageAggregate>>;

  /**
   * Page 복제
   *
   * @param params - 복제 파라미터
   * @returns PageAggregate (성공) | Error code (실패)
   */
  duplicatePage(params: {
    pageId: PageId;
    userId: string;
  }): Promise<Result<PageAggregate>>;

  /**
   * Page 복제 (캔버스 데이터 포함)
   *
   * 같은 워크스페이스 내에서 페이지와 캔버스 데이터를 복제
   * - 원본과 같은 부모 아래에 복제
   * - 원본 바로 다음 위치에 배치
   * - 캔버스 데이터(블록, 엣지) 포함
   *
   * @param params - 복제 파라미터
   * @returns PageAggregate (성공) | Error code (실패)
   */
  duplicatePageWithCanvas(params: {
    pageId: PageId;
    userId: string;
  }): Promise<Result<PageAggregate>>;
}
