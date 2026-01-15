/**
 * Script Transcript
 *
 * 스크립트 트랜스크립트를 표시하는 컴포넌트
 * [시간] 스크립트 형식으로 표시
 */

'use client';

import { useState } from 'react';

import type { JSONContent } from '@tiptap/core';
import { useReactFlow } from '@xyflow/react';

import { Box } from '@/components/ui/box';
import { useEditorPanelContext } from '@/domains/block-management/frontend/components/editor-panel/core/context';
import {
  appendToTiptapContent,
  createQuoteBlock,
} from '@/domains/block-management/frontend/components/tiptap-editor/core/tiptap-content.utils';
import { useUpdateBlockContent } from '@/domains/block-management/frontend/hooks/block-property/use-block-content-update';
import { useBlockInteraction } from '@/domains/canvas-management/frontend/contexts/block-interaction-context';

import { formatTime } from '../core/utils';
import { ScriptTranscriptItem } from './script-transcript-item';

/**
 * Script Transcript Segment
 */
interface ScriptTranscriptSegment {
  start: number;
  text: string;
}

/**
 * Script Transcript Props
 */
interface ScriptTranscriptProps {
  transcript: ScriptTranscriptSegment[] | undefined;
  youtubeTitle: string | undefined;
}

/**
 * Script Transcript Component
 */
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

  if (!transcript || transcript.length === 0) {
    return null;
  }

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

    // 로딩 시작
    setLoadingSegmentIndex(segmentIndex);

    try {
      // 1. 현재 content 가져오기 (tiptap JSON 확인)
      const currentContent = (blockData.content as JSONContent) || null;

      // 2. 타임스탬프 포맷팅 (시간 포함)
      const formatTimestamp = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
      };

      // 3. Quote 블록 생성 및 추가 (소스 정보 포함)
      const quoteBlock = createQuoteBlock(text, {
        title: youtubeTitle || 'YouTube Video',
        timestamp: formatTimestamp(timestamp),
      });
      // Quote 블록 추가
      let updatedContent = appendToTiptapContent(currentContent, quoteBlock);
      // Quote 블록 밑에 빈 줄 추가
      const emptyParagraph: JSONContent = {
        type: 'paragraph',
      };
      updatedContent = appendToTiptapContent(updatedContent, emptyParagraph);

      // 4. Content 업데이트
      await updateBlockContent({
        nodeId: blockMountId,
        content: updatedContent,
        blockData,
      });

      // 5. Tab 전환
      switchToTab('note');

      // 6. 스크롤 자동 이동 (약간의 지연 후)
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
      // 로딩 종료
      setLoadingSegmentIndex(null);
    }
  };

  // [시간] 스크립트 형식으로 표시
  return (
    <Box className="space-y-2">
      {transcript.map((segment, index) => (
        <ScriptTranscriptItem
          key={index}
          segment={segment}
          onTimeClick={handleTimeClick}
          onAddQuote={text => handleAddQuote(text, segment.start, index)}
          isLoading={loadingSegmentIndex === index}
        />
      ))}
    </Box>
  );
}
