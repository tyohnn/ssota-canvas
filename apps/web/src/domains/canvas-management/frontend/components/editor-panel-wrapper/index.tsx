'use client';

import { EditorPanel } from '@/domains/block-management/frontend/components/editor-panel';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';

/**
 * Editor Panel Wrapper Component
 *
 * React Flow 바깥에서 에디터 패널을 렌더링하는 컴포넌트
 */
export function EditorPanelWrapper() {
  const canvasMode = useCanvasModeContext();

  if (!canvasMode.isBlockEditingMode()) {
    return null;
  }

  const blockId =
    canvasMode.mode.type === 'block-editing' ? canvasMode.mode.blockId : '';

  return <EditorPanel blockId={blockId} isOpen={true} />;
}
