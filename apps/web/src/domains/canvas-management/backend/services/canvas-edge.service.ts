// apps/web/src/domains/canvas-management/backend/services/canvas-edge.service.ts

import { Result } from '@/utils/result';
import type { ICanvasEdgeService } from './interfaces/canvas-edge.service.interface';
import type { BlockMountRepository } from '../repositories/interfaces/block-mount.repository.interface';
import type { EdgeRepository } from '../repositories/interfaces/edge.repository.interface';
import {
  CreateEdgeCommand,
  UpdateEdgeShapeCommand,
  UpdateEdgeLabelCommand,
  UpdateEdgeStyleCommand,
  DeleteEdgeCommand,
} from '../../shared/commands/index';
import { EdgeAggregate } from '../../shared/aggregates/edge.aggregate';
import { EdgeId } from '../../shared/value-objects/edge-id.vo';
import { BlockMountId } from '../../shared/value-objects/block-mount-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { EdgeShape } from '../../shared/value-objects/edge-shape.vo';
import {
  EdgeCreatedEvent,
  EdgeShapeChangedEvent,
  EdgeLabelChangedEvent,
  EdgeStyleChangedEvent,
  EdgeDeletedEvent,
} from '../../shared/events';

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
 * Canvas Edge Service
 *
 * 엣지 생성 및 관리 비즈니스 로직을 담당하는 서비스 구현 (Drizzle ORM 사용)
 *
 * ⚠️ Schema Change: edges now reference block_mounts instead of blocks
 */
export class CanvasEdgeService implements ICanvasEdgeService {
  constructor(
    private blockMountRepository: BlockMountRepository,
    private edgeRepository: EdgeRepository
  ) {}

