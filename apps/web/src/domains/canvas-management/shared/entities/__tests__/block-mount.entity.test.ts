import { describe, it, expect, beforeEach } from 'vitest';
import { BlockMount } from '../block-mount.entity';
import { BlockMountId } from '../../value-objects/block-mount-id.vo';
import { BlockViewMode } from '../../value-objects/block-view-mode.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { Position } from '../../value-objects/position.vo';
import { Size } from '../../value-objects/size.vo';
import { ViewModeSizes } from '../../value-objects/view-mode-sizes.vo';
import { ZOrder } from '../../value-objects/z-order.vo';

describe('BlockMount Entity', () => {
  let blockMountId: BlockMountId;
  let pageId: PageId;
  let blockId: BlockId;
  let position: Position;
  let size: Size;
  let zOrder: ZOrder;
  let viewModeSizes: ViewModeSizes;
  let viewMode: BlockViewMode;
  let createdAt: Date;
  let updatedAt: Date;

  beforeEach(() => {
    pageId = new PageId('550e8400-e29b-41d4-a716-446655440000');
    blockId = new BlockId('550e8400-e29b-41d4-a716-446655440001');
    blockMountId = new BlockMountId('660e8400-e29b-41d4-a716-446655440002'); // UUID로 변경
    position = new Position(100, 200);
    size = new Size(300, 400);
    zOrder = new ZOrder(1);
    viewMode = BlockViewMode.default();
    viewModeSizes = ViewModeSizes.empty().updateSizeForViewMode(viewMode.value, size);
    createdAt = new Date('2025-01-14T10:00:00Z');
    updatedAt = new Date('2025-01-14T10:00:00Z');
  });

  describe('생성', () => {
    it('모든 필수 속성으로 BlockMount를 생성할 수 있어야 한다', () => {
      // When
      const blockMount = new BlockMount(
        blockMountId,
        pageId,
        blockId,
        position,
        viewModeSizes,
        zOrder,
        viewMode,
        null,
        createdAt,
        updatedAt
      );

      // Then
      expect(blockMount.id).toBe(blockMountId);
      expect(blockMount.pageId).toBe(pageId);
      expect(blockMount.blockId).toBe(blockId);
      expect(blockMount.position).toBe(position);
      expect(blockMount.size).toEqual(size);
      expect(blockMount.zOrder).toBe(zOrder);
      expect(blockMount.createdAt).toBe(createdAt);
      expect(blockMount.updatedAt).toBe(updatedAt);
    });

    it('기본 날짜로 BlockMount를 생성할 수 있어야 한다', () => {
      // When
      const now = new Date();
      const blockMount = new BlockMount(
        blockMountId,
        pageId,
        blockId,
        position,
        viewModeSizes,
        zOrder,
        viewMode
      );

      // Then
      expect(blockMount.createdAt.getTime()).toBeCloseTo(now.getTime(), -2);
      expect(blockMount.updatedAt.getTime()).toBeCloseTo(now.getTime(), -2);
    });
  });

  describe('transform', () => {
    it('새로운 position으로 변형할 수 있어야 한다', () => {
      // Given
      const blockMount = new BlockMount(
        blockMountId,
        pageId,
        blockId,
        position,
        viewModeSizes,
        zOrder,
        viewMode,
        null,
        createdAt,
        updatedAt
      );
      const newPosition = new Position(200, 300);
      const originalUpdatedAt = blockMount.updatedAt;

      // When
      blockMount.transform(newPosition);

      // Then
      expect(blockMount.position).toBe(newPosition);
      expect(blockMount.size).toEqual(size);
      expect(blockMount.zOrder).toBe(zOrder);
      expect(blockMount.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('새로운 size로 변형할 수 있어야 한다', () => {
      // Given
      const blockMount = new BlockMount(
        blockMountId,
        pageId,
        blockId,
        position,
        viewModeSizes,
        zOrder,
        viewMode,
        null,
        createdAt,
        updatedAt
      );
      const newSize = new Size(400, 500);
      const originalUpdatedAt = blockMount.updatedAt;

      // When
      blockMount.transform(undefined, newSize);

      // Then
      expect(blockMount.position).toBe(position);
      expect(blockMount.size).toEqual(newSize);
      expect(blockMount.zOrder).toBe(zOrder);
      expect(blockMount.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('새로운 zOrder로 변형할 수 있어야 한다', () => {
      // Given
      const blockMount = new BlockMount(
        blockMountId,
        pageId,
        blockId,
        position,
        viewModeSizes,
        zOrder,
        viewMode,
        null,
        createdAt,
        updatedAt
      );
      const newZOrder = new ZOrder(2);
      const originalUpdatedAt = blockMount.updatedAt;

      // When
      blockMount.transform(undefined, undefined, newZOrder);

      // Then
      expect(blockMount.position).toBe(position);
      expect(blockMount.size).toEqual(size);
      expect(blockMount.zOrder).toBe(newZOrder);
      expect(blockMount.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('모든 속성을 동시에 변형할 수 있어야 한다', () => {
      // Given
      const blockMount = new BlockMount(
        blockMountId,
        pageId,
        blockId,
        position,
        viewModeSizes,
        zOrder,
        viewMode,
        null,
        createdAt,
        updatedAt
      );
      const newPosition = new Position(300, 400);
      const newSize = new Size(500, 600);
      const newZOrder = new ZOrder(3);
      const originalUpdatedAt = blockMount.updatedAt;

      // When
      blockMount.transform(newPosition, newSize, newZOrder);

      // Then
      expect(blockMount.position).toBe(newPosition);
      expect(blockMount.size).toEqual(newSize);
      expect(blockMount.zOrder).toBe(newZOrder);
      expect(blockMount.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('속성 변경 없이 transform 호출 시에도 updatedAt이 갱신되어야 한다', () => {
      // Given
      const blockMount = new BlockMount(
        blockMountId,
        pageId,
        blockId,
        position,
        viewModeSizes,
        zOrder,
        viewMode,
        null,
        createdAt,
        updatedAt
      );
      const originalUpdatedAt = blockMount.updatedAt;

      // When
      blockMount.transform();

      // Then
      expect(blockMount.position).toBe(position);
      expect(blockMount.size).toEqual(size);
      expect(blockMount.zOrder).toBe(zOrder);
      expect(blockMount.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('canBeDeleted', () => {
    it('BlockMount는 삭제 가능해야 한다', () => {
      // Given
      const blockMount = new BlockMount(
        blockMountId,
        pageId,
        blockId,
        position,
        viewModeSizes,
        zOrder,
        viewMode,
        null,
        createdAt,
        updatedAt
      );

      // When
      const canBeDeleted = blockMount.canBeDeleted();

      // Then
      expect(canBeDeleted).toBe(true);
    });
  });
});
