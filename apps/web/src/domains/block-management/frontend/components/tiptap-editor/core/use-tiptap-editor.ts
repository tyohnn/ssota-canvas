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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Placeholder from '@tiptap/extension-placeholder';
import 'katex/dist/katex.min.css';
import Image from '@tiptap/extension-image';
// import DragHandle from '@tiptap/extension-drag-handle'; // node drag 비활성화 (동작 이슈)
import type { Editor } from '@tiptap/react';
import { useEditor } from '@tiptap/react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { SlashCommandExtension } from '@/domains/block-management/frontend/components/tiptap-editor/extensions/slash-command.extension';
import { SafeDropcursor } from '@/domains/block-management/frontend/components/tiptap-editor/extensions/safe-dropcursor.extension';
import { Admonition } from '@/domains/block-management/frontend/components/tiptap-editor/extensions/admonition.extension';
import {
  BASE_EXTENSIONS_WITHOUT_MATH,
  EMPTY_TIPTAP_DOC,
  extractPlainText,
} from '@/domains/block-management/shared/utils/tiptap-markdown.utils';
import {
  BackgroundColor,
  Color,
  TextStyle,
} from '@tiptap/extension-text-style';
import { Mathematics } from '@tiptap/extension-mathematics';
import { Markdown } from '@tiptap/markdown';
import type { JSONContent } from '@tiptap/core';
import DiffMatchPatch from 'diff-match-patch';

