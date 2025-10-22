import { describe, it, expect } from 'vitest';
import { BlockMountId } from '../block-mount-id.vo';
import { CanvasManagementError } from '../../errors/canvas-management.error';

describe('BlockMountId', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';
  const anotherValidUuid = '223e4567-e89b-12d3-a456-426614174000';

  describe('정상적인 생성', () => {
    it('유효한 UUID로 BlockMountId를 생성할 수 있다', () => {
      // Given: 유효한 UUID
      // When: BlockMountId 생성
      const blockMountId = new BlockMountId(validUuid);

      // Then: 정상적으로 생성됨
      expect(blockMountId.value).toBe(validUuid);
    });

    it('대소문자 구분 없이 UUID를 받을 수 있다', () => {
      // Given: 대문자가 포함된 UUID
      const upperCaseUuid = validUuid.toUpperCase();

      // When: BlockMountId 생성
      const blockMountId = new BlockMountId(upperCaseUuid);

      // Then: 정상적으로 생성됨 (소문자로 저장됨)
      expect(blockMountId.value).toBe(upperCaseUuid.toLowerCase());
    });
  });

  describe('비정상적인 생성', () => {
    it('빈 값으로 생성 시 에러를 발생시킨다', () => {
      // Given: 빈 값
      const emptyValue = '';

      // When & Then: CanvasManagementError 발생
      expect(() => new BlockMountId(emptyValue)).toThrow(
        CanvasManagementError
      );
    });

    it('null로 생성 시 에러를 발생시킨다', () => {
      // Given: null
      const nullValue = null as any;

      // When & Then: CanvasManagementError 발생
      expect(() => new BlockMountId(nullValue)).toThrow(CanvasManagementError);
    });

    it('잘못된 UUID 형식으로 생성 시 에러를 발생시킨다', () => {
      // Given: 잘못된 UUID 형식
      const invalidUuid = 'invalid-uuid-format';

      // When & Then: CanvasManagementError 발생
      expect(() => new BlockMountId(invalidUuid)).toThrow(
        CanvasManagementError
      );
    });
  });

  describe('동등성 비교', () => {
    it('같은 UUID를 가진 BlockMountId는 동등하다', () => {
      // Given: 같은 UUID로 생성된 두 BlockMountId
      const blockMountId1 = new BlockMountId(validUuid);
      const blockMountId2 = new BlockMountId(validUuid);

      // When & Then: equals() true 반환
      expect(blockMountId1.equals(blockMountId2)).toBe(true);
    });

    it('다른 UUID를 가진 BlockMountId는 동등하지 않다', () => {
      // Given: 다른 UUID로 생성된 두 BlockMountId
      const blockMountId1 = new BlockMountId(validUuid);
      const blockMountId2 = new BlockMountId(anotherValidUuid);

      // When & Then: equals() false 반환
      expect(blockMountId1.equals(blockMountId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('toString()은 UUID 값을 반환한다', () => {
      // Given: BlockMountId 생성
      const blockMountId = new BlockMountId(validUuid);

      // When: toString() 호출
      const result = blockMountId.toString();

      // Then: UUID 값 반환
      expect(result).toBe(validUuid);
    });
  });
});
