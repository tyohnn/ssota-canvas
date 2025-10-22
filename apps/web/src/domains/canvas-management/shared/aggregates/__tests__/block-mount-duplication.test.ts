import { describe, it, expect, beforeEach } from 'vitest';
import { BlockMountAggregate } from '../block-mount.aggregate';
import { BlockMount } from '../../entities/block-mount.entity';
import { BlockMountId } from '../../value-objects/block-mount-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { Position } from '../../value-objects/position.vo';
import { Size } from '../../value-objects/size.vo';
import { ZOrder } from '../../value-objects/z-order.vo';
import { CanvasManagementError } from '../../errors/canvas-management.error';

describe('BlockMountAggregate - Duplication', () => {
  let blockMountAggregate: BlockMountAggregate;
  let originalBlockId: BlockId;
  let pageId: PageId;
  let originalPosition: Position;
  let originalSize: Size;
  let originalZOrder: ZOrder;

  beforeEach(() => {
    originalBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
    pageId = new PageId('550e8400-e29b-41d4-a716-446655440001');
    originalPosition = new Position(100, 200);
    originalSize = new Size(150, 100);
    originalZOrder = new ZOrder(5);

    const blockMount = new BlockMount(
      new BlockMountId('550e8400-e29b-41d4-a716-446655440002'),
      pageId,
      originalBlockId,
      originalPosition,
      originalSize,
      originalZOrder,
      new Date(),
      new Date()
    );

    blockMountAggregate = new BlockMountAggregate(blockMount);
  });

  describe('duplicateBlock', () => {
    it('새로운 블럭 ID로 복제된 블럭 마운트를 생성해야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');
      const offsetX = 50;
      const offsetY = 50;

      // When
      const duplicatedMount = blockMountAggregate.duplicateBlock(newBlockId, offsetX, offsetY);

      // Then
      expect(duplicatedMount).toBeDefined();
      expect(duplicatedMount.blockMount.blockId).toBe(newBlockId);
      expect(duplicatedMount.blockMount.pageId).toBe(pageId);
      expect(duplicatedMount.blockMount.position.x).toBe(originalPosition.x + offsetX);
      expect(duplicatedMount.blockMount.position.y).toBe(originalPosition.y + offsetY);
      expect(duplicatedMount.blockMount.size).toEqual(originalSize);
      expect(duplicatedMount.blockMount.zOrder.value).toBe(originalZOrder.value + 1);
    });

    it('복제 시 원본 블럭 마운트는 변경되지 않아야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');
      const originalPositionX = blockMountAggregate.blockMount.position.x;
      const originalPositionY = blockMountAggregate.blockMount.position.y;
      const originalZOrderValue = blockMountAggregate.blockMount.zOrder.value;

      // When
      blockMountAggregate.duplicateBlock(newBlockId, 50, 50);

      // Then
      expect(blockMountAggregate.blockMount.position.x).toBe(originalPositionX);
      expect(blockMountAggregate.blockMount.position.y).toBe(originalPositionY);
      expect(blockMountAggregate.blockMount.zOrder.value).toBe(originalZOrderValue);
    });

    it('복제된 블럭은 원본보다 높은 z-order를 가져야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');

      // When
      const duplicatedMount = blockMountAggregate.duplicateBlock(newBlockId, 0, 0);

      // Then
      expect(duplicatedMount.blockMount.zOrder.value).toBeGreaterThan(blockMountAggregate.blockMount.zOrder.value);
    });

    it('복제 시 새로운 BlockMountId가 생성되어야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');

      // When
      const duplicatedMount = blockMountAggregate.duplicateBlock(newBlockId, 0, 0);

      // Then
      expect(duplicatedMount.blockMount.id).not.toEqual(blockMountAggregate.blockMount.id);
      expect(duplicatedMount.blockMount.id.value).toBeDefined();
    });

    it('복제 시 created_at과 updated_at이 현재 시간으로 설정되어야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');
      const beforeDuplication = new Date();

      // When
      const duplicatedMount = blockMountAggregate.duplicateBlock(newBlockId, 0, 0);

      // Then
      expect(duplicatedMount.blockMount.createdAt.getTime()).toBeGreaterThanOrEqual(beforeDuplication.getTime());
      expect(duplicatedMount.blockMount.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeDuplication.getTime());
    });

    it('음수 오프셋도 허용해야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');
      const offsetX = -30;
      const offsetY = -40;

      // When
      const duplicatedMount = blockMountAggregate.duplicateBlock(newBlockId, offsetX, offsetY);

      // Then
      expect(duplicatedMount.blockMount.position.x).toBe(originalPosition.x + offsetX);
      expect(duplicatedMount.blockMount.position.y).toBe(originalPosition.y + offsetY);
    });

    it('0 오프셋도 허용해야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');
      const offsetX = 0;
      const offsetY = 0;

      // When
      const duplicatedMount = blockMountAggregate.duplicateBlock(newBlockId, offsetX, offsetY);

      // Then
      expect(duplicatedMount.blockMount.position.x).toBe(originalPosition.x);
      expect(duplicatedMount.blockMount.position.y).toBe(originalPosition.y);
    });
  });

  describe('calculateDuplicatePosition', () => {
    it('기본 오프셋으로 복제 위치를 계산해야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');

      // When
      const duplicatedMount = blockMountAggregate.duplicateBlock(newBlockId);

      // Then
      // 기본 오프셋은 20px
      expect(duplicatedMount.blockMount.position.x).toBe(originalPosition.x + 20);
      expect(duplicatedMount.blockMount.position.y).toBe(originalPosition.y + 20);
    });

    it('커스텀 오프셋으로 복제 위치를 계산해야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');
      const customOffsetX = 100;
      const customOffsetY = 150;

      // When
      const duplicatedMount = blockMountAggregate.duplicateBlock(newBlockId, customOffsetX, customOffsetY);

      // Then
      expect(duplicatedMount.blockMount.position.x).toBe(originalPosition.x + customOffsetX);
      expect(duplicatedMount.blockMount.position.y).toBe(originalPosition.y + customOffsetY);
    });
  });
});
