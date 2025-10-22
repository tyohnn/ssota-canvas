import { BlockMountId } from '../value-objects/block-mount-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { Position } from '../value-objects/position.vo';
import { Size } from '../value-objects/size.vo';
import { ZOrder } from '../value-objects/z-order.vo';

export class BlockMount {
  constructor(
    public readonly id: BlockMountId,
    public readonly pageId: PageId,
    public readonly blockId: BlockId,
    public position: Position,
    public size: Size,
    public zOrder: ZOrder,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  transform(newPosition?: Position, newSize?: Size, newZOrder?: ZOrder): void {
    // 1. 각 속성이 제공된 경우 업데이트
    if (newPosition !== undefined) {
      this.position = newPosition;
    }

    if (newSize !== undefined) {
      this.size = newSize;
    }

    if (newZOrder !== undefined) {
      this.zOrder = newZOrder;
    }

    // 2. updatedAt 갱신
    this.updatedAt = new Date();
  }

  canBeDeleted(): boolean {
    // 1. 삭제 가능 조건 확인 (현재는 항상 true)
    // 향후 비즈니스 규칙이 추가되면 여기에 구현
    return true;
  }
}
