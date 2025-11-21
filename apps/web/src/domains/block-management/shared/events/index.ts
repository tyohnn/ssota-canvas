import { BlockId } from '../value-objects/block-id.vo';
import { CustomPropertyDefinition } from '../value-objects/block-properties/common-types';
import { BlockType } from '../types/block-types';
import { BlockProperties } from '../types/block-data.types';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { UserProfile } from '@/domains/user-management/shared/types';

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
      blockId: string;
      blockType: BlockType;
      title: string;
      properties: BlockProperties<BlockType>;
      customProperties: CustomPropertyDefinition[];
      workspaceId: string;
      userId: string;
    },
    public readonly occurredAt: Date
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
    },
    public readonly occurredAt: Date
  ) {}
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
  ) {}
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
  ) {}
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
  ) {}
}
