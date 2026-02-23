'use client';

import { Box } from '@/components/ui/box';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { cn } from '@workspace/ui/lib/utils';

import type { PdfViewProps } from '../../core/types';
import { PdfEmptyState } from './pdf-empty-state';
import { PdfViewer } from './pdf-viewer';

/**
 * PDF Block View (Presentational)
 *
 * Props only. Composes PdfEmptyState and PdfViewer.
 */
export function PdfView({
  url,
  filename,
  selected,
  hasError,
  errorMessage,
  isUploading,
  uploadErrors,
  isDragging,
  width,
  height,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  openFileDialog,
  getInputProps,
  onDocumentLoadSuccess,
  onDocumentLoadError,
}: PdfViewProps) {
  const shouldShowEmptyState = !url && !isUploading;
  const shouldShowViewer = url && !isUploading;

  return (
    <Box className="relative flex-1 overflow-hidden bg-muted/30 min-h-[200px]">
      {shouldShowEmptyState && (
        <PdfEmptyState
          selected={selected}
          isDragging={isDragging}
          uploadErrors={uploadErrors}
          openFileDialog={openFileDialog}
          getInputProps={getInputProps}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      )}

      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      )}

      {shouldShowViewer && (
        <div
          className={cn(
            'absolute inset-0',
            !selected && 'pointer-events-none'
          )}
        >
          <PdfViewer
            url={url}
            filename={filename}
            width={width}
            height={height}
            hasError={hasError}
            errorMessage={errorMessage}
            onDocumentLoadSuccess={onDocumentLoadSuccess}
            onDocumentLoadError={onDocumentLoadError}
          />
        </div>
      )}
    </Box>
  );
}
