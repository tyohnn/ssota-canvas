import { useCallback } from 'react';
import { useCustomProperty } from '@/domains/block-management/frontend/hooks';
import { PropertyType } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import { useCustomPropertiesSectionContext } from '../../../core/context';

/**
 * Business Logic Hook for Property Add Popover
 *
 * 프론트엔드 엔지니어가 비즈니스 로직을 배선하는 곳
 * - API 호출
 * - 데이터 검증
 * - 에러 처리
 * - 도메인 로직
 *
 * 노코드 툴에서는 Mock 버전을 주입하여 사용
 */

export interface PropertyAddBusinessLogic {
  /**
   * 속성 생성 제출
   * @throws Error when creation fails
   */
  onSubmit: (params: {
    name: string;
    type: PropertyType;
    icon: string;
  }) => Promise<void>;

  /**
   * 속성 이름 검증
   * @returns 에러 메시지 (유효하면 null)
   */
  validate?: (name: string) => string | null;

  /**
   * 취소 핸들러 (선택)
   */
  onCancel?: () => void;
}

/**
 * Production 비즈니스 로직
 * 실제 API를 호출하고 도메인 상태를 업데이트
 */
export function usePropertyAddBusiness(
  blockId: string
): PropertyAddBusinessLogic {
  const { createProperty } = useCustomProperty();
  const { setLastAddedPropertyId } = useCustomPropertiesSectionContext();

  const onSubmit = useCallback(
    async (params: { name: string; type: PropertyType; icon: string }) => {
      try {
        const newPropertyId = await createProperty(blockId, params);
        setLastAddedPropertyId(newPropertyId);
      } catch (error) {
        console.error('Failed to create property:', error);
        throw error; // Re-throw for UI to handle
      }
    },
    [blockId, createProperty, setLastAddedPropertyId]
  );

  const validate = useCallback((name: string) => {
    if (!name.trim()) {
      return 'Property name is required';
    }
    if (name.length > 50) {
      return 'Property name is too long (max 50 characters)';
    }
    // 추가 검증 로직 (예: 중복 검사, 특수문자 검사 등)
    return null;
  }, []);

  return {
    onSubmit,
    validate,
  };
}

/**
 * Mock 비즈니스 로직 (노코드 툴용)
 * 실제 API 호출 없이 로컬에서 동작 테스트
 */
export function useMockPropertyAddBusiness(): PropertyAddBusinessLogic {
  const onSubmit = useCallback(
    async (params: { name: string; type: PropertyType; icon: string }) => {
      console.log('[Mock] Creating property:', params);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('[Mock] Property created successfully');
    },
    []
  );

  const validate = useCallback((name: string) => {
    if (!name.trim()) {
      return 'Property name is required';
    }
    return null;
  }, []);

  return {
    onSubmit,
    validate,
  };
}
