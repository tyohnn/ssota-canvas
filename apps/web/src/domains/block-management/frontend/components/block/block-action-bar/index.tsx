/**
 * BlockActionBar Component
 *
 * Container Component: Hook → Props 변환
 * 선택된 블럭에 대한 액션을 제공하는 툴바 컴포넌트
 * 블록 아래쪽에 표시되며 블록 타입별로 다른 액션 아이템을 제공합니다.
 *
 * Features:
 * - 선택된 블럭 아래쪽에 표시되는 컨텍스트 액션 바
 * - 블럭 타입별 액션 아이템 (이미지 검색, AI 생성 등)
 * - BlockOriginalToolbar와 동일한 UX/UI (Absolute + ToolbarContainer)
 *
 * 렌더링 조건: 블록이 선택되었을 때
 */

'use client';

import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import { BLOCK_ACTION_MODULES } from './action-prefetch';
import { BlockActionMapper } from './block-action-mapper';
import { BlockActionBarView } from './block-action-bar.view';

export interface BlockActionBarProps {
  blockId: string;
  blockType: string;
  blockData: any;
}

export function BlockActionBar({
  blockId,
  blockType,
  blockData,
}: BlockActionBarProps) {
  const { readonly } = useCanvasReadOnly();

  // readonly 모드에서는 action toolbar를 숨김
  const show = !readonly && !!BLOCK_ACTION_MODULES[blockType];

  return (
    <BlockActionBarView show={show}>
      {/* 블록 타입별 액션 아이템 매퍼 */}
      <BlockActionMapper
        blockId={blockId}
        blockType={blockType}
        blockData={blockData}
      />
    </BlockActionBarView>
  );
}
