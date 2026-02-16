import type { EventLogPolicyContext } from '@/domains/event-management';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';

import { BlockProperties } from '../types/block-data.types';
import { BlockType } from '../types/block-types';
import { BlockId } from '../value-objects/block-id.vo';
import { CustomPropertyDefinition } from '../value-objects/block-properties/common-types';

// DomainEvent 인터페이스
export interface DomainEvent {
  readonly type: string;
  readonly aggregateId: any;
  readonly data: any;
  readonly occurredAt: Date;
  handle(context?: unknown): Promise<void>;
}

// BlockCreatedEvent
export class BlockCreatedEvent implements DomainEvent {
  readonly type = 'BlockCreated';

  constructor(
    public readonly aggregateId: BlockId,
    public readonly data: {
      blockId: string;
      blockType: BlockType;
      title: string;
      properties: BlockProperties<BlockType>;
      customProperties: CustomPropertyDefinition[];
      workspaceId: string;
      userId: string;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Event 발생 시 Policy 실행
   * Event Storming의 Policy와 1:1 매칭
   *
   * ✅ Policy는 부수 효과이므로 실패해도 Aggregate에 영향 없음
   * ✅ 실패한 Policy는 나중에 재시도 가능
   */
  async handle(_context?: unknown): Promise<void> {
    // 순수 로깅 (항상 성공)
    // console.log('[Block Management] Block Created:', {
    //   blockId: this.data.blockId,
    //   blockType: this.data.blockType,
    //   title: this.data.title,
    //   workspaceId: this.data.workspaceId,
    //   userId: this.data.userId,
    //   occurredAt: this.occurredAt,
    // });

    // 외부 도메인 Policy 실행 (부수 효과)
    // ✅ Promise.allSettled 사용: 실패해도 에러 throw 안 함
    await Promise.allSettled([
      // Policy 구현 예시:
      // - 워크스페이스 통계 업데이트
      // - 생성자별 활동 추적
      // - 워크스페이스별 블럭 수 증가
    ]);
  }
}

// BlockUpdatedEvent
export class BlockUpdatedEvent implements DomainEvent {
  readonly type = 'BlockUpdated';

  constructor(
    public readonly aggregateId: BlockId,
    public readonly data: {
      blockId: BlockId;
      updateData: Record<string, any>;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Policy: When BlockUpdated → log block_updated to event_log.
   * pageId는 context에 있으면 사용, 없으면 getPageIdForBlock(blockId)로 핸들러에서 직접 조회.
   */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    if (!ctx?.eventLogService || !ctx?.userId) return;
    let pageId = ctx.pageId;
    if (pageId == null && ctx.getPageIdForBlock) {
      pageId = (await ctx.getPageIdForBlock(this.data.blockId.value)) ?? undefined;
    }
    if (!pageId) return;
    await ctx.eventLogService
      .logBlockUpdated({
        pageId,
        userId: ctx.userId,
        blockId: this.data.blockId.value,
        changes: this.data.updateData,
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
      // - 블록 변경 이력 기록
      // - 버전 관리 시스템 업데이트
    ]);
  }
}

// BlockPropertyUpdatedEvent
export class BlockPropertyUpdatedEvent implements DomainEvent {
  readonly type = 'BlockPropertyUpdated';

  constructor(
    public readonly aggregateId: BlockId,
    public readonly data: {
      blockId: BlockId;
      propertyPath: string;
      oldValue: any;
      newValue: any;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(_context?: unknown): Promise<void> {
    // console.log('[Block Management] Block Property Updated:', {
    //   blockId: this.aggregateId.value,
    //   propertyPath: this.data.propertyPath,
    //   oldValue: this.data.oldValue,
    //   newValue: this.data.newValue,
    //   occurredAt: this.occurredAt,
    // });

    // 외부 도메인 Policy 실행 (부수 효과)
    await Promise.allSettled([
      // Policy 구현 예시:
      // - 블록 속성 변경 이력 기록
      // - 버전 관리 시스템 업데이트
      // - 감사 로그 생성
      // - 실시간 동기화를 위한 WebSocket 이벤트 전송
      // - 검색 인덱스 업데이트
    ]);
  }
}

/** Block content updated event data: content/raw optional; steps + version always present (event_log stores only steps + version). */
export type BlockContentUpdatedEventData = {
  blockId: BlockId;
  content?: unknown;
  contentRaw?: string;
  steps: unknown[];
  baseVersion: number;
  newVersion: number;
};

// BlockContentUpdatedEvent
// Event log (audit) for block content is written only on blur via logBlockUpdatedAuditAction, not from this event.
export class BlockContentUpdatedEvent implements DomainEvent {
  readonly type = 'BlockContentUpdated';

  constructor(
    public readonly aggregateId: BlockId,
    public readonly data: BlockContentUpdatedEventData,
    public readonly occurredAt: Date
  ) { }

  async handle(_context?: unknown): Promise<void> {
    // No event_log policy here; audit is blur-only via logBlockUpdatedAuditAction.
  }
}

// BlockTitleUpdatedEvent
export class BlockTitleUpdatedEvent implements DomainEvent {
  readonly type = 'BlockTitleUpdated';

  constructor(
    public readonly aggregateId: BlockId,
    public readonly data: {
      blockId: BlockId;
      oldTitle: string;
      newTitle: string;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Policy: When BlockTitleUpdated → log block_updated to event_log.
   * pageId는 context에 있으면 사용, 없으면 getPageIdForBlock(blockId)로 핸들러에서 직접 조회.
   */
  private async applyEventLogPolicy(context?: unknown): Promise<void> {
    const ctx = context as EventLogPolicyContext | undefined;
    if (!ctx?.eventLogService || !ctx?.userId) return;
    let pageId = ctx.pageId;
    if (pageId == null && ctx.getPageIdForBlock) {
      pageId = (await ctx.getPageIdForBlock(this.data.blockId.value)) ?? undefined;
    }
    if (!pageId) return;
    await ctx.eventLogService
      .logBlockUpdated({
        pageId,
        userId: ctx.userId,
        blockId: this.data.blockId.value,
        changes: { title: this.data.newTitle },
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
      // - 블록 제목 변경 이력 기록
      // - 버전 관리 시스템 업데이트
      // - 검색 인덱스 업데이트
    ]);
  }
}

// BlockPropertiesUpdatedEvent (일괄 업데이트)
export class BlockPropertiesUpdatedEvent implements DomainEvent {
  readonly type = 'BlockPropertiesUpdated';

  constructor(
    public readonly aggregateId: BlockId,
    public readonly data: {
      blockId: BlockId;
      updatedProperties: Record<string, { oldValue: any; newValue: any }>;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(_context?: unknown): Promise<void> {
    // console.log('[Block Management] Block Properties Updated:', {
    //   blockId: this.aggregateId.value,
    //   updatedProperties: this.data.updatedProperties,
    //   occurredAt: this.occurredAt,
    // });

    // 외부 도메인 Policy 실행 (부수 효과)
    await Promise.allSettled([
      // Policy 구현 예시:
      // - 블록 속성 일괄 변경 이력 기록
      // - 버전 관리 시스템 업데이트
      // - 감사 로그 생성
      // - 실시간 동기화를 위한 WebSocket 이벤트 전송
      // - 검색 인덱스 업데이트
    ]);
  }
}

// BlockDeletedEvent
export class BlockDeletedEvent implements DomainEvent {
  readonly type = 'BlockDeleted';

  constructor(
    public readonly aggregateId: BlockId,
    public readonly data: {
      blockId: BlockId;
      workspaceId: WorkspaceId;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(_context?: unknown): Promise<void> {
    // console.log('[Block Management] Block Deleted:', {
    //   blockId: this.aggregateId.value,
    //   workspaceId: this.data.workspaceId.value,
    //   occurredAt: this.occurredAt,
    // });

    // 외부 도메인 Policy 실행 (부수 효과)
    await Promise.allSettled([
      // Policy 구현 예시:
      // - 블록 삭제 이력 기록
      // - 관련 미디어 파일 정리
      // - 복원 가능성 확인
    ]);
  }
}

// BlockDuplicatedEvent
export class BlockDuplicatedEvent implements DomainEvent {
  readonly type = 'BlockDuplicated';

  constructor(
    public readonly aggregateId: BlockId,
    public readonly data: {
      originalBlockId: BlockId;
      duplicatedBlockId: BlockId;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Event 발생 시 Policy 실행
   * Event Storming의 Policy와 1:1 매칭
   *
   * ✅ Policy는 부수 효과이므로 실패해도 Aggregate에 영향 없음
   * ✅ 실패한 Policy는 나중에 재시도 가능
   */
  async handle(_context?: unknown): Promise<void> {
    // 순수 로깅 (항상 성공)
    // console.log('[Block Management] Block Duplicated:', {
    //   originalBlockId: this.data.originalBlockId.value,
    //   duplicatedBlockId: this.data.duplicatedBlockId.value,
    //   occurredAt: this.occurredAt,
    // });

    // 외부 도메인 Policy 실행 (부수 효과)
    // ✅ Promise.allSettled 사용: 실패해도 에러 throw 안 함
    await Promise.allSettled([
      // Policy 구현 예시:
      // - 블록 복제 이력 기록
      // - 복제된 블록 추적
    ]);
  }
}

// BlockRestoredEvent
export class BlockRestoredEvent implements DomainEvent {
  readonly type = 'BlockRestored';

  constructor(
    public readonly aggregateId: BlockId,
    public readonly data: {
      blockId: BlockId;
      userId: UserId;
    },
    public readonly occurredAt: Date
  ) { }

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(_context?: unknown): Promise<void> {
    // console.log('[Block Management] Block Restored:', {
    //   blockId: this.aggregateId.value,
    //   occurredAt: this.occurredAt,
    // });
  }
}
