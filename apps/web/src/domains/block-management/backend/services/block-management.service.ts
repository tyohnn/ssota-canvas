import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';

import { BlockAggregate } from '../../shared/aggregates/block.aggregate';
import {
  CreateBlockCommand,
  DeleteBlockCommand,
  DuplicateBlockCommand,
  UpdateBlockCommand,
} from '../../shared/commands';
import { Block } from '../../shared/entities/block.entity';
import { BlockManagementError } from '../../shared/errors/block-management.error';
import {
  BlockCreatedEvent,
  BlockDeletedEvent,
  BlockDuplicatedEvent,
  BlockUpdatedEvent,
} from '../../shared/events';
import { BlockId } from '../../shared/value-objects/block-id.vo';
import { BlockType } from '../../shared/value-objects/block-type.vo';
import { BlockRepository } from '../repositories/interfaces/block.repository.interface';

// BlockManagementService가 처리할 이벤트 타입 정의
type BlockManagementEvents =
  | BlockCreatedEvent
  | BlockUpdatedEvent
  | BlockDeletedEvent
  | BlockDuplicatedEvent;

/**
 * BlockManagementService
 *
 * 블록 관리의 핵심 비즈니스 로직을 담당하는 Application Service
 */
export class BlockManagementService {
  constructor(private readonly blockRepository: BlockRepository) {}

  /**
   * 이벤트가 BlockManagementService가 처리할 이벤트인지 확인
   */
  private isBlockManagementEvent(event: any): event is BlockManagementEvents {
    return (
      event instanceof BlockCreatedEvent ||
      event instanceof BlockUpdatedEvent ||
      event instanceof BlockDeletedEvent ||
      event instanceof BlockDuplicatedEvent
    );
  }

