// apps/web/src/domains/canvas-management/shared/value-objects/__tests__/position.test.ts

import { describe, it, expect } from 'vitest';
import { Position } from '../position.vo';
import { CanvasManagementError } from '../../errors/canvas-management.error';

describe('Position Value Object', () => {
  describe('생성자', () => {
    it('유효한 좌표값으로 생성되어야 한다', () => {
      // Given
      const x = 100;
      const y = 200;

      // When
      const position = new Position(x, y);

      // Then
      expect(position).toBeDefined();
      expect(position.x).toBe(x);
      expect(position.y).toBe(y);
    });

    it('범위를 벗어난 좌표값에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const invalidX = -1000000;
      const validY = 0;

      // When & Then
      expect(() => new Position(invalidX, validY)).toThrow(CanvasManagementError);
      expect(() => new Position(validY, invalidX)).toThrow(CanvasManagementError);
    });

    it('Infinity, NaN 값에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const validX = 100;

      // When & Then
      expect(() => new Position(Infinity, validX)).toThrow(CanvasManagementError);
      expect(() => new Position(validX, Infinity)).toThrow(CanvasManagementError);
      expect(() => new Position(NaN, validX)).toThrow(CanvasManagementError);
      expect(() => new Position(validX, NaN)).toThrow(CanvasManagementError);
    });

    it('최소/최대 범위 경계값은 허용되어야 한다', () => {
      // Given
      const minValue = -999999;
      const maxValue = 999999;

      // When & Then
      expect(() => new Position(minValue, 0)).not.toThrow();
      expect(() => new Position(maxValue, 0)).not.toThrow();
      expect(() => new Position(0, minValue)).not.toThrow();
      expect(() => new Position(0, maxValue)).not.toThrow();
    });
  });

  describe('equals', () => {
    it('동일한 좌표를 가진 Position은 같아야 한다', () => {
      // Given
      const pos1 = new Position(100, 200);
      const pos2 = new Position(100, 200);

      // When
      const isEqual = pos1.equals(pos2);

      // Then
      expect(isEqual).toBe(true);
    });

    it('다른 좌표를 가진 Position은 달라야 한다', () => {
      // Given
      const pos1 = new Position(100, 200);
      const pos2 = new Position(101, 200);

      // When
      const isEqual = pos1.equals(pos2);

      // Then
      expect(isEqual).toBe(false);
    });

    it('부동소수점 오차 범위 내에서 같다고 판단해야 한다', () => {
      // Given
      const pos1 = new Position(100.0001, 200.0001);
      const pos2 = new Position(100.0002, 200.0002);

      // When
      const isEqual = pos1.equals(pos2);

      // Then
      expect(isEqual).toBe(true);
    });
  });

  describe('add', () => {
    it('두 Position을 더한 결과가 올바르게 계산되어야 한다', () => {
      // Given
      const pos1 = new Position(100, 200);
      const pos2 = new Position(50, 75);

      // When
      const result = pos1.add(pos2);

      // Then
      expect(result.x).toBe(150);
      expect(result.y).toBe(275);
    });

    it('더한 결과가 범위를 벗어나면 예외가 발생해야 한다', () => {
      // Given
      const pos1 = new Position(999000, 0);
      const pos2 = new Position(10000, 0); // 결과가 범위 초과

      // When & Then
      expect(() => pos1.add(pos2)).toThrow(CanvasManagementError);
    });
  });

  describe('distanceTo', () => {
    it('두 Position 간 거리가 올바르게 계산되어야 한다', () => {
      // Given
      const pos1 = new Position(0, 0);
      const pos2 = new Position(3, 4);

      // When
      const distance = pos1.distanceTo(pos2);

      // Then
      expect(distance).toBe(5);
    });

    it('같은 위치의 거리는 0이어야 한다', () => {
      // Given
      const pos1 = new Position(100, 200);
      const pos2 = new Position(100, 200);

      // When
      const distance = pos1.distanceTo(pos2);

      // Then
      expect(distance).toBe(0);
    });
  });
});
