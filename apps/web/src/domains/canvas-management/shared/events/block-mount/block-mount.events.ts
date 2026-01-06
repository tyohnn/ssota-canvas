import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';

import { PageId } from '../../../../workspace-management/shared/value-objects/page-id.vo';
import { BlockMountId } from '../../value-objects/block-mount-id.vo';
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
      zOrder: ZOrder;
    },
    public readonly occurredAt: Date
  ) {}

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    console.log('[Canvas Management] Block Mounted:', {
      blockMountId: this.aggregateId.value,
      pageId: this.data.pageId.value,
      blockId: this.data.blockId.value,
      occurredAt: this.occurredAt,
    });

    await Promise.allSettled([
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
  ) {}

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    console.log('[Canvas Management] Block Deleted:', {
      blockMountId: this.aggregateId.value,
      occurredAt: this.occurredAt,
    });

    await Promise.allSettled([
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
    },
    public readonly occurredAt: Date
  ) {}

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    console.log('[Canvas Management] Block Mount Duplicated:', {
      originalBlockMountId: this.data.originalBlockMountId,
      duplicatedBlockMountId: this.data.duplicatedBlockMountId,
      occurredAt: this.occurredAt,
    });

    await Promise.allSettled([
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
  ) {}

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    console.log('[Canvas Management] Multiple Block Mounts Deleted:', {
      deletedBlockMountIds: this.data.deletedBlockMountIds,
      deletedEdgesCount: this.data.deletedEdgesCount,
      occurredAt: this.occurredAt,
    });

    await Promise.allSettled([
      // Policy 구현 예시:
      // - 캔버스 통계 일괄 업데이트
      // - 레이아웃 자동 재정렬
      // - 성능 최적화를 위한 배치 처리
    ]);
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
  ) {}

  /**
   * Event 발생 시 Policy 실행
   */
  async handle(): Promise<void> {
    console.log('[Canvas Management] Block Moved To Page:', {
      blockMountId: this.aggregateId.value,
      previousPageId: this.data.previousPageId.value,
      newPageId: this.data.newPageId.value,
      occurredAt: this.occurredAt,
    });

    await Promise.allSettled([
      // Policy 구현 예시:
      // - 연결된 엣지 정리 (다른 페이지로 이동했으므로)
      // - 캔버스 통계 업데이트
      // - 레이아웃 재정렬
    ]);
  }
}
