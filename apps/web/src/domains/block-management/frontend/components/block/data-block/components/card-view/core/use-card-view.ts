/**
 * Card View Hook
 *
 * 메인 훅: 의존성 주입 및 비즈니스 훅 오케스트레이션
 */

'use client';

import { useMemo } from 'react';

import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';

import type {
  CardViewProps,
  UseCardViewOptions,
  UseCardViewReturn,
} from './types';
import { useCardViewBusiness } from './use-card-view.business';

/**
 * Card View Hook
 *
 * 비즈니스 훅을 오케스트레이션하여 통합 로직 제공
 */
export function useCardView(
  props: CardViewProps,
  options?: UseCardViewOptions
): UseCardViewReturn {
  const { data } = props;

  // Canvas Mode Context (항상 실제 context 사용)
  const canvasMode = useCanvasModeContext();

  // 비즈니스 로직 (의존성 주입 지원)
  const defaultBusiness = useCardViewBusiness({
    blockId: data.blockId,
    canvasMode: {
      mode: canvasMode.mode,
      isBlockEditingMode: canvasMode.isBlockEditingMode,
      enterBlockEditingMode: canvasMode.enterBlockEditingMode,
    },
  });
  const business = options?.businessLogic ?? defaultBusiness;

  // 커스텀 속성 값 추출
  const customPropertiesWithValues = useMemo(() => {
    const properties = (data.properties ?? {}) as Record<string, unknown>;
    return business.getCustomPropertyValues(
      data.customProperties || [],
      properties
    );
  }, [data.customProperties, data.properties, business]);

  // View Props 생성
  const viewProps = useMemo(
    () => ({
      title: data.title || 'Untitled',
      blockType: data.blockType,
      customProperties: customPropertiesWithValues,
      className: props.className,
      selected: props.selected ?? false,
      onOpenEditorPanel: business.openEditorPanel,
    }),
    [
      data.title,
      data.blockType,
      customPropertiesWithValues,
      props.className,
      props.selected,
      business.openEditorPanel,
    ]
  );

  return {
    viewProps,
    business,
  };
}
