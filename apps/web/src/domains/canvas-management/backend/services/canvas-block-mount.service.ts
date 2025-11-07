// apps/web/src/domains/canvas-management/backend/services/canvas-block-mount.service.ts

import { Result } from '@/utils/result';
import type { ICanvasBlockMountService } from './interfaces/canvas-block-mount.service.interface';
import type { BlockMountRepository } from '../repositories/interfaces/block-mount.repository.interface';
import type { EdgeRepository } from '../repositories/interfaces/edge.repository.interface';
import type { BlockManagementService } from '@/domains/block-management/backend/services/block-management.service';
import {
  UpdateBlockPositionCommand,
  UpdateBlockSizeCommand,
  SoftDeleteBlockMountCommand,
  MountBlockCommand,
  DuplicateBlockMountCommand,
} from '../../shared/commands/index';
import { BlockMountAggregate } from '../../shared/aggregates/block-mount.aggregate';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { Block } from '@/domains/block-management/shared/entities/block.entity';
import { CreateBlockCommand } from '@/domains/block-management/shared/commands';
import {
  DomainEvent,
  MultipleBlockPositionsUpdatedEvent,
  MultipleBlockMountsDeletedEvent,
} from '../../shared/events';
import { BlockMountId } from '../../shared/value-objects/block-mount-id.vo';
import { BlockType } from '@/domains/block-management/shared/value-objects/block-type.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { Position } from '@/domains/canvas-management/shared/value-objects/position.vo';
import { Size } from '@/domains/canvas-management/shared/value-objects/size.vo';
import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';

class CanvasManagementError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'CanvasManagementError';
  }
}

/**
 * Canvas Block Mount Service
 *
 * 블럭 마운트 관련 비즈니스 로직을 담당하는 서비스 구현 (Drizzle ORM 사용)
 */
export class CanvasBlockMountService implements ICanvasBlockMountService {
  constructor(
    private blockManagementService: BlockManagementService,
    private blockMountRepository: BlockMountRepository,
    private edgeRepository: EdgeRepository
  ) {}

  /**
   * 블럭 생성 후 마운트하는 통합 메서드
   * Block Management Service를 사용하여 블럭 생성 후 마운트
   */
  async createAndMountBlock(params: {
    userId: UserId;
    workspaceId: WorkspaceId;
    pageId: PageId;
    blockType: BlockType;
    position: Position;
    size: Size;
    initialProperties?: Record<string, any>; // 선택적 초기 properties
    initialContent?: unknown; // 선택적 초기 content (JSONB)
  }): Promise<
    Result<
      {
        blockMountAggregate: BlockMountAggregate;
        blockAggregate: BlockAggregate;
      },
      Error
    >
  > {
    try {
      // 1. Block Management Service를 통해 블럭 생성 (완전한 Block 엔티티 반환)
      const blockAggregate = await this.blockManagementService.createBlock({
        userId: params.userId,
        workspaceId: params.workspaceId,
        blockType: params.blockType,
        title: '새 블럭', // 기본 제목
        initialProperties: params.initialProperties, // 초기 properties 전달
        initialContent: params.initialContent, // ✨ 초기 content 전달
      });

      // 2. Canvas Management Aggregate 생성 (자체 이벤트 생성)
      const blockMountId = new BlockMountId(crypto.randomUUID());
      const mountBlockCommand: MountBlockCommand = {
        blockMountId,
        pageId: params.pageId,
        blockId: blockAggregate.getBlock().id,
        position: params.position,
        size: params.size,
        userId: params.userId,
      };
      const blockMountAggregate =
        BlockMountAggregate.mountBlock(mountBlockCommand);

      // 3. Entity 저장
      try {
        await this.blockMountRepository.create(
          blockMountAggregate.getBlockMount()
        );
      } catch (saveError) {
        console.error(
          '❌ [CanvasBlockMountService] Failed to save block mount:',
          saveError
        );
        return Result.error(
          saveError instanceof Error
            ? saveError
            : new Error('Failed to save block mount')
        );
      }

      // 4. 이벤트 핸들러 실행 (Canvas Management 도메인 내부)
      const events = blockMountAggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 5. 이벤트 커밋
      blockMountAggregate.markEventsAsCommitted();

      // 6. 명시적 변수명으로 반환
      return Result.success({ blockMountAggregate, blockAggregate });
    } catch (error) {
      console.error(
        '💥 [CanvasBlockMountService] Block creation and mounting failed:',
        error
      );
      return Result.error(new Error('Block creation and mounting failed'));
    }
  }

