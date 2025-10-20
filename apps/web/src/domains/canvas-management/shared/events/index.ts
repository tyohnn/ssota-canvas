import { PageId } from '../../../workspace-management/shared/value-objects/page-id.vo';
import { BlockMountId } from '../value-objects/block-mount-id.vo';
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
