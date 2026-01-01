// apps/web/src/domains/canvas-management/backend/services/canvas-block-mount.service.ts
import type { BlockManagementService } from '@/domains/block-management/backend/services/block-management.service';
import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';
import type { BlockMountRepository } from '@/domains/canvas-management/backend/repositories/interfaces/block-mount.repository.interface';
import { EdgeManagementService } from '@/domains/canvas-management/backend/services/edge.service';
import { BlockMountAggregate } from '@/domains/canvas-management/shared/aggregates/block-mount.aggregate';
import type {
  CreateAndMountBlockRequest,
  DuplicateBlockAndMountRequest,
  MoveBlockToPageRequest,
  SoftDeleteBlockMountRequest,
  UpdateBlockPositionRequest,
  UpdateBlockSizeRequest,
} from '@/domains/canvas-management/shared/dtos/requests';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { Result } from '@/utils/result';

import { createAndMountBlock } from './block-mount/create-and-mount-block.service';
import { duplicateBlockAndMount } from './block-mount/duplicate-block-and-mount.service';
import { moveBlockToPage } from './block-mount/move-block-to-page.service';
import { softDeleteBlockMount } from './block-mount/soft-delete-block-mount.service';
import { updateBlockPosition } from './block-mount/update-block-position.service';
import { updateBlockSize } from './block-mount/update-block-size.service';
import type { ICanvasBlockMountService } from './interfaces/canvas-block-mount.service.interface';

/**
 * Canvas Block Mount Service
 *
 * 블럭 마운트 관련 비즈니스 로직을 담당하는 서비스 구현 (Drizzle ORM 사용)
 *
 * 의존성 주입과 함수 위임만 담당 (EdgeManagementService 패턴)
 */
export class CanvasBlockMountService implements ICanvasBlockMountService {
  constructor(
    private blockManagementService: BlockManagementService,
    private blockMountRepository: BlockMountRepository,
    private edgeManagementService: EdgeManagementService
  ) {}

  /**
   * 블럭 생성 후 마운트하는 통합 메서드
   * Block Management Service를 사용하여 블럭 생성 후 마운트
   *
   * ✅ Event Storming + DDD 패턴:
   * - SafeDTO를 입력으로 받음
   * - SafeDTO → Command 변환 (Value Objects 생성 포함)
   */
  async createAndMountBlock(
    safeDto: CreateAndMountBlockRequest & {
      userId: string;
      workspaceId: string;
    }
  ): Promise<
    Result<
      {
        blockMountAggregate: BlockMountAggregate;
        blockAggregate: BlockAggregate;
      },
      Error
    >
  > {
    return createAndMountBlock(
      safeDto,
      this.blockManagementService,
      this.blockMountRepository
    );
  }

  /**
   * 블럭 위치 업데이트 (단일 또는 다중)
   *
   * ✅ Event Storming + DDD 패턴:
   * - SafeDTO를 입력으로 받음
   * - SafeDTO → Command 변환 (Value Objects 생성 포함)
   */
  async updateBlockPosition(
    safeDto: UpdateBlockPositionRequest & {
      userId: string;
    }
  ): Promise<Result<BlockMountAggregate[], Error>> {
    return updateBlockPosition(safeDto, this.blockMountRepository);
  }

  /**
   * 블럭 크기 업데이트
   *
   * ✅ Event Storming + DDD 패턴:
   * - SafeDTO를 입력으로 받음
   * - SafeDTO → Command 변환 (Value Objects 생성 포함)
   */
  async updateBlockSize(
    safeDto: UpdateBlockSizeRequest & {
      userId: string;
    }
  ): Promise<Result<BlockMountAggregate, Error>> {
    return updateBlockSize(safeDto, this.blockMountRepository);
  }

  /**
   * 블럭 마운트 삭제 (단일 또는 다중, 연결된 엣지 자동 정리)
   * Story CM-008 구현
   *
   * ✅ Event Storming + DDD 패턴:
   * - SafeDTO를 입력으로 받음
   * - SafeDTO → Command 변환 (Value Objects 생성 포함)
   */
  async softDeleteBlockMount(
    safeDto: SoftDeleteBlockMountRequest & {
      userId: string;
    }
  ): Promise<
    Result<
      {
        deletedCount: number;
        deletedEdgesCount: number;
        deletedBlockMountIds: BlockMountId[];
      },
      Error
    >
  > {
    return softDeleteBlockMount(
      safeDto,
      this.blockMountRepository,
      this.edgeManagementService
    );
  }

  /**
   * 블럭 복제 (Block Management Service와 연동)
   * Story CM-010 구현
   *
   * ✅ Event Storming + DDD 패턴:
   * - SafeDTO를 입력으로 받음
   * - SafeDTO → Command 변환 (Value Objects 생성 포함)
   */
  async duplicateBlockAndMount(
    safeDto: DuplicateBlockAndMountRequest & {
      userId: string;
      workspaceId: string;
    }
  ): Promise<
    Result<
      {
        blockMountAggregate: BlockMountAggregate;
        blockAggregate: BlockAggregate;
      },
      Error
    >
  > {
    return duplicateBlockAndMount(
      safeDto,
      this.blockManagementService,
      this.blockMountRepository
    );
  }

  /**
   * 블럭 페이지 이동
   * Story E010-009 구현
   *
   * ✅ Event Storming + DDD 패턴:
   * - SafeDTO를 입력으로 받음
   * - SafeDTO → Command 변환 (Value Objects 생성 포함)
   */
  async moveBlockToPage(
    safeDto: MoveBlockToPageRequest & {
      userId: string;
    }
  ): Promise<Result<BlockMountAggregate, Error>> {
    return moveBlockToPage(safeDto, this.blockMountRepository);
  }
}
