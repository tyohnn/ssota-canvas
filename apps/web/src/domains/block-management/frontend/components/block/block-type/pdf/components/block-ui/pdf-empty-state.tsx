'use client';

import { FileText } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { cn } from '@workspace/ui/lib/utils';

export interface PdfEmptyStateProps {
  selected: boolean;
  isDragging: boolean;
  uploadErrors: string[];
  openFileDialog: () => void;
  getInputProps: () => Record<string, unknown>;
  onDragEnter: (e: React.DragEvent<HTMLElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLElement>) => void;
  onDrop: (e: React.DragEvent<HTMLElement>) => void;
}

const MAX_SIZE_MB = 6;

export function PdfEmptyState({
  selected,
  isDragging,
  uploadErrors,
  openFileDialog,
  getInputProps,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: PdfEmptyStateProps) {
  return (
    <div
      role="button"
      onClick={selected ? openFileDialog : undefined}
      onDragEnter={selected ? onDragEnter : undefined}
      onDragLeave={selected ? onDragLeave : undefined}
      onDragOver={selected ? onDragOver : undefined}
      onDrop={selected ? onDrop : undefined}
      data-dragging={isDragging || undefined}
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center',
        'transition-colors',
        selected && 'cursor-pointer',
        selected && 'hover:bg-accent/50',
        isDragging &&
          'bg-blue-50 dark:bg-blue-950/30 border-2 border-dashed border-blue-400 dark:border-blue-500'
      )}
    >
      <input
        {...getInputProps()}
        className="sr-only"
        aria-label="Upload PDF"
      />
      <Box className="flex flex-col items-center justify-center text-center px-4">
        <div
          className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background"
          aria-hidden
        >
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="mb-1 text-sm font-medium text-foreground">
          {selected
            ? 'Drop or click to upload PDF'
            : 'Select the block to add a PDF'}
        </p>
        {selected && (
          <p className="text-xs text-muted-foreground">Max {MAX_SIZE_MB}MB</p>
        )}
      </Box>
      {uploadErrors.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
            <span>{uploadErrors[0]}</span>
          </div>
        </div>
      )}
    </div>
  );
}
