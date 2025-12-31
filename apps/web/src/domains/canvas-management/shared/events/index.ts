import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';

import { PageId } from '../../../workspace-management/shared/value-objects/page-id.vo';
import { BlockMountId } from '../value-objects/block-mount-id.vo';
import { EdgeHandle } from '../value-objects/edge-handle.vo';
import { EdgeId } from '../value-objects/edge-id.vo';
import { EdgeShape } from '../value-objects/edge-shape.vo';
import { Position } from '../value-objects/position.vo';
import { Size } from '../value-objects/size.vo';
import { ZOrder } from '../value-objects/z-order.vo';

// DomainEvent 인터페이스
export interface DomainEvent {
  readonly type: string;
  readonly aggregateId: any;
  readonly data: any;
}

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
}

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
      occurredAt: Date;
    }
  ) {}
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
}

// BlockSizeUpdatedEvent
export class BlockSizeUpdatedEvent implements DomainEvent {
  readonly type = 'BlockSizeUpdated';

  constructor(
    public readonly aggregateId: BlockMountId,
    public readonly data: {
      blockMountId: BlockMountId;
      newSize: Size;
    },
    public readonly occurredAt: Date
  ) {}
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
  ) {}
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
      userId: string;
    },
    public readonly occurredAt: Date
  ) {}
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
}

// EdgeCreatedEvent
// ⚠️ Schema Change: now uses BlockMountId instead of BlockId
export class EdgeCreatedEvent implements DomainEvent {
  readonly type = 'EdgeCreated';

  constructor(
    public readonly aggregateId: EdgeId,
    public readonly data: {
      edgeId: EdgeId;
      pageId: PageId;
      sourceBlockMountId: BlockMountId;
      targetBlockMountId: BlockMountId;
      sourceHandle: EdgeHandle;
      targetHandle: EdgeHandle;
      edgeShape: EdgeShape;
    },
    public readonly occurredAt: Date
  ) {}
}

// EdgeShapeChangedEvent
export class EdgeShapeChangedEvent implements DomainEvent {
  readonly type = 'EdgeShapeChanged';

  constructor(
    public readonly aggregateId: EdgeId,
    public readonly data: {
      edgeId: EdgeId;
      newShape: EdgeShape;
    },
    public readonly occurredAt: Date
  ) {}
}

// EdgeLabelChangedEvent
export class EdgeLabelChangedEvent implements DomainEvent {
  readonly type = 'EdgeLabelChanged';

  constructor(
    public readonly aggregateId: EdgeId,
    public readonly data: {
      edgeId: EdgeId;
      newLabel: string;
    },
    public readonly occurredAt: Date
  ) {}
}

// EdgeStyleChangedEvent
export class EdgeStyleChangedEvent implements DomainEvent {
  readonly type = 'EdgeStyleChanged';

  constructor(
    public readonly aggregateId: EdgeId,
    public readonly data: {
      edgeId: EdgeId;
      style: {
        stroke?: string;
        strokeWidth?: number;
      };
    },
    public readonly occurredAt: Date
  ) {}
}

// EdgeDeletedEvent
export class EdgeDeletedEvent implements DomainEvent {
  readonly type = 'EdgeDeleted';

  constructor(
    public readonly aggregateId: EdgeId,
    public readonly data: {
      edgeId: EdgeId;
    },
    public readonly occurredAt: Date
  ) {}
}
