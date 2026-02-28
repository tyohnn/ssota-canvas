'use client';

import { FileText } from 'lucide-react';

import { Box } from '@workspace/ui/components/ui/box';

export interface PdfPreviewCardProps {
  title: string | null;
  properties: Record<string, unknown>;
}

export function PdfPreviewCard({ title, properties }: PdfPreviewCardProps) {
  const filename = properties.filename as string | undefined;
  const pageCount = properties.pageCount as number | undefined;

  const displayTitle = filename || title || 'PDF';

  return (
    <Box className="flex flex-col h-full min-h-0 p-4 justify-center items-center gap-2">
      <FileText className="w-12 h-12 shrink-0 text-muted-foreground" />
      <h3 className="text-sm font-semibold text-foreground truncate w-full text-center">
        {displayTitle}
      </h3>
      {pageCount != null && (
        <p className="text-xs text-muted-foreground">
          {pageCount} page{pageCount !== 1 ? 's' : ''}
        </p>
      )}
    </Box>
  );
}
