'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '@workspace/ui/lib/utils';
import { useBlockContentUpdate } from '../../hooks/use-block-content-update';
import type { BlockNodeData } from '../../../shared/types/block-data.types';

export interface BlockContentSectionProps {
  blockId: string; // React Flow node id (blockMountId)
  blockData: BlockNodeData;
}

/**
 * Block Content Section for Editor Panel
 *
 * 에디터 패널에서 블록 콘텐츠를 편집하는 섹션 (모든 블록 타입)
 * 블록과 동일한 content를 공유하며 실시간 동기화됨
 * Notion 스타일의 깔끔한 에디터
 */
export function BlockContentSection({
  blockId,
  blockData,
}: BlockContentSectionProps) {
  const { updateContent, updateContentImmediate } = useBlockContentUpdate();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false); // 현재 업데이트 중인지 추적

  // 초기 마운트 완료 추적 (초기 로드 시 불필요한 저장 방지)
  const isInitialMountRef = useRef(true);

  // 에디터 준비 완료 추적 (초기 content 설정이 완료될 때까지 대기)
  const editorReadyRef = useRef(false);

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '클릭해서 내용을 추가하세요.',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: (blockData as any).content || {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    },
    editable: true,
    immediatelyRender: false, // SSR hydration mismatch 방지
    onUpdate: ({ editor }) => {
      // 초기 마운트 시에는 저장하지 않음
      if (isInitialMountRef.current || !editorReadyRef.current) {
        return;
      }

      // 사용자가 직접 입력한 경우에만 저장
      isUpdatingRef.current = true;

      const content = editor.getJSON();

      // 즉시 Optimistic Update (딜레이 없음)
      updateContentImmediate(blockId, content, blockData);

      // Debounce: 500ms 후에 서버에 저장
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        saveContentToServer(content);
        // 저장 완료 후 플래그 리셋
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }, 500);
    },
  });

  // Content 업데이트 함수 (block.content JSONB)
  const saveContentToServer = useCallback(
    async (content: any) => {
      try {
        // Optimistic 상태이거나 blockId가 없으면 저장 건너뛰기
        if (!blockData.blockId || blockData.blockId === '') {
          console.log(
            '[BlockContentSection] Skipping save: block is in optimistic state'
          );
          return;
        }

        // React Flow node id (blockId prop = blockMountId)를 전달
        await updateContent(blockId, content, blockData);
      } catch (error) {
        console.error('Failed to save markdown content:', error);
      }
    },
    [blockId, blockData, updateContent]
  );

  // 초기 마운트 완료 후 플래그 해제 (지연 적용)
  useEffect(() => {
    if (editor) {
      // 에디터가 준비되고 초기 content가 설정된 후에만 준비 완료로 표시
      // setTimeout으로 다음 tick까지 대기하여 초기 렌더링 완료 보장
      const timer = setTimeout(() => {
        editorReadyRef.current = true;
        isInitialMountRef.current = false;
      }, 100); // 100ms 지연으로 초기 렌더링 완료 대기

      return () => clearTimeout(timer);
    }
  }, [editor]);

  // Cleanup: debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 에디터 클릭 핸들러 - Hook은 항상 먼저 호출
  const handleEditorClick = useCallback(() => {
    if (editor && !editor.isFocused) {
      editor.commands.focus();
    }
  }, [editor]);

  // 외부 content 변경 시 에디터 동기화 (블록에서 수정 시)
  useEffect(() => {
    // 에디터가 준비되지 않았거나 현재 사용자가 입력 중이면 외부 변경 무시
    if (
      !editor ||
      !editorReadyRef.current ||
      isUpdatingRef.current ||
      !(blockData as any).content
    ) {
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
      isUpdatingRef.current = true;
      editor.commands.setContent(newContent, { emitUpdate: false });
      // 다음 tick에 다시 활성화
      setTimeout(() => {
        editorReadyRef.current = true;
        isUpdatingRef.current = false;
      }, 50);
    }
  }, [(blockData as any).content, editor]);

  // Early return은 모든 Hook 호출 이후
  if (!editor) {
    return null;
  }

  return (
    <div className="border-t border-border/40 px-4 py-6">
      {/* Notion-style Editor Container */}
      <div onClick={handleEditorClick} className="min-h-[200px] cursor-text">
        {/* Placeholder 스타일 */}
        <style>{`
          .tiptap-editor-panel p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            color: rgb(209 213 219); /* gray-300 - 더 연한 회색 */
            font-style: italic;
            float: left;
            height: 0;
            pointer-events: none;
          }
        `}</style>

        {/* TipTap Editor with Built-in Placeholder */}
        <EditorContent
          editor={editor}
          className={cn(
            'tiptap-editor-panel', // Placeholder 스타일 타겟
            'prose prose-sm max-w-none',
            'focus:outline-none',
            // TipTap 기본 스타일
            '[&_.ProseMirror]:outline-none',
            '[&_.ProseMirror]:min-h-[200px]',
            '[&_.ProseMirror_p]:my-2',
            '[&_.ProseMirror_p:first-child]:mt-0',
            '[&_.ProseMirror_p:last-child]:mb-0',
            '[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:my-4',
            '[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:my-3',
            '[&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:my-2',
            '[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-4 [&_.ProseMirror_ul]:my-2',
            '[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-4 [&_.ProseMirror_ol]:my-2',
            '[&_.ProseMirror_li]:my-1',
            '[&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-sm [&_.ProseMirror_code]:font-mono',
            '[&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:rounded [&_.ProseMirror_pre]:my-3 [&_.ProseMirror_pre]:overflow-x-auto',
            '[&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:p-0',
            '[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-muted-foreground/30 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:my-3',
            '[&_.ProseMirror_hr]:border-border [&_.ProseMirror_hr]:my-4'
          )}
        />
      </div>
    </div>
  );
}
