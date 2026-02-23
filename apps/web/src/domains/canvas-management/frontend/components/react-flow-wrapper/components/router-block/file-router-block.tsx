'use client';

import React, { memo, useCallback, useEffect, useState } from 'react';

import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { Paperclip } from 'lucide-react';
import {
  type FileWithPreview,
  useFileUpload,
} from '@workspace/ui/hooks/use-file-upload';
import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';

import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';

import { BlockType } from '@/domains/block-management/shared/types/block-types';

import { resolveFileToBlockConfig } from './utils/file-block-resolver';
import type { RouterNodeData } from './core/use-router-block';
import { useRouterBlock } from './core/use-router-block';

const FILE_ROUTER_SIZE = { width: 250, height: 150 };

/**
 * File Router Block
 *
 * Phantom node that accepts a file (drop or click), uploads to Supabase,
 * resolves the block type (Image, PDF, Audio, File), then replaces itself
 * with the real block.
 */
export const FileRouterBlock = memo(function FileRouterBlock({
  id,
  data,
}: NodeProps) {
  const nodeData = data as unknown as RouterNodeData;
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { resolveAndCreateBlock, cancel } = useRouterBlock({
    nodeId: id,
    nodeData,
  });
  const { upload } = useSupabaseStorage();

  const maxSizeMB = 50;
  const maxSize = maxSizeMB * 1024 * 1024;

  const handleFileProcessed = useCallback(
    async (file: File) => {
      if (isUploading) return;

      setIsUploading(true);
      setError(null);

      try {
        const result = await upload({
          bucket: StorageBucket.CANVAS_ASSETS,
          file,
        });

        const { blockType } = resolveFileToBlockConfig(file);

        let initialProperties: Record<string, unknown>;

        switch (blockType) {
          case BlockType.IMAGE:
            initialProperties = {
              imageUrl: result.url,
              imageSource: 'user-upload',
              objectFit: 'contain',
            };
            break;
          case BlockType.PDF:
            initialProperties = {
              url: result.url,
            };
            break;
          case BlockType.AUDIO:
            initialProperties = {
              audioUrl: result.url,
            };
            break;
          case BlockType.FILE:
          default:
            initialProperties = {
              url: result.url,
              filename: file.name,
              fileSize: file.size,
            };
        }

        await resolveAndCreateBlock(blockType, initialProperties);
      } catch (err) {
        console.error('[FileRouterBlock] Upload or create failed:', err);
        setError('Upload failed');
        setIsUploading(false);
      }
    },
    [isUploading, upload, resolveAndCreateBlock]
  );

  const [
    { isDragging, errors: uploadErrors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    accept: '*',
    maxSize,
    multiple: false,
    onFilesAdded: async (addedFiles: FileWithPreview[]) => {
      const fileWithPreview = addedFiles[0];
      if (fileWithPreview?.file instanceof File) {
        await handleFileProcessed(fileWithPreview.file);
      }
    },
  });

  // ESC to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancel]);

  const displayError = error || uploadErrors[0];

  return (
    <>
      <Box
        className={cn(
          'relative w-full h-full rounded-lg border border-border bg-background overflow-hidden flex flex-col'
        )}
        style={{
          width: FILE_ROUTER_SIZE.width,
          height: FILE_ROUTER_SIZE.height,
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div
          role="button"
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          className={cn(
            'nodrag nopan absolute inset-0 flex flex-col items-center justify-center transition-colors cursor-pointer hover:bg-accent/50',
            isDragging &&
              'bg-blue-50 dark:bg-blue-950/30 border-2 border-dashed border-blue-400 dark:border-blue-500'
          )}
        >
          <input
            {...getInputProps()}
            className="sr-only"
            aria-label="Upload file"
          />
          <div className="flex flex-col items-center justify-center text-center px-4">
            <div
              className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background"
              aria-hidden="true"
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mb-1 text-sm font-medium text-foreground">
              {isUploading
                ? 'Uploading...'
                : 'Drop file or click to upload'}
            </p>
            {!isUploading && (
              <p className="text-xs text-muted-foreground">
                Max {maxSizeMB}MB · Image, PDF, Audio, or any file
              </p>
            )}
          </div>
          {displayError && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded text-center">
                <span>{displayError}</span>
              </div>
            </div>
          )}
        </div>
      </Box>
    </>
  );
});