import type {
  MathEditingState,
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
    placeholderShowWhenReadOnly = false,
    editable = true,
    onContentChange,
    onSaveSteps,
    onBlurAudit,
    initialVersion,
    contentVersionRef: contentVersionRefProp,
    onVersionMismatchRef,
    uploadImage,
  } = options;

  const uploadImageRef = useRef(uploadImage);
  useEffect(() => {
    uploadImageRef.current = uploadImage;
  }, [uploadImage]);

  // const dragHandleElRef = useRef<HTMLElement | null>(null); // node drag 비활성화

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

  const [mathEditing, setMathEditing] = useState<MathEditingState | null>(null);
  const setMathEditingWrapped = useCallback((state: MathEditingState | null) => {
    setMathEditing(state);
  }, []);
  const setMathEditingRef = useRef(setMathEditingWrapped);
  setMathEditingRef.current = setMathEditingWrapped;

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

  const editorProps = useMemo(
    () => ({
      handleClickOn: () => false,
      handlePaste: (view: import('@tiptap/pm/view').EditorView, event: ClipboardEvent) => {
        const upload = uploadImageRef.current;
        if (!upload) return false;
        const files = event.clipboardData?.files;
        const file = files ? Array.from(files).find((f) => f.type.startsWith('image/')) : null;
        if (!file) return false;
        upload(file)
          .then((url) => {
            const { state } = view;
            const node = state.schema.nodes.image?.create({ src: url });
            if (node) {
              const tr = state.tr.replaceSelectionWith(node);
              view.dispatch(tr);
            }
          })
          .catch((err) => console.warn('[TipTap] Image upload failed:', err));
        return true;
      },
      handleDrop: (view: import('@tiptap/pm/view').EditorView, event: DragEvent) => {
        const upload = uploadImageRef.current;
        if (!upload) return false;
        const files = event.dataTransfer?.files;
        const file = files ? Array.from(files).find((f) => f.type.startsWith('image/')) : null;
        if (!file) return false;
        event.preventDefault();
        upload(file)
          .then((url) => {
            const { state } = view;
            const node = state.schema.nodes.image?.create({ src: url });
            if (node) {
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (pos) {
                const tr = state.tr.insert(pos.pos, node);
                view.dispatch(tr);
              }
            }
          })
          .catch((err) => console.warn('[TipTap] Image upload failed:', err));
        return true;
      },
    }),
    []
  );

  // TipTap Editor 초기화
  const editor = useEditor({
    onCreate: () => { },
    extensions: [
      ...BASE_EXTENSIONS_WITHOUT_MATH,
      Mathematics.configure({
        katexOptions: { throwOnError: false },
        blockOptions: {
          onClick: (node, pos) => {
            if (!editorRef.current?.isEditable) return;
            const latex = (node.attrs?.latex as string) ?? '';
            const cb = setMathEditingRef.current;
            if (cb) cb({ pos, latex, nodeType: 'blockMath' });
          },
        },
        inlineOptions: {
          onClick: (node, pos) => {
            if (!editorRef.current?.isEditable) return;
            const latex = (node.attrs?.latex as string) ?? '';
            const cb = setMathEditingRef.current;
            if (cb) cb({ pos, latex, nodeType: 'inlineMath' });
          },
        },
      }),
      Markdown.configure({
        markedOptions: {
          gfm: true,
          breaks: true,
          pedantic: false,
        },
      }),
      Image,
      Admonition,
      TextStyle,
      Color.configure({ types: ['textStyle'] }),
      BackgroundColor.configure({ types: ['textStyle'] }),
      SafeDropcursor.configure({ color: 'var(--primary)' }),
      SlashCommandExtension.configure({
        uploadImage,
        openMathEditor: (state: MathEditingState) => {
          setMathEditingRef.current?.(state);
        },
        onSuggestionStart: () => {
          setMathEditingRef.current?.(null);
        },
      }),
      // [node drag 비활성화] DragHandle Extension (non-React): render()로 순수 DOM 엘리먼트를 생성하므로
      // React 트리와 충돌 없이 wrapper.appendChild(element)가 안전하게 동작함.
      // DragHandle React 컴포넌트는 React가 관리하는 엘리먼트를 plugin이 가로채
      // "removeChild: not a child" 에러를 유발하므로 사용하지 않음.
      // DragHandle.configure({
      //   nested: { edgeDetection: { edges: ['top'], threshold: -16 } },
      //   computePositionConfig: {
      //     placement: 'left' as const,
      //     middleware: [
      //       {
      //         name: 'dragHandlePositionFix',
      //         fn(state: {
      //           x: number;
      //           y: number;
      //           rects: { reference: { height: number }; floating: { width: number; height: number } };
      //           elements: { floating: HTMLElement };
      //         }) {
      //           const floatW = state.rects.floating.width;
      //           const floatH = state.rects.floating.height;

      //           const proseMirror = state.elements.floating
      //             .closest?.('.ProseMirror')
      //             ?? state.elements.floating.parentElement?.parentElement?.querySelector('.ProseMirror');
      //           let scaleX = 1;
      //           let scaleY = 1;
      //           if (proseMirror instanceof HTMLElement) {
      //             const r = proseMirror.getBoundingClientRect();
      //             scaleX = r.width / proseMirror.offsetWidth || 1;
      //             scaleY = r.height / proseMirror.offsetHeight || 1;
      //           }

      //           // Fix x: pin to ProseMirror left edge for top-level nodes.
      //           // For nodes nested inside an admonition (callout), position the handle
      //           // inside the admonition's left padding area so the user can reach it
      //           // without the cursor leaving the admonition and dismissing the handle.
      //           const wrapperEl = state.elements.floating.parentElement;
      //           // floating-ui's ReferenceElement may be VirtualElement; access via cast.
      //           const referenceEl = (state.elements as unknown as { reference?: Element }).reference;
      //           const admonitionEl = referenceEl?.closest?.('[data-admonition]');
      //           let x: number;
      //           if (admonitionEl instanceof HTMLElement && wrapperEl) {
      //             // Place handle 4px inside the admonition's left border edge,
      //             // within the extra 1.5rem left padding reserved for the handle.
      //             const admonVpLeft = admonitionEl.getBoundingClientRect().left;
      //             const wrapperVpLeft = wrapperEl.getBoundingClientRect().left;
      //             x = (admonVpLeft - wrapperVpLeft) / scaleX + 4;
      //           } else if (proseMirror instanceof HTMLElement && wrapperEl) {
      //             const editorVpLeft = proseMirror.getBoundingClientRect().left;
      //             const wrapperVpLeft = wrapperEl.getBoundingClientRect().left;
      //             x = (editorVpLeft - wrapperVpLeft) / scaleX - floatW + 2;
      //           } else {
      //             x = (state.x + floatW) / scaleX - floatW + 2;
      //           }

      //           // Fix y: isolate viewport-pixel reference part from CSS-pixel float
      //           // dimensions so the float size doesn't shrink/grow with zoom.
      //           let y = (state.y + floatH / 2) / scaleY - floatH / 2;

      //           // For tall blocks (nested lists etc.) re-align to first line center
      //           const refH = state.rects.reference.height / scaleY;
      //           const firstLineApprox = 28;
      //           if (refH > floatH * 2.5) {
      //             y += (firstLineApprox - refH) / 2;
      //           }

      //           return { x, y };
      //         },
      //       },
      //     ],
      //   },
      //   render() {
      //     const el = document.createElement('div');
      //     el.className =
      //       'flex cursor-grab items-center justify-center size-5 rounded ' +
      //       'bg-foreground/[0.06] hover:bg-foreground/10 text-foreground/40 hover:text-foreground/60 ' +
      //       'transition-colors';
      //     el.innerHTML =
      //       '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' +
      //       '<circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>' +
      //       '<circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>' +
      //       '<circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/></svg>';
      //     dragHandleElRef.current = el;
      //     return el;
      //   },
      // }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
        showOnlyWhenEditable: !placeholderShowWhenReadOnly,
      }),
    ],
    content: blockData.content ?? EMPTY_TIPTAP_DOC,
    editable,
    editorProps,
    immediatelyRender: false, // SSR hydration mismatch 방지
    onTransaction: ({ transaction }) => {
      if (!transaction.docChanged) return;
      if (isInitialMountRef.current || !editorReadyRef.current) return;

      // ProseMirror Node.toJSON() stores attrs as Object.create(null) (null-prototype).
      // React server action serialization can't handle null-prototype objects, turning
      // them into client reference Proxies. Round-trip through JSON to normalize.
      // ProseMirror Node.toJSON() stores attrs via Object.create(null) (null-prototype).
      // React server action serialization can't handle null-prototype objects, turning
      // them into client reference Proxies. Round-trip through JSON to normalize.
      const steps = JSON.parse(JSON.stringify(transaction.steps.map(step => step.toJSON())));
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
  }, [(blockData as BlockNodeData).blockId]);

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
        ).catch(() => { });
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

  // [node drag 비활성화] With immediatelyRender:false, plugins initialize before React mounts
  // EditorContent, so view.dom.parentElement is null when DragHandle's plugin
  // tries to appendChild its wrapper. Re-mount the wrapper once the DOM is ready.
  // useEffect(() => {
  //   if (!editor) return;
  //   const el = dragHandleElRef.current;
  //   if (!el) return;
  //   const wrapper = el.parentElement;
  //   if (!wrapper) return;
  //   const parent = editor.view.dom.parentElement;
  //   if (!parent || wrapper.parentElement === parent) return;
  //   parent.appendChild(wrapper);
  // }, [editor]);

  // [node drag 비활성화] 스크롤 시 drag handle 즉시 숨기기
  // useEffect(() => {
  //   if (!editor) return;
  //   const scrollParent = editor.view.dom.closest('[class*="overflow"]')
  //     ?? editor.view.dom.parentElement;
  //   if (!scrollParent) return;

  //   const hideOnScroll = () => {
  //     editor.view.dispatch(
  //       editor.view.state.tr.setMeta('hideDragHandle', true)
  //     );
  //   };
  //   scrollParent.addEventListener('scroll', hideOnScroll, { passive: true });
  //   return () => {
  //     scrollParent.removeEventListener('scroll', hideOnScroll);
  //   };
  // }, [editor]);

  // Cleanup: 타이머 정리. blur 없이 unmount되는 경우에도 pending steps flush (debounce 대기 중 데이터 손실 방지)
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (blurFlushTimerRef.current) {
        clearTimeout(blurFlushTimerRef.current);
        blurFlushTimerRef.current = null;
      }
      runPendingBlurFlushAndAudit();
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
    mathEditing,
    setMathEditing: setMathEditingWrapped,
  };
}
