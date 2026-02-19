/**
 * Extract section for link block editor.
 * Uses Source domain: useSourceContent (raw_content = markdown)
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { Box } from '@/components/ui/box';
import { SectionEmptyState } from '../section-empty-state';
import { useLinkExtractSectionBusiness } from './core/use-link-extract-section.business';

export interface ExtractSectionProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function ExtractSection({
  blockId,
  blockData,
}: ExtractSectionProps) {
  const { rawContent, isLoading, error, hasSourceId } =
    useLinkExtractSectionBusiness(blockId, blockData);

  if (!hasSourceId) {
    return (
      <SectionEmptyState
        message="Enter a URL and load metadata first."
        actionLabel=""
      />
    );
  }

  if (error) {
    return (
      <Box className="px-6 py-4 text-sm text-destructive">
        {error}
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box className="px-6 py-4 text-sm text-muted-foreground">
        Loading...
      </Box>
    );
  }

  if (!rawContent || !rawContent.trim()) {
    return (
      <SectionEmptyState
        message="Extraction runs automatically when you add a URL."
        actionLabel=""
      />
    );
  }

  return (
    <Box className="px-6 py-4">
      <pre className="text-xs bg-muted rounded-lg p-4 overflow-auto max-h-[400px] whitespace-pre-wrap font-sans">
        {rawContent}
      </pre>
    </Box>
  );
}
