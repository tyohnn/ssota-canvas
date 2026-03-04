'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { BlockType } from '@/domains/block-management/shared/types/block-types';

import type {
  CanvasMode,
  EnterBlockEditingOptions,
} from './canvas-mode-context';
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
  const spaceKeyHeldRef = useRef(false);

  // 모드 전환
  const enterPanningMode = useCallback(() => {
    setMode({ type: 'panning' });
  }, []);

  const enterBlockCreationMode = useCallback((blockType: BlockType) => {
    setMode({ type: 'block-creation', blockType });
  }, []);

  const enterSingleSelectionMode = useCallback((blockMountId: string) => {
    setMode({ type: 'single-selection', blockMountId });
  }, []);

  const enterMultiSelectionMode = useCallback((blockMountIds: string[]) => {
    setMode({ type: 'multi-selection', blockMountIds });
  }, []);

  const enterBlockEditingMode = useCallback(
    (
      blockId: string,
      blockMountId: string,
      options?: EnterBlockEditingOptions
    ) => {
      // 이미 같은 blockId와 blockMountId로 편집 모드인 경우
      // options가 없으면 업데이트하지 않음 (무한 루프 방지)
      // options가 있으면 업데이트 (탭 전환 등)
      setMode(prevMode => {
        if (
          prevMode.type === 'block-editing' &&
          prevMode.blockId === blockId &&
          prevMode.blockMountId === blockMountId &&
          !options
        ) {
          return prevMode; // 상태 변경 없음
        }
        return {
          type: 'block-editing',
          blockId,
          blockMountId,
          initialTab: options
            ? {
              tab: options.tab || '',
              tabOptions: options.tabOptions,
            }
            : undefined,
        };
      });
    },
    []
  );

  const enterDraggingMode = useCallback((blockMountIds: string[]) => {
    setMode({ type: 'dragging', blockMountIds });
  }, []);

  const enterEdgeCreationMode = useCallback((sourceBlockId: string) => {
    setMode({ type: 'edge-creation', sourceBlockId });
  }, []);

  const exitToDefaultMode = useCallback(() => {
    setMode({ type: 'default' });
  }, []);

  /**
   * block-editing 모드일 때 initialTab.tabOptions를 병합 업데이트
   * 
   * @param partial - 병합할 tabOptions 객체
   * @param opts - blockId/blockMountId 필터 옵션 (주어지면 해당 블록일 때만 적용)
   */
  const updateBlockEditingTabOptions = useCallback(
    (
      partial: Record<string, unknown>,
      opts?: { blockId?: string; blockMountId?: string }
    ) => {
      setMode((prevMode) => {
        // block-editing 모드가 아니면 아무것도 하지 않음
        if (prevMode.type !== 'block-editing') {
          return prevMode;
        }

        // opts가 주어진 경우, blockId/blockMountId가 일치하는지 확인
        if (opts) {
          if (opts.blockId && prevMode.blockId !== opts.blockId) {
            return prevMode;
          }
          if (opts.blockMountId && prevMode.blockMountId !== opts.blockMountId) {
            return prevMode;
          }
        }

        // initialTab이 없으면 생성
        if (!prevMode.initialTab) {
          return {
            ...prevMode,
            initialTab: {
              tab: '',
              tabOptions: partial,
            },
          };
        }

        // tabOptions 병합
        const nextTabOptions = { ...prevMode.initialTab.tabOptions, ...partial };
        return {
          ...prevMode,
          initialTab: {
            ...prevMode.initialTab,
            tabOptions: nextTabOptions,
          },
        };
      });
    },
    []
  );

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
      updateBlockEditingTabOptions,
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
      spaceKeyHeldRef,
    }),
    [
      mode,
      isTextareaEditing,
      enterPanningMode,
      enterBlockCreationMode,
      enterSingleSelectionMode,
      enterMultiSelectionMode,
      enterBlockEditingMode,
      updateBlockEditingTabOptions,
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
      spaceKeyHeldRef,
    ]
  );

  return value;
}
