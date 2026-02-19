/**
 * Script Transcript
 *
 * Container Component: Hook → Props 변환
 * 스크립트 트랜스크립트를 표시하는 컴포넌트
 * [시간] 스크립트 형식으로 표시
 */

'use client';

import { useState } from 'react';

import type { JSONContent } from '@tiptap/core';
import { useReactFlow } from '@xyflow/react';

import { useEditorPanelContext } from '@/domains/block-management/frontend/components/editor-panel/core/context';
import {
  appendToTiptapContent,
  createQuoteBlock,
} from '@/domains/block-management/frontend/components/tiptap-editor/core/tiptap-content.utils';
import { useUpdateBlockContent } from '@/domains/block-management/frontend/hooks/block-property/use-block-content-update';
import { useBlockInteraction } from '@/domains/canvas-management/frontend/contexts/block-interaction-context';

import { ScriptTranscriptView } from './script-transcript.view';

interface ScriptTranscriptSegment {
  start: number;
  text: string;
}

export interface ScriptTranscriptProps {
  transcript: ScriptTranscriptSegment[] | undefined;
  youtubeTitle: string | undefined;
}

export function ScriptTranscript({
  transcript,
  youtubeTitle,
}: ScriptTranscriptProps) {
  const { blockMountId, blockData, switchToTab } = useEditorPanelContext();
  const { getBlockInteractions } = useBlockInteraction();
  const { getNode, updateNode } = useReactFlow();
  const { updateBlockContent } = useUpdateBlockContent({
    reactFlow: { getNode, updateNode },
  });
  const [loadingSegmentIndex, setLoadingSegmentIndex] = useState<number | null>(
    null
  );

  const handleTimeClick = (seconds: number) => {
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
    if (!blockData) return;

    setLoadingSegmentIndex(segmentIndex);

    try {
      const currentContent = (blockData.content as JSONContent) || null;

      const formatTimestamp = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
      };

      const quoteBlock = createQuoteBlock(text, {
        title: youtubeTitle || 'YouTube Video',
        timestamp: formatTimestamp(timestamp),
      });
      let updatedContent = appendToTiptapContent(currentContent, quoteBlock);
      const emptyParagraph: JSONContent = { type: 'paragraph' };
      updatedContent = appendToTiptapContent(updatedContent, emptyParagraph);

      await updateBlockContent({
        nodeId: blockMountId,
        content: updatedContent,
        blockData,
      });

      switchToTab('note');

      setTimeout(() => {
        const noteSection = document.querySelector(
          '[data-note-section="true"]'
        );
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

  return (
    <ScriptTranscriptView
      transcript={transcript}
      youtubeTitle={youtubeTitle}
      onTimeClick={handleTimeClick}
      onAddQuote={handleAddQuote}
      loadingSegmentIndex={loadingSegmentIndex}
    />
  );
}
