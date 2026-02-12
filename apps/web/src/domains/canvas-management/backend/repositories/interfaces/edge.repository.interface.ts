import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

import { EdgeAggregate } from '../../../shared/aggregates/edge.aggregate';
import { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';
import { EdgeId } from '../../../shared/value-objects/edge-id.vo';

/**
 * EdgeRepository Interface
 *
 * ⚠️ Schema Change: edges now reference block_mounts instead of blocks
 */
export interface EdgeRepository {
  create(edge: EdgeAggregate): Promise<void>;
  update(edge: EdgeAggregate): Promise<void>;
  findById(edgeId: EdgeId): Promise<EdgeAggregate | null>;
  findByPageId(pageId: PageId): Promise<EdgeAggregate[]>;
  findByConnectedBlockMountId(
    blockMountId: BlockMountId
  ): Promise<EdgeAggregate[]>;

  /**
   * 특정 페이지에서, 해당 blockMountId에 연결된 Edge만 조회.
   * hop 검색 등 페이지 스코프가 있을 때 사용.
   */
  findByConnectedBlockMountIdAndPageId(
    blockMountId: BlockMountId,
    pageId: PageId
  ): Promise<EdgeAggregate[]>;

  /**
   * 여러 BlockMount ID 중 하나라도 source/target인 Edge 조회
   */
  findByConnectedBlockMountIds(
    blockMountIds: BlockMountId[]
  ): Promise<EdgeAggregate[]>;

  delete(edgeId: EdgeId): Promise<void>;
  deleteAll(edgeIds: EdgeId[]): Promise<void>;
}
