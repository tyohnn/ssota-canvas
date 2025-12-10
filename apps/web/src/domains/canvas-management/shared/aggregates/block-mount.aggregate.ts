import { BlockMount } from '../entities/block-mount.entity';
import { Position } from '../value-objects/position.vo';
import { Size } from '../value-objects/size.vo';
import { ZOrder } from '../value-objects/z-order.vo';
import {
  DomainEvent,
  BlockMountedEvent,
  BlockPositionUpdatedEvent,
  BlockSizeUpdatedEvent,
  BlockZOrderUpdatedEvent,
  BlockMountDeletedEvent,
  BlockMountDuplicatedEvent,
  BlockMovedToPageEvent,
} from '../events';
import {
  SoftDeleteBlockMountCommand,
  MountBlockCommand,
  DuplicateBlockMountCommand,
  MoveBlockToPageCommand,
} from '../commands/index';

export class BlockMountAggregate {
  private _uncommittedEvents: DomainEvent[] = [];
  private _blockMount: BlockMount;

  constructor(blockMount: BlockMount) {
    this._blockMount = blockMount;
  }

  getBlockMount(): BlockMount {
    return this._blockMount;
  }

  static mountBlock(command: MountBlockCommand): BlockMountAggregate {
    // 1. 최상위 ZOrder 계산
    const zOrder = new ZOrder(0);

    // 2. BlockMount Entity 생성
    const blockMount = new BlockMount(
      command.blockMountId,
      command.pageId,
      command.blockId,
      command.position,
      command.size,
      zOrder
    );

    // 3. BlockMounted 이벤트 생성
    const blockMountedEvent = new BlockMountedEvent(
      command.blockMountId,
      {
        blockMountId: command.blockMountId,
        pageId: command.pageId,
        blockId: command.blockId,
        position: command.position,
        size: command.size,
        zOrder: zOrder,
      },
      new Date()
    );

    // 4. Aggregate 생성 및 이벤트 추가
    const aggregate = new BlockMountAggregate(blockMount);
    aggregate._uncommittedEvents.push(blockMountedEvent);

    // 5. BlockMountAggregate 반환
    return aggregate;
  }

  updateBlockPosition(newPosition: Position): BlockPositionUpdatedEvent {
    // 1. BlockMount Entity 위치 업데이트
    this._blockMount.transform(newPosition, undefined, undefined);

    // 2. BlockPositionUpdated 이벤트 생성
    const event = new BlockPositionUpdatedEvent(
      this._blockMount.id,
      {
        blockMountId: this._blockMount.id,
        newPosition,
      },
      new Date()
    );

    // 3. 이벤트 추가
    this._uncommittedEvents.push(event);

    // 4. 이벤트 반환
    return event;
  }

  updateBlockSize(newSize: Size): BlockSizeUpdatedEvent {
    // 1. BlockMount Entity 크기 업데이트
    this._blockMount.transform(undefined, newSize, undefined);

    // 2. BlockSizeUpdated 이벤트 생성
    const event = new BlockSizeUpdatedEvent(
      this._blockMount.id,
      {
        blockMountId: this._blockMount.id,
        newSize,
      },
      new Date()
    );

    // 3. 이벤트 추가
    this._uncommittedEvents.push(event);

    // 4. 이벤트 반환
    return event;
  }

  updateBlockZOrder(newZOrder: ZOrder): BlockZOrderUpdatedEvent {
    // 1. BlockMount Entity Z-Order 업데이트
    this._blockMount.transform(undefined, undefined, newZOrder);

    // 2. BlockZOrderUpdated 이벤트 생성
    const event = new BlockZOrderUpdatedEvent(
      this._blockMount.id,
      {
        blockMountId: this._blockMount.id,
        newZOrder,
      },
      new Date()
    );

    // 3. 이벤트 추가
    this._uncommittedEvents.push(event);

    // 4. 이벤트 반환
    return event;
  }

  deleteBlockMount(
    command: SoftDeleteBlockMountCommand
  ): BlockMountDeletedEvent {
    // 1. 삭제 가능 여부 확인
    if (!this._blockMount.canBeDeleted()) {
      throw new Error('BlockMount cannot be deleted');
    }

    // 2. BlockMountDeleted 이벤트 생성
    const event = new BlockMountDeletedEvent(
      this._blockMount.id,
      {
        blockMountId: this._blockMount.id,
      },
      new Date()
    );

    // 3. uncommitted 이벤트에 추가 (BlockAggregate 패턴과 일치)
    this._uncommittedEvents.push(event);

    // 4. 이벤트 반환
    return event;
  }

  duplicateBlockMount(
    command: DuplicateBlockMountCommand
  ): BlockMountAggregate {
    // 1. 입력 검증
    if (!command.newBlockId) {
      throw new Error('New block ID is required for duplication');
    }

    // 2. BlockMount 복제 (엔티티의 duplicate 메서드 사용)
    const duplicatedBlockMount = this._blockMount.duplicate(
      command.newBlockId,
      command.offsetX,
      command.offsetY
    );

    // 3. BlockDuplicated 이벤트 생성
    const event = new BlockMountDuplicatedEvent(
      this._blockMount.id,
      {
        originalBlockMountId: this._blockMount.id.value,
        duplicatedBlockMountId: duplicatedBlockMount.id.value,
        originalBlockId: this._blockMount.blockId.value,
        duplicatedBlockId: command.newBlockId.value,
      },
      new Date()
    );

    // 4. 새로운 Aggregate 생성 및 이벤트 추가
    const duplicatedAggregate = new BlockMountAggregate(duplicatedBlockMount);
    duplicatedAggregate._uncommittedEvents.push(event);

    // 5. 복제된 Aggregate 반환
    return duplicatedAggregate;
  }

  moveToPage(command: MoveBlockToPageCommand): BlockMovedToPageEvent {
    // 1. 입력 검증
    if (!command.targetPageId) {
      throw new Error('Target page ID is required for moving block');
    }

    // 2. 이전 페이지 ID 저장
    const previousPageId = this._blockMount.pageId;

    // 3. 새로운 BlockMount 인스턴스 생성 (pageId가 readonly이므로 새 인스턴스 필요)
    const newBlockMount = new BlockMount(
      this._blockMount.id,
      command.targetPageId, // 새로운 pageId
      this._blockMount.blockId,
      command.newPosition, // 새로운 위치
      this._blockMount.size,
      this._blockMount.zOrder,
      this._blockMount.createdAt,
      new Date() // updatedAt 갱신
    );

    // 4. BlockMount 교체
    this._blockMount = newBlockMount;

    // 5. BlockMovedToPage 이벤트 생성
    const event = new BlockMovedToPageEvent(
      this._blockMount.id,
      {
        blockMountId: this._blockMount.id,
        previousPageId,
        newPageId: command.targetPageId,
        newPosition: command.newPosition,
      },
      new Date()
    );

    // 6. 이벤트 추가
    this._uncommittedEvents.push(event);

    // 7. 이벤트 반환
    return event;
  }

  clearEvents(): void {
    this._uncommittedEvents = [];
  }

  /**
   * 커밋되지 않은 이벤트들 조회
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  /**
   * 이벤트들을 커밋된 것으로 표시
   */
  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }
}
