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
   * 여러 BlockMount 일괄 생성 (bulk INSERT)
   * 23505 시 전체 ID 재생성 후 재시도, 실제 반영된 ID 목록 반환 (입력 순서)
   *
   * @param blockMounts - 생성할 BlockMount 배열
   * @returns Promise<string[]> - 실제 반영된 blockMountId 목록 (재시도 시 새 ID)
   */
  createMany(blockMounts: BlockMount[]): Promise<string[]>;

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
   * 여러 BlockMount ID로 조회 (입력 ID 순서대로 반환, 없으면 null)
   *
   * @param blockMountIds - BlockMount ID 배열
   * @returns Promise<(BlockMountAggregate | null)[]>
   */
  findByIds(
    blockMountIds: BlockMountId[]
  ): Promise<(BlockMountAggregate | null)[]>;

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
   * 여러 BlockMount 일괄 삭제 (소프트 삭제)
   *
   * @param blockMountIds - BlockMount ID 배열
   * @returns Promise<void>
   */
  softDeleteMany(blockMountIds: BlockMountId[]): Promise<void>;

  /**
   * 페이지의 BlockMount들과 함께 Block 정보를 JOIN해서 조회
   * @param pageId - 페이지 ID
   * @returns BlockMount와 Block 정보가 포함된 배열
   * @note parentBlockMountId는 blockMountAggregate.getBlockMount().parentBlockMountId로 접근
   */
  findByPageIdWithBlocks(pageId: PageId): Promise<
    Array<{
      blockMountAggregate: BlockMountAggregate;
      blockAggregate: BlockAggregate;
    }>
  >;

  /**
   * Parent-Child: parent_block_mount_id와 position만 업데이트 (Group 진입/해제용)
   */
  updateParentAndPosition(
    blockMountId: BlockMountId,
    params: {
      parentBlockMountId: string | null;
      position: { x: number; y: number };
    }
  ): Promise<void>;
}
