/**
 * Base Block Combined Hook
 *
 * UI State + Business Logic 통합
 * Optional injection으로 유연하게 연결
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useCanvasSelection } from '@/domains/canvas-management/frontend/hooks/use-canvas-selection';
import {
  ColorToken,
  getRichStyleClasses,
  getTextColorClass,
  getSelectedRingClasses,
} from '@/domains/block-management/shared/types/style-tokens.types';
import { useBaseBlockUI, type BaseBlockUIState } from './use-base-block.ui';
import {
  useBaseBlockBusiness,
  type BaseBlockBusinessLogic,
} from './use-base-block.business';
import type { BaseBlockProps, ResizeData } from './types';

export interface UseBaseBlockOptions {
  businessLogic?: BaseBlockBusinessLogic;
}

export interface UseBaseBlockReturn extends BaseBlockUIState {
  // 블록 데이터
  data: BaseBlockProps['data'];
  selected: boolean;
  isConnectable: boolean;

  // 크기
  width?: number;
  height?: number;

  // 스타일
  styleProps?: BaseBlockProps['styleProps'];
  noBorder: boolean;
  noBackground: boolean;

  // 계산된 스타일
  colorToken: ColorToken;
  richStyle: boolean;
  styleClasses: string;
  textColorClass: string;
  selectedRingClasses: string;

  // 선택 상태
  isCurrentBlockSelected: boolean;
  isSingleSelection: boolean;

  // Combined 액션
  handleMouseEnter: () => void;
  handleResizeEnd: (event: any, resizeData: ResizeData) => Promise<void>;
}

/**
 * BaseBlock Combined Hook
 *
 * UI + Business 로직 통합
 */
export function useBaseBlock(
  props: BaseBlockProps,
  options?: UseBaseBlockOptions
): UseBaseBlockReturn {
  const {
    data,
    selected = false,
    isConnectable = true,
    width,
    height,
    styleProps,
    noBorder = false,
    noBackground = false,
  } = props;

  // UI State (디자이너 영역)
  const uiState = useBaseBlockUI();

  // Business Logic (엔지니어 영역)
  const defaultBusiness = useBaseBlockBusiness();
  const business = options?.businessLogic ?? defaultBusiness;

  // Canvas Selection
  const canvasSelection = useCanvasSelection();

  // 선택 상태 계산
  const isCurrentBlockSelected = canvasSelection.isSelected(
    data.blockMountId || ''
  );
  const selectedBlocks = canvasSelection.getSelectedBlocks();
  const isSingleSelection = selectedBlocks.length === 1;

  // 색상 토큰 및 스타일 계산
  const colorToken = (styleProps?.color as ColorToken) || ColorToken.GRAY;
  const richStyle = styleProps?.richStyle || false;

  const styleClasses = useMemo(
    () => (richStyle ? getRichStyleClasses(colorToken) : ''),
    [richStyle, colorToken]
  );

  const textColorClass = useMemo(
    () => getTextColorClass(colorToken),
    [colorToken]
  );

  const selectedRingClasses = useMemo(
    () => getSelectedRingClasses(colorToken),
    [colorToken]
  );

  // Combined Logic: Mouse Enter (Prefetch)
  const handleMouseEnter = useCallback(() => {
    const blockType = data.blockType || 'basic';
    business.prefetchBlockTools(blockType);
  }, [data.blockType, business]);

  // Combined Logic: Resize End (Save to DB)
  const handleResizeEnd = useCallback(
    async (event: any, resizeData: ResizeData) => {
      // Business: Save to DB
      const result = await business.saveBlockSize(
        data.blockMountId || '',
        resizeData,
        {
          pageId: data.pageId,
          orgId: data.orgId,
          workspaceId: data.workspaceId,
        }
      );

      if (!result.ok) {
        console.error('블록 크기 업데이트 실패:', result.error);
      }

      // UI: Complete resize
      uiState.handleResizeComplete();
    },
    [data, business, uiState]
  );

  return {
    // 블록 데이터
    data,
    selected,
    isConnectable,

    // 크기
    width,
    height,

    // 스타일
    styleProps,
    noBorder,
    noBackground,

    // 계산된 스타일
    colorToken,
    richStyle,
    styleClasses,
    textColorClass,
    selectedRingClasses,

    // 선택 상태
    isCurrentBlockSelected,
    isSingleSelection,

    // UI State
    ...uiState,

    // Combined 액션
    handleMouseEnter,
    handleResizeEnd,
  };
}
