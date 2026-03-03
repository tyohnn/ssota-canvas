/**
 * useTimelineTranscript
 *
 * 타임라인 트랜스크립트 비즈니스 로직 (seek, add quote)
 */

'use client';

import { useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import { useReactFlow } from '@xyflow/react';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  appendToTiptapContent,
  createQuoteBlock,
} from '@/domains/block-management/frontend/components/tiptap-editor/core/tiptap-content.utils';
import { useUpdateBlockContent } from '@/domains/block-management/frontend/hooks/block-property/use-block-content-update';
import { useBlockInteraction } from '@/domains/canvas-management/frontend/contexts/block-interaction-context';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export interface UseTimelineTranscriptParams {
  sourceTitle: string | undefined;
  blockMountId?: string;
  blockData?: unknown;
  switchToTab?: (tabId: string) => void;
}

export interface UseTimelineTranscriptResult {
  handleTimeClick: (seconds: number) => void;
  handleAddQuote: (
    text: string,
    timestamp: number,
    segmentIndex: number
  ) => Promise<void>;
  loadingSegmentIndex: number | null;
  readonly: boolean;
}

export function useTimelineTranscript({
  sourceTitle,
  blockMountId: blockMountIdParam,
  blockData: blockDataParam,
  switchToTab: switchToTabParam,
}: UseTimelineTranscriptParams): UseTimelineTranscriptResult {
  const [loadingSegmentIndex, setLoadingSegmentIndex] = useState<number | null>(null);
  const typedBlockData = blockDataParam as BlockNodeData | undefined;
  const blockMountId = blockMountIdParam ?? '';
  const switchToTab = switchToTabParam ?? (() => {});
  const { readonly } = useCanvasReadOnly();
  const { getBlockInteractions } = useBlockInteraction();
  const { getNode, updateNode } = useReactFlow();
  const { updateBlockContent } = useUpdateBlockContent({
    reactFlow: { getNode, updateNode },
  });

  const handleTimeClick = (seconds: number) => {
    if (!blockMountId) return;
    const interactions = getBlockInteractions(blockMountId);
    if (interactions?.seekTo) {
      interactions.seekTo(seconds);
    }
  };

  const handleAddQuote = async (
    text: string,
    timestamp: number,
    segmentIndex: number
  ) => {
    if (!typedBlockData || !blockMountId) return;

    setLoadingSegmentIndex(segmentIndex);

    try {
      const currentContent = (typedBlockData.content as JSONContent) || null;

      const quoteBlock = createQuoteBlock(text, {
        title: sourceTitle || 'Video',
        timestamp: formatTimestamp(timestamp),
      });
      let updatedContent = appendToTiptapContent(currentContent, quoteBlock);
      const emptyParagraph: JSONContent = { type: 'paragraph' };
      updatedContent = appendToTiptapContent(updatedContent, emptyParagraph);

      await updateBlockContent({
        nodeId: blockMountId,
        content: updatedContent,
        blockData: typedBlockData,
      });

      switchToTab('note');

      setTimeout(() => {
        const noteSection = document.querySelector('[data-note-section="true"]');
        if (noteSection) {
          noteSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 100);
    } catch (error) {
      console.error('[handleAddQuote] Failed to update block content:', error);
    } finally {
      setLoadingSegmentIndex(null);
    }
  };

  return {
    handleTimeClick,
    handleAddQuote,
    loadingSegmentIndex,
    readonly,
  };
}
