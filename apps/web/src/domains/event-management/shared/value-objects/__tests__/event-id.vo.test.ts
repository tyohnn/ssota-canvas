import { describe, it, expect } from 'vitest';
import { EventId } from '../event-id.vo';
import { EventManagementError } from '../../errors/event-management.error';

describe('EventId Value Object', () => {
  describe('생성자', () => {
    it('유효한 UUID로 생성되어야 한다', () => {
      const validUuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const eventId = new EventId(validUuid);
      expect(eventId.value).toBe(validUuid);
    });

    it('빈 문자열에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new EventId('')).toThrow(EventManagementError);
      expect(() => new EventId('')).toThrow('Event ID cannot be empty');
    });

    it('공백 문자열에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new EventId('   ')).toThrow(EventManagementError);
    });

    it('잘못된 UUID 형식에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new EventId('not-a-valid-uuid')).toThrow(EventManagementError);
      expect(() => new EventId('not-a-valid-uuid')).toThrow('Invalid Event ID format');
    });
  });

  describe('equals', () => {
    it('동일한 UUID는 같다고 판단되어야 한다', () => {
      const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const eventId1 = new EventId(uuid);
      const eventId2 = new EventId(uuid);
      expect(eventId1.equals(eventId2)).toBe(true);
    });

    it('다른 UUID는 다르다고 판단되어야 한다', () => {
      const eventId1 = new EventId('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      const eventId2 = new EventId('b1ffcd88-8d1a-4ef9-cc7e-7cc0ce491b22');
      expect(eventId1.equals(eventId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('UUID 문자열을 반환해야 한다', () => {
      const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const eventId = new EventId(uuid);
      expect(eventId.toString()).toBe(uuid);
    });
  });
});
