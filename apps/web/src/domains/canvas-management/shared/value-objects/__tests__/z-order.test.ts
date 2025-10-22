import { describe, it, expect } from 'vitest';
import { ZOrder } from '../z-order.vo';
import { CanvasManagementError } from '../../errors/canvas-management.error';


describe('ZOrder Value Object', () => {
  describe('constructor', () => {
    it('유효한 z-order 값으로 ZOrder를 생성할 수 있어야 한다', () => {
      // Given
      const value = 100;

      // When
      const zOrder = new ZOrder(value);

      // Then
      expect(zOrder.value).toBe(value);
    });

    it('최소값(0)으로 ZOrder를 생성할 수 있어야 한다', () => {
      // Given
      const value = 0;

      // When
      const zOrder = new ZOrder(value);

      // Then
      expect(zOrder.value).toBe(value);
    });

    it('최대값(2147483647)으로 ZOrder를 생성할 수 있어야 한다', () => {
      // Given
      const value = 2147483647;

      // When
      const zOrder = new ZOrder(value);

      // Then
      expect(zOrder.value).toBe(value);
    });

    it('음수 값이 들어가면 CanvasManagementError를 발생시켜야 한다', () => {
      // Given
      const value = -1;

      // When & Then
      expect(() => {
        new ZOrder(value);
      }).toThrow('Invalid z-order value');
    });

    it('최대값을 초과하면 CanvasManagementError를 발생시켜야 한다', () => {
      // Given
      const value = 2147483648;

      // When & Then
      expect(() => {
        new ZOrder(value);
      }).toThrow('Invalid z-order value');
    });

    it('정수가 아닌 값이 들어가면 CanvasManagementError를 발생시켜야 한다', () => {
      // Given
      const value = 100.5;

      // When & Then
      expect(() => {
        new ZOrder(value);
      }).toThrow('Invalid z-order value');
    });

    it('NaN 값이 들어가면 CanvasManagementError를 발생시켜야 한다', () => {
      // Given
      const value = NaN;

      // When & Then
      expect(() => {
        new ZOrder(value);
      }).toThrow('Invalid z-order value');
    });

    it('Infinity 값이 들어가면 CanvasManagementError를 발생시켜야 한다', () => {
      // Given
      const value = Infinity;

      // When & Then
      expect(() => {
        new ZOrder(value);
      }).toThrow('Invalid z-order value');
    });
  });

  describe('equals', () => {
    it('동일한 값을 가진 ZOrder 객체는 같다고 판단해야 한다', () => {
      // Given
      const zOrder1 = new ZOrder(100);
      const zOrder2 = new ZOrder(100);

      // When
      const result = zOrder1.equals(zOrder2);

      // Then
      expect(result).toBe(true);
    });

    it('다른 값을 가진 ZOrder 객체는 다르다고 판단해야 한다', () => {
      // Given
      const zOrder1 = new ZOrder(100);
      const zOrder2 = new ZOrder(101);

      // When
      const result = zOrder1.equals(zOrder2);

      // Then
      expect(result).toBe(false);
    });

    it('null이나 undefined와 비교하면 false를 반환해야 한다', () => {
      // Given
      const zOrder = new ZOrder(100);

      // When & Then
      expect(zOrder.equals(null as any)).toBe(false);
      expect(zOrder.equals(undefined as any)).toBe(false);
    });
  });

  describe('isAbove', () => {
    it('더 큰 값을 가진 ZOrder는 위에 있다고 판단해야 한다', () => {
      // Given
      const higherZOrder = new ZOrder(200);
      const lowerZOrder = new ZOrder(100);

      // When
      const result = higherZOrder.isAbove(lowerZOrder);

      // Then
      expect(result).toBe(true);
    });

    it('더 작은 값을 가진 ZOrder는 아래에 있다고 판단해야 한다', () => {
      // Given
      const lowerZOrder = new ZOrder(100);
      const higherZOrder = new ZOrder(200);

      // When
      const result = lowerZOrder.isAbove(higherZOrder);

      // Then
      expect(result).toBe(false);
    });

    it('동일한 값을 가진 ZOrder는 위에 있지 않다고 판단해야 한다', () => {
      // Given
      const zOrder1 = new ZOrder(100);
      const zOrder2 = new ZOrder(100);

      // When
      const result = zOrder1.isAbove(zOrder2);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('getTopLayer', () => {
    it('최상위 레이어 ZOrder를 반환해야 한다', () => {
      // When
      const topLayer = ZOrder.getTopLayer();

      // Then
      expect(topLayer.value).toBe(2147483647);
    });

    it('getTopLayer로 생성된 ZOrder는 유효해야 한다', () => {
      // When
      const topLayer = ZOrder.getTopLayer();

      // Then
      expect(() => new ZOrder(topLayer.value)).not.toThrow();
    });
  });
});
