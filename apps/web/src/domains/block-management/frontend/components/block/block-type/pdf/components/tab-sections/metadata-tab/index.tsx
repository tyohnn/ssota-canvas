/**
 * Metadata tab for PDF block editor.
 * Shows PDF file info and block metadata.
 * Same layout/design as Link/Audio metadata tabs.
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { formatShortDisplayUrl } from '@/domains/block-management/shared/utils/format-display-url';
import type { PdfBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

import { Box } from '@/components/ui/box';

export interface MetadataTabProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function MetadataTab({
  blockId,
  blockData,
}: MetadataTabProps) {
  const props = blockData?.properties as PdfBlockProperties | undefined;
  const pdfUrl = props?.accessUrl ?? (props as { url?: string }).url ?? '';
  const filename = props?.filename ?? '';
  const pageCount = props?.pageCount;
  const createdAt = blockData?.createdAt;
  const updatedAt = blockData?.updatedAt;

  const hasData =
    !!pdfUrl ||
    !!filename ||
    pageCount != null ||
    !!createdAt ||
    !!updatedAt;

  if (!hasData) {
    return (
      <Box className="pl-6 pr-4 py-3 min-h-[200px]">
        <Box className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No metadata available. Metadata will appear after you upload or add
            a PDF.
          </p>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="pl-6 pr-4 py-3 min-h-[200px]">
      <Box className="space-y-6">
        {filename && (
          <Box className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Filename
            </h3>
            <p className="text-sm font-medium">{filename}</p>
          </Box>
        )}

        {pdfUrl && (
          <Box className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">URL</h3>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline break-all"
              title={pdfUrl}
            >
              {formatShortDisplayUrl(pdfUrl)}
            </a>
          </Box>
        )}

        <Box className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Info</h3>
          <Box className="grid grid-cols-2 gap-4">
            {pageCount != null && (
              <Box className="space-y-1">
                <p className="text-xs text-muted-foreground">Page Count</p>
                <p className="text-sm">{pageCount} pages</p>
              </Box>
            )}
            {createdAt && (
              <Box className="space-y-1">
                <p className="text-xs text-muted-foreground">Created At</p>
                <p className="text-sm">{formatDate(createdAt)}</p>
              </Box>
            )}
            {updatedAt && (
              <Box className="space-y-1">
                <p className="text-xs text-muted-foreground">Updated At</p>
                <p className="text-sm">{formatDate(updatedAt)}</p>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
