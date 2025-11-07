import { BlockId } from '../../shared/value-objects/block-id.vo';
import { BlockAggregate } from '../../shared/aggregates/block.aggregate';
import { BlockRepository } from '../repositories/interfaces/block.repository.interface';
import {
  UpdateBlockPropertyCommand,
  UpdateBlockContentCommand,
} from '../../shared/commands';
import { BlockPropertyUpdatedEvent } from '../../shared/events';
import { BlockManagementError } from '../../shared/errors/block-management.error';

/**
 * BlockPropertyService
 *
 * 블록 속성 및 콘텐츠 업데이트를 담당하는 Application Service
 * Command 패턴을 사용하여 직접 구현
 */
export class BlockPropertyService {
  constructor(private readonly blockRepository: BlockRepository) {}

  /**
   * 블록 속성 업데이트 (Command 패턴)
   *
   * @param command - 속성 업데이트 Command
   * @returns 업데이트된 시간 정보
   */
  async updateProperty(
    command: UpdateBlockPropertyCommand
  ): Promise<{ updatedAt: Date }> {
    try {
      // 1. 속성 경로 검증
      if (!command.propertyPath || command.propertyPath.trim() === '') {
        throw new BlockManagementError(
          'INVALID_PROPERTY_PATH',
          'Property path is required'
        );
      }

      // 2. 블록 조회 및 소유권 확인 (Low Hanging Fruit: 중복 DB 조회 제거)
      const block = await this.blockRepository.findById(command.blockId);
      if (!block) {
        throw new BlockManagementError('BLOCK_NOT_FOUND', 'Block not found');
      }

      // 3. 블록 소유권 확인: 블록이 해당 워크스페이스에 속하는지 검증
      if (block.workspaceId.value !== command.workspaceId) {
        throw new BlockManagementError(
          'WORKSPACE_MISMATCH',
          'Block does not belong to this workspace'
        );
      }

      // 4. Aggregate 재구성
      const aggregate = BlockAggregate.reconstitute(block);

      // 5. 블록 속성 업데이트
      aggregate.updateProperty(command);

      // 6. 블록 업데이트
      const updatedBlock = aggregate.getBlock();
      await this.blockRepository.update(updatedBlock);

      // 7. 도메인 이벤트 처리
      const events = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 8. 이벤트 커밋
      aggregate.markEventsAsCommitted();

      // 9. 업데이트된 시간 반환
      return { updatedAt: updatedBlock.updatedAt };
    } catch (error) {
      if (error instanceof BlockManagementError) {
        throw error;
      }
      throw new BlockManagementError(
        'PROPERTY_UPDATE_FAILED',
        `Failed to update property: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 블록 콘텐츠 업데이트 (Command 패턴)
   *
   * @param command - 콘텐츠 업데이트 Command
   * @returns 업데이트된 시간 정보
   */
  async updateContent(
    command: UpdateBlockContentCommand
  ): Promise<{ updatedAt: Date }> {
    console.log('[BlockPropertyService] updateContent called', {
      blockId: command.blockId.value,
      workspaceId: command.workspaceId,
      contentPreview: JSON.stringify(command.content).slice(0, 100),
    });

    try {
      // 1. 블록 조회 및 소유권 확인
      const block = await this.blockRepository.findById(command.blockId);
      if (!block) {
        console.error(
          '[BlockPropertyService] Block not found:',
          command.blockId.value
        );
        throw new BlockManagementError('BLOCK_NOT_FOUND', 'Block not found');
      }

      console.log('[BlockPropertyService] Block found:', {
        blockId: block.id.value,
        workspaceId: block.workspaceId.value,
      });

      // 2. 블록 소유권 확인: 블록이 해당 워크스페이스에 속하는지 검증
      if (block.workspaceId.value !== command.workspaceId) {
        console.error('[BlockPropertyService] Workspace mismatch', {
          blockWorkspaceId: block.workspaceId.value,
          commandWorkspaceId: command.workspaceId,
        });
        throw new BlockManagementError(
          'WORKSPACE_MISMATCH',
          'Block does not belong to this workspace'
        );
      }

      // 3. Aggregate 재구성
      const aggregate = BlockAggregate.reconstitute(block);

      // 4. 블록 콘텐츠 업데이트
      aggregate.updateContent(command);
      console.log('[BlockPropertyService] Aggregate updated');

      // 5. 블록 업데이트
      const updatedBlock = aggregate.getBlock();
      console.log('[BlockPropertyService] Calling repository.update...');
      await this.blockRepository.update(updatedBlock);
      console.log('[BlockPropertyService] Repository update succeeded');

      // 6. 도메인 이벤트 처리
      const events = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 7. 이벤트 커밋
      aggregate.markEventsAsCommitted();

      // 8. 업데이트된 시간 반환
      return { updatedAt: updatedBlock.updatedAt };
    } catch (error) {
      if (error instanceof BlockManagementError) {
        throw error;
      }
      throw new BlockManagementError(
        'PROPERTY_UPDATE_FAILED',
        `Failed to update content: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 도메인 이벤트 처리 (비동기 병렬 처리)
   */
  private async handleDomainEvents(events: Array<any>): Promise<void> {
    // Promise.allSettled를 사용하여 일부 이벤트 실패 시에도 다른 이벤트는 계속 처리
    const results = await Promise.allSettled(
      events.map(async event => {
        if (event.type === 'BlockPropertyUpdated') {
          return await this.handleBlockPropertyUpdated(event);
        }
      })
    );

    // 실패한 이벤트 로깅
    const failures = results.filter(
      result => result.status === 'rejected'
    ) as PromiseRejectedResult[];

    if (failures.length > 0) {
      console.warn(
        `[BlockPropertyService] ${failures.length} event handler(s) failed:`,
        failures.map(f => f.reason)
      );
    }
  }

  /**
   * 블록 속성 업데이트 이벤트 처리
   */
  private async handleBlockPropertyUpdated(
    event: BlockPropertyUpdatedEvent
  ): Promise<void> {
    console.log('[Block Property] Block Property Updated:', {
      type: event.type,
      blockId: event.aggregateId.value,
      propertyPath: event.data.propertyPath,
      oldValue: event.data.oldValue,
      newValue: event.data.newValue,
      occurredAt: event.occurredAt,
    });

    // Policy 구현 예시:
    // - 블록 속성 변경 이력 기록
    // - 버전 관리 시스템 업데이트
    // - 감사 로그 생성
    // - 실시간 동기화를 위한 WebSocket 이벤트 전송
    // - 검색 인덱스 업데이트
  }
}
