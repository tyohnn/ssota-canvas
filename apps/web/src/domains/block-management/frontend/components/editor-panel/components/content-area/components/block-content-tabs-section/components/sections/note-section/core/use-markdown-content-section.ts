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
  UseMarkdownContentSectionOptions,
  UseMarkdownContentSectionReturn,
} from './types';

/**
 * Markdown Content Section Hook
 *
 * Editor Panel에서 블록 콘텐츠를 편집하는 로직 관리
 */
export function useMarkdownContentSection(
  options: UseMarkdownContentSectionOptions
): UseMarkdownContentSectionReturn {
  const { blockId, blockData, dependencies, readonly = false } = options;
  const { reactFlow, updateBlockContent } = dependencies;

  // ✅ blockMountId를 사용 (React Flow node id)
  // blockId prop은 실제 블록 ID이지만, React Flow의 getNode/updateNode는 blockMountId를 사용해야 함
  const blockMountId = blockData.blockMountId;

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
        // ✅ blockMountId를 사용하여 노드 찾기
        const latestNode = reactFlow.getNode(blockMountId);
        const latestBlockData =
          (latestNode?.data as BlockNodeData) || blockData;

        // CRITICAL: Serialize content to ensure attrs.level is preserved through Server Action
        const serializedContent = JSON.parse(JSON.stringify(content));

        // ✅ React Flow node id (blockMountId)를 전달
        // updateBlockContent는 서버 저장만 수행 (optimistic update는 이미 완료됨)
        await updateBlockContent({
          nodeId: blockMountId,
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
    [blockMountId, blockData, updateBlockContent, reactFlow]
  );

  // 공통 TipTap Editor Hook 사용 (readonly면 수정 불가)
  const { editor, handleEditorClick } = useTipTapEditor({
    blockData,
    placeholder: 'Click to add note...',
    editable: !readonly,
    onContentChange: content => {
      // 1. 즉시 Optimistic Update: React Flow store 즉시 업데이트
      // ✅ blockMountId를 사용하여 노드 업데이트
      const updatedData = { ...blockData, content };
      reactFlow.updateNode(blockMountId, { data: updatedData });
    },
    onSave: saveContentToServer,
  });

  return {
    editor,
    handleEditorClick,
  };
}
