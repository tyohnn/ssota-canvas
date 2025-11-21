import { describe, it, expect } from 'vitest';
import { EventType } from '../event-type.vo';
import { AIManagementError } from '../../errors/ai-management.error';

describe('EventType Value Object', () => {
  describe('생성자', () => {
    it('user_utterance 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'user_utterance';

      // When
      const eventType = new EventType(type);

      // Then
      expect(eventType.value).toBe(type);
    });

    it('ai_response 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'ai_response';

      // When
      const eventType = new EventType(type);

      // Then
      expect(eventType.value).toBe(type);
    });

    it('tool_call 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'tool_call';

      // When
      const eventType = new EventType(type);

      // Then
      expect(eventType.value).toBe(type);
    });

    it('block_created 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'block_created';

      // When
      const eventType = new EventType(type);

      // Then
      expect(eventType.value).toBe(type);
    });

    it('block_updated 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'block_updated';

      // When
      const eventType = new EventType(type);

      // Then
      expect(eventType.value).toBe(type);
    });

    it('block_deleted 타입으로 생성되어야 한다', () => {
      // Given
      const type = 'block_deleted';

      // When
      const eventType = new EventType(type);

      // Then
      expect(eventType.value).toBe(type);
    });

    it('빈 문자열에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const emptyString = '';

      // When & Then
      expect(() => new EventType(emptyString as any)).toThrow(AIManagementError);
      expect(() => new EventType(emptyString as any)).toThrow('Event type cannot be empty');
    });

    it('유효하지 않은 타입에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const invalidType = 'invalid_type';

      // When & Then
      expect(() => new EventType(invalidType as any)).toThrow(AIManagementError);
      expect(() => new EventType(invalidType as any)).toThrow('Invalid event type');
    });
  });

  describe('equals', () => {
    it('동일한 타입은 같다고 판단되어야 한다', () => {
      // Given
      const eventType1 = new EventType('user_utterance');
      const eventType2 = new EventType('user_utterance');

      // When & Then
      expect(eventType1.equals(eventType2)).toBe(true);
    });

    it('다른 타입은 다르다고 판단되어야 한다', () => {
      // Given
      const eventType1 = new EventType('user_utterance');
      const eventType2 = new EventType('ai_response');

      // When & Then
      expect(eventType1.equals(eventType2)).toBe(false);
    });
  });

  describe('타입 체크 메서드', () => {
    it('isUserUtterance는 user_utterance일 때 true를 반환해야 한다', () => {
      // Given
      const eventType = new EventType('user_utterance');

      // When & Then
      expect(eventType.isUserUtterance()).toBe(true);
      expect(eventType.isAIResponse()).toBe(false);
      expect(eventType.isToolCall()).toBe(false);
      expect(eventType.isBlockChange()).toBe(false);
    });

    it('isAIResponse는 ai_response일 때 true를 반환해야 한다', () => {
      // Given
      const eventType = new EventType('ai_response');

      // When & Then
      expect(eventType.isUserUtterance()).toBe(false);
      expect(eventType.isAIResponse()).toBe(true);
      expect(eventType.isToolCall()).toBe(false);
      expect(eventType.isBlockChange()).toBe(false);
    });

    it('isToolCall은 tool_call일 때 true를 반환해야 한다', () => {
      // Given
      const eventType = new EventType('tool_call');

      // When & Then
      expect(eventType.isUserUtterance()).toBe(false);
      expect(eventType.isAIResponse()).toBe(false);
      expect(eventType.isToolCall()).toBe(true);
      expect(eventType.isBlockChange()).toBe(false);
    });

    it('isBlockCreated는 block_created일 때 true를 반환해야 한다', () => {
      // Given
      const eventType = new EventType('block_created');

      // When & Then
      expect(eventType.isUserUtterance()).toBe(false);
      expect(eventType.isAIResponse()).toBe(false);
      expect(eventType.isToolCall()).toBe(false);
      expect(eventType.isBlockCreated()).toBe(true);
      expect(eventType.isBlockUpdated()).toBe(false);
      expect(eventType.isBlockDeleted()).toBe(false);
      expect(eventType.isBlockChange()).toBe(true);
    });

    it('isBlockUpdated는 block_updated일 때 true를 반환해야 한다', () => {
      // Given
      const eventType = new EventType('block_updated');

      // When & Then
      expect(eventType.isUserUtterance()).toBe(false);
      expect(eventType.isAIResponse()).toBe(false);
      expect(eventType.isToolCall()).toBe(false);
      expect(eventType.isBlockCreated()).toBe(false);
      expect(eventType.isBlockUpdated()).toBe(true);
      expect(eventType.isBlockDeleted()).toBe(false);
      expect(eventType.isBlockChange()).toBe(true);
    });

    it('isBlockDeleted는 block_deleted일 때 true를 반환해야 한다', () => {
      // Given
      const eventType = new EventType('block_deleted');

      // When & Then
      expect(eventType.isUserUtterance()).toBe(false);
      expect(eventType.isAIResponse()).toBe(false);
      expect(eventType.isToolCall()).toBe(false);
      expect(eventType.isBlockCreated()).toBe(false);
      expect(eventType.isBlockUpdated()).toBe(false);
      expect(eventType.isBlockDeleted()).toBe(true);
      expect(eventType.isBlockChange()).toBe(true);
    });
  });

  describe('toString', () => {
    it('타입 문자열을 반환해야 한다', () => {
      // Given
      const eventType = new EventType('user_utterance');

      // When
      const result = eventType.toString();

      // Then
      expect(result).toBe('user_utterance');
    });
  });
});