  /**
   * 블럭 위치 업데이트 (단일 또는 다중)
   */
  async updateBlockPosition(params: {
    blockPositions: { blockMountId: BlockMountId; position: Position }[];
    userId: UserId;
  }): Promise<Result<BlockMountAggregate[], Error>> {
    try {
      // 1. 다중 BlockMount 조회
      const aggregates = await Promise.all(
        params.blockPositions.map(bp =>
          this.blockMountRepository.findById(bp.blockMountId)
        )
      );

      // 2. 각 블럭 위치 업데이트
      for (let i = 0; i < aggregates.length; i++) {
        const aggregate = aggregates[i];
        const position = params.blockPositions[i]!.position;

        if (!aggregate) {
          console.warn(
            `⚠️ [CanvasBlockMountService] Block mount not found: ${params.blockPositions[i]!.blockMountId}`
          );
          continue;
        }

        aggregate.updateBlockPosition(position);
      }

      // 3. 배치 저장 (트랜잭션)
      const validAggregates = aggregates.filter(
        (agg): agg is BlockMountAggregate => agg !== null
      );

      await Promise.all(
        validAggregates.map(agg =>
          this.blockMountRepository.update(agg.getBlockMount())
        )
      );

      // 4. 이벤트 처리
      const individualEvents = validAggregates.flatMap(agg =>
        agg.getUncommittedEvents()
      );

      // 다중 위치 업데이트인 경우 통합 이벤트 추가
      let allEvents = individualEvents;
      if (validAggregates.length > 1) {
        const multiplePositionsEvent = new MultipleBlockPositionsUpdatedEvent(
          'batch-update',
          {
            blockMountIds: validAggregates.map(
              agg => agg.getBlockMount().id.value
            ),
            positions: params.blockPositions.map(bp => ({
              blockMountId: bp.blockMountId.value,
              position: bp.position,
            })),
            userId: params.userId.value,
          },
          new Date()
        );
        allEvents = [...individualEvents, multiplePositionsEvent];
      }

      await this.handleDomainEvents(allEvents);

      // 5. Result.success(aggregates) 반환
      return Result.success(validAggregates);
    } catch (error) {
      console.error(
        '❌ [CanvasBlockMountService] Block position update failed:',
        error
      );
      return Result.error(
        new CanvasManagementError(
          'POSITION_UPDATE_FAILED',
          `Failed to update block position: ${error}`
        )
      );
    }
  }

  /**
   * 블럭 크기 업데이트
   */
  async updateBlockSize(params: {
    blockMountId: BlockMountId;
    size: Size;
    userId: UserId;
  }): Promise<Result<BlockMountAggregate, Error>> {
    try {
      // 1. BlockMountRepository.findById() 호출
      const aggregate = await this.blockMountRepository.findById(
        params.blockMountId
      );

      if (!aggregate) {
        return Result.error(
          new CanvasManagementError(
            'BLOCK_MOUNT_NOT_FOUND',
            'Block mount not found'
          )
        );
      }

      // 2. BlockMountAggregate.updateBlockSize() 호출
      aggregate.updateBlockSize(params.size);

      // 3. 배치 저장 (트랜잭션)
      await this.blockMountRepository.update(aggregate.getBlockMount());

      // 4. 이벤트 처리
      const individualEvents = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(individualEvents);

      // 5. Result.success(aggregate) 반환
      return Result.success(aggregate);
    } catch (error) {
      console.error(
        '❌ [CanvasBlockMountService] Block size update failed:',
        error
      );
      return Result.error(
        new CanvasManagementError(
          'SIZE_UPDATE_FAILED',
          `Failed to update block size: ${error}`
        )
      );
    }
  }

