/**
 * Card View Business Hook
 *
 * 비즈니스 로직: 커스텀 속성 값 추출 및 필터링, 에디터 패널 열기
 */

'use client';

import { useCallback } from 'react';

import type { CustomPropertyDefinition } from '@/domains/block-management/shared/value-objects/block-properties/common-types';

import type {
  CardViewBusinessLogic,
  UseCardViewBusinessOptions,
} from './types';

/**
 * Card View Business Hook
 *
 * 커스텀 속성의 값을 properties에서 추출하고 필터링
 * 에디터 패널 열기 기능 제공
 */
export function useCardViewBusiness(
  options: UseCardViewBusinessOptions
): CardViewBusinessLogic {
  const { blockId, blockMountId, canvasMode } = options;

  const getCustomPropertyValues = useCallback(
    (
      customProperties: CustomPropertyDefinition[],
      properties: Record<string, unknown>
    ) => {
      // visible이 true인 속성만 필터링하고, 값 추출
      return customProperties
        .filter(property => property.visible !== false)
        .map(property => {
          const value =
            properties[property.id] !== undefined
              ? properties[property.id]
              : property.defaultValue;

          return {
            property,
            value,
          };
        })
        .sort((a, b) => a.property.order - b.property.order);
    },
    []
  );

  const openEditorPanel = useCallback(() => {
    if (!blockId) {
      console.warn('[CardView] blockId is required to open editor panel');
      return;
    }
    if (!blockMountId) {
      console.warn('[CardView] blockMountId is required to open editor panel');
      return;
    }
    if (!canvasMode) {
      console.warn('[CardView] canvasMode is required to open editor panel');
      return;
    }

    // 항상 enterBlockEditingMode를 호출 (모드 상태와 UI 동기화)
    canvasMode.enterBlockEditingMode(blockId, blockMountId);
  }, [blockId, blockMountId, canvasMode]);

  return {
    getCustomPropertyValues,
    openEditorPanel,
  };
}
