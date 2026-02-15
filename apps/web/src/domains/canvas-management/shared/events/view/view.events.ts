import type { EventLogPolicyContext } from '@/domains/event-management';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';

import { BlockMountId } from '../../value-objects/block-mount-id.vo';
import { BlockViewMode } from '../../value-objects/block-view-mode.vo';
import { Position } from '../../value-objects/position.vo';
import { Size } from '../../value-objects/size.vo';
import { ZOrder } from '../../value-objects/z-order.vo';
import type { DomainEvent } from '../domain-event';

// BlockTransformedEvent
export class BlockTransformedEvent implements DomainEvent {
  readonly type = 'BlockTransformed';

  constructor(
    public readonly aggregateId: BlockMountId,
    public readonly data: {
      blockMountId: BlockMountId;
      newPosition?: Position;
      newSize?: Size;
      newZOrder?: ZOrder;
    },
    public readonly occurredAt: Date
  ) { }

  async handle(): Promise<void> {
    console.log('[Canvas Management] Block Transformed:', {
      blockMountId: this.aggregateId.value,
      newPosition: this.data.newPosition,
      newSize: this.data.newSize,
      newZOrder: this.data.newZOrder,
      occurredAt: this.occurredAt,
    });

    await Promise.allSettled([
      // Policy 구현 예시:
      // - 겹침 감지 및 자동 조정
      // - 가이드라인 업데이트
    ]);
  }
}

// BlockPositionUpdatedEvent
export class BlockPositionUpdatedEvent implements DomainEvent {
  readonly type = 'BlockPositionUpdated';

  constructor(
    public readonly aggregateId: BlockMountId,
    public readonly data: {
      blockMountId: BlockMountId;
      newPosition: Position;
    },
    public readonly occurredAt: Date
  ) {}

  /** 감사 로그: block_mount_updated (position) 기록 */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    if (!ctx?.eventLogService || !ctx?.userId || !ctx?.pageId) return;
    await ctx.eventLogService
      .logBlockMountUpdated({
        pageId: ctx.pageId,
        userId: ctx.userId,
        blockMountId: this.data.blockMountId.value,
        changes: {
          position: {
            x: this.data.newPosition.x,
            y: this.data.newPosition.y,
          },
        },
      })
      .catch(() => {});
  }

  async handle(context?: unknown): Promise<void> {
    await Promise.allSettled([this.applyEventLogPolicy(context)]);
  }
}

// BlockSizeUpdatedEvent
export class BlockSizeUpdatedEvent implements DomainEvent {
  readonly type = 'BlockSizeUpdated';

  constructor(
    public readonly aggregateId: BlockMountId,
    public readonly data: {
      blockMountId: BlockMountId;
      newSize: Size;
      viewMode?: BlockViewMode; // 어떤 뷰 모드의 크기가 업데이트되었는지
    },
    public readonly occurredAt: Date
  ) {}

  /** 감사 로그: block_mount_updated (size) 기록 */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    if (!ctx?.eventLogService || !ctx?.userId || !ctx?.pageId) return;
    const changes: Record<string, unknown> = {
      size: {
        width: this.data.newSize.width,
        height: this.data.newSize.height,
      },
    };
    if (this.data.viewMode != null) changes.viewMode = this.data.viewMode.value;
    await ctx.eventLogService
      .logBlockMountUpdated({
        pageId: ctx.pageId,
        userId: ctx.userId,
        blockMountId: this.data.blockMountId.value,
        changes,
      })
      .catch(() => {});
  }

  async handle(context?: unknown): Promise<void> {
    await Promise.allSettled([this.applyEventLogPolicy(context)]);
  }
}

// BlockZOrderUpdatedEvent
export class BlockZOrderUpdatedEvent implements DomainEvent {
  readonly type = 'BlockZOrderUpdated';

  constructor(
    public readonly aggregateId: BlockMountId,
    public readonly data: {
      blockMountId: BlockMountId;
      newZOrder: ZOrder;
    },
    public readonly occurredAt: Date
  ) { }

  async handle(): Promise<void> {
    console.log('[Canvas Management] Block Z Order Updated:', {
      blockMountId: this.aggregateId.value,
      newZOrder: this.data.newZOrder,
      occurredAt: this.occurredAt,
    });

    await Promise.allSettled([
      // Policy 구현 예시:
      // - 레이어 순서 업데이트
      // - 가이드라인 업데이트
      // - 성능 최적화를 위한 배치 처리
    ]);
  }
}

// BlockViewModeUpdatedEvent
export class BlockViewModeUpdatedEvent implements DomainEvent {
  readonly type = 'BlockViewModeUpdated';

  constructor(
    public readonly aggregateId: BlockMountId,
    public readonly data: {
      blockMountId: BlockMountId;
      newViewMode: BlockViewMode;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    console.log('[Canvas Management] Block View Mode Updated:', {
      blockMountId: this.aggregateId.value,
      newViewMode: this.data.newViewMode.value,
      occurredAt: this.occurredAt,
    });

    await Promise.allSettled([
      // Policy 구현 예시:
      // - 캔버스 렌더링 최적화
      // - 통계 업데이트
    ]);
  }
}

// MultipleBlockPositionsUpdatedEvent
export class MultipleBlockPositionsUpdatedEvent implements DomainEvent {
  readonly type = 'MultipleBlockPositionsUpdated';

  constructor(
    public readonly aggregateId: string, // 'batch-update' 등의 배치 식별자
    public readonly data: {
      blockMountIds: string[];
      positions: Array<{
        blockMountId: string;
        position: Position;
      }>;
      userId: UserId;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    console.log('[Canvas Management] Multiple Block Positions Updated:', {
      blockMountIds: this.data.blockMountIds,
      positionsCount: this.data.positions.length,
      occurredAt: this.occurredAt,
    });

    await Promise.allSettled([
      // Policy 구현 예시:
      // - 배치 이동 최적화
      // - 겹침 감지 및 자동 조정
      // - 가이드라인 업데이트
      // - 성능 최적화를 위한 배치 처리
    ]);
  }
}
