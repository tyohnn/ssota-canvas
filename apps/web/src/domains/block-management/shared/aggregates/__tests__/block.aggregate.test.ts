import { describe, it, expect, beforeEach } from 'vitest';
import { BlockAggregate } from '../block.aggregate';
import { Block } from '../../entities/block.entity';
import { CreateBlockCommand, DeleteBlockCommand } from '../../commands';
import { BlockId } from '../../value-objects/block-id.vo';
import { BlockType } from '../../value-objects/block-type.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { BlockCreatedEvent, BlockDeletedEvent } from '../../events';
import { BlockManagementError } from '../../errors/block-management.error';

describe('BlockAggregate', () => {
  let blockId: BlockId;
  let blockType: BlockType;
  let workspaceId: WorkspaceId;
  let userId: UserId;

  beforeEach(() => {
    blockId = new BlockId('123e4567-e89b-12d3-a456-426614174000');
    blockType = new BlockType('youtube');
    workspaceId = new WorkspaceId('550e8400-e29b-41d4-a716-446655440000');
    userId = new UserId('550e8400-e29b-41d4-a716-446655440020');
  });

  describe('create', () => {
    it('should create a new BlockAggregate with BlockCreatedEvent', () => {
      const command: CreateBlockCommand = {
        blockId,
        workspaceId,
        userId,
        blockType,
        title: 'Test Video'
      };
      
      const aggregate = BlockAggregate.create(command);
      
      expect(aggregate.getBlock().id).toBe(blockId);
      expect(aggregate.getBlock().workspaceId).toBe(workspaceId);
      expect(aggregate.getBlock().userId).toBe(userId);
      expect(aggregate.getBlock().blockType).toBe(blockType);
      expect(aggregate.getBlock().title).toBe('Test Video');
      
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BlockCreatedEvent);
      
      const createdEvent = events[0] as BlockCreatedEvent;
      expect(createdEvent.aggregateId).toBe(blockId);
      expect(createdEvent.data.workspaceId).toBe(workspaceId.value);
      expect(createdEvent.data.blockType).toBe(blockType.value);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute BlockAggregate from existing Block', () => {
      const command: CreateBlockCommand = {
        blockId,
        workspaceId,
        userId,
        blockType,
        title: 'Test Video'
      };
      const aggregate = BlockAggregate.create(command);
      const block = aggregate.getBlock();
      const reconstituted = BlockAggregate.reconstitute(block);
      
      expect(reconstituted.getBlock()).toBe(block);
      expect(reconstituted.getUncommittedEvents()).toHaveLength(0);
    });
  });


  describe('delete', () => {
    let aggregate: BlockAggregate;

    beforeEach(() => {
      const command: CreateBlockCommand = {
        blockId,
        workspaceId,
        userId,
        blockType,
        title: 'Test Video'
      };
      aggregate = BlockAggregate.create(command);
      aggregate.markEventsAsCommitted();
    });

    it('should delete block and emit BlockDeletedEvent', () => {
      const deleteCommand: DeleteBlockCommand = { userId };
      
      aggregate.delete(deleteCommand);
      
      expect(aggregate.getBlock().isDeleted()).toBe(true);
      expect(aggregate.isDeleted()).toBe(true);
      
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(BlockDeletedEvent);
      
      const deletedEvent = events[0] as BlockDeletedEvent;
      expect(deletedEvent.aggregateId).toBe(blockId);
      expect(deletedEvent.data.workspaceId.value).toBe(workspaceId.value);
    });

    it('should throw error when deleting already deleted block', () => {
      const deleteCommand: DeleteBlockCommand = { userId };
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
        userId,
        blockType,
        title: 'Test Video'
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
        userId,
        blockType,
        title: 'Test Video'
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
      expect(aggregate.getWorkspaceId()).toBe(workspaceId.value);
    });

    it('should return deletion status', () => {
      expect(aggregate.isDeleted()).toBe(false);
      
      const deleteCommand: DeleteBlockCommand = { userId };
      aggregate.delete(deleteCommand);
      
      expect(aggregate.isDeleted()).toBe(true);
    });
  });
});