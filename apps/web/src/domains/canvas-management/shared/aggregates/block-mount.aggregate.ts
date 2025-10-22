import { BlockMount } from '../entities/block-mount.entity';
import { BlockMountId } from '../value-objects/block-mount-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { Position } from '../value-objects/position.vo';
import { Size } from '../value-objects/size.vo';
import { ZOrder } from '../value-objects/z-order.vo';
import {
  DomainEvent,
  BlockMountedEvent,
  BlockTransformedEvent,
  BlockPositionUpdatedEvent,
  BlockSizeUpdatedEvent,
  BlockZOrderUpdatedEvent,
  BlockMountDeletedEvent,
} from '../events/index';

export class BlockMountAggregate {
  private _events: DomainEvent[] = [];

  constructor(public readonly blockMount: BlockMount) {}

  static mountBlock(
    blockMountId: BlockMountId,
    pageId: PageId,
    blockId: BlockId,
    position: Position,
    size: Size,
    baseZOrder: number = 0
  ): BlockMountAggregate {
    // 1. 최상위 ZOrder 계산
    const zOrder = new ZOrder(baseZOrder + 1);

    // 2. BlockMount Entity 생성
    const blockMount = new BlockMount(
      blockMountId,
      pageId,
      blockId,
      position,
      size,
      zOrder
    );

    // 3. BlockMounted 이벤트 생성
    const blockMountedEvent = new BlockMountedEvent(blockMountId, {
      blockMountId,
      pageId,
      blockId,
      position,
      size,
      zOrder,
      occurredAt: new Date(),
    });

    // 4. Aggregate 생성 및 이벤트 추가
    const aggregate = new BlockMountAggregate(blockMount);
    aggregate._events.push(blockMountedEvent);

    // 5. BlockMountAggregate 반환
    return aggregate;
  }

  updateBlockPosition(newPosition: Position): BlockPositionUpdatedEvent {
    // 1. BlockMount Entity 위치 업데이트
    this.blockMount.transform(newPosition, undefined, undefined);

    // 2. BlockPositionUpdated 이벤트 생성
    const event = new BlockPositionUpdatedEvent(this.blockMount.id, {
      blockMountId: this.blockMount.id,
      newPosition,
      occurredAt: new Date(),
    });

    // 3. 이벤트 추가
    this._events.push(event);

    // 4. 이벤트 반환
    return event;
  }

  updateBlockSize(newSize: Size): BlockSizeUpdatedEvent {
    // 1. BlockMount Entity 크기 업데이트
    this.blockMount.transform(undefined, newSize, undefined);

    // 2. BlockSizeUpdated 이벤트 생성
    const event = new BlockSizeUpdatedEvent(this.blockMount.id, {
      blockMountId: this.blockMount.id,
      newSize,
      occurredAt: new Date(),
    });

    // 3. 이벤트 추가
    this._events.push(event);

    // 4. 이벤트 반환
    return event;
  }

  updateBlockZOrder(newZOrder: ZOrder): BlockZOrderUpdatedEvent {
    // 1. BlockMount Entity Z-Order 업데이트
    this.blockMount.transform(undefined, undefined, newZOrder);

    // 2. BlockZOrderUpdated 이벤트 생성
    const event = new BlockZOrderUpdatedEvent(this.blockMount.id, {
      blockMountId: this.blockMount.id,
      newZOrder,
      occurredAt: new Date(),
    });

    // 3. 이벤트 추가
    this._events.push(event);

    // 4. 이벤트 반환
    return event;
  }

  deleteBlockMount(): BlockMountDeletedEvent {
    // 1. 삭제 가능 여부 확인
    if (!this.blockMount.canBeDeleted()) {
      throw new Error('BlockMount cannot be deleted');
    }

    // 2. BlockMountDeleted 이벤트 생성
    const event = new BlockMountDeletedEvent(this.blockMount.id, {
      blockMountId: this.blockMount.id,
      occurredAt: new Date(),
    });

    // 3. 이벤트 추가
    this._events.push(event);

    // 4. 이벤트 반환
    return event;
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this._events];
  }

  clearEvents(): void {
    this._events = [];
  }
}
