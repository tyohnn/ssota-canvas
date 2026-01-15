import { describe, it, expect, beforeEach } from 'vitest';
import { ActionTransactionAggregate } from '../action-transaction.aggregate';
import { ActionTransactionEntity } from '../../entities/action-transaction.entity';
import { ActionTransactionId } from '../../value-objects/action-transaction-id.vo';
import { VideoId } from '../../value-objects/video-id.vo';
import { BlockId } from '../../../../block-management/shared/value-objects/block-id.vo';
import type {
  CreateActionTransactionCommand,
  CompleteActionTransactionCommand,
} from '../../commands/action-transaction.commands';
import {
  ActionTransactionCreatedEvent,
  ActionTransactionCompletedEvent,
} from '../../events/action-transaction.events';

describe('ActionTransactionAggregate', () => {
  let blockId: BlockId;
  let videoId: VideoId;
  let now: Date;

  beforeEach(() => {
    blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
    videoId = VideoId.generate();
    now = new Date();
  });

  describe('createTransaction (팩토리 메서드)', () => {
    it('유효한 Command로 Action Transaction을 생성해야 한다', () => {
      // Given
      const command: CreateActionTransactionCommand = {
        blockId: blockId.value,
        videoId: videoId.value,
        actionType: 'extract_script',
      };

      // When
      const aggregate = ActionTransactionAggregate.createTransaction(command);

      // Then
      expect(aggregate).toBeInstanceOf(ActionTransactionAggregate);
      const transaction = aggregate.getTransaction();
      expect(transaction.id).toBeInstanceOf(ActionTransactionId);
      expect(transaction.blockId.value).toBe(command.blockId);
      expect(transaction.videoId.value).toBe(command.videoId);
      expect(transaction.actionType).toBe(command.actionType);
      expect(transaction.completedAt).toBeUndefined();
    });

    it('ActionTransactionId가 자동으로 생성되어야 한다', () => {
      // Given
      const command: CreateActionTransactionCommand = {
        blockId: blockId.value,
        videoId: videoId.value,
        actionType: 'extract_script',
      };

      // When
      const aggregate1 = ActionTransactionAggregate.createTransaction(command);
      const aggregate2 = ActionTransactionAggregate.createTransaction(command);

      // Then
      const transaction1 = aggregate1.getTransaction();
      const transaction2 = aggregate2.getTransaction();
      expect(transaction1.id.value).not.toBe(transaction2.id.value); // 서로 다른 UUID
    });

    it('ActionTransactionCreatedEvent가 발행되어야 한다', () => {
      // Given
      const command: CreateActionTransactionCommand = {
        blockId: blockId.value,
        videoId: videoId.value,
        actionType: 'extract_script',
      };

      // When
      const aggregate = ActionTransactionAggregate.createTransaction(command);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!).toBeInstanceOf(ActionTransactionCreatedEvent);
      expect(events[0]!.type).toBe('ActionTransactionCreated');
      const event = events[0] as ActionTransactionCreatedEvent;
      expect(event.aggregateId).toBe(aggregate.getTransaction().id.value);
      expect(event.data.transactionId).toBe(aggregate.getTransaction().id.value);
      expect(event.data.blockId).toBe(command.blockId);
      expect(event.data.videoId).toBe(command.videoId);
      expect(event.data.actionType).toBe(command.actionType);
    });

    it('smart_summary 액션 타입도 생성되어야 한다', () => {
      // Given
      const command: CreateActionTransactionCommand = {
        blockId: blockId.value,
        videoId: videoId.value,
        actionType: 'smart_summary',
      };

      // When
      const aggregate = ActionTransactionAggregate.createTransaction(command);
      const transaction = aggregate.getTransaction();

      // Then
      expect(transaction.actionType).toBe('smart_summary');
    });
  });

  describe('complete', () => {
    it('완료되지 않은 Transaction을 완료해야 한다', () => {
      // Given
      const command: CreateActionTransactionCommand = {
        blockId: blockId.value,
        videoId: videoId.value,
        actionType: 'extract_script',
      };
      const aggregate = ActionTransactionAggregate.createTransaction(command);
      aggregate.markEventsAsCommitted(); // 이전 이벤트 클리어

      const completeCommand: CompleteActionTransactionCommand = {
        transactionId: aggregate.getTransaction().id.value,
      };

      // When
      aggregate.complete(completeCommand);
      const events = aggregate.getUncommittedEvents();

      // Then
      const transaction = aggregate.getTransaction();
      expect(transaction.isCompleted()).toBe(true);
      expect(transaction.completedAt).toBeInstanceOf(Date);

      expect(events).toHaveLength(1);
      expect(events[0]!).toBeInstanceOf(ActionTransactionCompletedEvent);
      expect(events[0]!.type).toBe('ActionTransactionCompleted');
      const event = events[0] as ActionTransactionCompletedEvent;
      expect(event.data.transactionId).toBe(transaction.id.value);
      expect(event.data.blockId).toBe(transaction.blockId.value);
      expect(event.data.videoId).toBe(transaction.videoId.value);
      expect(event.data.actionType).toBe(transaction.actionType);
    });

    it('이미 완료된 Transaction은 다시 완료하지 않아야 한다', () => {
      // Given
      const command: CreateActionTransactionCommand = {
        blockId: blockId.value,
        videoId: videoId.value,
        actionType: 'extract_script',
      };
      const aggregate = ActionTransactionAggregate.createTransaction(command);

      // 첫 번째 완료
      const completeCommand: CompleteActionTransactionCommand = {
        transactionId: aggregate.getTransaction().id.value,
      };
      aggregate.complete(completeCommand);
      aggregate.markEventsAsCommitted(); // 이전 이벤트 클리어

      const originalCompletedAt = aggregate.getTransaction().completedAt;

      // When
      aggregate.complete(completeCommand);
      const events = aggregate.getUncommittedEvents();

      // Then
      const transaction = aggregate.getTransaction();
      expect(transaction.completedAt).toBe(originalCompletedAt); // 변경되지 않음
      expect(events).toHaveLength(0); // 이벤트가 발행되지 않음
    });
  });

  describe('getUncommittedEvents', () => {
    it('발행된 이벤트 목록을 반환해야 한다', () => {
      // Given
      const command: CreateActionTransactionCommand = {
        blockId: blockId.value,
        videoId: videoId.value,
        actionType: 'extract_script',
      };
      const aggregate = ActionTransactionAggregate.createTransaction(command);

      // When
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('ActionTransactionCreated');
    });

    it('이벤트를 반환해도 이벤트 목록은 유지되어야 한다', () => {
      // Given
      const command: CreateActionTransactionCommand = {
        blockId: blockId.value,
        videoId: videoId.value,
        actionType: 'extract_script',
      };
      const aggregate = ActionTransactionAggregate.createTransaction(command);

      // When
      const events1 = aggregate.getUncommittedEvents();
      const events2 = aggregate.getUncommittedEvents();

      // Then
      expect(events1).toHaveLength(1);
      expect(events2).toHaveLength(1); // 유지됨 (복사본 반환)
    });
  });

  describe('markEventsAsCommitted', () => {
    it('이벤트들을 커밋된 것으로 표시해야 한다', () => {
      // Given
      const command: CreateActionTransactionCommand = {
        blockId: blockId.value,
        videoId: videoId.value,
        actionType: 'extract_script',
      };
      const aggregate = ActionTransactionAggregate.createTransaction(command);
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);

      // When
      aggregate.markEventsAsCommitted();
      const eventsAfter = aggregate.getUncommittedEvents();

      // Then
      expect(eventsAfter).toHaveLength(0);
    });
  });

  describe('reconstitute', () => {
    it('기존 ActionTransactionEntity로 Aggregate를 재구성해야 한다', () => {
      // Given
      const transactionId = ActionTransactionId.generate();
      const transaction = ActionTransactionEntity.reconstitute({
        id: transactionId,
        blockId: blockId,
        videoId: videoId,
        actionType: 'extract_script',
        createdAt: now,
        completedAt: undefined,
      });

      // When
      const aggregate = ActionTransactionAggregate.reconstitute(transaction);

      // Then
      expect(aggregate).toBeInstanceOf(ActionTransactionAggregate);
      expect(aggregate.getTransaction()).toBe(transaction);
      expect(aggregate.getUncommittedEvents()).toHaveLength(0); // 재구성 시 이벤트 없음
    });

    it('완료된 Transaction도 재구성되어야 한다', () => {
      // Given
      const transactionId = ActionTransactionId.generate();
      const completedAt = new Date();
      const transaction = ActionTransactionEntity.reconstitute({
        id: transactionId,
        blockId: blockId,
        videoId: videoId,
        actionType: 'smart_summary',
        createdAt: now,
        completedAt: completedAt,
      });

      // When
      const aggregate = ActionTransactionAggregate.reconstitute(transaction);

      // Then
      expect(aggregate.getTransaction().isCompleted()).toBe(true);
      expect(aggregate.getTransaction().completedAt).toBe(completedAt);
    });
  });
});
