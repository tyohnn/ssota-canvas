import { Block } from '../entities/block.entity';
import { BlockId } from '../value-objects/block-id.vo';
import {
  CreateBlockCommand,
  UpdateBlockCommand,
  UpdateBlockPropertyCommand,
  UpdateBlockContentCommand,
  DeleteBlockCommand,
  DuplicateBlockCommand,
} from '../commands';
import {
  BlockCreatedEvent,
  BlockUpdatedEvent,
  BlockPropertyUpdatedEvent,
  BlockDeletedEvent,
  BlockDuplicatedEvent,
} from '../events';
import { BlockManagementError } from '../errors/block-management.error';
import { BlockPropertiesFactory } from '../value-objects/block-properties';

/**
 * BlockAggregate
 *
 * 블록 도메인의 Aggregate Root
 * 블록 생성, 수정, 삭제의 비즈니스 로직을 캡슐화하고 도메인 이벤트를 발생시킴
 */

type BlockManagementEvents =
  | BlockCreatedEvent
  | BlockUpdatedEvent
  | BlockPropertyUpdatedEvent
  | BlockDeletedEvent
  | BlockDuplicatedEvent;

export class BlockAggregate {
  private _block: Block;
  private _uncommittedEvents: Array<BlockManagementEvents> = [];

  private constructor(block: Block) {
    this._block = block;
  }

  /**
   * 새로운 BlockAggregate 생성
   */
  static create(command: CreateBlockCommand): BlockAggregate {
    // initialProperties가 있으면 기본값과 병합하여 BlockPropertiesVO 생성
    let propertiesVO = undefined;

    if (command.initialProperties) {
      const defaultProperties = BlockPropertiesFactory.createForBlockType(
        command.blockType
      );
      const mergedProperties = {
        ...defaultProperties.toJSON(),
        ...command.initialProperties,
      };
      propertiesVO = BlockPropertiesFactory.createFromJSON(
        command.blockType,
        mergedProperties
      );
    }

    const block = Block.create(
      command.blockId,
      command.workspaceId,
      command.userId,
      command.blockType,
      command.title,
      propertiesVO, // initialProperties가 있으면 전달, 없으면 undefined (기본값 사용)
      command.initialContent // ✨ initialContent 전달
    );

    const aggregate = new BlockAggregate(block);

    // 도메인 이벤트 발생
    const event = new BlockCreatedEvent(
      block.id,
      {
        blockId: block.id.value,
        blockType: block.blockType.value,
        title: block.title,
        properties: block.properties.toJSON(),
        customProperties: block.customProperties.map(cp => cp.toJSON()),
        workspaceId: block.workspaceId.value,
        userId: block.userId.value,
      },
      block.createdAt
    );

    aggregate._uncommittedEvents.push(event);

    return aggregate;
  }

  /**
   * 기존 BlockAggregate 재구성
   */
  static reconstitute(block: Block): BlockAggregate {
    return new BlockAggregate(block);
  }

  /**
   * 블록 업데이트
   */
  update(command: UpdateBlockCommand): void {
    if (this._block.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot update deleted block'
      );
    }

    // 속성 업데이트
    if (command.updateData.title !== undefined) {
      this._block.update({ title: command.updateData.title });
    }

    if (command.updateData.properties) {
      this._block.update({ properties: command.updateData.properties });
    }

    // 도메인 이벤트 발생
    const event = new BlockUpdatedEvent(
      this._block.id,
      {
        blockId: this._block.id,
        updateData: command.updateData,
      },
      this._block.updatedAt
    );

