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
  delete(edgeId: EdgeId): Promise<void>;
  deleteAll(edgeIds: EdgeId[]): Promise<void>;
}
