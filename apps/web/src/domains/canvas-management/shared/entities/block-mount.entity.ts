import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

import { BlockMountId } from '../value-objects/block-mount-id.vo';
import { BlockViewMode } from '../value-objects/block-view-mode.vo';
import { Position } from '../value-objects/position.vo';
import { Size } from '../value-objects/size.vo';
import { ViewModeSizes } from '../value-objects/view-mode-sizes.vo';
import { ZOrder } from '../value-objects/z-order.vo';

export class BlockMount {
  constructor(
    public readonly id: BlockMountId,
    public readonly pageId: PageId,
    public readonly blockId: BlockId,
    public position: Position,
    public viewModeSizes: ViewModeSizes,
    public zOrder: ZOrder,
    public viewMode: BlockViewMode, // 기본값 제거: 항상 명시적으로 전달
    public parentBlockMountId: BlockMountId | null = null, // Group 관계
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}

  /**
   * 현재 viewMode에 해당하는 크기 조회 (하위 호환성)
   *
   * @returns 현재 viewMode의 크기 (없으면 기본 크기)
   */
  get size(): Size {
    const currentSize = this.viewModeSizes.getSizeForViewMode(
      this.viewMode.value
    );
    if (currentSize) {
      return currentSize;
    }
    // 기본 크기 반환 (하위 호환성)
    return new Size(100, 100);
  }

  transform(
    newPosition?: Position,
    newSize?: Size,
    newZOrder?: ZOrder,
    targetViewMode?: BlockViewMode
  ): void {
    // 1. 각 속성이 제공된 경우 업데이트
    if (newPosition !== undefined) {
      this.position = newPosition;
    }

    if (newSize !== undefined) {
      // targetViewMode가 제공되면 해당 뷰 모드의 크기만 업데이트
      // 없으면 현재 viewMode의 크기 업데이트
      const viewModeToUpdate = targetViewMode ?? this.viewMode;
      this.viewModeSizes = this.viewModeSizes.updateSizeForViewMode(
        viewModeToUpdate.value,
        newSize
      );
    }

    if (newZOrder !== undefined) {
      this.zOrder = newZOrder;
    }

    // 2. updatedAt 갱신
    this.updatedAt = new Date();
  }

  /**
   * View Mode 업데이트
   *
   * @param viewMode - 새로운 View Mode
   */
  updateViewMode(viewMode: BlockViewMode): void {
    this.viewMode = viewMode;
    this.updatedAt = new Date();
  }

  canBeDeleted(): boolean {
    // 1. 삭제 가능 조건 확인 (현재는 항상 true)
    // 향후 비즈니스 규칙이 추가되면 여기에 구현
    return true;
  }

  /**
   * BlockMount 소프트 삭제 (비즈니스 로직)
   *
   * deletedAt을 설정하여 소프트 삭제 상태로 표시합니다.
   */
  markAsDeleted(): void {
    if (this.deletedAt !== null) {
      throw new Error('BlockMount is already deleted');
    }
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 기존 데이터로 BlockMount 재구성 (Repository에서 사용)
   *
   * @param params - BlockMount 재구성에 필요한 모든 파라미터
   * @returns BlockMount 인스턴스
   */
  static reconstitute(params: {
    id: BlockMountId;
    pageId: PageId;
    blockId: BlockId;
    position: Position;
    viewModeSizes: ViewModeSizes;
    zOrder: ZOrder;
    viewMode: BlockViewMode;
    parentBlockMountId: BlockMountId | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): BlockMount {
    return new BlockMount(
      params.id,
      params.pageId,
      params.blockId,
      params.position,
      params.viewModeSizes,
      params.zOrder,
      params.viewMode,
      params.parentBlockMountId,
      params.createdAt,
      params.updatedAt,
      params.deletedAt
    );
  }

  /**
   * BlockMount 복제
   *
   * @param newBlockId - 새로운 블록 ID
   * @returns 복제된 BlockMount
   */
  duplicate(newBlockId: BlockId, offsetX: number, offsetY: number): BlockMount {
    // 1. 새로운 BlockMountId 생성
    const newBlockMountId = BlockMountId.generate();

    // 2. 복제된 위치 계산
    const duplicatedPosition = new Position(
      this.position.x + offsetX,
      this.position.y + offsetY
    );

    // 3. 복제된 ZOrder 계산 (현재 ZOrder + 1)
    const duplicatedZOrder = new ZOrder(this.zOrder.value + 1);

    // 4. viewModeSizes 복제 (JSON을 통한 깊은 복사)
    const duplicatedViewModeSizes = ViewModeSizes.fromJSON(
      this.viewModeSizes.toJSON()
    );

    // 5. 새로운 BlockMount 생성
    return new BlockMount(
      newBlockMountId,
      this.pageId,
      newBlockId,
      duplicatedPosition,
      duplicatedViewModeSizes, // 모든 뷰 모드 크기 복제
      duplicatedZOrder,
      this.viewMode, // View Mode도 복제
      this.parentBlockMountId, // Group 관계도 복제
      new Date(), // 새로운 생성 시간
      new Date() // 새로운 업데이트 시간
    );
  }
}
