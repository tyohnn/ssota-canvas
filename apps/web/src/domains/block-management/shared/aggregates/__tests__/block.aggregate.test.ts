import { describe, it, expect, beforeEach } from 'vitest';
import { BlockAggregate } from '../block.aggregate';
import { Block } from '../../entities/block.entity';
import { CreateBlockCommand, UpdateBlockCommand, DeleteBlockCommand } from '../../commands';
import { BlockId } from '../../value-objects/block-id.vo';
import { BlockType } from '../../value-objects/block-type.vo';
import { BlockCreatedEvent, BlockUpdatedEvent, BlockDeletedEvent } from '../../events';
import { BlockManagementError } from '../../errors/block-management.error';

describe('BlockAggregate', () => {
  let blockId: BlockId;
  let blockType: BlockType;
  let workspaceId: string;

  beforeEach(() => {
    blockId = new BlockId('123e4567-e89b-12d3-a456-426614174000');
    blockType = new BlockType('youtube');
    workspaceId = 'workspace-123';
  });

  describe('create', () => {
    it('should create a new BlockAggregate with BlockCreatedEvent', () => {
      const command: CreateBlockCommand = {
        blockId,
        workspaceId,
        blockType,
        initialProperties: { title: 'Test Video' },
        userId: 'user-123'
      };
      
      const aggregate = BlockAggregate.create(command);
      
      expect(aggregate.getBlock().id).toBe(blockId);
      expect(aggregate.getBlock().workspaceId).toBe(workspaceId);
      expect(aggregate.getBlock().blockType).toBe(blockType);
      expect(aggregate.getBlock().properties.title).toBe('Test Video');
      
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BlockCreatedEvent);
      
      const createdEvent = events[0] as BlockCreatedEvent;
      expect(createdEvent.aggregateId).toBe(blockId);
      expect(createdEvent.data.workspaceId).toBe(workspaceId);
      expect(createdEvent.data.blockType).toBe(blockType);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute BlockAggregate from existing Block', () => {
      const command: CreateBlockCommand = {
        blockId,
        workspaceId,
        blockType,
        userId: 'user-123'
      };
      const aggregate = BlockAggregate.create(command);
      const block = aggregate.getBlock();
      const reconstituted = BlockAggregate.reconstitute(block);
      
      expect(reconstituted.getBlock()).toBe(block);
      expect(reconstituted.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('update', () => {
    let aggregate: BlockAggregate;

    beforeEach(() => {
      const command: CreateBlockCommand = {
        blockId,
        workspaceId,
        blockType,
        userId: 'user-123'
      };
      aggregate = BlockAggregate.create(command);
      aggregate.markEventsAsCommitted(); // 초기 이벤트 커밋
    });

    it('should update block properties and emit BlockUpdatedEvent', () => {
      const updateCommand: UpdateBlockCommand = {
        blockId,
        updateData: {
          title: 'Updated Title',
          description: 'Updated Description'
        },
        userId: 'user-123'
      };
      
      aggregate.update(updateCommand);
      
      expect(aggregate.getBlock().properties.title).toBe('Updated Title');
      expect(aggregate.getBlock().properties.description).toBe('Updated Description');
      
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BlockUpdatedEvent);
      
      const updatedEvent = events[0] as BlockUpdatedEvent;
      expect(updatedEvent.aggregateId).toBe(blockId);
      expect(updatedEvent.data.updateData.title).toBe('Updated Title');
    });

    it('should throw error when updating deleted block', () => {
      const deleteCommand: DeleteBlockCommand = {
        blockId,
        userId: 'user-123'
      };
      aggregate.delete(deleteCommand);
      aggregate.markEventsAsCommitted();
      
      const updateCommand: UpdateBlockCommand = {
        blockId,
        updateData: { title: 'Updated Title' },
        userId: 'user-123'
      };
      
      expect(() => {
        aggregate.update(updateCommand);
      }).toThrow(BlockManagementError);
    });

  });

  describe('delete', () => {
    let aggregate: BlockAggregate;

    beforeEach(() => {
      const command: CreateBlockCommand = {
        blockId,
        workspaceId,
        blockType,
        userId: 'user-123'
      };
      aggregate = BlockAggregate.create(command);
      aggregate.markEventsAsCommitted();
    });

    it('should delete block and emit BlockDeletedEvent', () => {
      const deleteCommand: DeleteBlockCommand = {
        blockId,
        userId: 'user-123'
      };
      
      aggregate.delete(deleteCommand);
      
      expect(aggregate.getBlock().isDeleted()).toBe(true);
      expect(aggregate.isDeleted()).toBe(true);
      
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BlockDeletedEvent);
      
      const deletedEvent = events[0] as BlockDeletedEvent;
      expect(deletedEvent.aggregateId).toBe(blockId);
      expect(deletedEvent.data.workspaceId).toBe(workspaceId);
    });

    it('should throw error when deleting already deleted block', () => {
      const deleteCommand: DeleteBlockCommand = {
        blockId,
        userId: 'user-123'
      };
      aggregate.delete(deleteCommand);
      aggregate.markEventsAsCommitted();
      
      expect(() => {
        aggregate.delete(deleteCommand);
      }).toThrow(BlockManagementError);
    });

  });

  describe('markEventsAsCommitted', () => {
    it('should clear uncommitted events', () => {
      const command: CreateBlockCommand = {
        blockId,
        workspaceId,
        blockType,
        userId: 'user-123'
      };
      const aggregate = BlockAggregate.create(command);
      
      expect(aggregate.getUncommittedEvents()).toHaveLength(1);
      
      aggregate.markEventsAsCommitted();
      
      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('getter methods', () => {
    let aggregate: BlockAggregate;

    beforeEach(() => {
      const command: CreateBlockCommand = {
        blockId,
        workspaceId,
        blockType,
        userId: 'user-123'
      };
      aggregate = BlockAggregate.create(command);
    });

    it('should return block', () => {
      const block = aggregate.getBlock();
      expect(block).toBeInstanceOf(Block);
      expect(block.id).toBe(blockId);
    });

    it('should return ID', () => {
      expect(aggregate.getId()).toBe(blockId);
    });

    it('should return workspace ID', () => {
      expect(aggregate.getWorkspaceId()).toBe(workspaceId);
    });

    it('should return deletion status', () => {
      expect(aggregate.isDeleted()).toBe(false);
      
      const deleteCommand: DeleteBlockCommand = {
        blockId,
        userId: 'user-123'
      };
      aggregate.delete(deleteCommand);
      
      expect(aggregate.isDeleted()).toBe(true);
    });
  });
});