  /**
   * 블록 조회
   *
   * @param blockId - 블록 ID
   * @returns 블록 Aggregate
   */
  async getBlock(blockId: BlockId): Promise<BlockAggregate> {
    try {
      const block = await this.blockRepository.findById(blockId);

      if (!block) {
        throw new BlockManagementError(
          'BLOCK_NOT_FOUND',
          `Block with ID ${blockId.value} not found`
        );
      }

      return BlockAggregate.reconstitute(block);
    } catch (error) {
      if (error instanceof BlockManagementError) {
        throw error;
      }
      throw new BlockManagementError(
        'BLOCK_FETCH_FAILED',
        `Failed to fetch block: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 블록 생성
   *
   * @param params - 블록 생성 파라미터
   * @returns 생성된 블록 정보
   */
  async createBlock(params: {
    userId: UserId;
    workspaceId: WorkspaceId;
    blockType: BlockType;
    title: string;
    initialProperties?: Record<string, any>; // 선택적 초기 properties
    initialContent?: unknown; // 선택적 초기 content (JSONB)
  }): Promise<BlockAggregate> {
    try {
      // Aggregate 생성
      const createBlockCommand: CreateBlockCommand = {
        userId: params.userId,
        workspaceId: params.workspaceId,
        blockId: BlockId.generate(),
        blockType: params.blockType,
        title: params.title,
        initialProperties: params.initialProperties, // 초기 properties 전달
        initialContent: params.initialContent, // ✨ 초기 content 전달
      };
      const aggregate = BlockAggregate.create(createBlockCommand);

      // 블록 생성
      await this.blockRepository.create(aggregate.getBlock());

      // 도메인 이벤트 처리 (실제 구현에서는 Event Store에 저장)
      const events = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 이벤트 커밋
      aggregate.markEventsAsCommitted();

      // 완전한 Block 엔티티 반환
      return aggregate;
    } catch (error) {
      throw new BlockManagementError(
        'BLOCK_CREATION_FAILED',
        `Failed to create block: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 블록 제목 업데이트
   *
   * @param blockId - 블록 ID
   * @param title - 새로운 제목
   * @param workspaceId - 워크스페이스 ID (소유권 검증용)
   * @returns 업데이트된 블록 Aggregate
   */
  async updateBlockTitle(
    blockId: BlockId,
    title: string,
    workspaceId: string
  ): Promise<BlockAggregate> {
    try {
      // 블록 조회
      const aggregate = await this.getBlock(blockId);

      // 블록 소유권 확인: 블록이 해당 워크스페이스에 속하는지 검증
      if (aggregate.getWorkspaceId() !== workspaceId) {
        throw new BlockManagementError(
          'WORKSPACE_MISMATCH',
          'Block does not belong to this workspace'
        );
      }

      // 업데이트 Command 생성
      const command: UpdateBlockCommand = {
        blockId,
        updateData: { title },
      };

      // 블록 업데이트
      aggregate.update(command);

      // 블록 업데이트
      await this.blockRepository.update(aggregate.getBlock());

      // 도메인 이벤트 처리
      const events = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 이벤트 커밋
      aggregate.markEventsAsCommitted();

      return aggregate;
    } catch (error) {
      if (error instanceof BlockManagementError) {
        throw error;
      }
      throw new BlockManagementError(
        'BLOCK_UPDATE_FAILED',
        `Failed to update block title: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 블록 업데이트
   *
   * @param blockId - 블록 ID
   * @param updates - 업데이트할 내용
   */
  async updateBlock(
    blockId: BlockId,
    updates: {
      blockType?: BlockType;
      properties?: Record<string, any>;
      customProperties?: Array<{
        id: string;
        name: string;
        type: string;
        options?: Array<{ id: string; label: string; color: string }>;
        order: number;
        visible: boolean;
      }>;
    }
  ): Promise<void> {
    try {
      // 블록 조회
      const aggregate = await this.getBlock(blockId);

      // 업데이트 Command 생성
      const command: UpdateBlockCommand = {
        blockId,
        updateData: updates,
      };

      // 블록 업데이트
      aggregate.update(command);

      // 블록 업데이트
      await this.blockRepository.update(aggregate.getBlock());

      // 도메인 이벤트 처리
      const events = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 이벤트 커밋
      aggregate.markEventsAsCommitted();
    } catch (error) {
      if (error instanceof BlockManagementError) {
        throw error;
      }
      throw new BlockManagementError(
        'BLOCK_UPDATE_FAILED',
        `Failed to update block: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 블록 삭제
   *
   * @param blockId - 블록 ID
   */
  async softDeleteBlock(blockId: BlockId): Promise<void> {
    try {
      // 블록 조회
      const aggregate = await this.getBlock(blockId);

      // 삭제 Command 생성
      const command: DeleteBlockCommand = {
        blockId,
      };

      // 블록 삭제
      aggregate.delete(command);

      // 블록 업데이트
      await this.blockRepository.update(aggregate.getBlock());

      // 도메인 이벤트 처리
      const events = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 이벤트 커밋
      aggregate.markEventsAsCommitted();
    } catch (error) {
      if (error instanceof BlockManagementError) {
        throw error;
      }
      throw new BlockManagementError(
        'BLOCK_DELETE_FAILED',
        `Failed to delete block: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 블록 복원
   *
   * @param blockId - 블록 ID
   */
  async restoreBlock(blockId: BlockId): Promise<void> {
    try {
      // 블록 조회 (삭제된 블록도 포함)
      const aggregate = await this.getBlock(blockId);

      // 블록 복원
      aggregate.restore();

      // 블록 업데이트
      await this.blockRepository.update(aggregate.getBlock());

      // 도메인 이벤트 처리
      const events = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 이벤트 커밋
      aggregate.markEventsAsCommitted();
    } catch (error) {
      if (error instanceof BlockManagementError) {
        throw error;
      }
      throw new BlockManagementError(
        'BLOCK_RESTORE_FAILED',
        `Failed to restore block: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 블록 복제
   *
   * @param params - 블록 복제 파라미터
   * @returns 복제된 블록 정보
   */
  async duplicateBlock(params: {
    originalBlockId: BlockId;
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<Block> {
    try {
      // 원본 블록 조회
      const originalBlockAggregate = await this.getBlock(
        params.originalBlockId
      );
      const duplicateBlockCommand: DuplicateBlockCommand = {
        userId: params.userId,
      };
      const duplicatedBlockAggregate = originalBlockAggregate.duplicate(
        duplicateBlockCommand
      );
      const duplicatedBlock = duplicatedBlockAggregate.getBlock();

      // 블록 생성
      await this.blockRepository.create(duplicatedBlock);

      // 도메인 이벤트 처리
      const events = duplicatedBlockAggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 이벤트 커밋
      duplicatedBlockAggregate.markEventsAsCommitted();

      return duplicatedBlock;
    } catch (error) {
      if (error instanceof BlockManagementError) {
        throw error;
      }
      throw new BlockManagementError(
        'BLOCK_DUPLICATION_FAILED',
        `Failed to duplicate block: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 도메인 이벤트 처리 (Block Management 도메인 내부) - 비동기 병렬 처리
   *
   * Event Bus 없이 비동기로 처리:
   * 1. Aggregate에서 이벤트 수집
   * 2. Service에서 이벤트 핸들러 병렬 실행
   * 3. Event Storming의 Policy와 1:1 매칭
   *
   * @param events - 처리할 도메인 이벤트 목록
   */
  private async handleDomainEvents(events: Array<any>): Promise<void> {
    // Promise.allSettled를 사용하여 일부 이벤트 실패 시에도 다른 이벤트는 계속 처리
    const results = await Promise.allSettled(
      events
        .filter(event => this.isBlockManagementEvent(event))
        .map(async event => {
          // Event Storming과 매칭: Block Management 도메인 이벤트 처리
          if (event instanceof BlockCreatedEvent) {
            return await this.handleBlockCreated(event);
          } else if (event instanceof BlockUpdatedEvent) {
            return await this.handleBlockUpdated(event);
          } else if (event instanceof BlockDeletedEvent) {
            return await this.handleBlockDeleted(event);
          } else if (event instanceof BlockDuplicatedEvent) {
            return await this.handleBlockDuplicated(event);
          }
          // BlockPropertyUpdatedEvent는 BlockPropertyService에서 처리하므로 여기서는 무시
        })
    );

    // 실패한 이벤트 로깅
    const failures = results.filter(
      result => result.status === 'rejected'
    ) as PromiseRejectedResult[];

    if (failures.length > 0) {
      console.warn(
        `[BlockManagementService] ${failures.length} event handler(s) failed:`,
        failures.map(f => f.reason)
      );
    }
  }

  /**
   * Policy: 블럭이 생성되었을 때
   *
   * Event Storming에서 정의한 Policy 구현:
   * - 예: 블럭 생성 로그 기록
   * - 예: 워크스페이스 통계 업데이트
   * - 예: 생성자별 블럭 수 추적
   */
  private async handleBlockCreated(event: BlockCreatedEvent): Promise<void> {
    console.log('[Block Management] Block Created:', {
      type: event.type,
      data: event.data,
      occurredAt: event.occurredAt,
    });

    // Policy 구현 예시:
    // - 블럭 생성 통계 업데이트
    // - 생성자별 활동 추적
    // - 워크스페이스별 블럭 수 증가
  }

  /**
   * Policy: 블럭이 업데이트되었을 때
   *
   * Event Storming에서 정의한 Policy 구현:
   * - 예: 블럭 변경 로그 기록
   * - 예: 버전 관리
   * - 예: 감사 추적
   */
  private async handleBlockUpdated(event: BlockUpdatedEvent): Promise<void> {
    console.log('[Block Management] Block Updated:', {
      blockId: event.aggregateId.value,
      data: event.data,
    });

    // Policy 구현 예시:
    // - 블럭 변경 이력 기록
    // - 버전 관리 시스템 업데이트
    // - 감사 로그 생성
  }

  /**
   * Policy: 블럭이 삭제되었을 때
   *
   * Event Storming에서 정의한 Policy 구현:
   * - 예: 블럭 삭제 로그 기록
   * - 예: 관련 데이터 정리
   * - 예: 복원 가능성 확인
   */
  private async handleBlockDeleted(event: BlockDeletedEvent): Promise<void> {
    console.log('[Block Management] Block Deleted:', {
      blockId: event.aggregateId.value,
      data: event.data,
    });

    // Policy 구현 예시:
    // - 블럭 삭제 이력 기록
    // - 관련 미디어 파일 정리
    // - 복원 가능성 확인
  }

  /**
   * Policy: 블록이 복제되었을 때
   *
   * Event Storming에서 정의한 Policy 구현:
   * - 예: 블록 복제 로그 기록
   * - 예: 복제된 블록 추적
   */
  private async handleBlockDuplicated(
    event: BlockDuplicatedEvent
  ): Promise<void> {
    console.log('[Block Management] Block Duplicated:', {
      originalBlockId: event.data.originalBlockId.value,
      duplicatedBlockId: event.data.duplicatedBlockId.value,
    });

    // Policy 구현 예시:
    // - 블록 복제 이력 기록
    // - 복제된 블록 추적
  }
}
