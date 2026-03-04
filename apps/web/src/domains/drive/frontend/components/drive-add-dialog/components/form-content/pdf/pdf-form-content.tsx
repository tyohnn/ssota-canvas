'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { FileWithPreview } from '@workspace/ui/hooks/use-file-upload';
import { useFileUpload } from '@workspace/ui/hooks/use-file-upload';
import { cn } from '@workspace/ui/lib/utils';
import { ChevronLeft, ChevronRight, Paperclip } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

import { Box } from '@/components/ui/box';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();
const MAX_SIZE_MB = 6;
const MAX_SIZE = MAX_SIZE_MB * 1024 * 1024;

export interface PdfFormContentProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  title: string;
  onTitleChange: (value: string) => void;
  workspaceId: string;
  onWorkspaceIdChange: (value: string) => void;
  workspaces: Array<{ workspaceId: string; name: string; icon?: string | null }>;
  isLoadingWorkspaces: boolean;
  isUploading?: boolean;
}

export function PdfFormContent({
  selectedFile,
  onFileSelect,
  title,
  onTitleChange,
  workspaceId,
  onWorkspaceIdChange,
  workspaces,
  isLoadingWorkspaces,
  isUploading = false,
}: PdfFormContentProps) {
  const [
    { isDragging, errors: uploadErrors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
      clearFiles,
    },
  ] = useFileUpload({
    accept: 'application/pdf,.pdf',
    maxSize: MAX_SIZE,
    multiple: false,
    onFilesAdded: (addedFiles: FileWithPreview[]) => {
      const file = addedFiles[0]?.file;
      onFileSelect(file instanceof File ? file : null);
    },
  });

  const handleRemove = useCallback(() => {
    clearFiles();
    onFileSelect(null);
  }, [clearFiles, onFileSelect]);

  const showPdfPreview = !!selectedFile;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(280);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const handleDocumentLoadSuccess = useCallback((params: { numPages: number }) => {
    setNumPages(params.numPages);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    if (!showPdfPreview) return;
    setNumPages(null);
    setCurrentPage(1);
  }, [selectedFile?.name, showPdfPreview]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect?.width) setContainerWidth(Math.max(rect.width, 200));
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth || 280);
    return () => ro.disconnect();
  }, [showPdfPreview]);

  return (
    <Box className="space-y-2">
      <p className="text-sm font-medium text-foreground">PDF file</p>
      {showPdfPreview && (
        <Box
          ref={containerRef}
          className={cn(
            'relative flex flex-col w-full min-h-[280px] max-h-[400px] rounded-lg border border-border overflow-hidden bg-muted',
            '[-webkit-mask:linear-gradient(#000_0_0)] [mask:linear-gradient(#000_0_0)]'
          )}
        >
          <Document
            file={selectedFile}
            onLoadSuccess={handleDocumentLoadSuccess}
            loading={
              <Box className="flex flex-1 items-center justify-center min-h-[200px]">
                <Skeleton className="w-24 h-32 bg-muted-foreground/20" />
              </Box>
            }
            className="flex flex-col flex-1 min-h-0"
          >
            {numPages != null && numPages > 0 && (
              <>
                <Box className="flex shrink-0 items-center justify-center gap-0.5 bg-background/80 backdrop-blur-sm border-b border-border px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <span className="px-2 text-xs text-muted-foreground tabular-nums">
                    {currentPage} / {numPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(p => Math.min(numPages, p + 1))
                    }
                    disabled={currentPage >= numPages}
                    className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </Box>
                <Box className="flex-1 min-h-0 overflow-auto p-2">
                  <Box className="flex justify-center">
                    <Page
                      key={currentPage}
                      pageNumber={currentPage}
                      width={Math.max(200, containerWidth - 16)}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={
                        <Box className="flex items-center justify-center min-h-[200px]">
                          <Skeleton className="w-24 h-32 bg-muted-foreground/20" />
                        </Box>
                      }
                      className="shadow-sm"
                    />
                  </Box>
                </Box>
              </>
            )}
          </Document>
          <Box
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-linear-to-t from-card to-transparent"
            aria-hidden
          />
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              handleRemove();
            }}
            className="absolute top-2 right-2 z-10 text-xs px-2 py-1 rounded bg-background/80 hover:bg-background border border-border pointer-events-auto"
          >
            Remove
          </button>
        </Box>
      )}
      {!showPdfPreview && (
      <Box
        role="button"
        tabIndex={0}
        onClick={isUploading ? undefined : openFileDialog}
        onKeyDown={e => e.key === 'Enter' && !isUploading && openFileDialog()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={isDragging || undefined}
        className={cn(
          'rounded-lg border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center min-h-[120px] w-full min-w-0 transition-colors',
          !isUploading && 'cursor-pointer hover:bg-muted/50',
          isDragging && 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
        )}
      >
        <input
          {...getInputProps()}
          className="sr-only"
          aria-label="Upload PDF"
          disabled={isUploading}
        />
        <Box className="flex flex-col items-center justify-center text-center px-4 py-6">
            <Box
              className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background"
              aria-hidden
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Box>
            <p className="text-sm font-medium text-foreground">
              {isUploading
                ? 'Uploading...'
                : 'Drop PDF or click to upload'}
            </p>
            {!isUploading && (
              <p className="text-xs text-muted-foreground mt-1">
                Max {MAX_SIZE_MB}MB
              </p>
            )}
          </Box>
        {uploadErrors[0] && (
          <p className="text-xs text-destructive mt-2 px-4">{uploadErrors[0]}</p>
        )}
      </Box>
      )}
    </Box>
  );
}
