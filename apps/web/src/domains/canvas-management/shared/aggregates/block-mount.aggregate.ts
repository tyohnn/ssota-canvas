import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';

import {
  DuplicateBlockMountCommand,
  MountBlockCommand,
  MoveBlockToPageCommand,
  SoftDeleteBlockMountCommand,
  UpdateBlockMountViewModeCommand,
  UpdateSingleBlockPositionCommand,
  UpdateSingleBlockSizeCommand,
} from '../commands/index';
import { BlockView } from '../dtos/views/block.views';
import { BlockMount } from '../entities/block-mount.entity';
import {
  BlockMountDeletedEvent,
  BlockMountDuplicatedEvent,
  BlockMountedEvent,
  BlockMovedToPageEvent,
  BlockPositionUpdatedEvent,
  BlockSizeUpdatedEvent,
  BlockViewModeUpdatedEvent,
  BlockZOrderUpdatedEvent,
  DomainEvent,
} from '../events';
import { BlockViewMode } from '../value-objects/block-view-mode.vo';
import { ViewModeSizes } from '../value-objects/view-mode-sizes.vo';
import { ZOrder } from '../value-objects/z-order.vo';

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
    // TODO: service 레이어에서 최상위 ZOrder 계산 로직 구현
    const zOrder = new ZOrder(0);

    // 2. viewMode 결정 (command에서 제공되지 않으면 기본값 사용)
    const viewMode = command.viewMode ?? BlockViewMode.default();

    // 3. ViewModeSizes 생성
    // command.viewModeSizes가 제공되면 사용, 없으면 현재 viewMode만 설정
    const viewModeSizes = command.viewModeSizes
      ? command.viewModeSizes
      : ViewModeSizes.empty().updateSizeForViewMode(
          viewMode.value,
          command.size
        );

    // 4. BlockMount Entity 생성
    // viewMode 명시적으로 전달
    const blockMount = new BlockMount(
      command.blockMountId,
      command.pageId,
      command.blockId,
      command.position,
      viewModeSizes,
      zOrder,
      viewMode,
      null // 새로 생성되는 블록은 그룹에 속하지 않음
    );

    // 5. BlockMounted 이벤트 생성
    const blockMountedEvent = new BlockMountedEvent(
      command.blockMountId,
      {
        blockMountId: blockMount.id,
        pageId: blockMount.pageId,
        blockId: blockMount.blockId,
        position: blockMount.position,
        size: blockMount.size, // 하위 호환성을 위해 유지
        viewMode: blockMount.viewMode,
        zOrder: zOrder,
      },
      new Date()
    );

    // 6. Aggregate 생성 및 이벤트 추가
    const aggregate = new BlockMountAggregate(blockMount);
    aggregate._uncommittedEvents.push(blockMountedEvent);

    // 7. BlockMountAggregate 반환
    return aggregate;
  }

  /**
   * 블럭 위치 업데이트 (Command Handler)
   *
   * ✅ Event Storming + DDD 패턴:
   * - Command를 입력으로 받음
   * - Entity에서 비즈니스 로직 실행
   * - Domain Event를 발생 (1 Command : 1 Event)
   *
   * @param command - UpdateSingleBlockPositionCommand
   */
  updateBlockPosition(command: UpdateSingleBlockPositionCommand): void {
    // 1. BlockMount Entity 위치 업데이트 (비즈니스 로직 실행)
    this._blockMount.transform(command.newPosition, undefined, undefined);

    // 2. Domain Event 발생 (Command → Event 1:1 대응)
    const event = new BlockPositionUpdatedEvent(
      this._blockMount.id,
      {
        blockMountId: this._blockMount.id,
        newPosition: command.newPosition,
      },
      this._blockMount.updatedAt
    );
    this._uncommittedEvents.push(event);
  }

  /**
   * 블럭 크기 업데이트 (Command Handler)
   *
   * ✅ Event Storming + DDD 패턴:
   * - Command를 입력으로 받음
   * - Entity에서 비즈니스 로직 실행
   * - Domain Event를 발생 (1 Command : 1 Event)
   *
   * @param command - UpdateSingleBlockSizeCommand
   */
  updateBlockSize(command: UpdateSingleBlockSizeCommand): void {
    // 1. BlockMount Entity 크기 업데이트 (비즈니스 로직 실행)
    // viewMode에 따라 해당 뷰 모드의 크기만 업데이트
    this._blockMount.transform(
      undefined,
      command.newSize,
      undefined,
      command.viewMode
    );

    // 2. Domain Event 발생 (Command → Event 1:1 대응)
    const event = new BlockSizeUpdatedEvent(
      this._blockMount.id,
      {
        blockMountId: this._blockMount.id,
        newSize: command.newSize,
        viewMode: command.viewMode,
      },
      this._blockMount.updatedAt
    );
    this._uncommittedEvents.push(event);
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

  /**
   * 블럭 마운트 삭제 (Command Handler)
   *
   * ✅ Event Storming + DDD 패턴:
   * - Command를 입력으로 받음
   * - Entity에서 비즈니스 로직 실행 (soft delete)
   * - Domain Event를 발생 (1 Command : 1 Event)
   *
   * @param command - SoftDeleteBlockMountCommand
   */
  deleteBlockMount(command: SoftDeleteBlockMountCommand): void {
    // 1. 삭제 가능 여부 확인
    if (!this._blockMount.canBeDeleted()) {
      throw new Error('BlockMount cannot be deleted');
    }

    // 2. BlockMount Entity 소프트 삭제 (비즈니스 로직 실행)
    this._blockMount.markAsDeleted();

    // 3. Domain Event 발생 (Command → Event 1:1 대응)
    const event = new BlockMountDeletedEvent(
      this._blockMount.id,
      {
        blockMountId: this._blockMount.id,
      },
      this._blockMount.deletedAt!
    );
    this._uncommittedEvents.push(event);
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

    // 3. viewModeSizes 복제 (모든 뷰 모드 크기 유지)
    const duplicatedViewModeSizes = ViewModeSizes.fromJSON(
      this._blockMount.viewModeSizes.toJSON()
    );

    // 4. 새로운 BlockMount 인스턴스 생성 (pageId가 readonly이므로 새 인스턴스 필요)
    const newBlockMount = new BlockMount(
      this._blockMount.id,
      command.targetPageId, // 새로운 pageId
      this._blockMount.blockId,
      command.newPosition, // 새로운 위치
      duplicatedViewModeSizes, // 모든 뷰 모드 크기 유지
      this._blockMount.zOrder,
      this._blockMount.viewMode, // View Mode 유지
      null, // 페이지 이동 시 그룹 관계 해제
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

  /**
   * View Mode 업데이트 (Command Handler)
   * @param command - UpdateBlockMountViewModeCommand
   */
  updateViewMode(command: UpdateBlockMountViewModeCommand): void {
    // 1. BlockMount Entity View Mode 업데이트 (비즈니스 로직 실행)
    this._blockMount.updateViewMode(command.viewMode);

    // 2. Domain Event 발생 (Command → Event 1:1 대응)
    const event = new BlockViewModeUpdatedEvent(
      this._blockMount.id,
      {
        blockMountId: this._blockMount.id,
        newViewMode: command.viewMode,
      },
      this._blockMount.updatedAt
    );
    this._uncommittedEvents.push(event);
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

  /**
   * BlockMountAggregate와 BlockAggregate를 BlockView DTO로 변환
   *
   * Aggregate → DTO 변환 로직을 Aggregate에 캡슐화하여
   * 중복 코드를 제거하고 일관성 있는 변환을 보장합니다.
   *
   * @param blockAggregate - BlockAggregate (Block 정보 포함)
   * @returns BlockView DTO
   */
  toView(blockAggregate: BlockAggregate): BlockView {
    const blockMount = this._blockMount;
    const block = blockAggregate.getBlock();

    return {
      // Mount 정보 (Canvas Management Domain)
      blockMountId: blockMount.id.value,
      position: {
        x: blockMount.position.x,
        y: blockMount.position.y,
      },
      size: {
        width: blockMount.size.width,
        height: blockMount.size.height,
      },
      zOrder: blockMount.zOrder.value,
      viewMode: blockMount.viewMode.value,
      viewModeSizes: blockMount.viewModeSizes.toJSON(),

      // Block 정보 (Block Management Domain)
      blockId: block.id.value,
      blockType: block.blockType.value,
      title: block.title,
      properties: block.properties.toJSON(),
      customProperties: block.customProperties.map(cp => cp.toJSON()) || [],
      content: block.content,

      // 메타데이터 (Block Management Domain)
      createdAt: block.createdAt.toISOString(),
      updatedAt: block.updatedAt.toISOString(),
      createdByProfile: block.createdByProfile,
    };
  }
}
