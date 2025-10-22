import { PageId } from '../../../workspace-management/shared/value-objects/page-id.vo';
import { BlockMountId } from '../value-objects/block-mount-id.vo';
import { EdgeId } from '../value-objects/edge-id.vo';
import { EdgeShape } from '../value-objects/edge-shape.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
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
      occurredAt: Date;
    }
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
      occurredAt: Date;
    }
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
      occurredAt: Date;
    }
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
      occurredAt: Date;
    }
  ) {}
}

// BlockMountDeletedEvent
export class BlockMountDeletedEvent implements DomainEvent {
  readonly type = 'BlockMountDeleted';

  constructor(
    public readonly aggregateId: BlockMountId,
    public readonly data: {
      blockMountId: BlockMountId;
      occurredAt: Date;
    }
  ) {}
}

// BlockDuplicatedEvent
export class BlockDuplicatedEvent implements DomainEvent {
  readonly type = 'BlockDuplicated';

  constructor(
    public readonly aggregateId: BlockMountId,
    public readonly data: {
      originalBlockMountId: BlockMountId;
      duplicatedBlockMountId: BlockMountId;
      originalBlockId: BlockId;
      duplicatedBlockId: BlockId;
      pageId: PageId;
      duplicatedPosition: Position;
      duplicatedSize: Size;
      duplicatedZOrder: ZOrder;
      occurredAt: Date;
    }
  ) {}
}

// EdgeCreatedEvent
export class EdgeCreatedEvent implements DomainEvent {
  readonly type = 'EdgeCreated';

  constructor(
    public readonly aggregateId: EdgeId,
    public readonly data: {
      edgeId: EdgeId;
      pageId: PageId;
      sourceBlockId: BlockId;
      targetBlockId: BlockId;
      edgeShape: EdgeShape;
      occurredAt: Date;
    }
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
      occurredAt: Date;
    }
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
      occurredAt: Date;
    }
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
      occurredAt: Date;
    }
  ) {}
}

// EdgeDeletedEvent
export class EdgeDeletedEvent implements DomainEvent {
  readonly type = 'EdgeDeleted';

  constructor(
    public readonly aggregateId: EdgeId,
    public readonly data: {
      edgeId: EdgeId;
      occurredAt: Date;
    }
  ) {}
}
