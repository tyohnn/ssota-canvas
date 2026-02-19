/**
 * Screenshot section for link block editor.
 * Shows screenshot images when properties.screenshot (array) is present.
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { LinkBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

import { Box } from '@/components/ui/box';
import { SectionEmptyState } from '../section-empty-state';

export interface ScreenshotSectionProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function ScreenshotSection({ blockId, blockData }: ScreenshotSectionProps) {
  const props = blockData?.properties as LinkBlockProperties | undefined;
  const screenshots = props?.screenshot ?? [];
  const hasData = screenshots.length > 0;

  if (!hasData) {
    return (
      <SectionEmptyState
        message="No data yet. Run the tool to generate."
        actionLabel="Capture screenshot"
      />
    );
  }

  return (
    <Box className="px-6 py-4 space-y-4">
      {screenshots.map((s, i) => (
        <Box key={i}>
          <Box className="rounded-lg border overflow-hidden bg-muted">
            <img
              src={s.url}
              alt="Screenshot"
              className="w-full h-auto object-contain"
            />
          </Box>
          {s.capturedAt && (
            <Box className="mt-2 text-xs text-muted-foreground">
              Captured: {new Date(s.capturedAt).toLocaleString()}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}
