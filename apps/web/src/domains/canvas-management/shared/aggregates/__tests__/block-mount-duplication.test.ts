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
import { DuplicateBlockMountCommand } from '../../commands';

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

  describe('duplicateBlockMount', () => {
    it('새로운 블럭 ID로 복제된 블럭 마운트를 생성해야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');
      const offsetX = 50;
      const offsetY = 50;

      // When
      const command: DuplicateBlockMountCommand = {
        newBlockId,
        originalBlockMount: blockMountAggregate.getBlockMount(),
        offsetX,
        offsetY,
      };
      const duplicatedMount = blockMountAggregate.duplicateBlockMount(command);

      // Then
      const duplicatedBlockMount = duplicatedMount.getBlockMount();
      expect(duplicatedMount).toBeDefined();
      expect(duplicatedBlockMount.blockId).toBe(newBlockId);
      expect(duplicatedBlockMount.pageId).toBe(pageId);
      expect(duplicatedBlockMount.position.x).toBe(originalPosition.x + offsetX);
      expect(duplicatedBlockMount.position.y).toBe(originalPosition.y + offsetY);
      expect(duplicatedBlockMount.size).toEqual(originalSize);
      expect(duplicatedBlockMount.zOrder.value).toBe(originalZOrder.value + 1);
    });

    it('복제 시 원본 블럭 마운트는 변경되지 않아야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');
      const originalBlockMount = blockMountAggregate.getBlockMount();
      const originalPositionX = originalBlockMount.position.x;
      const originalPositionY = originalBlockMount.position.y;
      const originalZOrderValue = originalBlockMount.zOrder.value;

      // When
      const command: DuplicateBlockMountCommand = {
        newBlockId,
        originalBlockMount,
        offsetX: 50,
        offsetY: 50,
      };
      blockMountAggregate.duplicateBlockMount(command);

      // Then
      const afterBlockMount = blockMountAggregate.getBlockMount();
      expect(afterBlockMount.position.x).toBe(originalPositionX);
      expect(afterBlockMount.position.y).toBe(originalPositionY);
      expect(afterBlockMount.zOrder.value).toBe(originalZOrderValue);
    });

    it('복제된 블럭은 원본보다 높은 z-order를 가져야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');

      // When
      const command: DuplicateBlockMountCommand = {
        newBlockId,
        originalBlockMount: blockMountAggregate.getBlockMount(),
        offsetX: 0,
        offsetY: 0,
      };
      const duplicatedMount = blockMountAggregate.duplicateBlockMount(command);

      // Then
      const duplicatedBlockMount = duplicatedMount.getBlockMount();
      const originalBlockMount = blockMountAggregate.getBlockMount();
      expect(duplicatedBlockMount.zOrder.value).toBeGreaterThan(originalBlockMount.zOrder.value);
    });

    it('복제 시 새로운 BlockMountId가 생성되어야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');

      // When
      const command: DuplicateBlockMountCommand = {
        newBlockId,
        originalBlockMount: blockMountAggregate.getBlockMount(),
        offsetX: 0,
        offsetY: 0,
      };
      const duplicatedMount = blockMountAggregate.duplicateBlockMount(command);

      // Then
      const duplicatedBlockMount = duplicatedMount.getBlockMount();
      const originalBlockMount = blockMountAggregate.getBlockMount();
      expect(duplicatedBlockMount.id).not.toEqual(originalBlockMount.id);
      expect(duplicatedBlockMount.id.value).toBeDefined();
    });

    it('복제 시 created_at과 updated_at이 현재 시간으로 설정되어야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');
      const beforeDuplication = new Date();

      // When
      const command: DuplicateBlockMountCommand = {
        newBlockId,
        originalBlockMount: blockMountAggregate.getBlockMount(),
        offsetX: 0,
        offsetY: 0,
      };
      const duplicatedMount = blockMountAggregate.duplicateBlockMount(command);

      // Then
      const duplicatedBlockMount = duplicatedMount.getBlockMount();
      expect(duplicatedBlockMount.createdAt.getTime()).toBeGreaterThanOrEqual(beforeDuplication.getTime());
      expect(duplicatedBlockMount.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeDuplication.getTime());
    });

    it('음수 오프셋도 허용해야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');
      const offsetX = -30;
      const offsetY = -40;

      // When
      const command: DuplicateBlockMountCommand = {
        newBlockId,
        originalBlockMount: blockMountAggregate.getBlockMount(),
        offsetX,
        offsetY,
      };
      const duplicatedMount = blockMountAggregate.duplicateBlockMount(command);

      // Then
      const duplicatedBlockMount = duplicatedMount.getBlockMount();
      expect(duplicatedBlockMount.position.x).toBe(originalPosition.x + offsetX);
      expect(duplicatedBlockMount.position.y).toBe(originalPosition.y + offsetY);
    });

    it('0 오프셋도 허용해야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');
      const offsetX = 0;
      const offsetY = 0;

      // When
      const command: DuplicateBlockMountCommand = {
        newBlockId,
        originalBlockMount: blockMountAggregate.getBlockMount(),
        offsetX,
        offsetY,
      };
      const duplicatedMount = blockMountAggregate.duplicateBlockMount(command);

      // Then
      const duplicatedBlockMount = duplicatedMount.getBlockMount();
      expect(duplicatedBlockMount.position.x).toBe(originalPosition.x);
      expect(duplicatedBlockMount.position.y).toBe(originalPosition.y);
    });
  });

  describe('calculateDuplicatePosition', () => {
    it('기본 오프셋으로 복제 위치를 계산해야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');

      // When
      const command: DuplicateBlockMountCommand = {
        newBlockId,
        originalBlockMount: blockMountAggregate.getBlockMount(),
        offsetX: 20,
        offsetY: 20,
      };
      const duplicatedMount = blockMountAggregate.duplicateBlockMount(command);

      // Then
      const duplicatedBlockMount = duplicatedMount.getBlockMount();
      expect(duplicatedBlockMount.position.x).toBe(originalPosition.x + 20);
      expect(duplicatedBlockMount.position.y).toBe(originalPosition.y + 20);
    });

    it('커스텀 오프셋으로 복제 위치를 계산해야 한다', () => {
      // Given
      const newBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');
      const customOffsetX = 100;
      const customOffsetY = 150;

      // When
      const command: DuplicateBlockMountCommand = {
        newBlockId,
        originalBlockMount: blockMountAggregate.getBlockMount(),
        offsetX: customOffsetX,
        offsetY: customOffsetY,
      };
      const duplicatedMount = blockMountAggregate.duplicateBlockMount(command);

      // Then
      const duplicatedBlockMount = duplicatedMount.getBlockMount();
      expect(duplicatedBlockMount.position.x).toBe(originalPosition.x + customOffsetX);
      expect(duplicatedBlockMount.position.y).toBe(originalPosition.y + customOffsetY);
    });
  });
});
