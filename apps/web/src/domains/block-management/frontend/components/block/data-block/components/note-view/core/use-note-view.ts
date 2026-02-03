/**
 * Note View Hook
 *
 * UI 훅과 비즈니스 훅을 오케스트레이션하여 통합 로직 제공
 * 공통 TipTap 로직은 useTipTapEditor를 사용하고, 비즈니스 로직은 onSave로 전달
 */

'use client';

import { useEffect } from 'react';

import { useReactFlow } from '@xyflow/react';

import { useBlockContentChangeContext } from '@/domains/block-management/frontend/contexts/block-content-change-context';
import { useTipTapEditor } from '@/domains/block-management/frontend/components/tiptap-editor/core/use-tiptap-editor';
import { useUpdateBlockContent } from '@/domains/block-management/frontend/hooks/block-property/use-block-content-update';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import type { CanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks';

import type {
  DomainDependencies,
  UseNoteViewOptions,
  UseNoteViewReturn,
} from './types';
import { useNoteViewBusiness } from './use-note-view.business';
import { useNoteViewUI } from './use-note-view.ui';

export interface UseNoteViewProps {
  data: BlockNodeData;
  selected?: boolean;
}

/**
 * Note View Hook
 *
 * UI 훅과 비즈니스 훅을 오케스트레이션하여 통합 로직 제공
 * 공통 TipTap 로직은 useTipTapEditor를 사용하고, 비즈니스 로직은 onSave로 전달
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

  // 2. 의존성을 의미 있는 객체로 번들링
  const domainDependencies: DomainDependencies = {
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: BlockNodeData }) => {
        updateNode(nodeId, options);
      },
    },
    canvasMetadata: {
      pageId: canvasMetadata.pageId,
    },
    canvasMode: {
      setTextareaEditing: canvasMode.setTextareaEditing,
    },
  };

  // 3. UI 상태 훅
  const uiState = useNoteViewUI(selected, {
    canvasMode: {
      setTextareaEditing: canvasMode.setTextareaEditing,
      mode: canvasMode.mode,
    },
  });

  // 4. 블록 콘텐츠 업데이트 훅
  const { updateBlockContent } = useUpdateBlockContent({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: BlockNodeData }) => {
        updateNode(nodeId, options);
      },
    },
  });

  // 5. 비즈니스 로직 훅 (onSave에서 사용하기 위해 먼저 정의)
  const defaultBusiness = useNoteViewBusiness({
    data,
    dependencies: domainDependencies,
    updateBlockContent,
  });
  const business = options?.businessLogic ?? defaultBusiness;

  // 6. 공통 TipTap Editor 훅
  const isEditable =
    uiState.isEditing && canvasMode.mode?.type !== 'block-editing';
  const { editor, state: editorState } = useTipTapEditor({
    blockData: data,
    placeholder: 'Click to add note...',
    editable: isEditable,
    onContentChange: content => {
      const updatedData = { ...data, content };
      updateNode(data.blockMountId, { data: updatedData });
      blockContentChange?.onContentChange?.();
    },
    onSave: (content, contentRaw) => {
      business.saveContentToServer(content, contentRaw);
    },
  });

  // 7. uiState에 editorState의 ref들 병합
  const fullUIState = {
    ...uiState,
    ...editorState,
  };

  // 8. 선택 시 편집 모드 진입 (더블클릭 모드가 활성화된 경우에만)
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

  // 9. 선택 해제 시 편집 종료 및 더블클릭 모드 리셋
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
  };
}
