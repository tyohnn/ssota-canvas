'use client';

import { Mic, Music, Upload } from 'lucide-react';

import { Button } from '@workspace/ui/components/ui/button';
import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';

export interface AudioEmptyStateProps {
  selected: boolean;
  isDragging: boolean;
  uploadErrors: string[];
  maxSizeMB: number;
  openFileDialog: () => void;
  getInputProps: () => object;
  onDragEnter: (e: React.DragEvent<HTMLElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLElement>) => void;
  onDrop: (e: React.DragEvent<HTMLElement>) => void;
  onOpenRecordDialog: () => void;
}

export function AudioEmptyState({
  selected,
  isDragging,
  uploadErrors,
  maxSizeMB,
  openFileDialog,
  getInputProps,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onOpenRecordDialog,
}: AudioEmptyStateProps) {
  return (
    <Box
      onDragEnter={selected ? onDragEnter : undefined}
      onDragLeave={selected ? onDragLeave : undefined}
      onDragOver={selected ? onDragOver : undefined}
      onDrop={selected ? onDrop : undefined}
      data-dragging={isDragging || undefined}
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-4 p-6',
        'transition-colors',
        isDragging &&
          'bg-blue-50 dark:bg-blue-950/30 border-2 border-dashed border-blue-400 dark:border-blue-500'
      )}
    >
      <input
        {...getInputProps()}
        className="sr-only"
        aria-label="Upload audio"
      />
      <Box className="flex flex-col items-center justify-center text-center">
        <Box
          className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background"
          aria-hidden
        >
          <Music className="h-5 w-5 text-muted-foreground" />
        </Box>
        <p className="mb-1 text-sm font-medium text-foreground">Add audio</p>
        <p className="text-xs text-muted-foreground mb-3">
          Drop a file or use the button below (max {maxSizeMB} MB)
        </p>
        <Box className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={e => {
                  e.stopPropagation();
                  openFileDialog();
                }}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload file
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={e => {
                  e.stopPropagation();
                  onOpenRecordDialog();
                }}
                className="gap-2"
              >
                <Mic className="w-4 h-4" />
                Record
              </Button>
            </Box>
      </Box>
      {uploadErrors.length > 0 && (
        <Box className="absolute bottom-4 left-4 right-4">
          <Box className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
            <span>{uploadErrors[0]}</span>
          </Box>
        </Box>
      )}
    </Box>
  );
}
