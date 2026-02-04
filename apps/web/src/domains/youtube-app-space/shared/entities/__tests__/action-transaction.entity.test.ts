import { describe, it, expect, beforeEach } from 'vitest';
import { ActionTransactionEntity, type ActionType } from '../action-transaction.entity';
import { ActionTransactionId } from '../../value-objects/action-transaction-id.vo';
import { VideoId } from '../../value-objects/video-id.vo';

describe('ActionTransactionEntity', () => {
  let transactionId: ActionTransactionId;
  let orgId: string;
  let videoId: VideoId;
  let actionType: ActionType;
  let now: Date;

  beforeEach(() => {
    transactionId = ActionTransactionId.generate();
    orgId = '550e8400-e29b-41d4-a716-446655440000';
    videoId = VideoId.generate();
    actionType = 'extract_script';
    now = new Date();
  });

  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다', () => {
      // When (signature: id, orgId, videoId, actionType, language?, createdAt, completedAt)
      const transaction = new ActionTransactionEntity(
        transactionId,
        orgId,
        videoId,
        actionType,
        undefined, // language
        now,
        undefined
      );

      // Then
      expect(transaction.id).toBe(transactionId);
      expect(transaction.orgId).toBe(orgId);
      expect(transaction.videoId).toBe(videoId);
      expect(transaction.actionType).toBe(actionType);
      expect(transaction.createdAt).toBe(now);
      expect(transaction.completedAt).toBeUndefined();
    });

    it('completedAt이 있는 경우 생성되어야 한다', () => {
      // Given
      const completedAt = new Date();

      // When
      const transaction = new ActionTransactionEntity(
        transactionId,
        orgId,
        videoId,
        actionType,
        undefined, // language
        now,
        completedAt
      );

      // Then
      expect(transaction.completedAt).toBe(completedAt);
    });
  });

  describe('reconstitute', () => {
    it('기존 데이터로 Action Transaction을 재구성해야 한다', () => {
      // Given
      const params = {
        id: transactionId,
        orgId: orgId,
        videoId: videoId,
        actionType: actionType as ActionType,
        language: undefined,
        createdAt: now,
        completedAt: undefined,
      };

      // When
      const transaction = ActionTransactionEntity.reconstitute(params);

      // Then
      expect(transaction.id).toBe(params.id);
      expect(transaction.orgId).toBe(params.orgId);
      expect(transaction.videoId).toBe(params.videoId);
      expect(transaction.actionType).toBe(params.actionType);
      expect(transaction.createdAt).toBe(params.createdAt);
      expect(transaction.completedAt).toBeUndefined();
    });

    it('completedAt이 있는 경우 재구성되어야 한다', () => {
      // Given
      const completedAt = new Date();
      const params = {
        id: transactionId,
        orgId: orgId,
        videoId: videoId,
        actionType: actionType as ActionType,
        language: undefined,
        createdAt: now,
        completedAt: completedAt,
      };

      // When
      const transaction = ActionTransactionEntity.reconstitute(params);

      // Then
      expect(transaction.completedAt).toBe(completedAt);
    });
  });

  describe('isCompleted', () => {
    it('completedAt이 없으면 false를 반환해야 한다', () => {
      // Given
      const transaction = new ActionTransactionEntity(
        transactionId,
        orgId,
        videoId,
        actionType,
        undefined,
        now,
        undefined
      );

      // When & Then
      expect(transaction.isCompleted()).toBe(false);
    });

    it('completedAt이 null이면 false를 반환해야 한다', () => {
      // Given
      const transaction = new ActionTransactionEntity(
        transactionId,
        orgId,
        videoId,
        actionType,
        undefined,
        now,
        null as any
      );

      // When & Then
      expect(transaction.isCompleted()).toBe(false);
    });

    it('completedAt이 있으면 true를 반환해야 한다', () => {
      // Given
      const completedAt = new Date();
      const transaction = new ActionTransactionEntity(
        transactionId,
        orgId,
        videoId,
        actionType,
        undefined,
        now,
        completedAt
      );

      // When & Then
      expect(transaction.isCompleted()).toBe(true);
    });
  });

  describe('complete', () => {
    it('완료되지 않은 Transaction을 완료해야 한다', () => {
      // Given
      const transaction = new ActionTransactionEntity(
        transactionId,
        orgId,
        videoId,
        actionType,
        undefined,
        now,
        undefined
      );

      // When
      transaction.complete();

      // Then
      expect(transaction.completedAt).toBeInstanceOf(Date);
      expect(transaction.isCompleted()).toBe(true);
    });

    it('이미 완료된 Transaction은 다시 완료하지 않아야 한다', () => {
      // Given
      const originalCompletedAt = new Date('2024-01-01');
      const transaction = new ActionTransactionEntity(
        transactionId,
        orgId,
        videoId,
        actionType,
        undefined,
        now,
        originalCompletedAt
      );

      // When
      transaction.complete();

      // Then
      expect(transaction.completedAt).toBe(originalCompletedAt);
      expect(transaction.completedAt?.getTime()).toBe(
        originalCompletedAt.getTime()
      );
    });

    it('완료 시 completedAt이 현재 시간으로 설정되어야 한다', () => {
      // Given
      const transaction = new ActionTransactionEntity(
        transactionId,
        orgId,
        videoId,
        actionType,
        undefined,
        now,
        undefined
      );
      const beforeComplete = new Date();

      // When
      transaction.complete();
      const afterComplete = new Date();

      // Then
      expect(transaction.completedAt).toBeInstanceOf(Date);
      if (transaction.completedAt) {
        expect(transaction.completedAt.getTime()).toBeGreaterThanOrEqual(
          beforeComplete.getTime()
        );
        expect(transaction.completedAt.getTime()).toBeLessThanOrEqual(
          afterComplete.getTime()
        );
      }
    });
  });
});
