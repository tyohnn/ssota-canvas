import type { EventLogPolicyContext } from '@/domains/event-management';
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

  /** 감사 로그: edge_created 기록 */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    const pageId = ctx?.pageId ?? this.data.pageId.value;
    if (!ctx?.eventLogService || !ctx?.userId || !pageId) return;
    await ctx.eventLogService
      .logEdgeCreated({
        pageId,
        userId: ctx.userId,
        edgeId: this.data.edgeId.value,
        sourceBlockMountId: this.data.sourceBlockMountId.value,
        targetBlockMountId: this.data.targetBlockMountId.value,
      })
      .catch(() => { });
  }

  async handle(context?: unknown): Promise<void> {
    await Promise.allSettled([this.applyEventLogPolicy(context)]);
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

  /** 감사 로그: edge_updated (label) 기록 */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    if (!ctx?.eventLogService || !ctx?.userId || !ctx?.pageId) return;
    await ctx.eventLogService
      .logEdgeUpdated({
        pageId: ctx.pageId,
        userId: ctx.userId,
        edgeId: this.data.edgeId.value,
        changes: { label: this.data.newLabel },
      })
      .catch(() => { });
  }

  async handle(context?: unknown): Promise<void> {
    await Promise.allSettled([this.applyEventLogPolicy(context)]);
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

  /** 감사 로그: edge_updated (markers) 기록 */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    if (!ctx?.eventLogService || !ctx?.userId || !ctx?.pageId) return;
    await ctx.eventLogService
      .logEdgeUpdated({
        pageId: ctx.pageId,
        userId: ctx.userId,
        edgeId: this.data.edgeId.value,
        changes: {
          markerEnd: this.data.markerEnd,
          markerStart: this.data.markerStart,
        },
      })
      .catch(() => { });
  }

  async handle(context?: unknown): Promise<void> {
    await Promise.allSettled([this.applyEventLogPolicy(context)]);
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

  /** 감사 로그: edge_deleted 기록 */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    if (!ctx?.eventLogService || !ctx?.userId || !ctx?.pageId) return;
    await ctx.eventLogService
      .logEdgeDeleted({
        pageId: ctx.pageId,
        userId: ctx.userId,
        edgeId: this.data.edgeId.value,
      })
      .catch(() => { });
  }

  async handle(context?: unknown): Promise<void> {

    await Promise.allSettled([this.applyEventLogPolicy(context)]);
  }
}
