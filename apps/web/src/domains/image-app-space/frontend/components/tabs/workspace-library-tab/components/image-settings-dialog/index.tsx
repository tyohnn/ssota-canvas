/**
 * Image Settings Dialog
 *
 * 이미지 메타데이터 및 공개 설정을 관리하는 다이얼로그
 */

'use client';

import { Info } from 'lucide-react';
import { Box } from '@workspace/ui/components/ui/box';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';
import { ImageMetadataEditor } from './metadata-editor';
import { ImageVisibilityToggle } from './visibility-toggle';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';

export interface ImageSettingsDialogProps {
  image: ImageAsset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Image Settings Dialog
 *
 * 이미지 설정 다이얼로그 컴포넌트
 * 조건부 렌더링으로 래깅 방지
 */
export function ImageSettingsDialog({
  image,
  open,
  onOpenChange,
  onSuccess,
}: ImageSettingsDialogProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Image settings</DialogTitle>
          <DialogDescription>
            Manage image metadata and public settings.
          </DialogDescription>
        </DialogHeader>

        <Box className="space-y-6">
          {/* Image Preview */}
          <Box className="aspect-video relative overflow-hidden rounded-lg border bg-muted">
            <img
              src={image.thumbnail_url || image.signed_url || image.image_url}
              alt={image.title || 'Image'}
              className="w-full h-full object-contain"
            />
          </Box>

          {/* Metadata Editor */}
          <ImageMetadataEditor
            imageAsset={image}
            onSuccess={() => {
              onSuccess?.();
              onOpenChange(false);
            }}
            onClose={() => {
              onOpenChange(false);
            }}
          />

          {/* Visibility Toggle */}
          <Box className="border-t pt-6">
            <ImageVisibilityToggle
              imageAsset={image}
              onSuccess={() => {
                onSuccess?.();
              }}
            />

            {image.is_public && (
              <Box className="mt-4 p-4 bg-primary/10 rounded-lg">
                <Box className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 text-primary" />
                  <Box className="text-sm">
                    <p className="font-medium text-primary">
                      Credit Reward Information
                    </p>
                    <p className="text-muted-foreground mt-1">
                      If the public image is used by other users, credit will be
                      awarded based on usage.
                    </p>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
