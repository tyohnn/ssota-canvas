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
import type { Editor } from '@tiptap/react';
import { useEditor } from '@tiptap/react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { SlashCommandExtension } from '@/domains/block-management/frontend/components/tiptap-editor/extensions/slash-command.extension';
import {
  EMPTY_TIPTAP_DOC,
  extractPlainText,
  MARKDOWN_EXTENSIONS,
} from '@/domains/block-management/shared/utils/tiptap-markdown.utils';
import type { JSONContent } from '@tiptap/core';
import DiffMatchPatch from 'diff-match-patch';

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
    onSaveSteps,
    onBlurAudit,
    initialVersion,
    contentVersionRef: contentVersionRefProp,
    onVersionMismatchRef,
  } = options;

  // State Refs
  const previousContentRef = useRef<string>('');
  const editorReadyRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blurFlushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isComposingRef = useRef(false); // 한글 입력 조합 중 플래그 (optimistic: onUpdate 스킵용)
  const onContentChangeRef = useRef(onContentChange);
  const onSaveStepsRef = useRef(onSaveSteps);
  const stepsBufferRef = useRef<unknown[]>([]);
  const blockContentVersion = (blockData as BlockNodeData).contentVersion;
  const initialVersionValue: number =
    initialVersion ?? (typeof blockContentVersion === 'number' ? blockContentVersion : 0);
  const internalContentVersionRef = useRef<number>(initialVersionValue);
  const contentVersionRef =
    contentVersionRefProp ?? internalContentVersionRef;
  const editorRef = useRef<Editor | null>(null);
  const lastSyncedContentRef = useRef<object>(
    (blockData.content as object) ?? EMPTY_TIPTAP_DOC
  );
  /** 이전 flush가 끝날 때까지 대기해 직렬화 (한글 IME 다중 compositionend 시 baseVersion 갱신 보장) */
  const flushInFlightRef = useRef<Promise<void> | null>(null);
  /** Focus 시점 contentRaw (blur 시 patch 생성용). */
  const contentRawAtFocusRef = useRef<string | null>(null);
  const onBlurAuditRef = useRef(onBlurAudit);

  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  useEffect(() => {
    onSaveStepsRef.current = onSaveSteps;
  }, [onSaveSteps]);

  useEffect(() => {
    onBlurAuditRef.current = onBlurAudit;
  }, [onBlurAudit]);

  // 서버/부모에서 내려준 content_version 동기화
  useEffect(() => {
    const v =
      initialVersion ??
      (typeof (blockData as BlockNodeData).contentVersion === 'number'
        ? (blockData as BlockNodeData).contentVersion
        : undefined);
    if (typeof v === 'number') {
      contentVersionRef.current = v;
    }
  }, [initialVersion, (blockData as BlockNodeData).contentVersion, contentVersionRef]);

  // 저장 플러시: steps가 있을 때만 onSaveSteps 호출. 이전 flush 완료 후 실행해 직렬화 (contentVersionRef 갱신 보장).
  const flushPendingSave = useCallback(async (): Promise<void> => {
    const ed = editorRef.current;
    const steps = stepsBufferRef.current;
    if (!ed || !onSaveStepsRef.current) {
      return;
    }
    if (steps.length === 0) {
      return;
    }

    await flushInFlightRef.current;

    const baseVersion = contentVersionRef.current ?? 0;
    const stepsCopy = [...steps];
    stepsBufferRef.current = [];
    lastSyncedContentRef.current = ed.getJSON() as object;
    const savePromise = Promise.resolve(onSaveStepsRef.current(stepsCopy, baseVersion));
    flushInFlightRef.current = savePromise;
    try {
      await savePromise;
    } finally {
      if (flushInFlightRef.current === savePromise) {
        flushInFlightRef.current = null;
      }
    }
  }, []);

  // TipTap Editor 초기화
  const editor = useEditor({
    extensions: [
      ...MARKDOWN_EXTENSIONS,
      SlashCommandExtension,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: blockData.content ?? EMPTY_TIPTAP_DOC,
    editable,
    immediatelyRender: false, // SSR hydration mismatch 방지
    onTransaction: ({ transaction }) => {
      if (!transaction.docChanged) return;
      if (isInitialMountRef.current || !editorReadyRef.current) return;
      // composition 여부와 관계없이 step 항상 수집

      const steps = transaction.steps.map(step => step.toJSON());
      stepsBufferRef.current.push(...steps);
    },
    onUpdate: ({ editor: ed }) => {
      if (isInitialMountRef.current || !editorReadyRef.current) return;
      if (isComposingRef.current) return;

      const currentContent = JSON.stringify(ed.getJSON());
      if (currentContent === previousContentRef.current) return;

      previousContentRef.current = currentContent;
      const content = ed.getJSON();

      const currentOnContentChange = onContentChangeRef.current;
      if (currentOnContentChange) {
        currentOnContentChange(content);
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (onSaveSteps) {
        debounceTimerRef.current = setTimeout(() => {
          void flushRef.current();
        }, 500);
      }
    },
  });

  const flushRef = useRef(flushPendingSave);
  flushRef.current = flushPendingSave;

  /** Run flush + blur audit (same as 100ms timeout). Used on blur timeout and on unmount when timer was pending. */
  const runPendingBlurFlushAndAudit = useCallback(() => {
    if (onSaveStepsRef.current && stepsBufferRef.current.length > 0) {
      void flushRef.current();
    }
    const beforeRaw = contentRawAtFocusRef.current;
    const blockId = (blockData as BlockNodeData).blockId;
    if (beforeRaw !== null && onBlurAuditRef.current && blockId) {
      contentRawAtFocusRef.current = null;
      const afterRaw = extractPlainText(
        editorRef.current?.getJSON() as JSONContent
      );
      const dmp = new DiffMatchPatch();
      const patches = dmp.patch_make(beforeRaw, afterRaw);
      if (patches.length > 0) {
        let patchStr = dmp.patch_toText(patches);
        try {
          patchStr = decodeURIComponent(patchStr);
        } catch {
          // keep original if decode fails
        }
        void Promise.resolve(
          onBlurAuditRef.current({ blockId, patch: patchStr })
        ).catch(() => {});
      }
    }
  }, [blockData]);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Version mismatch 시 서버 content/version으로 에디터 동기화
  useEffect(() => {
    if (!onVersionMismatchRef) return;
    onVersionMismatchRef.current = (content, version) => {
      const ed = editorRef.current;
      if (ed) {
        ed.commands.setContent(content as any, { emitUpdate: false });
      }
      contentVersionRef.current = version;
      stepsBufferRef.current = [];
      lastSyncedContentRef.current = (content as object) ?? EMPTY_TIPTAP_DOC;
      previousContentRef.current = JSON.stringify(content);
    };
    return () => {
      onVersionMismatchRef.current = null;
    };
  }, [editor, onVersionMismatchRef, contentVersionRef]);

  // 초기 마운트 완료 후 플래그 해제 및 비교 기준 설정 (지연 적용)
  useEffect(() => {
    if (editor) {
      // 에디터가 준비되고 초기 content가 설정된 후에만 준비 완료로 표시
      // previousContentRef는 editor.getJSON()으로 설정해 TipTap 정규화 결과와 비교 기준을 맞춤 (수정 없을 때 flush 방지)
      const timer = setTimeout(() => {
        editorReadyRef.current = true;
        isInitialMountRef.current = false;
        previousContentRef.current = JSON.stringify(editor.getJSON());
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

  // 에디터 블러 핸들러: step 있으면 flush; blur 시 contentRaw diff → patch → onBlurAudit (감사 로그만, 저장과 분리).
  const handleEditorBlur = useCallback(() => {
    if (!editor || !editorReadyRef.current) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const currentContentStr = JSON.stringify(editor.getJSON());
    if (currentContentStr !== previousContentRef.current) {
      previousContentRef.current = currentContentStr;
    }
    // Debounce blur so multiple blur events result in one save + one audit
    if (blurFlushTimerRef.current) {
      clearTimeout(blurFlushTimerRef.current);
    }
    blurFlushTimerRef.current = setTimeout(() => {
      blurFlushTimerRef.current = null;
      runPendingBlurFlushAndAudit();
    }, 100);
  }, [editor, blockData, runPendingBlurFlushAndAudit]);

  // 한글 입력 조합(composition) 이벤트 리스너
  useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom;

    const handleCompositionStart = () => {
      isComposingRef.current = true;
    };

    const handleCompositionEnd = () => {
      isComposingRef.current = false;

      if (!editorReadyRef.current) return;

      // 브라우저가 마지막 조합 글자('요' 등)를 doc에 반영하기 전에 compositionend가 올 수 있음.
      // 한 틱 지연 후 읽어서 optimistic을 최종 content로 갱신함.
      const currentOnContentChange = onContentChangeRef.current;
      const runFlush = onSaveStepsRef.current;
      setTimeout(() => {
        if (!editorRef.current) return;
        const currentContent = editorRef.current.getJSON();
        const currentContentStr = JSON.stringify(currentContent);
        if (currentContentStr === previousContentRef.current) {
          if (runFlush) void flushRef.current();
          return;
        }
        previousContentRef.current = currentContentStr;
        if (currentOnContentChange) {
          currentOnContentChange(currentContent);
        }
        if (runFlush) {
          void flushRef.current();
        }
      }, 0);
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

  // Focus 시 contentRaw 저장 (blur 시 patch 생성용)
  useEffect(() => {
    if (!editor) return;
    const handleFocus = () => {
      contentRawAtFocusRef.current = extractPlainText(
        editor.getJSON() as JSONContent
      );
    };
    editor.on('focus', handleFocus);
    return () => {
      editor.off('focus', handleFocus);
    };
  }, [editor]);

  // 에디터 블러 이벤트 리스너 등록
  useEffect(() => {
    if (editor) {
      editor.on('blur', handleEditorBlur);
      return () => {
        editor.off('blur', handleEditorBlur);
      };
    }
  }, [editor, handleEditorBlur]);

  // Cleanup: 타이머 정리. blur 100ms 타이머가 아직 대기 중이면 unmount 시 동기적으로 flush + 감사 실행 (패널 닫기/ESC 시 로그 누락 방지)
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (blurFlushTimerRef.current) {
        clearTimeout(blurFlushTimerRef.current);
        blurFlushTimerRef.current = null;
        runPendingBlurFlushAndAudit();
      }
    };
  }, [editor, runPendingBlurFlushAndAudit]);

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
      lastSyncedContentRef.current = newContent as object;

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
    stepsBufferRef,
    contentVersionRef,
  };

  return {
    editor,
    state,
    handleEditorClick,
  };
}
