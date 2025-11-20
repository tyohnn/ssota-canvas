/**
 * Editor Panel
 *
 * Notion 스타일 우측 슬라이드 패널
 * - 블록 정보 표시 및 편집
 * - Style Section, Property Section
 */

'use client';

import { useCanvasMode } from '@/domains/canvas-management/frontend/hooks/use-canvas-mode';
import { EditorPanelProvider } from './core/provider';
import { useEditorPanelContext } from './core/context';
import { useViewportAdjustment } from './core/use-viewport-adjustment';
import { Header } from './components/header';
import { ContentArea } from './components/content-area';
import type { EditorPanelProps } from './core/types';
import type { EditorPanelBusinessLogic } from './core/use-editor-panel.business';

function EditorPanelWrapper() {
  const { blockId, isOpen, isAnimating, shouldRender, blockData } =
    useEditorPanelContext();

  // Viewport 조정 (에디터 열림 시 블록을 적절한 위치로 이동)
  useViewportAdjustment(blockId, isOpen);

  if (!shouldRender || !blockData) return null;

  return (
    <div
      className={`absolute bottom-0 right-0 z-50 w-[43%] h-[85%] bg-background backdrop-blur-md border-l border-t border-border shadow-2xl rounded-tl-lg transition-all duration-300 ease-out ${
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-panel-title"
    >
      <div className="flex flex-col h-full">
        <Header />
        <ContentArea />
      </div>
    </div>
  );
}

export function EditorPanel({
  blockId,
  isOpen,
  businessLogic,
}: EditorPanelProps & { businessLogic?: EditorPanelBusinessLogic }) {
  const canvasMode = useCanvasMode();

  return (
    <EditorPanelProvider
      blockId={blockId}
      isOpen={isOpen}
      onClose={() => canvasMode.exitToDefaultMode()}
      businessLogic={businessLogic}
    >
      <EditorPanelWrapper />
    </EditorPanelProvider>
  );
}
