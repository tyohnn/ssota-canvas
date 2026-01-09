/**
 * Add Button Zones Component
 *
 * Container Component: Hook → Props 변환
 *
 * 블록 바깥 50px 영역에 투명한 hover 영역을 배치하여
 * Add Button의 hover 트리거를 핸들과 분리
 * - E010-003: 블록 추가 + 버튼
 * - selected일 때만 렌더링
 */

'use client';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { AddButtonZoneView } from './components/add-button-zone-view';
import type { HoverDirection } from './core/types';
import { useAddButtonsBusiness } from './core/use-add-buttons.business';
import { useAddButtonsUI } from './core/use-add-buttons.ui';

export interface AddButtonZonesContainerProps {
  show: boolean;
  data: BlockNodeData;
  width?: number;
  height?: number;
  setHoverDirection: (direction: HoverDirection | null) => void;
}

/**
 * Add Button Zones Container
 *
 * Hook을 사용하여 데이터를 가져오고 Props로 전달
 */
export function AddButtonZonesContainer({
  show,
  data,
  width,
  height,
  setHoverDirection,
}: AddButtonZonesContainerProps) {
  const uiState = useAddButtonsUI();
  const { handleAddBlock } = useAddButtonsBusiness({ data, width, height });

  if (!show) {
    return null;
  }

  return (
    <>
      {/* <AddButtonZoneView direction="left" {...uiState} setHoverDirection={setHoverDirection} onAddBlock={handleAddBlock} /> */}
      <AddButtonZoneView
        direction="right"
        {...uiState}
        setHoverDirection={setHoverDirection}
        onAddBlock={handleAddBlock}
      />
      {/* <AddButtonZoneView direction="top" {...uiState} setHoverDirection={setHoverDirection} onAddBlock={handleAddBlock} /> */}
      <AddButtonZoneView
        direction="bottom"
        {...uiState}
        setHoverDirection={setHoverDirection}
        onAddBlock={handleAddBlock}
      />
    </>
  );
}
