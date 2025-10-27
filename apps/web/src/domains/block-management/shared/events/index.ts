import { BlockId } from '../value-objects/block-id.vo';
import { BlockType } from '../value-objects/block-type.vo';

// DomainEvent 인터페이스
export interface DomainEvent {
  readonly type: string;
  readonly aggregateId: any;
  readonly data: any;
}

// BlockCreatedEvent
export class BlockCreatedEvent implements DomainEvent {
  readonly type = 'BlockCreated';

  constructor(
    public readonly aggregateId: BlockId,
    public readonly data: {
      blockId: BlockId;
      workspaceId: string;
      blockType: BlockType;
      properties: Record<string, any>;
      customProperties: Array<{
        id: string;
        name: string;
        type: string;
        options?: Array<{ id: string; label: string; color: string }>;
        order: number;
        visible: boolean;
      }>;
      occurredAt: Date;
    }
  ) {}
}

// BlockUpdatedEvent
export class BlockUpdatedEvent implements DomainEvent {
  readonly type = 'BlockUpdated';

  constructor(
    public readonly aggregateId: BlockId,
    public readonly data: {
      blockId: BlockId;
      updateData: Record<string, any>;
      occurredAt: Date;
    }
  ) {}
}

// BlockDeletedEvent
export class BlockDeletedEvent implements DomainEvent {
  readonly type = 'BlockDeleted';

  constructor(
    public readonly aggregateId: BlockId,
    public readonly data: {
      blockId: BlockId;
      workspaceId: string;
      occurredAt: Date;
    }
  ) {}
}
