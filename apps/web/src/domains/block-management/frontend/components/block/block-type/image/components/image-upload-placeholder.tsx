/**
 * ImageUploadPlaceholder Component
 *
 * 이미지 업로드 전 플레이스홀더 (드래그 앤 드롭 + 클릭)
 *
 * 리팩토링: 간소화된 패턴 사용
 */

import { useState } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { ImageIcon } from 'lucide-react';
import type { FileWithPreview } from '@workspace/ui/hooks/use-file-upload';
import { Loader } from '@workspace/ui/components/ai-elements/loader';
import { Box } from '@/components/ui/box';

export interface ImageUploadPlaceholderProps {
  selected: boolean;
  maxSizeMB: number;
  isUploading?: boolean;
  onFileSelect: (files: FileWithPreview[]) => Promise<void>;
}

export function ImageUploadPlaceholder({
  selected,
  maxSizeMB,
  isUploading = false,
  onFileSelect,
}: ImageUploadPlaceholderProps) {
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  // 파일 선택 (클릭)
  const handleClick = () => {
    if (!selected || isUploading) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // 파일 크기 검증
      const maxSize = maxSizeMB * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadErrors([`File size must be less than ${maxSizeMB}MB`]);
        return;
      }

      setUploadErrors([]);

      // FileWithPreview 형식으로 변환
      const fileWithPreview: FileWithPreview = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
      };

      await onFileSelect([fileWithPreview]);
    };

    input.click();
  };

  return (
    <Box
      role="button"
      onClick={handleClick}
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center',
        'transition-colors',
        selected && !isUploading && 'cursor-pointer',
        selected && !isUploading && 'hover:bg-accent/50',
        isUploading && 'cursor-wait'
      )}
    >
      <Box
        className={cn(
          'flex flex-col items-center justify-center text-center px-4',
          isUploading && 'opacity-50'
        )}
      >
        <Box
          className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background"
          aria-hidden="true"
        >
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </Box>
        <p className="mb-1 text-sm font-medium text-foreground">
          {selected
            ? 'Drop or click to upload an image'
            : 'To add an image, select a block'}
        </p>
        {selected && (
          <p className="text-xs text-muted-foreground">Maximum {maxSizeMB}MB</p>
        )}
      </Box>
      {uploadErrors.length > 0 && (
        <Box className="absolute bottom-4 left-4 right-4">
          <Box className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
            <span>{uploadErrors[0]}</span>
          </Box>
        </Box>
      )}
      {/* 로딩 오버레이 */}
      {isUploading && (
        <Box className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
          <Box className="flex flex-col items-center gap-2">
            <Loader size={32} className="text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </Box>
        </Box>
      )}
    </Box>
  );
}
