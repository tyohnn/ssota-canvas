import { describe, it, expect } from 'vitest';
import { EdgeId } from '../edge-id.vo';

describe('EdgeId Value Object', () => {
  describe('constructor', () => {
    it('유효한 UUID 형식으로 EdgeId를 생성할 수 있어야 한다', () => {
      // Given
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';

      // When
      const edgeId = new EdgeId(validUuid);

      // Then
      expect(edgeId.value).toBe(validUuid);
    });

    it('빈 문자열이 들어가면 CanvasManagementError를 발생시켜야 한다', () => {
      // Given
      const emptyValue = '';

      // When & Then
      expect(() => {
        new EdgeId(emptyValue);
      }).toThrow('Invalid EdgeId format');
    });

    it('공백만 있는 문자열이 들어가면 CanvasManagementError를 발생시켜야 한다', () => {
      // Given
      const whitespaceValue = '   ';

      // When & Then
      expect(() => {
        new EdgeId(whitespaceValue);
      }).toThrow('Invalid EdgeId format');
    });

    it('잘못된 UUID 형식이 들어가면 CanvasManagementError를 발생시켜야 한다', () => {
      // Given
      const invalidUuid = 'not-a-uuid';

      // When & Then
      expect(() => {
        new EdgeId(invalidUuid);
      }).toThrow('Invalid EdgeId format');
    });

    it('null이나 undefined가 들어가면 CanvasManagementError를 발생시켜야 한다', () => {
      // When & Then
      expect(() => {
        new EdgeId(null as any);
      }).toThrow('Invalid EdgeId format');
      
      expect(() => {
        new EdgeId(undefined as any);
      }).toThrow('Invalid EdgeId format');
    });
  });

  describe('equals', () => {
    it('동일한 UUID를 가진 EdgeId 객체는 같다고 판단해야 한다', () => {
      // Given
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const edgeId1 = new EdgeId(uuid);
      const edgeId2 = new EdgeId(uuid);

      // When
      const result = edgeId1.equals(edgeId2);

      // Then
      expect(result).toBe(true);
    });

    it('다른 UUID를 가진 EdgeId 객체는 다르다고 판단해야 한다', () => {
      // Given
      const edgeId1 = new EdgeId('550e8400-e29b-41d4-a716-446655440000');
      const edgeId2 = new EdgeId('550e8400-e29b-41d4-a716-446655440001');

      // When
      const result = edgeId1.equals(edgeId2);

      // Then
      expect(result).toBe(false);
    });

    it('null이나 undefined와 비교하면 false를 반환해야 한다', () => {
      // Given
      const edgeId = new EdgeId('550e8400-e29b-41d4-a716-446655440000');

      // When & Then
      expect(edgeId.equals(null as any)).toBe(false);
      expect(edgeId.equals(undefined as any)).toBe(false);
    });
  });

  describe('generate', () => {
    it('새로운 UUID를 생성해야 한다', () => {
      // When
      const edgeId1 = EdgeId.generate();
      const edgeId2 = EdgeId.generate();

      // Then
      expect(edgeId1.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(edgeId2.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(edgeId1.value).not.toBe(edgeId2.value);
    });

    it('생성된 EdgeId는 유효해야 한다', () => {
      // When
      const edgeId = EdgeId.generate();

      // Then
      expect(() => new EdgeId(edgeId.value)).not.toThrow();
    });
  });
});
