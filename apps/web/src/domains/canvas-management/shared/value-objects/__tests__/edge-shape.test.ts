import { describe, it, expect } from 'vitest';
import { EdgeShape } from '../edge-shape.vo';
import { CanvasManagementError } from '../../errors/canvas-management.error';

describe('EdgeShape Value Object', () => {
  describe('생성자', () => {
    it('유효한 엣지 모양으로 생성되어야 한다 - default', () => {
      // Given
      const validShape = 'default';

      // When
      const edgeShape = new EdgeShape(validShape);

      // Then
      expect(edgeShape.value).toBe(validShape);
    });

    it('유효한 엣지 모양으로 생성되어야 한다 - straight', () => {
      // Given
      const validShape = 'straight';

      // When
      const edgeShape = new EdgeShape(validShape);

      // Then
      expect(edgeShape.value).toBe(validShape);
    });

    it('유효한 엣지 모양으로 생성되어야 한다 - step', () => {
      // Given
      const validShape = 'step';

      // When
      const edgeShape = new EdgeShape(validShape);

      // Then
      expect(edgeShape.value).toBe(validShape);
    });

    it('유효한 엣지 모양으로 생성되어야 한다 - smoothstep', () => {
      // Given
      const validShape = 'smoothstep';

      // When
      const edgeShape = new EdgeShape(validShape);

      // Then
      expect(edgeShape.value).toBe(validShape);
    });

    it('유효한 엣지 모양으로 생성되어야 한다 - simplebezier', () => {
      // Given
      const validShape = 'simplebezier';

      // When
      const edgeShape = new EdgeShape(validShape);

      // Then
      expect(edgeShape.value).toBe(validShape);
    });

    it('빈 문자열로 생성 시 예외를 발생시켜야 한다', () => {
      // Given
      const invalidShape = '';

      // When & Then
      expect(() => new EdgeShape(invalidShape)).toThrow(CanvasManagementError);
      expect(() => new EdgeShape(invalidShape)).toThrow('Invalid edge shape');
    });

    it('지원하지 않는 엣지 모양으로 생성 시 예외를 발생시켜야 한다', () => {
      // Given
      const invalidShape = 'invalid-shape';

      // When & Then
      expect(() => new EdgeShape(invalidShape)).toThrow(CanvasManagementError);
      expect(() => new EdgeShape(invalidShape)).toThrow('Invalid edge shape');
    });

    it('null 값으로 생성 시 예외를 발생시켜야 한다', () => {
      // Given
      const invalidShape = null as any;

      // When & Then
      expect(() => new EdgeShape(invalidShape)).toThrow(CanvasManagementError);
    });

    it('undefined 값으로 생성 시 예외를 발생시켜야 한다', () => {
      // Given
      const invalidShape = undefined as any;

      // When & Then
      expect(() => new EdgeShape(invalidShape)).toThrow(CanvasManagementError);
    });
  });

  describe('equals', () => {
    it('같은 값을 가진 EdgeShape은 동등해야 한다', () => {
      // Given
      const shape1 = new EdgeShape('default');
      const shape2 = new EdgeShape('default');

      // When
      const result = shape1.equals(shape2);

      // Then
      expect(result).toBe(true);
    });

    it('다른 값을 가진 EdgeShape은 동등하지 않아야 한다', () => {
      // Given
      const shape1 = new EdgeShape('default');
      const shape2 = new EdgeShape('straight');

      // When
      const result = shape1.equals(shape2);

      // Then
      expect(result).toBe(false);
    });

    it('null과 비교 시 false를 반환해야 한다', () => {
      // Given
      const shape = new EdgeShape('default');

      // When
      const result = shape.equals(null as any);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('정적 메서드', () => {
    it('default() 메서드는 기본 엣지 모양을 반환해야 한다', () => {
      // When
      const edgeShape = EdgeShape.default();

      // Then
      expect(edgeShape.value).toBe('default');
    });

    it('straight() 메서드는 straight 엣지 모양을 반환해야 한다', () => {
      // When
      const edgeShape = EdgeShape.straight();

      // Then
      expect(edgeShape.value).toBe('straight');
    });

    it('step() 메서드는 step 엣지 모양을 반환해야 한다', () => {
      // When
      const edgeShape = EdgeShape.step();

      // Then
      expect(edgeShape.value).toBe('step');
    });

    it('smoothstep() 메서드는 smoothstep 엣지 모양을 반환해야 한다', () => {
      // When
      const edgeShape = EdgeShape.smoothstep();

      // Then
      expect(edgeShape.value).toBe('smoothstep');
    });

    it('simplebezier() 메서드는 simplebezier 엣지 모양을 반환해야 한다', () => {
      // When
      const edgeShape = EdgeShape.simplebezier();

      // Then
      expect(edgeShape.value).toBe('simplebezier');
    });
  });

  describe('타입 체크 메서드', () => {
    it('isDefault() 메서드는 default 모양일 때 true를 반환해야 한다', () => {
      // Given
      const edgeShape = new EdgeShape('default');

      // When
      const result = edgeShape.isDefault();

      // Then
      expect(result).toBe(true);
    });

    it('isStraight() 메서드는 straight 모양일 때 true를 반환해야 한다', () => {
      // Given
      const edgeShape = new EdgeShape('straight');

      // When
      const result = edgeShape.isStraight();

      // Then
      expect(result).toBe(true);
    });

    it('isStep() 메서드는 step 모양일 때 true를 반환해야 한다', () => {
      // Given
      const edgeShape = new EdgeShape('step');

      // When
      const result = edgeShape.isStep();

      // Then
      expect(result).toBe(true);
    });
  });
});

