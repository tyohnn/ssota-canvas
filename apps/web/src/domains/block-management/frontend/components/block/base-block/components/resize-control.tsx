/**
 * Resize Control Component
 *
 * Container Component: Hook → Props 변환
 * 우측 하단 리사이즈 핸들
 * 단일 선택 시에만 표시
 * 이미지 블록은 종횡비 고정
 */

'use client';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import type { ResizeData } from '../core/types';
import { ResizeControlView } from './resize-control.view';

// 종횡비 유지가 필요한 블록 타입들
const ASPECT_RATIO_LOCKED_BLOCK_TYPES = [
  BlockType.IMAGE,
  BlockType.YOUTUBE,
] as const;

export interface ResizeControlProps {
  data: BlockNodeData;
  selected: boolean;
  isSingleSelection: boolean;
  handleResizeStart: () => void;
  handleResizeEnd: (event: any, resizeData: ResizeData) => Promise<void>;
}

export function ResizeControl({
  data,
  selected,
  isSingleSelection,
  handleResizeStart,
  handleResizeEnd,
}: ResizeControlProps) {
  const { readonly } = useCanvasReadOnly();

  // readonly 모드에서는 resize 핸들을 숨김
  const show = !readonly && selected && isSingleSelection && !!data.blockMountId;

  // 이미지/YouTube 블록이고 오리지널 뷰일 때만 가로세로비 고정
  const isAspectRatioLockedBlock = ASPECT_RATIO_LOCKED_BLOCK_TYPES.includes(
    data.blockType as (typeof ASPECT_RATIO_LOCKED_BLOCK_TYPES)[number]
  );
  const isOriginalView = data.viewMode === 'original';
  const shouldKeepAspectRatio = isAspectRatioLockedBlock && isOriginalView;

  return (
    <ResizeControlView
      nodeId={data.blockMountId || ''}
      show={show}
      keepAspectRatio={shouldKeepAspectRatio}
      onResizeStart={handleResizeStart}
      onResizeEnd={handleResizeEnd}
    />
  );
}
