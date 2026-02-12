import { describe, it, expect } from 'vitest';
import { EventType } from '../event-type.vo';
import { EventManagementError } from '../../errors/event-management.error';

describe('EventType Value Object', () => {
  describe('생성자', () => {
    it('user_utterance 타입으로 생성되어야 한다', () => {
      const eventType = new EventType('user_utterance');
      expect(eventType.value).toBe('user_utterance');
    });

    it('ai_response 타입으로 생성되어야 한다', () => {
      const eventType = new EventType('ai_response');
      expect(eventType.value).toBe('ai_response');
    });

    it('tool_call 타입으로 생성되어야 한다', () => {
      const eventType = new EventType('tool_call');
      expect(eventType.value).toBe('tool_call');
    });

    it('block_created 타입으로 생성되어야 한다', () => {
      const eventType = new EventType('block_created');
      expect(eventType.value).toBe('block_created');
    });

    it('빈 문자열에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new EventType('' as any)).toThrow(EventManagementError);
      expect(() => new EventType('' as any)).toThrow('Event type cannot be empty');
    });

    it('유효하지 않은 타입에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new EventType('invalid_type' as any)).toThrow(EventManagementError);
      expect(() => new EventType('invalid_type' as any)).toThrow('Invalid event type');
    });
  });

  describe('equals', () => {
    it('동일한 타입은 같다고 판단되어야 한다', () => {
      const eventType1 = new EventType('user_utterance');
      const eventType2 = new EventType('user_utterance');
      expect(eventType1.equals(eventType2)).toBe(true);
    });

    it('다른 타입은 다르다고 판단되어야 한다', () => {
      const eventType1 = new EventType('user_utterance');
      const eventType2 = new EventType('ai_response');
      expect(eventType1.equals(eventType2)).toBe(false);
    });
  });

  describe('타입 체크 메서드', () => {
    it('isUserUtterance는 user_utterance일 때 true를 반환해야 한다', () => {
      const eventType = new EventType('user_utterance');
      expect(eventType.isUserUtterance()).toBe(true);
      expect(eventType.isAIResponse()).toBe(false);
      expect(eventType.isToolCall()).toBe(false);
      expect(eventType.isBlockChange()).toBe(false);
    });

    it('isBlockChange는 block_created일 때 true를 반환해야 한다', () => {
      const eventType = new EventType('block_created');
      expect(eventType.isBlockChange()).toBe(true);
    });
  });

  describe('toString', () => {
    it('타입 문자열을 반환해야 한다', () => {
      const eventType = new EventType('user_utterance');
      expect(eventType.toString()).toBe('user_utterance');
    });
  });
});
