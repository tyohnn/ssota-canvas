/**
 * Design tab for link block editor.
 * Shows design metadata when properties.design is present.
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { LinkBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

import { Box } from '@/components/ui/box';
import { TabEmptyState } from '../tab-empty-state';

export interface DesignTabProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function DesignTab({ blockId, blockData }: DesignTabProps) {
  const props = blockData?.properties as LinkBlockProperties | undefined;
  const design = props?.design;
  const hasData = !!design && (!!design.colors?.length || !!design.fonts?.length || !!design.metadata);

  if (!hasData) {
    return (
      <TabEmptyState
        message="No data yet. Run the tool to generate."
        actionLabel="Extract design"
      />
    );
  }

  return (
    <Box className="px-6 py-4 space-y-4">
      {design?.colors?.length ? (
        <Box>
          <Box className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Colors
          </Box>
          <Box className="flex flex-wrap gap-2">
            {design.colors.map((c, i) => (
              <Box
                key={i}
                className="w-10 h-10 rounded-lg border shrink-0"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </Box>
        </Box>
      ) : null}
      {design?.fonts?.length ? (
        <Box>
          <Box className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Fonts
          </Box>
          <Box className="flex flex-wrap gap-2">
            {design.fonts.map((f, i) => (
              <Box
                key={i}
                className="px-2 py-1 rounded bg-muted text-sm font-mono"
              >
                {f}
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}
      {design?.metadata && Object.keys(design.metadata).length > 0 ? (
        <Box>
          <Box className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Metadata
          </Box>
          <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-48">
            {JSON.stringify(design.metadata, null, 2)}
          </pre>
        </Box>
      ) : null}
    </Box>
  );
}
