/**
 * Editor Panel
 *
 * Notion 스타일 우측 슬라이드 패널
 * - 블록 정보 표시 및 편집
 * - Style Section, Property Section
 */

'use client';

import React from 'react';

import {
  useCanvasModeContext,
  useCanvasSelection,
} from '@/domains/canvas-management/frontend/hooks';

import { ContentArea } from './components/content-area';
import { Header } from './components/header';
import { EditorPanelView } from './editor-panel.view';
import { useEditorPanelContext } from './core/context';
import { EditorPanelProvider } from './core/provider';
import type { EditorPanelProps } from './core/types';
import type { EditorPanelBusinessLogic } from './core/use-editor-panel.business';
import { useViewportAdjustment } from './core/use-viewport-adjustment';

function EditorPanelWrapper() {
  const {
    blockId,
    blockMountId,
    isOpen,
    isAnimating,
    shouldRender,
    blockData,
    isExpanded,
    setIsExpanded,
    onClose,
  } = useEditorPanelContext();

  // Viewport 조정 (에디터 열림 시 블록을 적절한 위치로 이동)
  useViewportAdjustment(blockMountId, isOpen);

  // ESC 키 핸들러: 확대 상태면 축소, 축소 상태면 패널 닫기
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Input이나 contentEditable 요소에서는 무시
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }

        if (isExpanded) {
          // 확대된 상태 → 축소 (이벤트 완전 차단)
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          setIsExpanded(false);
        } else {
          // 축소 상태 → 패널 닫기
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }
    };

    // 캡처 단계에서 가장 먼저 처리
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isExpanded, setIsExpanded, onClose]);

  if (!shouldRender || !blockData) return null;

  return (
    <EditorPanelView isExpanded={isExpanded} isVisible={isAnimating}>
      <Header />
      <ContentArea />
    </EditorPanelView>
  );
}

export function EditorPanel({
  blockId,
  blockMountId,
  isOpen,
  businessLogic,
}: EditorPanelProps & { businessLogic?: EditorPanelBusinessLogic }) {
  const canvasMode = useCanvasModeContext();
  const { selectedNodes } = useCanvasSelection();

  // 에디터 패널 close 핸들러: 선택된 노드가 있으면 single-selection 모드로 전환
  const handleClose = React.useCallback(() => {
    if (selectedNodes.length === 1) {
      // 단일 선택: single-selection 모드로 전환
      canvasMode.enterSingleSelectionMode(selectedNodes[0]!.id);
    } else if (selectedNodes.length > 1) {
      // 다중 선택: multi-selection 모드로 전환
      canvasMode.enterMultiSelectionMode(selectedNodes.map(n => n.id));
    } else {
      // 선택 없음: default 모드로 전환
      canvasMode.exitToDefaultMode();
    }
  }, [canvasMode, selectedNodes]);

  return (
    <EditorPanelProvider
      blockId={blockId}
      blockMountId={blockMountId}
      isOpen={isOpen}
      onClose={handleClose}
      businessLogic={businessLogic}
    >
      <EditorPanelWrapper />
    </EditorPanelProvider>
  );
}
