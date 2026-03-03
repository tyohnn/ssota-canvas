'use client';

import { useCallback, useState } from 'react';

import { AlertCircleIcon, ImageIcon, ImageOff, Trash2 } from 'lucide-react';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import {
  type FileWithPreview,
  useFileUpload,
} from '@workspace/ui/hooks/use-file-upload';
import { cn } from '@workspace/ui/lib/utils';

import type { PropertyUIDefinition } from '../types';

export interface ImageUploadPropertyProps {
  value: string | null | undefined;
  propertyDef: PropertyUIDefinition;
  onChange: (value: string) => Promise<void>;
  disabled?: boolean;
  /** Upload function - injected by caller (e.g. apps/web with Supabase) */
  onUpload: (file: File) => Promise<string>;
}

/**
 * Image Upload Property Input
 * Accepts onUpload via props - caller provides storage implementation.
 */
export function ImageUploadProperty({
  value,
  propertyDef,
  onChange,
  disabled = false,
  onUpload,
}: ImageUploadPropertyProps) {
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const maxSizeMB = 10;
  const maxSize = maxSizeMB * 1024 * 1024;

  const [
    { files, isDragging, errors: uploadErrors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept: 'image/*',
    maxSize,
    multiple: false,
    onFilesAdded: async (addedFiles: FileWithPreview[]) => {
      const fileWithPreview = addedFiles[0];
      if (fileWithPreview?.file instanceof File) {
        try {
          setIsUploading(true);
          const url = await onUpload(fileWithPreview.file);
          await onChange(url);
        } catch (error) {
          console.error('Failed to upload image:', error);
          if (fileWithPreview.preview) {
            await onChange(fileWithPreview.preview);
          }
        } finally {
          setIsUploading(false);
        }
      }
    },
  });

  const handleImageLoad = useCallback(() => setHasError(false), []);
  const handleImageError = useCallback(() => setHasError(true), []);

  const handleRemoveImage = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!disabled) {
        await onChange('');
        if (files[0]) removeFile(files[0].id);
      }
    },
    [disabled, onChange, files, removeFile]
  );

  const handleFileSelect = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async event => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            setIsUploading(true);
            const url = await onUpload(file);
            await onChange(url);
          } catch (error) {
            console.error('Failed to upload image:', error);
            const reader = new FileReader();
            reader.onload = async ev => {
              const url = ev.target?.result as string;
              await onChange(url);
            };
            reader.readAsDataURL(file);
          } finally {
            setIsUploading(false);
          }
        }
      };
      input.click();
    },
    [disabled, onUpload, onChange]
  );

  if (value) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={handleFileSelect}
          className={cn(
            'relative rounded border border-border overflow-hidden',
            'w-32 h-18',
            'hover:border-blue-400 dark:hover:border-blue-500 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <ImageOff className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <img
              src={value}
              alt="Preview"
              onLoad={handleImageLoad}
              onError={handleImageError}
              className="w-full h-full object-cover"
            />
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Skeleton className="w-full h-full" />
            </div>
          )}
        </button>
        {isHovered && !disabled && !isUploading && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className={cn(
              'absolute top-1 right-1 z-10',
              'flex items-center justify-center w-5 h-5 rounded-full',
              'bg-destructive text-destructive-foreground',
              'hover:bg-destructive/90 transition-colors shadow-md'
            )}
            aria-label="Remove image"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {isUploading ? (
        <Skeleton className="w-12 h-12 rounded" />
      ) : (
        <button
          type="button"
          onClick={handleFileSelect}
          disabled={disabled}
          className={cn(
            'relative w-12 h-12 rounded border border-border overflow-hidden',
            'flex items-center justify-center',
            'hover:border-blue-400 dark:hover:border-blue-500 hover:bg-accent transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </button>
      )}
      <input {...getInputProps()} className="sr-only" aria-label="Upload image" disabled={disabled} />
      {uploadErrors.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{uploadErrors[0]}</span>
        </div>
      )}
    </div>
  );
}
