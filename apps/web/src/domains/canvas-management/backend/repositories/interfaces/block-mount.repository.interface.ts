import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

import { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import { BlockMount } from '../../../shared/entities/block-mount.entity';
import { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';

export interface BlockMountRepository {
  /**
   * BlockMount 생성
   *
   * @param blockMount - 생성할 BlockMount
   * @returns Promise<void>
   */
  create(blockMount: BlockMount): Promise<void>;

  /**
   * BlockMount 업데이트
   *
   * @param blockMount - 업데이트할 BlockMount
   * @returns Promise<void>
   */
  update(blockMount: BlockMount): Promise<void>;

  /**
   * BlockMount ID로 조회
   *
   * @param blockMountId - BlockMount ID
   * @returns Promise<BlockMount | null>
   */
  findById(blockMountId: BlockMountId): Promise<BlockMountAggregate | null>;

  /**
   * 페이지 ID로 BlockMount 목록 조회
   *
   * @param pageId - 페이지 ID
   * @returns Promise<BlockMount[]>
   */
  findByPageId(pageId: PageId): Promise<BlockMountAggregate[]>;

  /**
   * BlockMount 삭제
   *
   * @param blockMountId - BlockMount ID
   * @returns Promise<void>
   */
  softDelete(blockMountId: BlockMountId): Promise<void>;

  /**
   * 페이지의 BlockMount들과 함께 Block 정보를 JOIN해서 조회
   * @param pageId - 페이지 ID
   * @returns BlockMount와 Block 정보가 포함된 배열
   */
  findByPageIdWithBlocks(pageId: PageId): Promise<
    Array<{
      blockMountAggregate: BlockMountAggregate;
      blockAggregate: BlockAggregate;
    }>
  >;
}
