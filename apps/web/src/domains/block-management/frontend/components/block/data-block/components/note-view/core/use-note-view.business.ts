/**
 * Note View Business Hook
 *
 * 비즈니스 로직: 도메인 훅을 조합하여 컴포넌트 특화 로직 제공
 */

'use client';

import { useCallback } from 'react';

import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import type {
  DomainDependencies,
  NoteViewBusinessLogic,
  UpdateBlockContentFunction,
} from './types';

export interface UseNoteViewBusinessOptions {
  data: BlockNodeData;
  dependencies: DomainDependencies;
  updateBlockContent: UpdateBlockContentFunction;
}

/**
 * Note View Business Hook
 *
 * 도메인 훅을 조합하여 컴포넌트 특화 비즈니스 로직 제공
 */
export function useNoteViewBusiness(
  options: UseNoteViewBusinessOptions
): NoteViewBusinessLogic {
  const { data, updateBlockContent } = options;

  // Content 업데이트 함수 (block.content JSONB) - 서버 저장만
  const saveContentToServer = useCallback(
    async (content: any, contentRaw?: string) => {
      try {
        // Optimistic 상태이거나 blockId가 없으면 저장 건너뛰기
        if (!data.blockId || data.blockId === '') {
          return;
        }

        // CRITICAL: Serialize content to ensure attrs.level is preserved through Server Action
        // Next.js Server Actions can lose nested object properties during serialization
        const serializedContent = JSON.parse(JSON.stringify(content));

        // 서버 저장만 수행 (Optimistic Update는 mutation에서 자동 처리됨)
        await updateBlockContent({
          nodeId: data.blockMountId,
          content: serializedContent,
          blockData: data,
          contentRaw,
        });
      } catch (error) {
        console.error('[NoteView] Failed to save markdown content:', error);
      }
    },
    [data, updateBlockContent]
  );

  return {
    saveContentToServer,
  };
}
