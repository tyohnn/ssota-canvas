'use client';

import { useCallback, useMemo, useState } from 'react';

import { BlockType } from '@/domains/block-management/shared/types/block-types';

import type { CanvasMode } from './canvas-mode-context';
import type { CanvasModeContextValue } from './canvas-mode-context';

/**
 * Canvas Mode Control Hook
 *
 * Canvas의 모드 상태를 관리하는 hook
 * - 모드 전환 (panning, block-creation, selection, editing, dragging, edge-creation)
 * - Textarea 편집 상태 관리
 * - 모드 확인 헬퍼 함수들
 */
export function useCanvasMode(): CanvasModeContextValue {
  const [mode, setMode] = useState<CanvasMode>({ type: 'default' });
  const [isTextareaEditing, setIsTextareaEditing] = useState(false);

  // 모드 전환
  const enterPanningMode = useCallback(() => {
    setMode({ type: 'panning' });
  }, []);

  const enterBlockCreationMode = useCallback((blockType: BlockType) => {
    setMode({ type: 'block-creation', blockType });
  }, []);

  const enterSingleSelectionMode = useCallback((blockId: string) => {
    setMode({ type: 'single-selection', blockId });
  }, []);

  const enterMultiSelectionMode = useCallback((blockIds: string[]) => {
    setMode({ type: 'multi-selection', blockIds });
  }, []);

  const enterBlockEditingMode = useCallback((blockId: string) => {
    // 이미 같은 blockId로 편집 모드인 경우 업데이트하지 않음 (무한 루프 방지)
    setMode(prevMode => {
      if (prevMode.type === 'block-editing' && prevMode.blockId === blockId) {
        return prevMode; // 상태 변경 없음
      }
      return { type: 'block-editing', blockId };
    });
  }, []);

  const enterDraggingMode = useCallback((blockIds: string[]) => {
    setMode({ type: 'dragging', blockIds });
  }, []);

  const enterEdgeCreationMode = useCallback((sourceBlockId: string) => {
    setMode({ type: 'edge-creation', sourceBlockId });
  }, []);

  const exitToDefaultMode = useCallback(() => {
    setMode({ type: 'default' });
  }, []);

  // Textarea 편집 상태 관리
  const setTextareaEditing = useCallback((editing: boolean) => {
    setIsTextareaEditing(editing);
  }, []);

  // 상태 읽기 헬퍼
  const getCurrentMode = useCallback(() => mode, [mode]);

  const isPanningMode = useCallback(() => mode.type === 'panning', [mode.type]);
  const isBlockCreationMode = useCallback(
    () => mode.type === 'block-creation',
    [mode.type]
  );
  const isSingleSelectionMode = useCallback(
    () => mode.type === 'single-selection',
    [mode.type]
  );
  const isMultiSelectionMode = useCallback(
    () => mode.type === 'multi-selection',
    [mode.type]
  );
  const isBlockEditingMode = useCallback(
    () => mode.type === 'block-editing',
    [mode.type]
  );
  const isDraggingMode = useCallback(
    () => mode.type === 'dragging',
    [mode.type]
  );
  const isEdgeCreationMode = useCallback(
    () => mode.type === 'edge-creation',
    [mode.type]
  );

  const value: CanvasModeContextValue = useMemo(
    () => ({
      mode,
      isTextareaEditing,
      enterPanningMode,
      enterBlockCreationMode,
      enterSingleSelectionMode,
      enterMultiSelectionMode,
      enterBlockEditingMode,
      enterDraggingMode,
      enterEdgeCreationMode,
      exitToDefaultMode,
      setTextareaEditing,
      getCurrentMode,
      isPanningMode,
      isBlockCreationMode,
      isSingleSelectionMode,
      isMultiSelectionMode,
      isBlockEditingMode,
      isDraggingMode,
      isEdgeCreationMode,
    }),
    [
      mode,
      isTextareaEditing,
      enterPanningMode,
      enterBlockCreationMode,
      enterSingleSelectionMode,
      enterMultiSelectionMode,
      enterBlockEditingMode,
      enterDraggingMode,
      enterEdgeCreationMode,
      exitToDefaultMode,
      setTextareaEditing,
      getCurrentMode,
      isPanningMode,
      isBlockCreationMode,
      isSingleSelectionMode,
      isMultiSelectionMode,
      isBlockEditingMode,
      isDraggingMode,
      isEdgeCreationMode,
    ]
  );

  return value;
}
