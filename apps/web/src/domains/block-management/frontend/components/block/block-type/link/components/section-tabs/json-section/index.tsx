/**
 * JSON section for link block editor.
 * Shows structured data when properties.tabs.json is present.
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { Box } from '@/components/ui/box';
import { SectionEmptyState } from '../section-empty-state';

export interface JsonSectionProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

type LinkPropertiesWithTabs = {
  tabs?: {
    json?: {
      schema?: Record<string, unknown>;
      data?: Record<string, unknown>;
      extractedAt?: string;
    };
  };
};
export default function JsonSection({ blockId, blockData }: JsonSectionProps) {
  const props = blockData?.properties as LinkPropertiesWithTabs | undefined;
  const jsonTab = props?.tabs?.json;
  const hasData = !!jsonTab && (!!jsonTab.data || !!jsonTab.schema);

  if (!hasData) {
    return (
      <SectionEmptyState
        message="No data yet. Run the tool to generate."
        actionLabel="Extract JSON"
      />
    );
  }

  return (
    <Box className="px-6 py-4 space-y-4">
      {jsonTab?.data && Object.keys(jsonTab.data).length > 0 ? (
        <Box>
          <Box className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Data
          </Box>
          <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-64 font-mono">
            {JSON.stringify(jsonTab.data, null, 2)}
          </pre>
        </Box>
      ) : null}
      {jsonTab?.schema && Object.keys(jsonTab.schema).length > 0 ? (
        <Box>
          <Box className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Schema
          </Box>
          <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-48 font-mono">
            {JSON.stringify(jsonTab.schema, null, 2)}
          </pre>
        </Box>
      ) : null}
      {jsonTab?.extractedAt && (
        <Box className="text-xs text-muted-foreground">
          Extracted: {new Date(jsonTab.extractedAt).toLocaleString()}
        </Box>
      )}
    </Box>
  );
}
