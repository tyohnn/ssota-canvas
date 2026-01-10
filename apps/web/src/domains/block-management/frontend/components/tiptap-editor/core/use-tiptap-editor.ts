/**
 * TipTap Editor Hook
 *
 * 공통 TipTap Editor 로직
 * - Editor 초기화
 * - Content 변경 감지 및 debounce
 * - 초기 마운트 처리
 * - 외부 content 동기화
 * - Blur 이벤트 처리
 * - Cleanup 로직
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';

import Placeholder from '@tiptap/extension-placeholder';
import { useEditor } from '@tiptap/react';

import {
  EMPTY_TIPTAP_DOC,
  MARKDOWN_EXTENSIONS,
} from '@/domains/block-management/shared/utils/tiptap-markdown.utils';

import type {
  TipTapEditorOptions,
  TipTapEditorState,
  UseTipTapEditorReturn,
} from './types';

/**
 * TipTap Editor Hook
 *
 * 공통 TipTap Editor 로직을 제공하는 훅
 */
export function useTipTapEditor(
  options: TipTapEditorOptions
): UseTipTapEditorReturn {
  const {
    blockData,
    placeholder = '클릭해서 내용을 추가하세요.',
    editable = true,
    onContentChange,
    onSave,
  } = options;

  // State Refs
  const previousContentRef = useRef<string>('');
  const editorReadyRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isComposingRef = useRef(false); // 한글 입력 조합 중 플래그
  const onSaveRef = useRef(onSave); // onSave ref 저장
  const onContentChangeRef = useRef(onContentChange); // onContentChange ref 저장

  // onSave가 변경되면 ref 업데이트
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // onContentChange가 변경되면 ref 업데이트
  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  // TipTap Editor 초기화
  const editor = useEditor({
    extensions: [
      ...MARKDOWN_EXTENSIONS,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: (blockData as any).content || EMPTY_TIPTAP_DOC,
    editable,
    immediatelyRender: false, // SSR hydration mismatch 방지
    onUpdate: ({ editor }) => {
      // 초기 마운트 시에는 저장하지 않음
      if (isInitialMountRef.current || !editorReadyRef.current) {
        return;
      }

      // 한글 입력 조합 중에는 저장하지 않음
      if (isComposingRef.current) {
        return;
      }

      // 실제 콘텐츠 변경 확인 (클릭/드래그만으로는 저장하지 않음)
      const currentContent = JSON.stringify(editor.getJSON());

      if (currentContent === previousContentRef.current) {
        return; // 콘텐츠 변경 없음 → 저장 안 함
      }

      // 콘텐츠가 실제로 변경됨
      previousContentRef.current = currentContent;

      const content = editor.getJSON();

      // Optimistic Update (onContentChange 콜백)
      // Note: 조합 중이 아니므로 안전하게 호출 가능
      const currentOnContentChange = onContentChangeRef.current;
      if (currentOnContentChange) {
        currentOnContentChange(content);
      }

      // Debounce: 500ms 후에 서버에 저장
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (onSave) {
        debounceTimerRef.current = setTimeout(() => {
          // Markdown 텍스트 추출 (AI context용)
          let contentRaw: string | undefined;
          try {
            // @ts-ignore - getMarkdown()은 Markdown 확장에서 추가됨
            contentRaw = editor.getMarkdown() as string;
          } catch (error) {
            console.warn('[TipTapEditor] Failed to extract markdown:', error);
          }
          onSave(content, contentRaw);
        }, 500);
      }
    },
  });

  // 초기 마운트 완료 후 플래그 해제 (지연 적용)
  useEffect(() => {
    if (editor) {
      // 초기 콘텐츠를 previousContentRef에 설정
      const initialContent = (blockData as any).content || EMPTY_TIPTAP_DOC;
      previousContentRef.current = JSON.stringify(initialContent);

      // 에디터가 준비되고 초기 content가 설정된 후에만 준비 완료로 표시
      // setTimeout으로 다음 tick까지 대기하여 초기 렌더링 완료 보장
      const timer = setTimeout(() => {
        editorReadyRef.current = true;
        isInitialMountRef.current = false;
      }, 100); // 100ms 지연으로 초기 렌더링 완료 대기

      return () => clearTimeout(timer);
    }
  }, [editor, blockData]);

  // editable prop 변경 시 에디터 상태 업데이트
  useEffect(() => {
    if (editor && editorReadyRef.current) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // 에디터 클릭 핸들러
  const handleEditorClick = useCallback(() => {
    if (editor && !editor.isFocused) {
      editor.commands.focus();
    }
  }, [editor]);

  // 에디터 블러 핸들러: 포커스 상실 시 즉시 저장
  const handleEditorBlur = useCallback(() => {
    if (!editor || !editorReadyRef.current || !onSave) {
      return;
    }

    // 한글 입력 조합 중에는 blur 시에도 저장하지 않음
    // (조합 완료 후 compositionend에서 저장됨)
    if (isComposingRef.current) {
      return;
    }

    // Debounce timer 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // 변경사항이 있으면 즉시 저장
    const currentContent = editor.getJSON();
    const currentContentStr = JSON.stringify(currentContent);
    const previousContentStr = previousContentRef.current;

    if (currentContentStr !== previousContentStr) {
      // Markdown 텍스트 추출
      let contentRaw: string | undefined;
      try {
        // @ts-ignore - getMarkdown()은 Markdown 확장에서 추가됨
        contentRaw = editor.getMarkdown() as string;
      } catch (error) {
        console.warn('[TipTapEditor] Failed to extract markdown:', error);
      }
      onSave(currentContent, contentRaw);
    }
  }, [editor]);
  // Note: onSave를 의존성에서 제거하여 매 렌더마다 핸들러 재생성 방지

  // 한글 입력 조합(composition) 이벤트 리스너
  useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom;

    const handleCompositionStart = () => {
      isComposingRef.current = true;
    };

    const handleCompositionEnd = () => {
      isComposingRef.current = false;

      if (!editorReadyRef.current) {
        return;
      }

      const currentContent = editor.getJSON();
      const currentContentStr = JSON.stringify(currentContent);
      const previousContentStr = previousContentRef.current;

      // 콘텐츠가 변경되었는지 확인
      if (currentContentStr !== previousContentStr) {
        previousContentRef.current = currentContentStr;

        // 조합 완료 후 즉시 Optimistic Update (onContentChange 콜백)
        const currentOnContentChange = onContentChangeRef.current;
        if (currentOnContentChange) {
          currentOnContentChange(currentContent);
        }

        // 조합 완료 후 즉시 저장 트리거 (debounce 없이)
        const currentOnSave = onSaveRef.current;
        if (currentOnSave) {
          // Markdown 텍스트 추출
          let contentRaw: string | undefined;
          try {
            // @ts-ignore
            contentRaw = editor.getMarkdown() as string;
          } catch (error) {
            console.warn('[TipTapEditor] Failed to extract markdown:', error);
          }

          currentOnSave(currentContent, contentRaw);
        }
      }
    };

    editorElement.addEventListener('compositionstart', handleCompositionStart);
    editorElement.addEventListener('compositionend', handleCompositionEnd);

    return () => {
      editorElement.removeEventListener(
        'compositionstart',
        handleCompositionStart
      );
      editorElement.removeEventListener('compositionend', handleCompositionEnd);
    };
  }, [editor]);
  // Note: onSave 제거 - onSaveRef.current로 참조

  // 에디터 블러 이벤트 리스너 등록
  useEffect(() => {
    if (editor) {
      editor.on('blur', handleEditorBlur);
      return () => {
        editor.off('blur', handleEditorBlur);
      };
    }
  }, [editor, handleEditorBlur]);

  // Cleanup: debounce timer 및 pending 변경사항 저장
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // Unmount 시 pending 변경사항 저장
      if (editor && editorReadyRef.current && onSave) {
        const currentContent = editor.getJSON();
        const currentContentStr = JSON.stringify(currentContent);
        const previousContentStr = previousContentRef.current;

        if (currentContentStr !== previousContentStr) {
          // Markdown 텍스트 추출
          let contentRaw: string | undefined;
          try {
            // @ts-ignore - getMarkdown()은 Markdown 확장에서 추가됨
            contentRaw = editor.getMarkdown() as string;
          } catch (error) {
            console.warn('[TipTapEditor] Failed to extract markdown:', error);
          }
          // 동기적으로 저장 (unmount 중이므로)
          if (onSave) {
            Promise.resolve(onSave(currentContent, contentRaw)).catch(
              (error: unknown) => {
                console.error(
                  '[TipTapEditor] Failed to save on unmount:',
                  error
                );
              }
            );
          }
        }
      }
    };
  }, [editor]);
  // Note: onSave를 의존성에서 제거하여 매 렌더마다 cleanup 실행 방지

  // 외부 content 변경 시 에디터 동기화 (블록에서 수정 시)
  // CRITICAL: 편집 중인 에디터(editable: true)는 외부 동기화를 건너뜀
  // 읽기 모드(editable: false)만 외부 변경사항을 반영
  useEffect(() => {
    // 에디터가 준비되지 않았거나 외부 변경이 없으면 무시
    if (!editor || !editorReadyRef.current || !(blockData as any).content) {
      return;
    }

    // 편집 중인 에디터는 외부 동기화 건너뛰기 (무한 루프 방지)
    // 편집 중에는 사용자가 직접 입력 중이므로 외부 변경사항을 반영하면 안 됨
    if (editable) {
      return;
    }

    const currentContent = editor.getJSON();
    const newContent = (blockData as any).content;

    // 내용이 다를 때만 업데이트 (무한 루프 방지)
    const currentStr = JSON.stringify(currentContent);
    const newStr = JSON.stringify(newContent);

    if (currentStr !== newStr) {
      // 외부 변경 동기화 중에는 onUpdate 트리거 방지
      editorReadyRef.current = false;

      // previousContentRef도 업데이트 (외부 변경 반영)
      previousContentRef.current = newStr;

      editor.commands.setContent(newContent, { emitUpdate: false });
      // 다음 tick에 다시 활성화
      setTimeout(() => {
        editorReadyRef.current = true;
      }, 50);
    }
  }, [(blockData as any).content, editor, editable]);

  const state: TipTapEditorState = {
    previousContentRef,
    editorReadyRef,
    isInitialMountRef,
    debounceTimerRef,
    isComposingRef,
  };

  return {
    editor,
    state,
    handleEditorClick,
  };
}
