'use client';

import { useCallback } from 'react';

import type { FileWithPreview } from '@workspace/ui/hooks/use-file-upload';
import { useFileUpload } from '@workspace/ui/hooks/use-file-upload';
import { cn } from '@workspace/ui/lib/utils';
import { ImageIcon } from 'lucide-react';

import { Box } from '@/components/ui/box';
const MAX_SIZE_MB = 6;
const MAX_SIZE = MAX_SIZE_MB * 1024 * 1024;

export interface ImageFormContentProps {
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

export function ImageFormContent({
  selectedFile,
  onFileSelect,
  title,
  onTitleChange,
  workspaceId,
  onWorkspaceIdChange,
  workspaces,
  isLoadingWorkspaces,
  isUploading = false,
}: ImageFormContentProps) {
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
    accept: 'image/*',
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

  return (
    <Box className="space-y-2">
      <p className="text-sm font-medium text-foreground">Image file</p>
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
          'rounded-lg border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center min-h-[120px] transition-colors',
          !isUploading && 'cursor-pointer hover:bg-muted/50',
          isDragging && 'border-blue-400 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/30'
        )}
      >
        <input
          {...getInputProps()}
          className="sr-only"
          aria-label="Upload image"
          disabled={isUploading}
        />
        {selectedFile && !isUploading ? (
          <Box className="flex flex-col items-center gap-2 p-4">
            <p className="text-sm font-medium truncate max-w-full px-2">
              {selectedFile.name}
            </p>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleRemove();
              }}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Remove
            </button>
          </Box>
        ) : (
          <Box className="flex flex-col items-center justify-center text-center px-4 py-6">
            <Box
              className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background"
              aria-hidden
            >
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </Box>
            <p className="text-sm font-medium text-foreground">
              {isUploading
                ? 'Uploading...'
                : 'Drop image or click to upload'}
            </p>
            {!isUploading && (
              <p className="text-xs text-muted-foreground mt-1">
                Max {MAX_SIZE_MB}MB
              </p>
            )}
          </Box>
        )}
        {uploadErrors[0] && (
          <p className="text-xs text-destructive mt-2 px-4">{uploadErrors[0]}</p>
        )}
      </Box>
    </Box>
  );
}
