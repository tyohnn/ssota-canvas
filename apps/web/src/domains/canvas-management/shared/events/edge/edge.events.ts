import { PageId } from '../../../../workspace-management/shared/value-objects/page-id.vo';
import type { MarkerType } from '../../types/marker-type';
import { BlockMountId } from '../../value-objects/block-mount-id.vo';
import { EdgeHandle } from '../../value-objects/edge-handle.vo';
import { EdgeId } from '../../value-objects/edge-id.vo';
import { EdgeShape } from '../../value-objects/edge-shape.vo';
import type { DomainEvent } from '../domain-event';

// EdgeCreatedEvent
// ⚠️ Schema Change: now uses BlockMountId instead of BlockId
export class EdgeCreatedEvent implements DomainEvent {
  readonly type = 'EdgeCreated';

  constructor(
    public readonly aggregateId: EdgeId,
    public readonly data: {
      edgeId: EdgeId;
      pageId: PageId;
      sourceBlockMountId: BlockMountId;
      targetBlockMountId: BlockMountId;
      sourceHandle: EdgeHandle;
      targetHandle: EdgeHandle;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    console.log('[Canvas Edge Management] Edge Created:', {
      edgeId: this.aggregateId.value,
      pageId: this.data.pageId.value,
      occurredAt: this.occurredAt,
    });

    await Promise.allSettled([
      // Policy 구현 예시:
      // - 엣지 생성 통계 업데이트
      // - 생성자별 활동 추적
      // - 페이지별 엣지 수 증가
    ]);
  }
}

// EdgeShapeChangedEvent
export class EdgeShapeChangedEvent implements DomainEvent {
  readonly type = 'EdgeShapeChanged';

  constructor(
    public readonly aggregateId: EdgeId,
    public readonly data: {
      edgeId: EdgeId;
      newShape: EdgeShape;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    console.log('[Canvas Edge Management] Edge Shape Changed:', {
      edgeId: this.aggregateId.value,
      newShape: this.data.newShape,
      occurredAt: this.occurredAt,
    });

    await Promise.allSettled([
      // Policy 구현 예시:
      // - 엣지 변경 이력 기록
      // - 버전 관리 시스템 업데이트
      // - 감사 로그 생성
    ]);
  }
}

// EdgeLabelChangedEvent
export class EdgeLabelChangedEvent implements DomainEvent {
  readonly type = 'EdgeLabelChanged';

  constructor(
    public readonly aggregateId: EdgeId,
    public readonly data: {
      edgeId: EdgeId;
      newLabel: string;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    console.log('[Canvas Edge Management] Edge Label Changed:', {
      edgeId: this.aggregateId.value,
      newLabel: this.data.newLabel,
      occurredAt: this.occurredAt,
    });

    await Promise.allSettled([
      // Policy 구현 예시:
      // - 엣지 레이블 변경 이력 기록
    ]);
  }
}

// EdgeStyleChangedEvent
export class EdgeStyleChangedEvent implements DomainEvent {
  readonly type = 'EdgeStyleChanged';

  constructor(
    public readonly aggregateId: EdgeId,
    public readonly data: {
      edgeId: EdgeId;
      style: {
        stroke?: string;
        strokeWidth?: number;
      };
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    console.log('[Canvas Edge Management] Edge Style Changed:', {
      edgeId: this.aggregateId.value,
      style: this.data.style,
      occurredAt: this.occurredAt,
    });

    await Promise.allSettled([
      // Policy 구현 예시:
      // - 엣지 스타일 변경 이력 기록
    ]);
  }
}

// EdgeMarkersChangedEvent
export class EdgeMarkersChangedEvent implements DomainEvent {
  readonly type = 'EdgeMarkersChanged';

  constructor(
    public readonly aggregateId: EdgeId,
    public readonly data: {
      edgeId: EdgeId;
      markerEnd: MarkerType;
      markerStart: MarkerType | null;
    },
    public readonly occurredAt: Date
  ) { }

  async handle(): Promise<void> {
    // console.log('[Canvas Edge Management] Edge Markers Changed:', {
    //   edgeId: this.aggregateId.value,
    //   markerEnd: this.data.markerEnd,
    //   markerStart: this.data.markerStart,
    //   occurredAt: this.occurredAt,
    // });
    await Promise.allSettled([]);
  }
}

// EdgeConnectionChangedEvent
export class EdgeConnectionChangedEvent implements DomainEvent {
  readonly type = 'EdgeConnectionChanged';

  constructor(
    public readonly aggregateId: EdgeId,
    public readonly data: {
      edgeId: EdgeId;
      newSourceBlockMountId: BlockMountId;
      newTargetBlockMountId: BlockMountId;
      newSourceHandle: EdgeHandle;
      newTargetHandle: EdgeHandle;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    console.log('[Canvas Edge Management] Edge Connection Changed:', {
      edgeId: this.aggregateId.value,
      source: this.data.newSourceBlockMountId.value,
      target: this.data.newTargetBlockMountId.value,
      occurredAt: this.occurredAt,
    });

    await Promise.allSettled([]);
  }
}

// EdgeDeletedEvent
export class EdgeDeletedEvent implements DomainEvent {
  readonly type = 'EdgeDeleted';

  constructor(
    public readonly aggregateId: EdgeId,
    public readonly data: {
      edgeId: EdgeId;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    console.log('[Canvas Edge Management] Edge Deleted:', {
      edgeId: this.aggregateId.value,
      occurredAt: this.occurredAt,
    });

    await Promise.allSettled([
      // Policy 구현 예시:
      // - 엣지 삭제 이력 기록
      // - 관련 데이터 정리
    ]);
  }
}
