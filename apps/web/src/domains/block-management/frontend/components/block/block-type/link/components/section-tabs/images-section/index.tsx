/**
 * Images section for link block editor.
 * Shows image gallery when properties.images is present.
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { LinkBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

import { Box } from '@/components/ui/box';
import { SectionEmptyState } from '../section-empty-state';

export interface ImagesSectionProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function ImagesSection({ blockId, blockData }: ImagesSectionProps) {
  const props = blockData?.properties as LinkBlockProperties | undefined;
  const images = props?.images ?? [];
  const hasData = images.length > 0;

  if (!hasData) {
    return (
      <SectionEmptyState
        message="No data yet. Run the tool to generate."
        actionLabel="Extract images"
      />
    );
  }

  return (
    <Box className="px-6 py-4">
      <Box className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img, i) => (
          <Box
            key={i}
            className="rounded-lg border overflow-hidden bg-muted aspect-square"
          >
            <img
              src={img.url}
              alt={img.alt ?? `Image ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
