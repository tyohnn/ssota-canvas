import { useMemo } from 'react';

import { ColorToken } from '@/domains/block-management/shared/types/style-tokens.types';

import type { EdgeVisualState, UIStateDependencies } from './types';

/**
 * UI State Hook for Custom Edge
 *
 * 디자이너가 Storybook/노코드 툴에서 사용할 수 있는 순수 UI 로직
 * - 비즈니스 로직 없음 (API 호출, 데이터 검증 등)
 * - Visual state만 담당 (path 계산은 EdgePath 컴포넌트에서 처리)
 * - 노코드 환경에서 독립적으로 테스트 가능
 */
export interface CustomEdgeUIState {
  // Visual state
  visualState: EdgeVisualState;
}

export function useCustomEdgeUI(deps: UIStateDependencies): CustomEdgeUIState {
  const { style = {}, selected = false, themeDeps } = deps;

  // Calculate visual state (stroke color and width)
  const visualState = useMemo<EdgeVisualState>(() => {
    const defaultStrokeColor =
      themeDeps.theme === 'dark'
        ? themeDeps.getHexColorDark(ColorToken.GRAY)
        : themeDeps.getHexColor(ColorToken.GRAY);
    const selectedStrokeColor =
      themeDeps.theme === 'dark'
        ? themeDeps.getHexColorDark(ColorToken.BLUE)
        : themeDeps.getHexColor(ColorToken.BLUE);

    const strokeWidth = style.strokeWidth
      ? selected
        ? (style.strokeWidth as number) + 0.5
        : (style.strokeWidth as number)
      : selected
        ? 2.5
        : 1.5;

    const stroke = selected
      ? selectedStrokeColor
      : style.stroke || defaultStrokeColor;

    return {
      strokeColor: stroke,
      strokeWidth,
      isSelected: selected,
    };
  }, [
    style,
    selected,
    themeDeps.theme,
    themeDeps.getHexColor,
    themeDeps.getHexColorDark,
  ]);

  return {
    visualState,
  };
}
