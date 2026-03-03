/**
 * Editor Panel
 *
 * Notion 스타일 우측 슬라이드 패널
 * - Single adapter: wires @workspace/editor-panel with app deps
 * - Props dependency & logic live in core/use-editor-panel*.ts(x)
 */

'use client';

import React, { useCallback } from 'react';

import {
  useCanvasModeContext,
  useCanvasSelection,
} from '@/domains/canvas-management/frontend/hooks';
import {
  EditorPanelView,
} from '@workspace/editor-panel';

import type { EditorPanelBusinessLogic } from '@workspace/editor-panel';

import { useEditorPanel } from './core/use-editor-panel';

export interface EditorPanelProps {
  blockId: string;
  blockMountId: string;
  isOpen: boolean;
}

function EditorPanelAdapter({
  blockId,
  blockMountId,
  isOpen,
  onClose,
  businessLogic,
}: EditorPanelProps & {
  onClose: () => void;
  businessLogic?: EditorPanelBusinessLogic;
}) {
  const { contract, frameClassName, shouldRender, blockData } = useEditorPanel({
    blockId,
    blockMountId,
    isOpen,
    onClose,
    businessLogic,
  });

  if (!shouldRender || !blockData) return null;

  return (
    <div
      className={frameClassName}
      style={{
        transition:
          'all 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease-out, opacity 0.3s ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-panel-title"
    >
      <EditorPanelView {...contract} />
    </div>
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

  const handleClose = useCallback(() => {
    if (selectedNodes.length === 1) {
      canvasMode.enterSingleSelectionMode(selectedNodes[0]!.id);
    } else if (selectedNodes.length > 1) {
      canvasMode.enterMultiSelectionMode(selectedNodes.map(n => n.id));
    } else {
      canvasMode.exitToDefaultMode();
    }
  }, [canvasMode, selectedNodes]);

  return (
    <EditorPanelAdapter
      blockId={blockId}
      blockMountId={blockMountId}
      isOpen={isOpen}
      onClose={handleClose}
      businessLogic={businessLogic}
    />
  );
}
