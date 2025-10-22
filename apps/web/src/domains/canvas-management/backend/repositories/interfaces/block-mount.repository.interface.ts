import { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { Block } from '@/domains/block-management/shared/entities/block.entity';

export interface BlockMountRepository {
  save(blockMount: BlockMountAggregate): Promise<void>;
  findById(blockMountId: BlockMountId): Promise<BlockMountAggregate | null>;
  findByPageId(pageId: PageId): Promise<BlockMountAggregate[]>;
  delete(blockMountId: BlockMountId): Promise<void>;

  /**
   * 페이지의 BlockMount들과 함께 Block 정보를 JOIN해서 조회
   * @param pageId - 페이지 ID
   * @returns BlockMount와 Block 정보가 포함된 배열
   */
  findByPageIdWithBlocks(pageId: PageId): Promise<
    Array<{
      blockMount: BlockMountAggregate;
      block: Block;
    }>
  >;
}