    this._uncommittedEvents.push(event);
  }

  /**
   * 블록 복제
   */
  duplicate(command: DuplicateBlockCommand): BlockAggregate {
    const duplicatedBlock = this._block.duplicate(command.userId);

    const aggregate = new BlockAggregate(duplicatedBlock);

    const event = new BlockDuplicatedEvent(
      duplicatedBlock.id,
      {
        originalBlockId: this._block.id,
        duplicatedBlockId: duplicatedBlock.id,
      },
      duplicatedBlock.createdAt
    );

    aggregate._uncommittedEvents.push(event);

    return aggregate;
  }

  /**
   * 블록 속성 업데이트
   */
  updateProperty(command: UpdateBlockPropertyCommand): void {
    if (this._block.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot update property of deleted block'
      );
    }

    // properties.xxx 형태의 경로만 처리
    if (command.propertyPath.startsWith('properties.')) {
      const propertyKey = command.propertyPath.replace('properties.', '');
      const currentPropertiesJSON = this._block.properties.toJSON() as Record<
        string,
        any
      >;
      // 기존 _extraFields (커스텀 속성 값) 포함
      const extraFields = (this._block.properties as any)._extraFields || {};
      const currentProperties = {
        ...currentPropertiesJSON,
        ...extraFields,
      };
      const oldValue = currentProperties[propertyKey];
      const updatedProperties = {
        ...currentProperties,
        [propertyKey]: command.value,
      };
      this._block.update({ properties: updatedProperties });

      // 도메인 이벤트 발생
      const event = new BlockPropertyUpdatedEvent(
        this._block.id,
        {
          blockId: this._block.id,
          propertyPath: command.propertyPath,
          oldValue,
          newValue: command.value,
        },
        this._block.updatedAt
      );

      this._uncommittedEvents.push(event);
    } else {
      throw new BlockManagementError(
        'INVALID_PROPERTY_PATH',
        `Invalid property path: ${command.propertyPath}. Only properties.* paths are supported.`
      );
    }
  }

  /**
   * 블록 콘텐츠 업데이트
   */
  updateContent(command: UpdateBlockContentCommand): void {
    if (this._block.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot update content of deleted block'
      );
    }

    // content 및 contentRaw 필드 업데이트
    this._block.update({
      content: command.content,
      contentRaw: command.contentRaw,
    });

    // 도메인 이벤트 발생 (BlockUpdatedEvent 재사용)
    const event = new BlockUpdatedEvent(
      this._block.id,
      {
        blockId: this._block.id,
        updateData: {
          content: command.content,
          contentRaw: command.contentRaw,
        },
      },
      this._block.updatedAt
    );

    this._uncommittedEvents.push(event);
  }

  /**
   * 블록 삭제
   */
  delete(command: DeleteBlockCommand): void {
    if (this._block.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Block already deleted'
      );
    }

    this._block.markAsDeleted();

    // 도메인 이벤트 발생
    const event = new BlockDeletedEvent(
      this._block.id,
      {
        blockId: this._block.id,
        workspaceId: this._block.workspaceId,
      },
      this._block.deletedAt || new Date()
    );

    this._uncommittedEvents.push(event);
  }

  /**
   * 블록 복원
   */
  restore(): void {
    if (!this._block.isDeleted()) {
      throw new BlockManagementError(
        'INVALID_OPERATION',
        'Block is not deleted'
      );
    }

    this._block.restore();

    // 복원 이벤트는 별도로 정의하지 않고 업데이트 이벤트로 처리
    const event = new BlockUpdatedEvent(
      this._block.id,
      {
        blockId: this._block.id,
        updateData: { restored: true },
      },
      this._block.updatedAt
    );

    this._uncommittedEvents.push(event);
  }

  /**
   * 현재 블록 상태 반환
   */
  getBlock(): Block {
    return this._block;
  }

  /**
   * 커밋되지 않은 이벤트들 반환
   */
  getUncommittedEvents(): Array<BlockManagementEvents> {
    return [...this._uncommittedEvents];
  }

  /**
   * 이벤트 커밋 (이벤트 스토어에 저장 후 호출)
   */
  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  /**
   * Aggregate ID 반환
   */
  getId(): BlockId {
    return this._block.id;
  }

  /**
   * 워크스페이스 ID 반환
   */
  getWorkspaceId(): string {
    return this._block.workspaceId.value;
  }

  /**
   * 블록이 삭제되었는지 확인
   */
  isDeleted(): boolean {
    return this._block.isDeleted();
  }
}