  /**
   * 블럭 마운트 삭제 (단일 또는 다중, 연결된 엣지 자동 정리)
   * Story CM-008 구현
   */
  async softDeleteBlockMount(params: {
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
  > {
    try {
      // 1. 다중 BlockMount 조회
      const aggregates = await Promise.all(
        params.blockMountIds.map(id => this.blockMountRepository.findById(id))
      );

      // 2. 유효한 블럭 마운트 aggregate들 필터링
      const validAggregates = aggregates.filter(
        (agg): agg is BlockMountAggregate => agg !== null
      );

      if (validAggregates.length === 0) {
        return Result.error(
          new CanvasManagementError(
            'BLOCK_MOUNT_NOT_FOUND',
            'No valid block mounts found'
          )
        );
      }

      // 3-6. 각 BlockMount 삭제를 병렬로 처리 (Promise.allSettled 사용)
      const deletionResults = await Promise.allSettled(
        validAggregates.map(async aggregate => {
          // 1. Aggregate에서 deleteBlockMount 호출
          const blockMount = aggregate.getBlockMount();
          const deleteBlockMountCommand: SoftDeleteBlockMountCommand = {
            blockMountId: blockMount.id,
            userId: params.userId,
          };
          aggregate.deleteBlockMount(deleteBlockMountCommand);

          // 2. 연결된 엣지 조회
          const connectedEdges =
            await this.edgeRepository.findByConnectedBlockMountId(
              blockMount.id
            );

          // 3. 엣지 삭제
          if (connectedEdges.length > 0) {
            const edgeIds = connectedEdges.map(edgeAgg => edgeAgg.edge.id);
            await this.edgeRepository.deleteAll(edgeIds);
          }

          // 4. BlockMount 삭제
          await this.blockMountRepository.softDelete(blockMount.id);

          return {
            aggregate,
            deletedEdgesCount: connectedEdges.length,
          };
        })
      );

      // Log rejected errors
      const rejectedResults = deletionResults.filter(
        r => r.status === 'rejected'
      );
      if (rejectedResults.length > 0) {
        console.error(
          '❌ [CanvasBlockMountService] Some deletions failed:',
          rejectedResults.map((r, i) => ({
            index: i,
            reason: (r as PromiseRejectedResult).reason,
          }))
        );
      }

      // 7. 성공한 작업들만 이벤트 처리
      const successfulResults = deletionResults
        .filter(
          (
            result
          ): result is PromiseFulfilledResult<{
            aggregate: BlockMountAggregate;
            deletedEdgesCount: number;
          }> => result.status === 'fulfilled'
        )
        .map(result => result.value);

      const individualEvents = successfulResults.flatMap(result =>
        result.aggregate.getUncommittedEvents()
      );

      // 다중 삭제인 경우 통합 이벤트 추가 (성공한 것들만)
      let allEvents = individualEvents;
      if (successfulResults.length > 1) {
        const totalDeletedEdgesCount = successfulResults.reduce(
          (sum, result) => sum + result.deletedEdgesCount,
          0
        );

        const multipleDeletionsEvent = new MultipleBlockMountsDeletedEvent(
          'batch-delete',
          {
            deletedBlockMountIds: successfulResults.map(
              result => result.aggregate.getBlockMount().id.value
            ),
            deletedEdgesCount: totalDeletedEdgesCount,
            deletedAt: new Date(),
            userId: params.userId.value,
          },
          new Date()
        );
        allEvents = [...individualEvents, multipleDeletionsEvent];
      }

      await this.handleDomainEvents(allEvents);

      // 8. Result.success 반환 (성공한 것들만)
      const totalDeletedEdgesCount = successfulResults.reduce(
        (sum, result) => sum + result.deletedEdgesCount,
        0
      );

      return Result.success({
        deletedCount: successfulResults.length,
        deletedEdgesCount: totalDeletedEdgesCount,
        deletedBlockMountIds: successfulResults.map(
          result => result.aggregate.getBlockMount().id
        ),
      });
    } catch (error) {
      console.error(
        '❌ [CanvasBlockMountService] Block mount deletion failed:',
        error
      );
      return Result.error(
        new CanvasManagementError(
          'BLOCK_MOUNT_DELETION_FAILED',
          `Failed to delete block mount: ${error}`
        )
      );
    }
  }

  /**
   * 블럭 복제 (Block Management Service와 연동)
   * Story CM-010 구현
   */
  async duplicateBlockAndMount(params: {
    blockMountId: BlockMountId;
    offsetX: number;
    offsetY: number;
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<Result<BlockMountAggregate, Error>> {
    try {
      // 1. 원본 BlockMount 조회
      const originalAggregate = await this.blockMountRepository.findById(
        params.blockMountId
      );

      if (!originalAggregate) {
        return Result.error(
          new CanvasManagementError(
            'BLOCK_MOUNT_NOT_FOUND',
            'Block mount not found'
          )
        );
      }

      // 2. Block Management Service를 통해 블럭 복제
      const duplicatedBlock = await this.blockManagementService.duplicateBlock({
        originalBlockId: originalAggregate.getBlockMount().blockId,
        workspaceId: params.workspaceId,
        userId: params.userId,
      });

      // 3. BlockMountAggregate.duplicateBlock() 호출
      const duplicateBlockMountCommand: DuplicateBlockMountCommand = {
        newBlockId: duplicatedBlock.id,
        originalBlockMount: originalAggregate.getBlockMount(),
        offsetX: params.offsetX,
        offsetY: params.offsetY,
      };
      const duplicatedAggregate = originalAggregate.duplicateBlockMount(
        duplicateBlockMountCommand
      );

      // 4. BlockMountRepository에 저장
      try {
        await this.blockMountRepository.create(
          duplicatedAggregate.getBlockMount()
        );
      } catch (saveError) {
        return Result.error(
          saveError instanceof Error
            ? saveError
            : new Error('Failed to save duplicated block mount')
        );
      }

      // 5. 이벤트 핸들러 실행 (Canvas Management 도메인 내부)
      const events = duplicatedAggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 6. 이벤트 커밋
      duplicatedAggregate.markEventsAsCommitted();

      return Result.success(duplicatedAggregate);
    } catch (error) {
      return Result.error(
        new CanvasManagementError(
          'BLOCK_DUPLICATION_FAILED',
          `Failed to duplicate block: ${error}`
        )
      );
    }
  }

  /**
   * 도메인 이벤트 처리 (Canvas Management 도메인 내부) - 비동기 병렬 처리
   *
   * Event Bus 없이 비동기로 처리:
   * 1. Aggregate에서 이벤트 수집
   * 2. Service에서 이벤트 핸들러 병렬 실행
   * 3. Event Storming의 Policy와 1:1 매칭
   *
   * @param events - 처리할 도메인 이벤트 목록
   */
  private async handleDomainEvents(events: DomainEvent[]): Promise<void> {
    // Promise.allSettled를 사용하여 일부 이벤트 실패 시에도 다른 이벤트는 계속 처리
    const results = await Promise.allSettled(
      events.map(async event => {
        // Event Storming과 매칭: Canvas Management 도메인 이벤트 처리
        if (event.type === 'BlockMounted') {
          return await this.handleBlockMounted(event);
        } else if (event.type === 'BlockPositionUpdated') {
          return await this.handleBlockPositionUpdated(event);
        } else if (event.type === 'BlockSizeUpdated') {
          return await this.handleBlockSizeUpdated(event);
        } else if (event.type === 'MultipleBlockPositionsUpdated') {
          return await this.handleMultipleBlockPositionsUpdated(event);
        } else if (event.type === 'MultipleBlockMountsDeleted') {
          return await this.handleMultipleBlockMountsDeleted(event);
        } else if (event.type === 'BlockMountDeleted') {
          return await this.handleBlockDeleted(event);
        } else if (event.type === 'BlockMountDuplicated') {
          return await this.handleBlockMountDuplicated(event);
        }

        // 알 수 없는 이벤트 타입의 경우 무시
        return Promise.resolve();
        // 필요에 따라 다른 이벤트 핸들러 추가
      })
    );

    // 실패한 이벤트 로깅
    const failures = results.filter(
      result => result.status === 'rejected'
    ) as PromiseRejectedResult[];

    if (failures.length > 0) {
      console.warn(
        `[CanvasBlockMountService] ${failures.length} event handler(s) failed:`,
        failures.map(f => f.reason)
      );
    }
  }

  /**
   * Policy: 블럭이 마운트되었을 때
   *
   * Event Storming에서 정의한 Policy 구현:
   * - 예: 특정 블럭 타입이 마운트되면 자동으로 엣지 생성
   * - 예: 캔버스 통계 업데이트
   * - 예: 알림 전송
   */
  private async handleBlockMounted(event: DomainEvent): Promise<void> {
    console.log('[Canvas Management] Block Mounted:', {
      blockMountId: event.aggregateId,
      data: event.data,
    });

    // Policy 구현 예시:
    // - 자동 엣지 연결 확인
    // - 캔버스 레이아웃 최적화
    // - 통계 업데이트
  }

  /**
   * Policy: 블럭 위치가 업데이트되었을 때
   */
  private async handleBlockPositionUpdated(event: DomainEvent): Promise<void> {
    console.log('[Canvas Management] Block Position Updated:', {
      blockMountId: event.aggregateId,
      data: event.data,
    });

    // Policy 구현 예시:
    // - 겹침 감지 및 자동 조정
    // - 가이드라인 업데이트
  }

  /**
   * Policy: 블럭 크기가 업데이트되었을 때
   */
  private async handleBlockSizeUpdated(event: DomainEvent): Promise<void> {
    console.log('[Canvas Management] Block Size Updated:', {
      blockMountId: event.aggregateId,
      data: event.data,
    });

    // Policy 구현 예시:
    // - 최소/최대 크기 제한 확인
    // - 엣지 재계산
  }

  /**
   * Policy: 다중 블럭 위치가 업데이트되었을 때
   */
  private async handleMultipleBlockPositionsUpdated(
    event: DomainEvent
  ): Promise<void> {
    console.log('[Canvas Management] Multiple Block Positions Updated:', {
      eventId: event.aggregateId,
      data: event.data,
    });

    // Policy 구현 예시:
    // - 배치 이동 최적화
    // - 겹침 감지 및 자동 조정
    // - 가이드라인 업데이트
    // - 성능 최적화를 위한 배치 처리
  }

  /**
   * Policy: 다중 블럭이 삭제되었을 때
   */
  private async handleMultipleBlockMountsDeleted(
    event: DomainEvent
  ): Promise<void> {
    console.log('[Canvas Management] Multiple Block Mounts Deleted:', {
      eventId: event.aggregateId,
      data: event.data,
    });

    // Policy 구현 예시:
    // - 캔버스 통계 일괄 업데이트
    // - 레이아웃 자동 재정렬
    // - 성능 최적화를 위한 배치 처리
  }

  /**
   * Policy: 블럭이 삭제되었을 때
   */
  private async handleBlockDeleted(event: DomainEvent): Promise<void> {
    console.log('[Canvas Management] Block Deleted:', {
      blockMountId: event.aggregateId,
      data: event.data,
    });

    // Policy 구현 예시:
    // - 연결된 엣지 정리 (이미 서비스에서 처리됨)
    // - 캔버스 통계 업데이트
    // - 레이아웃 재정렬
  }

  /**
   * Policy: 블럭 마운트가 복제되었을 때
   */
  private async handleBlockMountDuplicated(event: DomainEvent): Promise<void> {
    console.log('[Canvas Management] Block Mount Duplicated:', {
      blockMountId: event.aggregateId,
      data: event.data,
    });

    // Policy 구현 예시:
    // - 복제된 블럭의 자동 연결
    // - 캔버스 통계 업데이트
    // - 레이아웃 최적화
  }
}
