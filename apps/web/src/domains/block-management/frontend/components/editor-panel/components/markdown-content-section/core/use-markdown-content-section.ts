/**
 * Markdown Content Section Hook
 *
 * Editor Panel의 Markdown Content Section 로직 관리
 */

'use client';

import { useCallback } from 'react';

import { useTipTapEditor } from '@/domains/block-management/frontend/components/tiptap-editor/core/use-tiptap-editor';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import type {
  UseMarkdownContentSectionDependencies,
  UseMarkdownContentSectionReturn,
} from './types';

export interface UseMarkdownContentSectionOptions {
  blockId: string;
  blockData: BlockNodeData;
  dependencies: UseMarkdownContentSectionDependencies;
}

/**
 * Markdown Content Section Hook
 *
 * Editor Panel에서 블록 콘텐츠를 편집하는 로직 관리
 */
export function useMarkdownContentSection(
  options: UseMarkdownContentSectionOptions
): UseMarkdownContentSectionReturn {
  const { blockId, blockData, dependencies } = options;
  const { reactFlow, updateBlockContent } = dependencies;

  // Content 업데이트 함수 (block.content JSONB) - 서버 저장만 수행
  // Note: Optimistic update는 이미 onContentChange에서 수행됨
  const saveContentToServer = useCallback(
    async (content: any, contentRaw?: string) => {
      try {
        // Optimistic 상태이거나 blockId가 없으면 저장 건너뛰기
        if (!blockData.blockId || blockData.blockId === '') {
          console.log(
            '[MarkdownContentSection] Skipping save: block is in optimistic state'
          );
          return;
        }

        // 최신 blockData 가져오기 (optimistic update 후의 데이터)
        const latestNode = reactFlow.getNode(blockId);
        const latestBlockData =
          (latestNode?.data as BlockNodeData) || blockData;

        // CRITICAL: Serialize content to ensure attrs.level is preserved through Server Action
        const serializedContent = JSON.parse(JSON.stringify(content));

        // React Flow node id (blockId prop = blockMountId)를 전달
        // updateBlockContent는 서버 저장만 수행 (optimistic update는 이미 완료됨)
        await updateBlockContent({
          nodeId: blockId,
          content: serializedContent,
          blockData: latestBlockData,
          contentRaw,
        });
      } catch (error) {
        console.error(
          '[MarkdownContentSection] Failed to save markdown content:',
          error
        );
      }
    },
    [blockId, blockData, updateBlockContent, reactFlow]
  );

  // 공통 TipTap Editor Hook 사용
  const { editor, handleEditorClick } = useTipTapEditor({
    blockData,
    placeholder: 'Click to add note...',
    editable: true,
    onContentChange: content => {
      // 1. 즉시 Optimistic Update: React Flow store 즉시 업데이트
      const updatedData = { ...blockData, content };
      reactFlow.updateNode(blockId, { data: updatedData });
    },
    onSave: saveContentToServer,
  });

  return {
    editor,
    handleEditorClick,
  };
}
