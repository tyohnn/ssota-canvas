// apps/web/src/domains/canvas-management/backend/services/interfaces/canvas-block-mount.service.interface.ts

import type { Result } from '@/utils/result';
import type { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import type {
  CreateAndMountBlockCommand,
  UpdateBlockPositionCommand,
  UpdateBlockSizeCommand,
  UpdateMultipleBlockPositionsCommand,
  DeleteBlockMountCommand,
  DeleteMultipleBlockMountsCommand,
} from '../../../shared/commands';
import type { Block } from '@/domains/block-management/shared/entities/block.entity';

/**
 * Canvas Block Mount Service Interface
 *
 * 블럭 마운트 관련 비즈니스 로직을 담당하는 서비스
 */
export interface CanvasBlockMountService {
  /**
   * 블럭 생성 후 마운트하는 통합 메서드
   *
   * @param command - 블럭 생성 및 마운트 Command
   * @returns BlockMountAggregate (성공) | Error (실패)
   */
  createAndMountBlock(
    command: CreateAndMountBlockCommand
  ): Promise<Result<{ aggregate: BlockMountAggregate; block: Block }, Error>>;

  /**
   * 블럭 위치 업데이트
   *
   * @param command - 블럭 위치 업데이트 Command
   * @returns BlockMountAggregate (성공) | Error (실패)
   */
  updateBlockPosition(
    command: UpdateBlockPositionCommand
  ): Promise<Result<BlockMountAggregate, Error>>;

  /**
   * 블럭 크기 업데이트
   *
   * @param command - 블럭 크기 업데이트 Command
   * @returns BlockMountAggregate (성공) | Error (실패)
   */
  updateBlockSize(
    command: UpdateBlockSizeCommand
  ): Promise<Result<BlockMountAggregate, Error>>;

  /**
   * 다중 블럭 위치 일괄 업데이트 (정렬/분포용)
   *
   * @param command - 다중 블럭 위치 업데이트 Command
   * @returns void (성공) | Error (실패)
   */
  updateMultipleBlockPositions(
    command: UpdateMultipleBlockPositionsCommand
  ): Promise<Result<void, Error>>;

  /**
   * 블럭 마운트 삭제 (연결된 엣지 자동 정리)
   *
   * @param command - 블럭 마운트 삭제 Command
   * @returns 삭제된 엣지 개수 (성공) | Error (실패)
   */
  deleteBlockMount(
    command: DeleteBlockMountCommand
  ): Promise<Result<{ deletedEdgesCount: number }, Error>>;

  /**
   * 다중 블럭 마운트 삭제 (연결된 엣지 자동 정리)
   *
   * @param command - 다중 블럭 마운트 삭제 Command
   * @returns 삭제된 블럭과 엣지 개수 (성공) | Error (실패)
   */
  deleteMultipleBlockMounts(
    command: DeleteMultipleBlockMountsCommand
  ): Promise<
    Result<{ deletedCount: number; deletedEdgesCount: number }, Error>
  >;
}
