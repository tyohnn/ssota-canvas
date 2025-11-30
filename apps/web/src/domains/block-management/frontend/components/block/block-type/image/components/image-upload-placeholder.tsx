/**
 * ImageUploadPlaceholder Component
 *
 * 드래그앤드롭 및 파일 선택 UI
 */

import { cn } from '@workspace/ui/lib/utils';
import { ImageIcon } from 'lucide-react';

export interface ImageUploadPlaceholderProps {
  selected: boolean;
  isDragging: boolean;
  uploadErrors: string[];
  maxSizeMB: number;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  onOpenFileDialog: () => void;
  onDragEnter: (e: React.DragEvent<HTMLElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLElement>) => void;
  onDrop: (e: React.DragEvent<HTMLElement>) => void;
}

export function ImageUploadPlaceholder({
  selected,
  isDragging,
  uploadErrors,
  maxSizeMB,
  inputProps,
  onOpenFileDialog,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: ImageUploadPlaceholderProps) {
  return (
    <div
      role="button"
      onClick={selected ? onOpenFileDialog : undefined}
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
        {...inputProps}
        className="sr-only"
        aria-label="Upload image"
      />
      <div className="flex flex-col items-center justify-center text-center px-4">
        <div
          className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background"
          aria-hidden="true"
        >
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="mb-1 text-sm font-medium text-foreground">
          {selected
            ? '이미지를 드롭하거나 클릭하여 업로드'
            : '이미지를 추가하려면 블록을 선택하세요'}
        </p>
        {selected && (
          <p className="text-xs text-muted-foreground">
            최대 {maxSizeMB}MB
          </p>
        )}
      </div>
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

