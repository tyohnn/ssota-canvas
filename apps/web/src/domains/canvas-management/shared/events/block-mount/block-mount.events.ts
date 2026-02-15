import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import type { EventLogPolicyContext } from '@/domains/event-management';

import { PageId } from '../../../../workspace-management/shared/value-objects/page-id.vo';
import { BlockMountId } from '../../value-objects/block-mount-id.vo';
import { BlockViewMode } from '../../value-objects/block-view-mode.vo';
import { Position } from '../../value-objects/position.vo';
import { Size } from '../../value-objects/size.vo';
import { ZOrder } from '../../value-objects/z-order.vo';
import type { DomainEvent } from '../domain-event';

// BlockMountedEvent
export class BlockMountedEvent implements DomainEvent {
  readonly type = 'BlockMounted';

  constructor(
    public readonly aggregateId: BlockMountId,
    public readonly data: {
      blockMountId: BlockMountId;
      pageId: PageId;
      blockId: BlockId;
      position: Position;
      size: Size;
      viewMode: BlockViewMode;
      zOrder: ZOrder;
      /** 블록 타입 (event-log block_created 로깅용, context 없을 때 사용) */
      blockType?: string;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Policy: When BlockMounted → log block_created to event_log.
   * blockType은 context.blockType ?? this.data.blockType (배치 시 각 이벤트 data에 blockType 포함).
   */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    const blockType = ctx?.blockType ?? this.data.blockType;
    if (!ctx?.eventLogService || !ctx?.userId || !blockType) return;
    await ctx.eventLogService
      .logBlockCreated({
        pageId: this.data.pageId.value,
        userId: ctx.userId,
        blockId: this.data.blockId.value,
        blockType,
      })
      .catch(() => { });
  }

  /**
   * Event 발생 시 Policy 실행. handle()에서 각 정책을 Promise.allSettled로 일괄 실행.
   */
  async handle(context?: unknown): Promise<void> {
    await Promise.allSettled([
      this.applyEventLogPolicy(context),
      // Policy 구현 예시:
      // - 자동 엣지 연결 확인
      // - 캔버스 레이아웃 최적화
      // - 통계 업데이트
    ]);
  }
}

// BlockMountDeletedEvent
export class BlockMountDeletedEvent implements DomainEvent {
  readonly type = 'BlockMountDeleted';

  constructor(
    public readonly aggregateId: BlockMountId,
    public readonly data: {
      blockMountId: BlockMountId;
    },
    public readonly occurredAt: Date
  ) { }

  /** 감사 로그: block_mount_soft_deleted (소프트 삭제) 기록 */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    if (!ctx?.eventLogService || !ctx?.userId || !ctx?.pageId) return;
    await ctx.eventLogService
      .logBlockMountSoftDeleted({
        pageId: ctx.pageId,
        userId: ctx.userId,
        blockMountId: this.data.blockMountId.value,
      })
      .catch(() => { });
  }

  /**
   * Event 발생 시 Policy 실행. handle()에서 각 정책을 Promise.allSettled로 일괄 실행.
   */
  async handle(context?: unknown): Promise<void> {
    await Promise.allSettled([
      this.applyEventLogPolicy(context),
      // Policy 구현 예시:
      // - 연결된 엣지 정리 (이미 서비스에서 처리됨)
      // - 캔버스 통계 업데이트
      // - 레이아웃 재정렬
    ]);
  }
}

// BlockMountDuplicatedEvent
export class BlockMountDuplicatedEvent implements DomainEvent {
  readonly type = 'BlockMountDuplicated';

