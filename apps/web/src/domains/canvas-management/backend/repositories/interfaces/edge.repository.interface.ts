import { EdgeAggregate } from '../../../shared/aggregates/edge.aggregate';
import { EdgeId } from '../../../shared/value-objects/edge-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';

export interface EdgeRepository {
  save(edge: EdgeAggregate): Promise<void>;
  findById(edgeId: EdgeId): Promise<EdgeAggregate | null>;
  findByPageId(pageId: PageId): Promise<EdgeAggregate[]>;
  findByConnectedBlockId(blockId: BlockId): Promise<EdgeAggregate[]>;
  delete(edgeId: EdgeId): Promise<void>;
  deleteAll(edgeIds: EdgeId[]): Promise<void>;
}
