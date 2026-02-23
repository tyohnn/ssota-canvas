/**
 * Note View Hook
 *
 * UI 훅과 공통 블록 노트 Tiptap 훅(useBlockNoteTiptap)을 오케스트레이션
 */

'use client';

import { useEffect, useRef } from 'react';

import { useReactFlow } from '@xyflow/react';

import { useBlockContentChangeContext } from '@/domains/block-management/frontend/contexts/block-content-change-context';
import { useBlockNoteTiptap } from '@/domains/block-management/frontend/hooks/block-property/use-block-note-tiptap';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import type { CanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';

import type { UseNoteViewOptions, UseNoteViewReturn } from './types';
import { useNoteViewUI } from './use-note-view.ui';

export interface UseNoteViewProps {
  data: BlockNodeData;
  selected?: boolean;
}

/**
 * Note View Hook
 *
 * UI 훅과 비즈니스 훅을 오케스트레이션하여 통합 로직 제공
 * 공통 TipTap 로직은 useTipTapEditor를 사용하고, 비즈니스 로직은 onSaveSteps로 전달
 */
export function useNoteView(
  props: UseNoteViewProps,
  options?: UseNoteViewOptions
): UseNoteViewReturn {
  const { data, selected = false } = props;

  // 1. 외부 의존성 수집
  const { getNode, updateNode } = useReactFlow();
  const canvasMetadata = useCanvasMetadata(
    options?.canvasMetadataOverride as CanvasMetadata | undefined
  );
  const canvasMode = useCanvasModeContext();
  const blockContentChange = useBlockContentChangeContext();

  const contentVersionRef = useRef<number>(data.contentVersion ?? 0);

  // 3. UI 상태 훅
  const uiState = useNoteViewUI(selected, {
    canvasMode: {
      setTextareaEditing: canvasMode.setTextareaEditing,
      mode: canvasMode.mode,
    },
  });

  // 4. 공통 블록 노트 Tiptap 훅 (저장·감사·버전 불일치 ref 갱신 포함)
  const isEditable =
    uiState.isEditing && canvasMode.mode?.type !== 'block-editing';
  const reactFlow = {
    getNode,
    updateNode: (nodeId: string, opts: { data: BlockNodeData }) => {
      updateNode(nodeId, opts);
    },
  };
  const { editor, state: editorState, mathEditing, setMathEditing } = useBlockNoteTiptap({
    blockData: data,
    reactFlow,
    editable: isEditable,
    placeholder: 'Click to add note...',
    contentVersionRef,
    onContentChangeSideEffect: blockContentChange?.onContentChange,
  });

  // 5. 하위 호환: business는 공통 훅으로 이전됨, 스텁만 반환
  const business = options?.businessLogic ?? {
    saveStepsToServer: async () => {},
  };

  // 6. uiState에 editorState의 ref들 병합
  const fullUIState = {
    ...uiState,
    ...editorState,
  };

  // 7. 선택 시 편집 모드 진입 (더블클릭 모드가 활성화된 경우에만)
  useEffect(() => {
    if (canvasMode.mode?.type === 'block-editing') {
      return;
    }

    if (selected && uiState.isDoubleClickMode && editor) {
      uiState.handleEnterEditing();
      editor.commands.focus();
    }
  }, [
    selected,
    uiState.isDoubleClickMode,
    uiState.handleEnterEditing,
    editor,
    canvasMode.mode?.type,
  ]);

  // 8. 선택 해제 시 편집 종료 및 더블클릭 모드 리셋
  useEffect(() => {
    if (uiState.isEditing && !selected) {
      uiState.handleExitEditing();
    }

    if (!selected) {
      uiState.setIsDoubleClickMode(false);
    }
  }, [uiState.isEditing, selected]);

  return {
    editor,
    uiState: fullUIState,
    business,
    mathEditing,
    setMathEditing,
  };
}
