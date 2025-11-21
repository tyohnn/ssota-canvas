/**
 * Editor Panel
 *
 * Notion 스타일 우측 슬라이드 패널
 * - 블록 정보 표시 및 편집
 * - Style Section, Property Section
 */

'use client';

import React from 'react';
import { useCanvasMode } from '@/domains/canvas-management/frontend/hooks/use-canvas-mode';
import { EditorPanelProvider } from './core/provider';
import { useEditorPanelContext } from './core/context';
import { useViewportAdjustment } from './core/use-viewport-adjustment';
import { Header } from './components/header';
import { ContentArea } from './components/content-area';
import type { EditorPanelProps } from './core/types';
import type { EditorPanelBusinessLogic } from './core/use-editor-panel.business';

function EditorPanelWrapper() {
  const {
    blockId,
    isOpen,
    isAnimating,
    shouldRender,
    blockData,
    isExpanded,
    setIsExpanded,
    onClose,
  } = useEditorPanelContext();

  // Viewport 조정 (에디터 열림 시 블록을 적절한 위치로 이동)
  useViewportAdjustment(blockId, isOpen);

  // ESC 키 핸들러: 확대 상태면 축소, 축소 상태면 패널 닫기
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isExpanded) {
          // 확대된 상태 → 축소 (이벤트 완전 차단)
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          setIsExpanded(false);
        }
        // 축소 상태일 때는 아무것도 하지 않음 (다른 핸들러가 처리)
      }
    };

    // 캡처 단계에서 가장 먼저 처리
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isExpanded, setIsExpanded]);

  if (!shouldRender || !blockData) return null;

  return (
    <div
      className={`absolute z-50 bg-background backdrop-blur-md border-border shadow-2xl ${
        isExpanded
          ? 'inset-0 border rounded-none'
          : 'bottom-0 right-0 w-[43%] h-[85%] border-l border-t rounded-tl-lg'
      } ${
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{
        transition:
          'all 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease-out, opacity 0.3s ease-out',
      }}
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
