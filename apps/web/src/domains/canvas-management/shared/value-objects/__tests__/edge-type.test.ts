import { describe, it, expect } from 'vitest';
import { EdgeType } from '../edge-type.vo';
import { CanvasManagementError } from '../../errors/canvas-management.error';

describe('EdgeType Value Object', () => {
  describe('생성자', () => {
    it('유효한 엣지 타입으로 생성되어야 한다 - default', () => {
      // Given
      const validType = 'default';

      // When
      const edgeType = new EdgeType(validType);

      // Then
      expect(edgeType.value).toBe(validType);
    });

    it('유효한 엣지 타입으로 생성되어야 한다 - straight', () => {
      // Given
      const validType = 'straight';

      // When
      const edgeType = new EdgeType(validType);

      // Then
      expect(edgeType.value).toBe(validType);
    });

    it('유효한 엣지 타입으로 생성되어야 한다 - step', () => {
      // Given
      const validType = 'step';

      // When
      const edgeType = new EdgeType(validType);

      // Then
      expect(edgeType.value).toBe(validType);
    });

    it('유효한 엣지 타입으로 생성되어야 한다 - smoothstep', () => {
      // Given
      const validType = 'smoothstep';

      // When
      const edgeType = new EdgeType(validType);

      // Then
      expect(edgeType.value).toBe(validType);
    });

    it('유효한 엣지 타입으로 생성되어야 한다 - simplebezier', () => {
      // Given
      const validType = 'simplebezier';

      // When
      const edgeType = new EdgeType(validType);

      // Then
      expect(edgeType.value).toBe(validType);
    });

    it('빈 문자열로 생성 시 예외를 발생시켜야 한다', () => {
      // Given
      const invalidType = '';

      // When & Then
      expect(() => new EdgeType(invalidType)).toThrow(CanvasManagementError);
      expect(() => new EdgeType(invalidType)).toThrow('Invalid edge type');
    });

    it('지원하지 않는 엣지 타입으로 생성 시 예외를 발생시켜야 한다', () => {
      // Given
      const invalidType = 'invalid-type';

      // When & Then
      expect(() => new EdgeType(invalidType)).toThrow(CanvasManagementError);
      expect(() => new EdgeType(invalidType)).toThrow('Invalid edge type');
    });

    it('null 값으로 생성 시 예외를 발생시켜야 한다', () => {
      // Given
      const invalidType = null as any;

      // When & Then
      expect(() => new EdgeType(invalidType)).toThrow(CanvasManagementError);
    });

    it('undefined 값으로 생성 시 예외를 발생시켜야 한다', () => {
      // Given
      const invalidType = undefined as any;

      // When & Then
      expect(() => new EdgeType(invalidType)).toThrow(CanvasManagementError);
    });
  });

  describe('equals', () => {
    it('같은 값을 가진 EdgeType은 동등해야 한다', () => {
      // Given
      const type1 = new EdgeType('default');
      const type2 = new EdgeType('default');

      // When
      const result = type1.equals(type2);

      // Then
      expect(result).toBe(true);
    });

    it('다른 값을 가진 EdgeType은 동등하지 않아야 한다', () => {
      // Given
      const type1 = new EdgeType('default');
      const type2 = new EdgeType('straight');

      // When
      const result = type1.equals(type2);

      // Then
      expect(result).toBe(false);
    });

    it('null과 비교 시 false를 반환해야 한다', () => {
      // Given
      const type = new EdgeType('default');

      // When
      const result = type.equals(null as any);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('정적 메서드', () => {
    it('default() 메서드는 기본 엣지 타입을 반환해야 한다', () => {
      // When
      const edgeType = EdgeType.default();

      // Then
      expect(edgeType.value).toBe('default');
    });

    it('straight() 메서드는 straight 엣지 타입을 반환해야 한다', () => {
      // When
      const edgeType = EdgeType.straight();

      // Then
      expect(edgeType.value).toBe('straight');
    });

    it('step() 메서드는 step 엣지 타입을 반환해야 한다', () => {
      // When
      const edgeType = EdgeType.step();

      // Then
      expect(edgeType.value).toBe('step');
    });

    it('smoothstep() 메서드는 smoothstep 엣지 타입을 반환해야 한다', () => {
      // When
      const edgeType = EdgeType.smoothstep();

      // Then
      expect(edgeType.value).toBe('smoothstep');
    });

    it('simplebezier() 메서드는 simplebezier 엣지 타입을 반환해야 한다', () => {
      // When
      const edgeType = EdgeType.simplebezier();

      // Then
      expect(edgeType.value).toBe('simplebezier');
    });
  });

  describe('타입 체크 메서드', () => {
    it('isDefault() 메서드는 default 타입일 때 true를 반환해야 한다', () => {
      // Given
      const edgeType = new EdgeType('default');

      // When
      const result = edgeType.isDefault();

      // Then
      expect(result).toBe(true);
    });

    it('isStraight() 메서드는 straight 타입일 때 true를 반환해야 한다', () => {
      // Given
      const edgeType = new EdgeType('straight');

      // When
      const result = edgeType.isStraight();

      // Then
      expect(result).toBe(true);
    });

    it('isStep() 메서드는 step 타입일 때 true를 반환해야 한다', () => {
      // Given
      const edgeType = new EdgeType('step');

      // When
      const result = edgeType.isStep();

      // Then
      expect(result).toBe(true);
    });
  });
});

