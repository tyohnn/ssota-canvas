import { PageAggregate } from '../../../shared/aggregates/page.aggregate';
import { Page } from '../../../shared/entities/page.entity';
import { PageId } from '../../../shared/value-objects/page-id.vo';
import { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';

/**
 * Page Repository Interface
 *
 * Page Aggregate의 영속성을 담당하는 Repository 계약
 */
export interface PageRepository {
  /**
   * Page 저장 (생성 또는 업데이트)
   *
   * @param aggregate - Page Aggregate
   */
  save(aggregate: PageAggregate): Promise<void>;

  /**
   * ID로 Page 조회
   */
  findById(id: PageId): Promise<Page | null>;

  /**
   * Workspace의 모든 Page 트리 조회 (재귀 CTE)
   *
   * @returns depth, order 순으로 정렬된 플랫 배열
   */
  findTreeByWorkspaceId(workspaceId: WorkspaceId): Promise<Page[]>;

  /**
   * Page의 모든 조상 조회 (재귀 CTE)
   *
   * @returns 조상 페이지 배열 (순환 참조 체크용)
   */
  findAncestors(pageId: PageId): Promise<Page[]>;

  /**
   * Page의 depth 업데이트
   *
   * @param pageId - Page ID
   * @param newDepth - 새 depth 값
   */
  updateDepth(pageId: PageId, newDepth: number): Promise<void>;

  /**
   * 하위 페이지들의 depth 재귀적으로 업데이트
   *
   * @param parentId - 부모 페이지 ID
   * @param depthDelta - depth 변화량
   */
  updateChildrenDepth(parentId: PageId, depthDelta: number): Promise<void>;
}
