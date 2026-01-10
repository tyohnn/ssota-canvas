/**
 * DataBlock Types
 *
 * DataBlock 컴포넌트의 타입 정의
 */
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockViewModeValue } from '@/domains/canvas-management/shared/value-objects/block-view-mode.vo';

/**
 * DataBlock Props
 */
export interface DataBlockProps {
  data: BlockNodeData; // BlockNodeData에 이미 viewMode가 required로 포함됨
  selected?: boolean;
  isConnectable?: boolean;
  width?: number;
  height?: number;
  children?: React.ReactNode;
  // Original View 렌더러 (블록 고유 UI) - optional (마크다운 블록은 note view만 사용)
  renderOriginalView?: () => React.ReactNode;
  // Card View 렌더러 (속성 중심 카드)
  renderCardView?: () => React.ReactNode;
}

/**
 * DataBlock Context Value
 */
export interface DataBlockContextValue {
  data: BlockNodeData;
  viewMode: BlockViewModeValue;
  selected: boolean;
  isSingleSelection: boolean;
  onViewModeChange?: (viewMode: BlockViewModeValue) => void;
}
