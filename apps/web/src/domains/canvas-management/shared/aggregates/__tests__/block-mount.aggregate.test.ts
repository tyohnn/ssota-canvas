import { describe, it, expect, beforeEach } from 'vitest';
import { BlockMountAggregate } from '../block-mount.aggregate';
import { BlockMountId } from '../../value-objects/block-mount-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { Position } from '../../value-objects/position.vo';
import { Size } from '../../value-objects/size.vo';
import { ZOrder } from '../../value-objects/z-order.vo';

describe('BlockMountAggregate', () => {
  let blockMountId: BlockMountId;
  let pageId: PageId;
  let blockId: BlockId;
  let position: Position;
  let size: Size;

  beforeEach(() => {
    blockMountId = new BlockMountId('660e8400-e29b-41d4-a716-446655440002');
    pageId = new PageId('550e8400-e29b-41d4-a716-446655440000');
    blockId = new BlockId('550e8400-e29b-41d4-a716-446655440001');
    position = new Position(100, 200);
    size = new Size(300, 400);
  });

  describe('mountBlock', () => {
    it('새로운 블럭을 마운트할 수 있어야 한다', () => {
      // When
      const aggregate = BlockMountAggregate.mountBlock(blockMountId, pageId, blockId, position, size);

      // Then
      expect(aggregate.blockMount).toBeDefined();
      expect(aggregate.blockMount.pageId).toEqual(pageId);
      expect(aggregate.blockMount.blockId).toEqual(blockId);
      expect(aggregate.blockMount.position).toEqual(position);
      expect(aggregate.blockMount.size).toEqual(size);
      expect(aggregate.blockMount.zOrder.value).toBeGreaterThan(0);
    });

    it('블럭 마운트 시 BlockMounted 이벤트가 발행되어야 한다', () => {
      // When
      const aggregate = BlockMountAggregate.mountBlock(blockMountId, pageId, blockId, position, size);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]! .type).toBe('BlockMounted');
      expect(events[0]!.data.pageId).toEqual(pageId);
      expect(events[0]!.data.blockId).toEqual(blockId);
      expect(events[0]!.data.position).toEqual(position);
      expect(events[0]!.data.size).toEqual(size);
    });

    it('새로 생성된 블럭은 최상위 z-order에 배치되어야 한다', () => {
      // Given
      const baseZOrder = 5;

      // When
      const aggregate = BlockMountAggregate.mountBlock(blockMountId, pageId, blockId, position, size, baseZOrder);

      // Then
      expect(aggregate.blockMount.zOrder.value).toBe(baseZOrder + 1);
    });
  });


  describe('updateBlockPosition', () => {
    let aggregate: BlockMountAggregate;

    beforeEach(() => {
      aggregate = BlockMountAggregate.mountBlock(blockMountId, pageId, blockId, position, size);
      aggregate.clearEvents(); // 테스트를 위해 이벤트 초기화
    });

    it('블럭 위치를 개별적으로 업데이트할 수 있어야 한다', () => {
      // Given
      const newPosition = new Position(200, 300);

      // When
      const event = aggregate.updateBlockPosition(newPosition);

      // Then
      expect(aggregate.blockMount.position).toEqual(newPosition);
      expect(event.type).toBe('BlockPositionUpdated');
      expect(event.data.newPosition).toEqual(newPosition);
    });

    it('위치 업데이트 시 BlockPositionUpdated 이벤트가 발행되어야 한다', () => {
      // Given
      const newPosition = new Position(250, 350);

      // When
      aggregate.updateBlockPosition(newPosition);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('BlockPositionUpdated');
      expect(events[0]!.data.blockMountId).toEqual(blockMountId);
      expect(events[0]!.data.newPosition).toEqual(newPosition);
    });
  });

  describe('updateBlockSize', () => {
    let aggregate: BlockMountAggregate;

    beforeEach(() => {
      aggregate = BlockMountAggregate.mountBlock(blockMountId, pageId, blockId, position, size);
      aggregate.clearEvents(); // 테스트를 위해 이벤트 초기화
    });

    it('블럭 크기를 개별적으로 업데이트할 수 있어야 한다', () => {
      // Given
      const newSize = new Size(400, 500);

      // When
      const event = aggregate.updateBlockSize(newSize);

      // Then
      expect(aggregate.blockMount.size).toEqual(newSize);
      expect(event.type).toBe('BlockSizeUpdated');
      expect(event.data.newSize).toEqual(newSize);
    });

    it('크기 업데이트 시 BlockSizeUpdated 이벤트가 발행되어야 한다', () => {
      // Given
      const newSize = new Size(450, 550);

      // When
      aggregate.updateBlockSize(newSize);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('BlockSizeUpdated');
      expect(events[0]!.data.blockMountId).toEqual(blockMountId);
      expect(events[0]!.data.newSize).toEqual(newSize);
    });
  });

  describe('updateBlockZOrder', () => {
    let aggregate: BlockMountAggregate;

    beforeEach(() => {
      aggregate = BlockMountAggregate.mountBlock(blockMountId, pageId, blockId, position, size);
      aggregate.clearEvents(); // 테스트를 위해 이벤트 초기화
    });

    it('블럭 Z-Order를 개별적으로 업데이트할 수 있어야 한다', () => {
      // Given
      const newZOrder = new ZOrder(10);

      // When
      const event = aggregate.updateBlockZOrder(newZOrder);

      // Then
      expect(aggregate.blockMount.zOrder).toEqual(newZOrder);
      expect(event.type).toBe('BlockZOrderUpdated');
      expect(event.data.newZOrder).toEqual(newZOrder);
    });

    it('Z-Order 업데이트 시 BlockZOrderUpdated 이벤트가 발행되어야 한다', () => {
      // Given
      const newZOrder = new ZOrder(15);

      // When
      aggregate.updateBlockZOrder(newZOrder);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('BlockZOrderUpdated');
      expect(events[0]!.data.blockMountId).toEqual(blockMountId);
      expect(events[0]!.data.newZOrder).toEqual(newZOrder);
    });
  });

  describe('deleteBlockMount', () => {
    let aggregate: BlockMountAggregate;

    beforeEach(() => {
      aggregate = BlockMountAggregate.mountBlock(blockMountId, pageId, blockId, position, size);
      aggregate.clearEvents(); // 테스트를 위해 이벤트 초기화
    });

    it('블럭 마운트를 삭제할 수 있어야 한다', () => {
      // When
      const event = aggregate.deleteBlockMount();

      // Then
      expect(event.type).toBe('BlockMountDeleted');
      expect(event.data.blockMountId).toEqual(aggregate.blockMount.id);
    });
  });
});
