/**
 * Library Image Card
 *
 * Workspace Library 탭의 이미지 카드 컴포넌트
 */

'use client';

import { Eye, EyeOff, Info } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@workspace/ui/components/ui/tooltip';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';
import {
  ImageCardBase,
  ImageBase,
  ImageCardOverlay,
} from '../../common/components';

/**
 * Settings Button Component
 */
function SettingsButton({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="secondary"
            onClick={e => {
              e.stopPropagation();
              onOpenSettings();
            }}
            className="h-8 w-8 p-0"
          >
            <Info className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Image settings</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Image Info Component
 */
function ImageInfo({ image }: { image: ImageAsset }) {
  return (
    <div className="text-white space-y-1">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{image.title || 'Untitled'}</p>
        {image.is_public ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Eye className="h-3 w-3" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Public image - Displayed in community</p>
                <p className="text-xs text-muted-foreground">
                  Credit awarded per usage
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <EyeOff className="h-3 w-3 opacity-60" />
        )}
      </div>
      <p className="text-xs opacity-80">
        {image.asset_type === 'ai-generated' && '🤖 AI Generated'}
        {image.asset_type === 'unsplash' && '📸 Unsplash'}
        {image.asset_type === 'user-upload' && '📤 Uploaded'}
      </p>
    </div>
  );
}

export interface LibraryImageCardProps {
  image: ImageAsset;
  onSelect: () => void;
  onDelete: () => void;
  onOpenSettings: () => void;
}

/**
 * Library Image Card
 */
export function LibraryImageCard({
  image,
  onSelect,
  onDelete,
  onOpenSettings,
}: LibraryImageCardProps) {
  return (
    <ImageCardBase onClick={onSelect}>
      <ImageBase
        src={image.thumbnail_url || image.signed_url || ''}
        alt={image.title || 'Image'}
        className="cursor-pointer"
      />

      {/* Overlay */}
      <ImageCardOverlay
        topContent={<SettingsButton onOpenSettings={onOpenSettings} />}
        bottomContent={<ImageInfo image={image} />}
      />
    </ImageCardBase>
  );
}
