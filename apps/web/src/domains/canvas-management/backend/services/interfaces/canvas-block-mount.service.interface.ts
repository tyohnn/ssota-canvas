// apps/web/src/domains/canvas-management/backend/services/interfaces/canvas-block-mount.service.interface.ts

import type { Result } from '@/utils/result';
import type { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import type {
  CreateAndMountBlockCommand,
  UpdateBlockPositionCommand,
  UpdateBlockSizeCommand,
  UpdateMultipleBlockPositionsCommand,
} from '../../../shared/commands';

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
  ): Promise<Result<BlockMountAggregate, Error>>;

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
}