  constructor(
    public readonly aggregateId: BlockMountId,
    public readonly data: {
      originalBlockMountId: string;
      duplicatedBlockMountId: string;
      originalBlockId: string;
      duplicatedBlockId: string;
      /** 복제된 블록 타입 (event-log block_created 로깅용) */
      duplicatedBlockType: string;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Policy: When BlockMountDuplicated → log block_created for the duplicated block to event_log.
   */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    if (!ctx?.eventLogService || !ctx?.userId || !ctx?.pageId) return;
    await ctx.eventLogService
      .logBlockCreated({
        pageId: ctx.pageId,
        userId: ctx.userId,
        blockId: this.data.duplicatedBlockId,
        blockType: this.data.duplicatedBlockType,
      })
      .catch(() => { });
  }

  /**
   * Event 발생 시 Policy 실행. handle()에서 각 정책을 Promise.allSettled로 일괄 실행.
   */
  async handle(context?: unknown): Promise<void> {
    await Promise.allSettled([
      this.applyEventLogPolicy(context),
      // Policy 구현 예시:
      // - 복제된 블럭의 자동 연결
      // - 캔버스 통계 업데이트
      // - 레이아웃 최적화
    ]);
  }
}

// MultipleBlockMountsDeletedEvent
export class MultipleBlockMountsDeletedEvent implements DomainEvent {
  readonly type = 'MultipleBlockMountsDeleted';

  constructor(
    public readonly aggregateId: string, // 'batch-delete' 등의 배치 식별자
    public readonly data: {
      deletedBlockMountIds: string[];
      deletedEdgesCount: number;
      deletedAt: Date;
      userId: string;
    },
    public readonly occurredAt: Date
  ) { }

  /** 감사 로그: 배치 소프트 삭제를 block_mount_soft_deleted 한 건으로 기록 */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    if (!ctx?.eventLogService || !ctx?.userId || !ctx?.pageId) return;
    if (this.data.deletedBlockMountIds.length === 0) return;
    await ctx.eventLogService
      .logBlockMountsSoftDeleted({
        pageId: ctx.pageId,
        userId: ctx.userId,
        blockMountIds: this.data.deletedBlockMountIds,
      })
      .catch(() => { });
  }

  async handle(context?: unknown): Promise<void> {
    await Promise.allSettled([this.applyEventLogPolicy(context)]);
  }
}

// BlockMovedToPageEvent
export class BlockMovedToPageEvent implements DomainEvent {
  readonly type = 'BlockMovedToPage';

  constructor(
    public readonly aggregateId: BlockMountId,
    public readonly data: {
      blockMountId: BlockMountId;
      previousPageId: PageId;
      newPageId: PageId;
      newPosition: Position;
    },
    public readonly occurredAt: Date
  ) { }

  /** 감사 로그: block_mount_updated (movedToPage) 기록 — pageId는 이동 대상 페이지(newPageId) */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    const pageId = ctx?.pageId ?? this.data.newPageId.value;
    if (!ctx?.eventLogService || !ctx?.userId || !pageId) return;
    await ctx.eventLogService
      .logBlockMountUpdated({
        pageId,
        userId: ctx.userId,
        blockMountId: this.data.blockMountId.value,
        changes: {
          movedToPage: this.data.newPageId.value,
          previousPageId: this.data.previousPageId.value,
          newPosition: {
            x: this.data.newPosition.x,
            y: this.data.newPosition.y,
          },
        },
      })
      .catch(() => { });
  }

  async handle(context?: unknown): Promise<void> {
    await Promise.allSettled([this.applyEventLogPolicy(context)]);
  }
}

/** 선택된 노드들로 그룹 생성 완료 — 감사 로그: block_mount_updated (groupCreated) */
export class GroupCreatedFromNodesEvent implements DomainEvent {
  readonly type = 'GroupCreatedFromNodes';

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      groupBlockMountId: string;
      childBlockMountIds: string[];
    },
    public readonly occurredAt: Date
  ) {}

  /** 감사 로그: block_mount_updated (groupCreated) 기록 */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    if (!ctx?.eventLogService || !ctx?.userId || !ctx?.pageId) return;
    await ctx.eventLogService
      .logBlockMountUpdated({
        pageId: ctx.pageId,
        userId: ctx.userId,
        blockMountId: this.data.groupBlockMountId,
        changes: {
          groupCreated: true,
          childBlockMountIds: this.data.childBlockMountIds,
        },
      })
      .catch(() => {});
  }

  async handle(context?: unknown): Promise<void> {
    await Promise.allSettled([this.applyEventLogPolicy(context)]);
  }
}
