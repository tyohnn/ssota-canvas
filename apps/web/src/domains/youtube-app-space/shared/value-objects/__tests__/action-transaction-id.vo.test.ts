import { describe, it, expect } from 'vitest';
import { ActionTransactionId } from '../action-transaction-id.vo';
import { YoutubeError } from '../../errors/youtube-app-space.error';

describe('ActionTransactionId Value Object', () => {
  describe('생성자', () => {
    it('유효한 UUID로 생성되어야 한다', () => {
      // Given
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';

      // When
      const actionTransactionId = new ActionTransactionId(validUuid);

      // Then
      expect(actionTransactionId.value).toBe(validUuid);
    });

    it('잘못된 UUID 형식에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const invalidUuid = 'invalid-uuid-format';

      // When & Then
      expect(() => new ActionTransactionId(invalidUuid)).toThrow(YoutubeError);
      expect(() => new ActionTransactionId(invalidUuid)).toThrow(
        'Invalid ActionTransactionId format'
      );
    });

    it('빈 문자열은 허용하지 않아야 한다', () => {
      // Given
      const emptyString = '';

      // When & Then
      expect(() => new ActionTransactionId(emptyString)).toThrow(YoutubeError);
    });

    it('공백만 있는 문자열은 허용하지 않아야 한다', () => {
      // Given
      const whitespaceString = '   ';

      // When & Then
      expect(() => new ActionTransactionId(whitespaceString)).toThrow(
        YoutubeError
      );
    });

    it('null/undefined는 허용하지 않아야 한다', () => {
      // When & Then
      expect(() => new ActionTransactionId(null as any)).toThrow(YoutubeError);
      expect(() => new ActionTransactionId(undefined as any)).toThrow(
        YoutubeError
      );
    });

    it('UUID v4 형식이 아닌 경우 예외를 발생시켜야 한다', () => {
      // Given
      const invalidFormats = [
        '550e8400-e29b-41d4-a716', // 너무 짧음
        '550e8400-e29b-41d4-a716-446655440000-extra', // 너무 김
        '550e8400e29b41d4a716446655440000', // 하이픈 없음
        'G50e8400-e29b-41d4-a716-446655440000', // 잘못된 문자
      ];

      // When & Then
      invalidFormats.forEach((invalid) => {
        expect(() => new ActionTransactionId(invalid)).toThrow(YoutubeError);
      });
    });
  });

  describe('generate', () => {
    it('새로운 UUID를 생성해야 한다', () => {
      // When
      const id1 = ActionTransactionId.generate();
      const id2 = ActionTransactionId.generate();

      // Then
      expect(id1).toBeInstanceOf(ActionTransactionId);
      expect(id2).toBeInstanceOf(ActionTransactionId);
      expect(id1.value).not.toBe(id2.value);
      expect(id1.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('생성된 UUID는 유효한 형식이어야 한다', () => {
      // When
      const id = ActionTransactionId.generate();

      // Then
      expect(id.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('equals', () => {
    it('동일한 ID는 같다고 판단되어야 한다', () => {
      // Given
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id1 = new ActionTransactionId(uuid);
      const id2 = new ActionTransactionId(uuid);

      // When & Then
      expect(id1.equals(id2)).toBe(true);
    });

    it('다른 ID는 다르다고 판단되어야 한다', () => {
      // Given
      const id1 = new ActionTransactionId(
        '550e8400-e29b-41d4-a716-446655440000'
      );
      const id2 = new ActionTransactionId(
        '660e8400-e29b-41d4-a716-446655440000'
      );

      // When & Then
      expect(id1.equals(id2)).toBe(false);
    });

    it('null과 비교하면 false를 반환해야 한다', () => {
      // Given
      const id = new ActionTransactionId(
        '550e8400-e29b-41d4-a716-446655440000'
      );

      // When & Then
      expect(id.equals(null as any)).toBe(false);
    });

    it('undefined와 비교하면 false를 반환해야 한다', () => {
      // Given
      const id = new ActionTransactionId(
        '550e8400-e29b-41d4-a716-446655440000'
      );

      // When & Then
      expect(id.equals(undefined as any)).toBe(false);
    });
  });
});