  /**
   * 엣지 생성
   *
   * @param params - 엣지 생성 파라미터
   * @returns 생성된 엣지 Aggregate
   */
  async createEdge(params: {
    pageId: PageId;
    sourceBlockMountId: BlockMountId;
    targetBlockMountId: BlockMountId;
    sourceHandle?: string;
    targetHandle?: string;
    edgeShape?: EdgeShape;
    userId: string;
  }): Promise<Result<EdgeAggregate, Error>> {
    try {
      // 1. 소스/타겟 블럭 마운트가 같은 페이지에 존재하는지 확인
      const sourceBlockMount = await this.blockMountRepository.findById(
        params.sourceBlockMountId
      );
      const targetBlockMount = await this.blockMountRepository.findById(
        params.targetBlockMountId
      );

      if (!sourceBlockMount || !targetBlockMount) {
        return Result.error(
          new CanvasManagementError(
            'BLOCK_MOUNT_NOT_FOUND',
            'Source or target block mount not found'
          )
        );
      }

      // 2. 블럭 마운트가 동일한 페이지에 있는지 확인
      const sourceBM = sourceBlockMount.getBlockMount();
      const targetBM = targetBlockMount.getBlockMount();

      if (
        !sourceBM.pageId.equals(params.pageId) ||
        !targetBM.pageId.equals(params.pageId)
      ) {
        return Result.error(
          new CanvasManagementError(
            'PAGE_MISMATCH',
            'Block mounts must be on the same page as the edge'
          )
        );
      }

      // 3. Command 생성 및 Aggregate 호출
      const edgeId = EdgeId.generate();
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        params.pageId,
        params.sourceBlockMountId,
        params.targetBlockMountId,
        params.edgeShape,
        params.sourceHandle,
        params.targetHandle
      );

      // 4. Repository 생성
      await this.edgeRepository.create(aggregate);

      // 5. 도메인 이벤트 처리
      const events = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 6. 이벤트 커밋
      aggregate.markEventsAsCommitted();

      // 7. Result.success(aggregate) 반환
      return Result.success(aggregate);
    } catch (error) {
      console.error('❌ [CanvasEdgeService] Edge creation failed:', error);
      return Result.error(
        new CanvasManagementError(
          'EDGE_CREATION_FAILED',
          `Failed to create edge: ${error}`
        )
      );
    }
  }

  /**
   * 엣지 모양 업데이트
   *
   * @param params - 엣지 모양 업데이트 파라미터
   * @returns 업데이트된 엣지 Aggregate
   */
  async updateEdgeShape(params: {
    edgeId: EdgeId;
    newShape: EdgeShape;
    userId: string;
  }): Promise<Result<EdgeAggregate, Error>> {
    try {
      // 1. 엣지 조회
      const aggregate = await this.edgeRepository.findById(params.edgeId);

      if (!aggregate) {
        return Result.error(
          new CanvasManagementError('EDGE_NOT_FOUND', 'Edge not found')
        );
      }

      // 2. Aggregate 업데이트 (Command 패턴)
      aggregate.updateEdgeShape(params.newShape);

      // 3. Repository 업데이트
      await this.edgeRepository.update(aggregate);

      // 4. 도메인 이벤트 처리
      const events = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 5. 이벤트 커밋
      aggregate.markEventsAsCommitted();

      // 6. Result.success(aggregate) 반환
      return Result.success(aggregate);
    } catch (error) {
      console.error('❌ [CanvasEdgeService] Edge shape update failed:', error);
      return Result.error(
        new CanvasManagementError(
          'EDGE_SHAPE_UPDATE_FAILED',
          `Failed to update edge shape: ${error}`
        )
      );
    }
  }

  /**
   * 엣지 레이블 업데이트
   *
   * @param params - 엣지 레이블 업데이트 파라미터
   * @returns 업데이트된 엣지 Aggregate
   */
  async updateEdgeLabel(params: {
    edgeId: EdgeId;
    newLabel: string;
    userId: string;
  }): Promise<Result<EdgeAggregate, Error>> {
    try {
      // 1. 엣지 조회
      const aggregate = await this.edgeRepository.findById(params.edgeId);

      if (!aggregate) {
        return Result.error(
          new CanvasManagementError('EDGE_NOT_FOUND', 'Edge not found')
        );
      }

      // 2. Aggregate 업데이트
      aggregate.updateEdgeLabel(params.newLabel);

      // 3. Repository 업데이트
      await this.edgeRepository.update(aggregate);

      // 4. 도메인 이벤트 처리
      const events = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 5. 이벤트 커밋
      aggregate.markEventsAsCommitted();

      // 6. Result.success(aggregate) 반환
      return Result.success(aggregate);
    } catch (error) {
      console.error('❌ [CanvasEdgeService] Edge label update failed:', error);
      return Result.error(
        new CanvasManagementError(
          'EDGE_LABEL_UPDATE_FAILED',
          `Failed to update edge label: ${error}`
        )
      );
    }
  }

  /**
   * 엣지 스타일 업데이트
   *
   * @param params - 엣지 스타일 업데이트 파라미터
   * @returns 업데이트된 엣지 Aggregate
   */
  async updateEdgeStyle(params: {
    edgeId: EdgeId;
    style: {
      stroke?: string;
      strokeWidth?: number;
    };
    userId: string;
  }): Promise<Result<EdgeAggregate, Error>> {
    try {
      // 1. 엣지 조회
      const aggregate = await this.edgeRepository.findById(params.edgeId);

      if (!aggregate) {
        return Result.error(
          new CanvasManagementError('EDGE_NOT_FOUND', 'Edge not found')
        );
      }

      // 2. Aggregate 업데이트
      aggregate.updateEdgeStyle(params.style);

      // 3. Repository 업데이트
      await this.edgeRepository.update(aggregate);

      // 4. 도메인 이벤트 처리
      const events = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 5. 이벤트 커밋
      aggregate.markEventsAsCommitted();

      // 6. Result.success(aggregate) 반환
      return Result.success(aggregate);
    } catch (error) {
      console.error('❌ [CanvasEdgeService] Edge style update failed:', error);
      return Result.error(
        new CanvasManagementError(
          'EDGE_STYLE_UPDATE_FAILED',
          `Failed to update edge style: ${error}`
        )
      );
    }
  }

  /**
   * 엣지 삭제
   *
   * @param params - 엣지 삭제 파라미터
   */
  async deleteEdge(params: {
    edgeId: EdgeId;
    userId: string;
  }): Promise<Result<void, Error>> {
    try {
      // 1. 엣지 조회
      const aggregate = await this.edgeRepository.findById(params.edgeId);

      if (!aggregate) {
        return Result.error(
          new CanvasManagementError('EDGE_NOT_FOUND', 'Edge not found')
        );
      }

      // 2. Aggregate 삭제 (이벤트 발행)
      aggregate.deleteEdge();

      // 3. 도메인 이벤트 처리
      const events = aggregate.getUncommittedEvents();
      await this.handleDomainEvents(events);

      // 4. 이벤트 커밋
      aggregate.markEventsAsCommitted();

      // 5. Repository 삭제
      await this.edgeRepository.delete(params.edgeId);

      // 6. Result.success() 반환
      return Result.success(undefined);
    } catch (error) {
      console.error('❌ [CanvasEdgeService] Edge deletion failed:', error);
      return Result.error(
        new CanvasManagementError(
          'EDGE_DELETION_FAILED',
          `Failed to delete edge: ${error}`
        )
      );
    }
  }

  /**
   * 블럭 마운트 삭제 시 연결된 엣지 모두 삭제
   * ⚠️ Schema Change: now uses BlockMountId instead of BlockId
   */
  async deleteConnectedEdges(
    blockMountId: BlockMountId
  ): Promise<Result<void, Error>> {
    try {
      // 1. EdgeRepository.findByConnectedBlockMountId() 호출
      const connectedEdges =
        await this.edgeRepository.findByConnectedBlockMountId(blockMountId);

      if (connectedEdges.length === 0) {
        return Result.success(undefined);
      }

      // 2. 모든 엣지 삭제 이벤트 발행 및 처리
      for (const aggregate of connectedEdges) {
        aggregate.deleteEdge();

        // 도메인 이벤트 처리
        const events = aggregate.getUncommittedEvents();
        await this.handleDomainEvents(events);

        // 이벤트 커밋
        aggregate.markEventsAsCommitted();
      }

      // 3. EdgeRepository.deleteAll() 호출
      const edgeIds = connectedEdges.map(agg => agg.edge.id);
      await this.edgeRepository.deleteAll(edgeIds);

      // 4. Result.success() 반환
      return Result.success(undefined);
    } catch (error) {
      console.error(
        '❌ [CanvasEdgeService] Connected edges deletion failed:',
        error
      );
      return Result.error(
        new CanvasManagementError(
          'CONNECTED_EDGES_DELETION_FAILED',
          `Failed to delete connected edges: ${error}`
        )
      );
    }
  }

  /**
   * 도메인 이벤트 처리 (Canvas Edge Management 도메인 내부) - 비동기 병렬 처리
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
        .filter(event => this.isEdgeManagementEvent(event))
        .map(async event => {
          // Event Storming과 매칭: Edge Management 도메인 이벤트 처리
          if (event instanceof EdgeCreatedEvent) {
            return await this.handleEdgeCreated(event);
          } else if (event instanceof EdgeShapeChangedEvent) {
            return await this.handleEdgeShapeChanged(event);
          } else if (event instanceof EdgeLabelChangedEvent) {
            return await this.handleEdgeLabelChanged(event);
          } else if (event instanceof EdgeStyleChangedEvent) {
            return await this.handleEdgeStyleChanged(event);
          } else if (event instanceof EdgeDeletedEvent) {
            return await this.handleEdgeDeleted(event);
          }
        })
    );

    // 실패한 이벤트 로깅
    const failures = results.filter(
      result => result.status === 'rejected'
    ) as PromiseRejectedResult[];

    if (failures.length > 0) {
      console.warn(
        `[CanvasEdgeService] ${failures.length} event handler(s) failed:`,
        failures.map(f => f.reason)
      );
    }
  }

  /**
   * 이벤트가 CanvasEdgeService가 처리할 이벤트인지 확인
   */
  private isEdgeManagementEvent(
    event: any
  ): event is
    | EdgeCreatedEvent
    | EdgeShapeChangedEvent
    | EdgeLabelChangedEvent
    | EdgeStyleChangedEvent
    | EdgeDeletedEvent {
    return (
      event instanceof EdgeCreatedEvent ||
      event instanceof EdgeShapeChangedEvent ||
      event instanceof EdgeLabelChangedEvent ||
      event instanceof EdgeStyleChangedEvent ||
      event instanceof EdgeDeletedEvent
    );
  }

  /**
   * Policy: 엣지가 생성되었을 때
   *
   * Event Storming에서 정의한 Policy 구현:
   * - 예: 엣지 생성 로그 기록
   * - 예: 캔버스 통계 업데이트
   * - 예: 생성자별 엣지 수 추적
   */
  private async handleEdgeCreated(event: EdgeCreatedEvent): Promise<void> {
    console.log('[Canvas Edge Management] Edge Created:', {
      type: event.type,
      data: event.data,
      occurredAt: event.occurredAt,
    });

    // Policy 구현 예시:
    // - 엣지 생성 통계 업데이트
    // - 생성자별 활동 추적
    // - 페이지별 엣지 수 증가
  }

  /**
   * Policy: 엣지 모양이 변경되었을 때
   *
   * Event Storming에서 정의한 Policy 구현:
   * - 예: 엣지 변경 로그 기록
   * - 예: 버전 관리
   * - 예: 감사 추적
   */
  private async handleEdgeShapeChanged(
    event: EdgeShapeChangedEvent
  ): Promise<void> {
    console.log('[Canvas Edge Management] Edge Shape Changed:', {
      edgeId: event.aggregateId.value,
      data: event.data,
      occurredAt: event.occurredAt,
    });

    // Policy 구현 예시:
    // - 엣지 변경 이력 기록
    // - 버전 관리 시스템 업데이트
    // - 감사 로그 생성
  }

  /**
   * Policy: 엣지 레이블이 변경되었을 때
   *
   * Event Storming에서 정의한 Policy 구현:
   * - 예: 엣지 레이블 변경 로그 기록
   */
  private async handleEdgeLabelChanged(
    event: EdgeLabelChangedEvent
  ): Promise<void> {
    console.log('[Canvas Edge Management] Edge Label Changed:', {
      edgeId: event.aggregateId.value,
      data: event.data,
      occurredAt: event.occurredAt,
    });

    // Policy 구현 예시:
    // - 엣지 레이블 변경 이력 기록
  }

  /**
   * Policy: 엣지 스타일이 변경되었을 때
   *
   * Event Storming에서 정의한 Policy 구현:
   * - 예: 엣지 스타일 변경 로그 기록
   */
  private async handleEdgeStyleChanged(
    event: EdgeStyleChangedEvent
  ): Promise<void> {
    console.log('[Canvas Edge Management] Edge Style Changed:', {
      edgeId: event.aggregateId.value,
      data: event.data,
      occurredAt: event.occurredAt,
    });

    // Policy 구현 예시:
    // - 엣지 스타일 변경 이력 기록
  }

  /**
   * Policy: 엣지가 삭제되었을 때
   *
   * Event Storming에서 정의한 Policy 구현:
   * - 예: 엣지 삭제 로그 기록
   * - 예: 관련 데이터 정리
   */
  private async handleEdgeDeleted(event: EdgeDeletedEvent): Promise<void> {
    console.log('[Canvas Edge Management] Edge Deleted:', {
      edgeId: event.aggregateId.value,
      data: event.data,
      occurredAt: event.occurredAt,
    });

    // Policy 구현 예시:
    // - 엣지 삭제 이력 기록
    // - 관련 데이터 정리
  }
}
