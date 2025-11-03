// apps/web/src/domains/canvas-management/backend/services/interfaces/canvas-block-mount.service.interface.ts

import type { Result } from '@/utils/result';
import type { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import type {
  UpdateBlockPositionCommand,
  UpdateBlockSizeCommand,
  SoftDeleteBlockMountCommand,
  DuplicateBlockMountCommand,
} from '../../../shared/commands';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { BlockType } from '@/domains/block-management/shared/value-objects/block-type.vo';
import { Position } from '@/domains/canvas-management/shared/value-objects/position.vo';
import { Size } from '@/domains/canvas-management/shared/value-objects/size.vo';
import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';

/**
 * Canvas Block Mount Service Interface
 *
 * 블럭 마운트 관련 비즈니스 로직을 담당하는 서비스 인터페이스
 * 구현체는 특정 ORM/DB에 의존하지 않도록 설계
 */
export interface ICanvasBlockMountService {
  /**
   * 블럭 생성 후 마운트하는 통합 메서드
   *
   * @param command - 블럭 생성 및 마운트 Command
   * @returns blockMountAggregate (마운트 정보) + blockEntity (블럭 엔티티) | Error (실패)
   */
  createAndMountBlock(params: {
    userId: UserId;
    workspaceId: WorkspaceId;
    pageId: PageId;
    blockType: BlockType;
    position: Position;
    size: Size;
  }): Promise<
    Result<
      {
        blockMountAggregate: BlockMountAggregate;
        blockAggregate: BlockAggregate;
      },
      Error
    >
  >;

  /**
   * 블럭 위치 업데이트 (단일 또는 다중)
   *
   * @param command - 블럭 위치 업데이트 Command
   * @returns BlockMountAggregate[] (성공) | Error (실패)
   */
  updateBlockPosition(params: {
    blockPositions: { blockMountId: BlockMountId; position: Position }[];
    userId: UserId;
  }): Promise<Result<BlockMountAggregate[], Error>>;

  /**
   * 블럭 크기 업데이트
   *
   * @param command - 블럭 크기 업데이트 Command
   * @returns BlockMountAggregate (성공) | Error (실패)
   */
  updateBlockSize(params: {
    blockMountId: BlockMountId;
    size: Size;
    userId: UserId;
  }): Promise<Result<BlockMountAggregate, Error>>;

  /**
   * 블럭 마운트 삭제 (단일 또는 다중, 연결된 엣지 자동 정리)
   *
   * @param command - 블럭 마운트 삭제 Command
   * @returns 삭제된 블럭과 엣지 개수 (성공) | Error (실패)
   */
  softDeleteBlockMount(params: {
    blockMountIds: BlockMountId[];
    userId: UserId;
  }): Promise<
    Result<
      {
        deletedCount: number;
        deletedEdgesCount: number;
        deletedBlockMountIds: BlockMountId[];
      },
      Error
    >
  >;

  /**
   * 블럭 복제 (Block Management Service와 연동)
   *
   * @param command - 블럭 복제 Command
   * @returns BlockMountAggregate (성공) | Error (실패)
   */
  duplicateBlockAndMount(params: {
    blockMountId: BlockMountId;
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<Result<BlockMountAggregate, Error>>;
}
