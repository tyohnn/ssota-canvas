/**
 * Base Block Combined Hook
 *
 * UI State + Business Logic 통합
 * Optional injection으로 유연하게 연결
 */

'use client';

import { useCallback, useEffect, useMemo } from 'react';

import { useUpdateNodeInternals } from '@xyflow/react';

import {
  ColorToken,
  getRichStyleClasses,
  getSelectedRingClasses,
  getTextColorClass,
} from '@/domains/block-management/shared/types/style-tokens.types';
import { useCanvasSelection } from '@/domains/canvas-management/frontend/hooks/use-canvas-selection';

import type { BaseBlockProps, ResizeData } from './types';
import {
  type BaseBlockBusinessLogic,
  useBaseBlockBusiness,
} from './use-base-block.business';
import { type BaseBlockUIState, useBaseBlockUI } from './use-base-block.ui';

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
  handleMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseLeave: () => void;
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

  // viewMode 변경 시 sizes에서 크기를 즉시 사용하여 딜레이 방지
  const effectiveWidth = useMemo(() => {
    if (width) return width;
    const currentViewMode = data.viewMode;
    const sizes = data.sizes;
    if (sizes && sizes[currentViewMode]) {
      return sizes[currentViewMode].width;
    }
    return width;
  }, [width, data.viewMode, data.sizes]);

  const effectiveHeight = useMemo(() => {
    if (height) return height;
    const currentViewMode = data.viewMode;
    const sizes = data.sizes;
    if (sizes && sizes[currentViewMode]) {
      return sizes[currentViewMode].height;
    }
    return height;
  }, [height, data.viewMode, data.sizes]);

  // React Flow 노드 내부 업데이트 (방어적)
  // effectiveWidth/effectiveHeight가 변경될 때마다 React Flow에 알림
  // 이렇게 하면 viewMode나 sizes 변경으로 인한 크기 변경 시에도 엣지가 올바르게 연결됨
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    if (data.blockMountId) {
      updateNodeInternals(data.blockMountId);
    }
  }, [effectiveWidth, effectiveHeight, data.blockMountId, updateNodeInternals]);

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

  // Combined Logic: Mouse Move (Delegated to UI hook)
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      uiState.detectEdgeHoverDirection(event);
    },
    [uiState]
  );

  // Combined Logic: Mouse Leave (Delegated to UI hook)
  const handleMouseLeave = useCallback(() => {
    uiState.clearHoverDirection();
  }, [uiState]);

  // Combined Logic: Resize End (Save to DB)
  const handleResizeEnd = useCallback(
    async (event: any, resizeData: ResizeData) => {
      // 현재 viewMode 가져오기
      const currentViewMode = data.viewMode;

      // Business: Save to DB (현재 viewMode 전달)
      const result = await business.saveBlockSize(
        data.blockMountId || '',
        resizeData,
        currentViewMode
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
    // UI State (먼저 스프레드)
    ...uiState,

    // 블록 데이터
    data,
    selected,
    isConnectable,

    // 크기 (viewMode 변경 시 sizes에서 즉시 사용)
    width: effectiveWidth,
    height: effectiveHeight,

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

    // Combined 액션
    handleMouseEnter,
    handleMouseMove,
    handleMouseLeave,
    handleResizeEnd,
  };
}
