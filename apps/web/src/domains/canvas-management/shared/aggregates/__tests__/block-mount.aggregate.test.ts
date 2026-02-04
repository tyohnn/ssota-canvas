import { describe, it, expect, beforeEach } from 'vitest';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { BlockMountAggregate } from '../block-mount.aggregate';
import { BlockMountId } from '../../value-objects/block-mount-id.vo';
import { BlockViewMode } from '../../value-objects/block-view-mode.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { Position } from '../../value-objects/position.vo';
import { Size } from '../../value-objects/size.vo';
import { ZOrder } from '../../value-objects/z-order.vo';
import { MountBlockCommand } from '../../commands';

const testUserId = new UserId('550e8400-e29b-41d4-a716-446655440099');

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
      const command: MountBlockCommand = { blockMountId, pageId, blockId, position, size, userId: testUserId };
      const aggregate = BlockMountAggregate.mountBlock(command);

      // Then
      const blockMount = aggregate.getBlockMount();
      expect(blockMount).toBeDefined();
      expect(blockMount.pageId).toEqual(pageId);
      expect(blockMount.blockId).toEqual(blockId);
      expect(blockMount.position).toEqual(position);
      expect(blockMount.size).toEqual(size);
      expect(blockMount.zOrder.value).toBeGreaterThanOrEqual(0);
    });

    it('블럭 마운트 시 BlockMounted 이벤트가 발행되어야 한다', () => {
      // When
      const command: MountBlockCommand = { blockMountId, pageId, blockId, position, size, userId: testUserId };
      const aggregate = BlockMountAggregate.mountBlock(command);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]! .type).toBe('BlockMounted');
      expect(events[0]!.data.pageId).toEqual(pageId);
      expect(events[0]!.data.blockId).toEqual(blockId);
      expect(events[0]!.data.position).toEqual(position);
      expect(events[0]!.data.size).toEqual(size);
    });

    it('새로 생성된 블럭은 기본 z-order에 배치되어야 한다', () => {
      // When
      const command: MountBlockCommand = { blockMountId, pageId, blockId, position, size, userId: testUserId };
      const aggregate = BlockMountAggregate.mountBlock(command);

      // Then
      const blockMount = aggregate.getBlockMount();
      expect(blockMount.zOrder.value).toBeGreaterThanOrEqual(0);
    });
  });


  describe('updateBlockPosition', () => {
    let aggregate: BlockMountAggregate;

    beforeEach(() => {
      const command: MountBlockCommand = { blockMountId, pageId, blockId, position, size, userId: testUserId };
      aggregate = BlockMountAggregate.mountBlock(command);
    });

    it('블럭 위치를 개별적으로 업데이트할 수 있어야 한다', () => {
      // Given
      const newPosition = new Position(200, 300);

      // When
      aggregate.updateBlockPosition({ newPosition });
      const events = aggregate.getUncommittedEvents();

      // Then
      const blockMount = aggregate.getBlockMount();
      expect(blockMount.position).toEqual(newPosition);
      expect(events[events.length - 1]!.type).toBe('BlockPositionUpdated');
      expect((events[events.length - 1] as any).data.newPosition).toEqual(newPosition);
    });

    it('위치 업데이트 시 BlockPositionUpdated 이벤트가 발행되어야 한다', () => {
      // Given
      const newPosition = new Position(250, 350);

      // When
      aggregate.updateBlockPosition({ newPosition });
      const events = aggregate.getUncommittedEvents();

      // Then (mountBlock + updateBlockPosition → 2 events)
      expect(events).toHaveLength(2);
      expect(events[1]!.type).toBe('BlockPositionUpdated');
      expect(events[1]!.data.blockMountId).toEqual(blockMountId);
      expect(events[1]!.data.newPosition).toEqual(newPosition);
    });
  });

  describe('updateBlockSize', () => {
    let aggregate: BlockMountAggregate;

    beforeEach(() => {
      const command: MountBlockCommand = { blockMountId, pageId, blockId, position, size, userId: testUserId };
      aggregate = BlockMountAggregate.mountBlock(command);
    });

    it('블럭 크기를 개별적으로 업데이트할 수 있어야 한다', () => {
      // Given
      const newSize = new Size(400, 500);
      const viewMode = BlockViewMode.default();

      // When
      aggregate.updateBlockSize({ newSize, viewMode, userId: testUserId });
      const events = aggregate.getUncommittedEvents();

      // Then
      const blockMount = aggregate.getBlockMount();
      expect(blockMount.size).toEqual(newSize);
      expect(events[events.length - 1]!.type).toBe('BlockSizeUpdated');
      expect((events[events.length - 1] as any).data.newSize).toEqual(newSize);
    });

    it('크기 업데이트 시 BlockSizeUpdated 이벤트가 발행되어야 한다', () => {
      // Given
      const newSize = new Size(450, 550);
      const viewMode = BlockViewMode.default();

      // When
      aggregate.updateBlockSize({ newSize, viewMode, userId: testUserId });
      const events = aggregate.getUncommittedEvents();

      // Then (mountBlock + updateBlockSize → 2 events)
      expect(events).toHaveLength(2);
      expect(events[1]!.type).toBe('BlockSizeUpdated');
      expect(events[1]!.data.blockMountId).toEqual(blockMountId);
      expect(events[1]!.data.newSize).toEqual(newSize);
    });
  });

  describe('updateBlockZOrder', () => {
    let aggregate: BlockMountAggregate;

    beforeEach(() => {
      const command: MountBlockCommand = { blockMountId, pageId, blockId, position, size, userId: testUserId };
      aggregate = BlockMountAggregate.mountBlock(command);
    });

    it('블럭 Z-Order를 개별적으로 업데이트할 수 있어야 한다', () => {
      // Given
      const newZOrder = new ZOrder(10);

      // When
      const event = aggregate.updateBlockZOrder(newZOrder);

      // Then
      const blockMount = aggregate.getBlockMount();
      expect(blockMount.zOrder).toEqual(newZOrder);
      expect(event.type).toBe('BlockZOrderUpdated');
      expect(event.data.newZOrder).toEqual(newZOrder);
    });

    it('Z-Order 업데이트 시 BlockZOrderUpdated 이벤트가 발행되어야 한다', () => {
      // Given
      const newZOrder = new ZOrder(15);

      // When
      aggregate.updateBlockZOrder(newZOrder);
      const events = aggregate.getUncommittedEvents();

      // Then (mountBlock + updateBlockZOrder → 2 events)
      expect(events).toHaveLength(2);
      expect(events[1]!.type).toBe('BlockZOrderUpdated');
      expect(events[1]!.data.blockMountId).toEqual(blockMountId);
      expect(events[1]!.data.newZOrder).toEqual(newZOrder);
    });
  });

  describe('deleteBlockMount', () => {
    let aggregate: BlockMountAggregate;

    beforeEach(() => {
      const command: MountBlockCommand = { blockMountId, pageId, blockId, position, size, userId: testUserId };
      aggregate = BlockMountAggregate.mountBlock(command);
    });

    it('블럭 마운트를 삭제할 수 있어야 한다', () => {
      // Given
      const command = { blockMountId, userId: testUserId };

      // When
      aggregate.deleteBlockMount(command);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events[events.length - 1]!.type).toBe('BlockMountDeleted');
      const blockMount = aggregate.getBlockMount();
      expect((events[events.length - 1] as any).data.blockMountId).toEqual(blockMount.id);
    });
  });
});
