import { describe, it, expect } from 'vitest';
import { Size } from '../size.vo';
import { CanvasManagementError } from '../../errors/canvas-management.error';

// Size Value Object 테스트
describe('Size Value Object', () => {
  describe('constructor', () => {
    it('유효한 width와 height로 Size를 생성할 수 있어야 한다', () => {
      // Given
      const width = 100;
      const height = 200;

      // When
      const size = new Size(width, height);

      // Then
      expect(size.width).toBe(width);
      expect(size.height).toBe(height);
    });

    it('최소 크기(1)로 Size를 생성할 수 있어야 한다', () => {
      // Given
      const width = 1;
      const height = 1;

      // When
      const size = new Size(width, height);

      // Then
      expect(size.width).toBe(width);
      expect(size.height).toBe(height);
    });

    it('최대 크기(10000)로 Size를 생성할 수 있어야 한다', () => {
      // Given
      const width = 10000;
      const height = 10000;

      // When
      const size = new Size(width, height);

      // Then
      expect(size.width).toBe(width);
      expect(size.height).toBe(height);
    });

    it('width가 0보다 작으면 CanvasManagementError를 발생시켜야 한다', () => {
      // Given
      const width = 0;
      const height = 100;

      // When & Then
      expect(() => {
        new Size(width, height);
      }).toThrow(CanvasManagementError);
      expect(() => {
        new Size(width, height);
      }).toThrow('Invalid size values');
    });

    it('height가 0보다 작으면 CanvasManagementError를 발생시켜야 한다', () => {
      // Given
      const width = 100;
      const height = 0;

      // When & Then
      expect(() => {
        new Size(width, height);
      }).toThrow(CanvasManagementError);
      expect(() => {
        new Size(width, height);
      }).toThrow('Invalid size values');
    });

    it('width가 10000을 초과하면 CanvasManagementError를 발생시켜야 한다', () => {
      // Given
      const width = 10001;
      const height = 100;

      // When & Then
      expect(() => {
        new Size(width, height);
      }).toThrow(CanvasManagementError);
      expect(() => {
        new Size(width, height);
      }).toThrow('Invalid size values');
    });

    it('height가 10000을 초과하면 CanvasManagementError를 발생시켜야 한다', () => {
      // Given
      const width = 100;
      const height = 10001;

      // When & Then
      expect(() => {
        new Size(width, height);
      }).toThrow(CanvasManagementError);
      expect(() => {
        new Size(width, height);
      }).toThrow('Invalid size values');
    });

    it('NaN 값이 들어가면 CanvasManagementError를 발생시켜야 한다', () => {
      // Given
      const width = NaN;
      const height = 100;

      // When & Then
      expect(() => {
        new Size(width, height);
      }).toThrow(CanvasManagementError);
      expect(() => {
        new Size(width, height);
      }).toThrow('Invalid size values');
    });

    it('Infinity 값이 들어가면 CanvasManagementError를 발생시켜야 한다', () => {
      // Given
      const width = Infinity;
      const height = 100;

      // When & Then
      expect(() => {
        new Size(width, height);
      }).toThrow(CanvasManagementError);
      expect(() => {
        new Size(width, height);
      }).toThrow('Invalid size values');
    });
  });

  describe('equals', () => {
    it('동일한 width와 height를 가진 Size 객체는 같다고 판단해야 한다', () => {
      // Given
      const size1 = new Size(100, 200);
      const size2 = new Size(100, 200);

      // When
      const result = size1.equals(size2);

      // Then
      expect(result).toBe(true);
    });

    it('다른 width를 가진 Size 객체는 다르다고 판단해야 한다', () => {
      // Given
      const size1 = new Size(100, 200);
      const size2 = new Size(101, 200);

      // When
      const result = size1.equals(size2);

      // Then
      expect(result).toBe(false);
    });

    it('다른 height를 가진 Size 객체는 다르다고 판단해야 한다', () => {
      // Given
      const size1 = new Size(100, 200);
      const size2 = new Size(100, 201);

      // When
      const result = size1.equals(size2);

      // Then
      expect(result).toBe(false);
    });

    it('null이나 undefined와 비교하면 false를 반환해야 한다', () => {
      // Given
      const size = new Size(100, 200);

      // When & Then
      expect(size.equals(null as any)).toBe(false);
      expect(size.equals(undefined as any)).toBe(false);
    });
  });

  describe('resize', () => {
    it('새로운 크기로 Size를 생성할 수 있어야 한다', () => {
      // Given
      const originalSize = new Size(100, 200);
      const newWidth = 150;
      const newHeight = 250;

      // When
      const resizedSize = originalSize.resize(newWidth, newHeight);

      // Then
      expect(resizedSize.width).toBe(newWidth);
      expect(resizedSize.height).toBe(newHeight);
      // 원본은 변경되지 않아야 함
      expect(originalSize.width).toBe(100);
      expect(originalSize.height).toBe(200);
    });

    it('유효하지 않은 크기로 resize하면 CanvasManagementError를 발생시켜야 한다', () => {
      // Given
      const originalSize = new Size(100, 200);
      const invalidWidth = 0;
      const invalidHeight = 150;

      // When & Then
      expect(() => {
        originalSize.resize(invalidWidth, invalidHeight);
      }).toThrow(CanvasManagementError);
    });
  });

  describe('getArea', () => {
    it('width와 height의 곱을 반환해야 한다', () => {
      // Given
      const size = new Size(100, 200);

      // When
      const area = size.getArea();

      // Then
      expect(area).toBe(20000);
    });

    it('소수점 크기에 대해서도 정확한 면적을 반환해야 한다', () => {
      // Given
      const size = new Size(10.5, 20.3);

      // When
      const area = size.getArea();

      // Then
      expect(area).toBeCloseTo(213.15, 2);
    });
  });
});
