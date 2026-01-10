/**
 * Note View Hook
 *
 * 메인 훅: 의존성 주입 및 UI/비즈니스 훅 오케스트레이션
 */

'use client';

import { useCallback, useEffect } from 'react';

import Placeholder from '@tiptap/extension-placeholder';
import type { Editor } from '@tiptap/react';
import { useEditor } from '@tiptap/react';
import { useReactFlow } from '@xyflow/react';

import { useUpdateBlockContent } from '@/domains/block-management/frontend/hooks/block-property/use-block-content-update';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  EMPTY_TIPTAP_DOC,
  MARKDOWN_EXTENSIONS,
} from '@/domains/block-management/shared/utils/tiptap-markdown.utils';
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
 */
export function useNoteView(
  props: UseNoteViewProps,
  options?: UseNoteViewOptions
): UseNoteViewReturn {
  const { data, selected = false } = props;

  // 1. Gather External Dependencies
  const { getNode, updateNode } = useReactFlow();
  const canvasMetadata = useCanvasMetadata(
    options?.canvasMetadataOverride as CanvasMetadata | undefined
  );
  const canvasMode = useCanvasModeContext();

  // 2. Bundle Dependencies into semantic objects
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

  // 3. UI State Hook (Designer area)
  const uiState = useNoteViewUI(selected, {
    canvasMode: {
      setTextareaEditing: canvasMode.setTextareaEditing,
    },
  });

  // 4. Block content update hook (의존성 조합)
  const { updateBlockContent } = useUpdateBlockContent({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: BlockNodeData }) => {
        updateNode(nodeId, options);
      },
    },
  });

  // 5. TipTap Editor 초기화 (메인 훅에서 관리)
  const editor = useEditor({
    extensions: [
      ...MARKDOWN_EXTENSIONS, // StarterKit + Markdown 확장
      Placeholder.configure({
        placeholder: 'Click to add markdown content...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    // Tiptap JSON을 직접 content로 설정
    content: data.content || EMPTY_TIPTAP_DOC,
    editable: uiState.isEditing,
    immediatelyRender: false, // SSR hydration mismatch 방지
  });

  // 6. Business Logic Hook (Engineer area) - editor 포함
  const defaultBusiness = useNoteViewBusiness({
    data,
    dependencies: domainDependencies,
    updateBlockContent,
  });
  const business = options?.businessLogic ?? defaultBusiness;

  // 7. Editor에서 콘텐츠 추출 및 저장 함수 (재사용 가능)
  const extractAndSaveContent = useCallback((): void => {
    if (!editor) return;

    // Tiptap JSON 추출
    const tiptapJson = editor.getJSON();
    // Markdown 텍스트 추출 (AI context용)
    let contentRaw: string | undefined;
    try {
      // @ts-ignore - getMarkdown()은 Markdown 확장에서 추가됨
      contentRaw = editor.getMarkdown() as string;
    } catch (error) {
      console.warn('[NoteView] Failed to extract markdown:', error);
    }
    // 서버 저장
    business.saveContentToServer(tiptapJson, contentRaw);
  }, [editor, business.saveContentToServer]);

  // 8. onUpdate 핸들러 (비즈니스 로직으로 위임)
  const handleEditorUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      // 초기 마운트 시에는 저장하지 않음
      if (
        uiState.isInitialMountRef.current ||
        !uiState.editorReadyRef.current
      ) {
        return;
      }

      // 실제 콘텐츠 변경 확인 (클릭/드래그만으로는 저장하지 않음)
      const tiptapJson = editor.getJSON();
      const currentContent = JSON.stringify(tiptapJson);

      if (currentContent === uiState.previousContentRef.current) {
        return; // 콘텐츠 변경 없음 → 저장 안 함
      }

      // 콘텐츠가 실제로 변경됨
      uiState.previousContentRef.current = currentContent;

      // Debounce: 500ms 후에 서버에 저장
      if (uiState.debounceTimerRef.current) {
        clearTimeout(uiState.debounceTimerRef.current);
      }

      uiState.debounceTimerRef.current = setTimeout(() => {
        // Editor에서 콘텐츠 추출 및 저장
        extractAndSaveContent();
      }, 500);
    },
    [
      extractAndSaveContent,
      uiState.previousContentRef,
      uiState.debounceTimerRef,
    ]
    // ref들은 안정적인 참조이므로 의존성 배열에 포함하지 않아도 됨
  );

  // editor의 onUpdate 업데이트
  useEffect(() => {
    if (editor) {
      editor.on('update', handleEditorUpdate);
      return () => {
        editor.off('update', handleEditorUpdate);
      };
    }
  }, [editor, handleEditorUpdate]);

  // 9. 초기 마운트 완료 후 플래그 해제 (지연 적용)
  useEffect(() => {
    if (editor) {
      // 초기 콘텐츠를 previousContentRef에 설정
      if (data.content) {
        uiState.previousContentRef.current = JSON.stringify(data.content);
      }

      // 에디터가 준비되고 초기 content가 설정된 후에만 준비 완료로 표시
      // setTimeout으로 다음 tick까지 대기하여 초기 렌더링 완료 보장
      const timer = setTimeout(() => {
        uiState.editorReadyRef.current = true;
        uiState.isInitialMountRef.current = false;
      }, 100); // 100ms 지연으로 초기 렌더링 완료 대기

      return () => clearTimeout(timer);
    }
  }, [editor, data.content, uiState]);

  // 10. Cleanup: debounce timer
  useEffect(() => {
    return () => {
      if (uiState.debounceTimerRef.current) {
        clearTimeout(uiState.debounceTimerRef.current);
      }
    };
  }, [uiState.debounceTimerRef]);

  // 11. 외부 데이터가 바뀌었을 때, 편집 중이 아니면 에디터 동기화
  // (에디터 패널에서 수정 시 블록에 반영)
  useEffect(() => {
    // 에디터가 준비되지 않았거나 편집 중이면 무시
    if (
      !editor ||
      !uiState.editorReadyRef.current ||
      uiState.isEditing ||
      !data.content
    ) {
      return;
    }

    // 현재 에디터 내용을 JSON으로 가져오기
    const currentJson = JSON.stringify(editor.getJSON());
    const newJson = JSON.stringify(data.content);

    // 내용이 다를 때만 업데이트 (무한 루프 방지)
    if (currentJson !== newJson) {
      // 외부 변경 동기화 중에는 onUpdate 트리거 방지
      uiState.editorReadyRef.current = false;

      // previousContentRef도 업데이트 (외부 변경 반영)
      uiState.previousContentRef.current = newJson;

      // Tiptap JSON을 직접 setContent로 설정
      editor.commands.setContent(data.content, {
        emitUpdate: false,
      });
      // 다음 tick에 다시 활성화
      setTimeout(() => {
        uiState.editorReadyRef.current = true;
      }, 50);
    }
  }, [data.content, editor, uiState.isEditing, uiState]);

  // 12. 편집 모드 변경 시 에디터 상태 업데이트
  useEffect(() => {
    if (editor) {
      editor.setEditable(uiState.isEditing);
    }
  }, [uiState.isEditing, editor]);

  // 13. 선택 시 편집 모드 진입 (더블클릭 모드가 활성화된 경우에만)
  useEffect(() => {
    if (selected && uiState.isDoubleClickMode && editor) {
      uiState.handleEnterEditing();

      // 포커스
      editor.commands.focus();
    }
  }, [selected, uiState.isDoubleClickMode, uiState.handleEnterEditing, editor]);

  // 선택이 해제되면 편집 종료 및 더블클릭 모드 리셋
  useEffect(() => {
    if (uiState.isEditing && !selected) {
      uiState.handleExitEditing();
      extractAndSaveContent();
    }
    if (!selected) {
      uiState.setIsDoubleClickMode(false);
    }
  }, [
    uiState.isEditing,
    uiState.handleExitEditing,
    uiState.setIsDoubleClickMode,
    selected,
    extractAndSaveContent,
  ]);

  return {
    editor,
    uiState,
    business,
  };
}
