/**
 * Base Block Types
 *
 * BaseBlock 컴포넌트의 타입 정의
 */

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { ColorToken } from '@/domains/block-management/shared/types/style-tokens.types';

/**
 * BaseBlock Props
 */
export interface BaseBlockProps {
  data: BlockNodeData;
  selected?: boolean;
  isConnectable?: boolean;
  children?: React.ReactNode;
  width?: number;
  height?: number;
  // 스타일 관련 props (선택적)
  styleProps?: {
    color?: string;
    richStyle?: boolean;
    textAlign?: string;
    fontSize?: string;
  };
  // 배경/테두리 제어
  noBorder?: boolean;
  noBackground?: boolean;
}

/**
 * BaseBlock Context Value
 */
export interface BaseBlockContextValue {
  // 블록 데이터
  data: BlockNodeData;
  selected: boolean;
  isConnectable: boolean;

  // 크기
  width?: number;
  height?: number;

  // 스타일
  styleProps?: BaseBlockProps['styleProps'];
  noBorder: boolean;
  noBackground: boolean;

  // 색상 토큰
  colorToken: ColorToken;
  richStyle: boolean;

  // 계산된 스타일 클래스
  styleClasses: string;
  textColorClass: string;
  selectedRingClasses: string;

  // 선택 상태
  isCurrentBlockSelected: boolean;
  isSingleSelection: boolean;

  // UI 상태
  isResizing: boolean;

  // UI 액션
  handleMouseEnter: () => void;
  handleResizeStart: () => void;
  handleResizeEnd: (
    event: any,
    resizeData: { width: number; height: number }
  ) => void;
}

/**
 * 리사이즈 데이터
 */
export interface ResizeData {
  width: number;
  height: number;
}

/**
 * 블록 크기 업데이트 파라미터
 */
export interface BlockSizeUpdateParams {
  width: number;
  height: number;
  pageId: string;
  orgId: string;
  workspaceId: string;
}
