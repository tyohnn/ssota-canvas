'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import type { NodeProps } from '@xyflow/react';
import { useReactFlow } from '@xyflow/react';

import { cn } from '@workspace/ui/lib/utils';

import { useUpdateBlockContent } from '@/domains/block-management/frontend/hooks/use-block-content-update';
import type {
  BlockNodeData,
  MarkdownBlockNodeData,
} from '@/domains/block-management/shared/types/block-data.types';
import {
  EMPTY_TIPTAP_DOC,
  MARKDOWN_EXTENSIONS,
} from '@/domains/block-management/shared/utils/tiptap-markdown.utils';
import type { MarkdownBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { useCanvasMode } from '@/domains/canvas-management/frontend/hooks/use-canvas-mode';

import { BaseBlock } from '../base-block';

/**
 * Markdown Block Component
 *
 * TipTap 기반 마크다운 블록
 * - 이중 선택 구조 (텍스트/이미지 블록과 동일)
 * - block.content TEXT에 Markdown 저장 (Tiptap JSON → Markdown 변환)
 * - 렌더링 시 Markdown → Tiptap JSON 파싱
 */
export const MarkdownBlock = memo(function MarkdownBlock({
  id,
  data,
  selected,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  // TypeScript 타입 안전성을 위한 데이터 접근
  if (!data) {
    console.error('MarkdownBlock: data is required');
    return null;
  }

  const nodeData = data as MarkdownBlockNodeData;
  const properties = nodeData.properties as MarkdownBlockProperties;

  // Dimensions
  const width = typeof nodeW === 'number' ? nodeW : 400;
  const height = typeof nodeH === 'number' ? nodeH : 300;

  // Properties
  const { color } = properties;

  // Block content update hook
  const { getNode, updateNode } = useReactFlow();
  const { updateBlockContent } = useUpdateBlockContent({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: BlockNodeData }) => {
        updateNode(nodeId, options);
      },
    },
  });

  // Canvas mode context
  const { setTextareaEditing } = useCanvasMode();

  // 편집 상태 (SSOT)
  const [isEditing, setIsEditing] = useState(false);
  const [isDoubleClickMode, setIsDoubleClickMode] = useState(false);

  // Debounce timer for content updates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 초기 마운트 완료 추적 (초기 로드 시 불필요한 저장 방지)
  const isInitialMountRef = useRef(true);

  // 에디터 준비 완료 추적 (초기 content 설정이 완료될 때까지 대기)
  const editorReadyRef = useRef(false);

  // Editor container ref (스크롤 처리용)
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // 이전 콘텐츠 추적 (실제 변경 감지용)
  const previousContentRef = useRef<string>('');

  // TipTap Editor with Markdown content type
  const editor = useEditor({
    extensions: [
      ...MARKDOWN_EXTENSIONS, // StarterKit + Markdown 확장
      Placeholder.configure({
        placeholder: 'Click to add markdown content...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    // Tiptap JSON을 직접 content로 설정
    content: nodeData.content || EMPTY_TIPTAP_DOC,
    editable: isEditing,
    immediatelyRender: false, // SSR hydration mismatch 방지
    onUpdate: ({ editor }) => {
      // 초기 마운트 시에는 저장하지 않음
      if (isInitialMountRef.current || !editorReadyRef.current) {
        return;
      }

      // 실제 콘텐츠 변경 확인 (클릭/드래그만으로는 저장하지 않음)
      const currentContent = JSON.stringify(editor.getJSON());

      if (currentContent === previousContentRef.current) {
        console.log(
          '[MarkdownBlock] onUpdate triggered but content unchanged, skipping save'
        );
        return; // 콘텐츠 변경 없음 → 저장 안 함
      }

      // 콘텐츠가 실제로 변경됨
      console.log('[MarkdownBlock] Content changed, saving...');
      previousContentRef.current = currentContent;

      // Tiptap JSON 추출
      const tiptapJson = editor.getJSON();

      // 즉시 Optimistic Update (딜레이 없음) - mutation의 optimistic update로 처리
      // updateContentImmediate는 제거되었으므로 mutation을 사용
      if (nodeData.blockId && nodeData.blockId !== '') {
        // mutation의 optimistic update가 자동으로 처리됨
      }

      // Debounce: 500ms 후에 서버에 저장
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        saveContentToServer(tiptapJson);
      }, 500);
    },
  });

  // Content 업데이트 함수 (block.content JSONB) - 서버 저장만
  const saveContentToServer = useCallback(
    async (content: any) => {
      try {
        // Optimistic 상태이거나 blockId가 없으면 저장 건너뛰기
        if (!nodeData.blockId || nodeData.blockId === '') {
          return;
        }

        // Markdown 텍스트 추출 (AI context용)
        let contentRaw: string | undefined;
        if (editor) {
          try {
            // @ts-ignore - getMarkdown()은 Markdown 확장에서 추가됨
            contentRaw = editor.getMarkdown() as string;
          } catch (error) {
            console.warn('[MarkdownBlock] Failed to extract markdown:', error);
          }
        }

        // 서버 저장만 수행 (Optimistic Update는 mutation에서 자동 처리됨)
        await updateBlockContent({
          nodeId: id,
          content,
          blockData: nodeData,
          contentRaw,
        });
      } catch (error) {
        console.error(
          '[MarkdownBlock] Failed to save markdown content:',
          error
        );
      }
    },
    [id, nodeData, updateBlockContent, editor]
  );

  // 초기 마운트 완료 후 플래그 해제 (지연 적용)
  useEffect(() => {
    if (editor) {
      // 초기 콘텐츠를 previousContentRef에 설정
      if (nodeData.content) {
        previousContentRef.current = JSON.stringify(nodeData.content);
      }

      // 에디터가 준비되고 초기 content가 설정된 후에만 준비 완료로 표시
      // setTimeout으로 다음 tick까지 대기하여 초기 렌더링 완료 보장
      const timer = setTimeout(() => {
        editorReadyRef.current = true;
        isInitialMountRef.current = false;
      }, 100); // 100ms 지연으로 초기 렌더링 완료 대기

      return () => clearTimeout(timer);
    }
  }, [editor, nodeData.content]);

  // Cleanup: debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 외부 데이터가 바뀌었을 때, 편집 중이 아니면 에디터 동기화
  // (에디터 패널에서 수정 시 블록에 반영)
  useEffect(() => {
    // 에디터가 준비되지 않았거나 편집 중이면 무시
    if (!editor || !editorReadyRef.current || isEditing || !nodeData.content) {
      return;
    }

    // 현재 에디터 내용을 JSON으로 가져오기
    const currentJson = JSON.stringify(editor.getJSON());
    const newJson = JSON.stringify(nodeData.content);

    // 내용이 다를 때만 업데이트 (무한 루프 방지)
    if (currentJson !== newJson) {
      // 외부 변경 동기화 중에는 onUpdate 트리거 방지
      editorReadyRef.current = false;

      // previousContentRef도 업데이트 (외부 변경 반영)
      previousContentRef.current = newJson;

      // Tiptap JSON을 직접 setContent로 설정
      editor.commands.setContent(nodeData.content, {
        emitUpdate: false,
      });
      // 다음 tick에 다시 활성화
      setTimeout(() => {
        editorReadyRef.current = true;
      }, 50);
    }
  }, [(nodeData as any).content, editor, isEditing]);

  // 편집 모드 변경 시 에디터 상태 업데이트
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  // 선택 시 편집 모드 진입 (더블클릭 모드가 활성화된 경우에만)
  useEffect(() => {
    if (selected && isDoubleClickMode) {
      setIsEditing(true);
      setTextareaEditing(true);

      // 포커스
      if (editor) {
        editor.commands.focus();
      }
    }
  }, [selected, isDoubleClickMode, editor, setTextareaEditing]);

  // 선택이 해제되면 편집 종료 및 더블클릭 모드 리셋
  useEffect(() => {
    if (isEditing && !selected) {
      setIsEditing(false);
      setTextareaEditing(false);

      // Blur 시 debounce timer 취소하고 즉시 저장
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (editor) {
        // Tiptap JSON 추출 후 저장
        const tiptapJson = editor.getJSON();
        saveContentToServer(tiptapJson);
      }
    }
    if (!selected) {
      setIsDoubleClickMode(false);
    }
  }, [isEditing, selected, setTextareaEditing, editor, saveContentToServer]);

  // 블럭 클릭 핸들러 (더블클릭 모드 활성화)
  const handleBlockClick = useCallback(
    (e: React.MouseEvent) => {
      if (selected && !isDoubleClickMode) {
        e.stopPropagation();
        setIsDoubleClickMode(true);
      }
    },
    [selected, isDoubleClickMode]
  );

  // 에디터 클릭 핸들러 (편집 모드일 때만 propagation 차단)
  const handleEditorClick = useCallback(
    (e: React.MouseEvent) => {
      if (isEditing) {
        e.stopPropagation(); // 편집 중일 때만 전파 차단
      }
    },
    [isEditing]
  );

  // ESC 키 핸들러
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(false);
        setTextareaEditing(false);
        setIsDoubleClickMode(false);

        // Debounce timer 취소 (저장하지 않음)
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, setTextareaEditing]);

  // Editor 스크롤을 위해 네이티브 휠 이벤트 전파 막기
  // Container div를 스크롤 타겟으로 사용 (편집 모드일 때만)
  useEffect(() => {
    // 편집 중이 아니거나 container가 없으면 리스너 등록하지 않음
    if (!isEditing || !editorContainerRef.current) {
      return;
    }

    const editorContainer = editorContainerRef.current;

    const handleWheel = (e: WheelEvent) => {
      // React Flow로 이벤트 전파 차단
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();

      // Container div 스크롤 처리
      const newScrollTop = editorContainer.scrollTop + e.deltaY;
      editorContainer.scrollTop = newScrollTop;
    };

    // 캡처 단계에서 먼저 이벤트 리스너 등록하여 다른 리스너보다 우선 실행
    editorContainer.addEventListener('wheel', handleWheel, {
      passive: false,
      capture: true, // 캡처 단계에서 처리
    });

    return () => {
      editorContainer.removeEventListener('wheel', handleWheel, {
        capture: true,
      });
    };
  }, [isEditing]); // 편집 모드 변경 시 재등록

  // 편집 모드에서 키보드 단축키 이벤트 전파 막기 (사이드바 토글 방지)
  useEffect(() => {
    if (!isEditing || !editorContainerRef.current) {
      return;
    }

    const editorContainer = editorContainerRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + B 조합 감지 (사이드바 토글)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'b') {
        // 브라우저 기본 동작 차단 (북마크바 토글 방지)
        e.preventDefault();
        // 이벤트 전파 차단 (사이드바가 토글되지 않도록)
        e.stopPropagation();
      }
    };

    // 버블링 단계에서 이벤트 리스너 등록 (Tiptap이 먼저 처리한 후 전파 차단)
    editorContainer.addEventListener('keydown', handleKeyDown);

    return () => {
      editorContainer.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing]);

  return (
    <BaseBlock
      data={nodeData}
      selected={selected}
      isConnectable={true}
      width={width}
      height={height}
      styleProps={{
        color,
      }}
    >
      {/* Markdown Block Content */}
      <div
        className={cn(
          'w-full h-full flex flex-col rounded-lg overflow-hidden',
          'bg-background border-2 border-border',
          'shadow-md',
          // 호버 효과 (선택되지 않았을 때만)
          !selected && 'hover:shadow-xl',
          // 선택 효과
          selected && 'ring-2 ring-blue-400 dark:ring-blue-500',
          selected && 'shadow-xl',
          // Transition
          'transition-all duration-300 ease-out'
        )}
      >
        {/* Editor Content */}
        <div
          ref={editorContainerRef}
          className={cn(
            'flex-1 p-4 overflow-auto',
            isEditing ? 'cursor-text' : 'cursor-pointer',
            // 편집 모드일 때만 드래그 방지 (React Flow 선택 허용)
            isEditing && 'nodrag'
          )}
          onClick={handleBlockClick}
        >
          {selected && isDoubleClickMode ? (
            // 편집 모드: TipTap 에디터
            <>
              {/* Placeholder 스타일 */}
              <style>{`
                .tiptap-markdown-block p.is-editor-empty:first-child::before {
                  content: attr(data-placeholder);
                  color: hsl(var(--muted-foreground));
                  font-style: italic;
                  float: left;
                  height: 0;
                  pointer-events: none;
                }
              `}</style>

              <EditorContent
                editor={editor}
                onClick={handleEditorClick}
                className={cn(
                  'tiptap-markdown-block', // Placeholder 스타일 타겟
                  'prose prose-sm max-w-none nodrag',
                  'focus:outline-none',
                  // TipTap 기본 스타일
                  '[&_.ProseMirror]:outline-none',
                  '[&_.ProseMirror]:min-h-[100px]',
                  '[&_.ProseMirror_p]:my-2',
                  '[&_.ProseMirror_p:first-child]:mt-0',
                  '[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:my-3',
                  '[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:my-2',
                  '[&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:my-2',
                  '[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-4',
                  '[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-4',
                  '[&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:rounded',
                  '[&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:rounded',
                  '[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic'
                )}
              />
            </>
          ) : (
            // 읽기 모드: TipTap 렌더링 (편집 불가)
            <>
              {/* Placeholder 스타일 */}
              <style>{`
                .tiptap-markdown-readonly p.is-editor-empty:first-child::before {
                  content: attr(data-placeholder);
                  color: hsl(var(--muted-foreground));
                  font-style: italic;
                  float: left;
                  height: 0;
                  pointer-events: none;
                }
              `}</style>

              <EditorContent
                editor={editor}
                className={cn(
                  'tiptap-markdown-readonly', // Placeholder 스타일 타겟
                  'prose prose-sm max-w-none',
                  // 읽기 모드에서는 pointer-events 차단하여 클릭이 wrapper로 전달되도록
                  'pointer-events-none',
                  // TipTap 기본 스타일
                  '[&_.ProseMirror]:outline-none',
                  '[&_.ProseMirror]:min-h-[100px]',
                  '[&_.ProseMirror_p]:my-2',
                  '[&_.ProseMirror_p:first-child]:mt-0',
                  '[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:my-3',
                  '[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:my-2',
                  '[&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:my-2',
                  '[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-4',
                  '[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-4',
                  '[&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:rounded',
                  '[&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:rounded',
                  '[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic'
                )}
              />
            </>
          )}
        </div>
      </div>
    </BaseBlock>
  );
});
