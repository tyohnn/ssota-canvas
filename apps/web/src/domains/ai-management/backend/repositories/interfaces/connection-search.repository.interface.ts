/**
 * ConnectionSearchRepository Interface
 *
 * Agent connection-search 도구(hopSearch, searchGroup) 전용 Repository.
 * Edge/BlockMount 도메인 레포를 래핑해, AI 도메인에서는 이 인터페이스만 의존하도록 함.
 *
 * - hopSearch: blockMountId에 연결된 엣지 조회 (페이지 스코프 optional)
 * - searchGroup: 페이지 내 block_mounts + blocks JOIN 조회 (그룹 자식 필터는 서비스에서)
 */

import type { BlockMountAggregate } from '@/domains/canvas-management/shared/aggregates/block-mount.aggregate';
import type { EdgeAggregate } from '@/domains/canvas-management/shared/aggregates/edge.aggregate';
import type { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import type { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import type { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';

export interface ConnectionSearchRepository {
  /**
   * blockMountId에 연결된 모든 엣지 조회 (페이지 무관)
   */
  findEdgesByConnectedBlockMountId(
    blockMountId: BlockMountId
  ): Promise<EdgeAggregate[]>;

  /**
   * 특정 페이지 내에서 blockMountId에 연결된 엣지만 조회
   */
  findEdgesByConnectedBlockMountIdAndPageId(
    blockMountId: BlockMountId,
    pageId: PageId
  ): Promise<EdgeAggregate[]>;

  /**
   * 페이지 내 block_mounts + blocks JOIN 조회 (searchGroup에서 그룹 자식 필터링에 사용)
   */
  findBlockMountsWithBlocksByPageId(pageId: PageId): Promise<
    Array<{
      blockMountAggregate: BlockMountAggregate;
      blockAggregate: BlockAggregate;
    }>
  >;
}
