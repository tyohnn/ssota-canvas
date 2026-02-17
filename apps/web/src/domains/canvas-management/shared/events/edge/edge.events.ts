import { createTextPatch, uuidToSlug } from '@/lib/utils';
import type { EventLogPolicyContext } from '@/domains/event-management';
import { PageId } from '../../../../workspace-management/shared/value-objects/page-id.vo';
import type { MarkerType } from '../../types/marker-type';
import { BlockMountId } from '../../value-objects/block-mount-id.vo';
import { EdgeHandle } from '../../value-objects/edge-handle.vo';
import { EdgeId } from '../../value-objects/edge-id.vo';
import { EdgeShape } from '../../value-objects/edge-shape.vo';
import type { EdgeStyle } from '../../value-objects/edge-style.vo';
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
        edgeId: uuidToSlug(this.data.edgeId.value),
        sourceBlockMountId: uuidToSlug(this.data.sourceBlockMountId.value),
        targetBlockMountId: uuidToSlug(this.data.targetBlockMountId.value),
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
      oldShape: EdgeShape;
      newShape: EdgeShape;
    },
    public readonly occurredAt: Date
  ) { }

  /** 감사 로그: edge_updated (shape) 기록 — 이전값·현재값 */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    if (!ctx?.eventLogService || !ctx?.userId || !ctx?.pageId) return;
    await ctx.eventLogService
      .logEdgeUpdated({
        pageId: ctx.pageId,
        userId: ctx.userId,
        edgeId: uuidToSlug(this.data.edgeId.value),
        changes: {
          shape: {
            previous: this.data.oldShape.value,
            current: this.data.newShape.value,
          },
        },
      })
      .catch(() => { });
  }

  async handle(context?: unknown): Promise<void> {
    await Promise.allSettled([this.applyEventLogPolicy(context)]);
  }
}

// EdgeLabelChangedEvent
export class EdgeLabelChangedEvent implements DomainEvent {
  readonly type = 'EdgeLabelChanged';

  constructor(
    public readonly aggregateId: EdgeId,
    public readonly data: {
      edgeId: EdgeId;
      oldLabel: string;
      newLabel: string;
    },
    public readonly occurredAt: Date
  ) { }

  /** 감사 로그: edge_updated (label) 기록 — patch 형식 (block content와 동일) */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    if (!ctx?.eventLogService || !ctx?.userId || !ctx?.pageId) return;
    const patch = createTextPatch(this.data.oldLabel, this.data.newLabel);
    if (!patch) return;
    await ctx.eventLogService
      .logEdgeUpdated({
        pageId: ctx.pageId,
        userId: ctx.userId,
        edgeId: uuidToSlug(this.data.edgeId.value),
        changes: { label: { patch } },
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
      oldStyle: EdgeStyle;
      newStyle: EdgeStyle;
    },
    public readonly occurredAt: Date
  ) { }

  /** 감사 로그: edge_updated (style) 기록 — 바뀐 것만 저장 (color 또는 thickness) */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    if (!ctx?.eventLogService || !ctx?.userId || !ctx?.pageId) return;
    const old = this.data.oldStyle;
    const cur = this.data.newStyle;
    const style: Record<string, { previous: unknown; current: unknown }> = {};
    if (old.color !== cur.color) style.color = { previous: old.color, current: cur.color };
    if (old.thickness !== cur.thickness)
      style.thickness = { previous: old.thickness, current: cur.thickness };
    if (Object.keys(style).length === 0) return;
    await ctx.eventLogService
      .logEdgeUpdated({
        pageId: ctx.pageId,
        userId: ctx.userId,
        edgeId: uuidToSlug(this.data.edgeId.value),
        changes: { style },
      })
      .catch(() => { });
  }

  async handle(context?: unknown): Promise<void> {
    await Promise.allSettled([this.applyEventLogPolicy(context)]);
  }
}

// EdgeMarkersChangedEvent
// 바뀐 것만 저장 (markerEnd 또는 markerStart 중 하나)
export class EdgeMarkersChangedEvent implements DomainEvent {
  readonly type = 'EdgeMarkersChanged';

  constructor(
    public readonly aggregateId: EdgeId,
    public readonly data: {
      edgeId: EdgeId;
      markerEnd?: { previous: MarkerType; current: MarkerType };
      markerStart?: {
        previous: MarkerType | null;
        current: MarkerType | null;
      };
    },
    public readonly occurredAt: Date
  ) { }

  /** 감사 로그: edge_updated (markers) 기록 — 바뀐 마커만 저장 */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    if (!ctx?.eventLogService || !ctx?.userId || !ctx?.pageId) return;
    const changes: Record<string, unknown> = {};
    if (this.data.markerEnd) changes.markerEnd = this.data.markerEnd;
    if (this.data.markerStart) changes.markerStart = this.data.markerStart;
    if (Object.keys(changes).length === 0) return;
    await ctx.eventLogService
      .logEdgeUpdated({
        pageId: ctx.pageId,
        userId: ctx.userId,
        edgeId: uuidToSlug(this.data.edgeId.value),
        changes,
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
        edgeId: uuidToSlug(this.data.edgeId.value),
      })
      .catch(() => { });
  }

  async handle(context?: unknown): Promise<void> {

    await Promise.allSettled([this.applyEventLogPolicy(context)]);
  }
}
