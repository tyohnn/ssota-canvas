/**
 * Workspace Library Image Grid
 */

'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import { useWorkspaceLibraryContext } from '../core/workspace-library.context';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';

/**
 * Library Image Card
 */
function LibraryImageCard({
  image,
  onSelect,
  onDelete,
}: {
  image: ImageAsset;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border bg-card">
      <img
        src={image.thumbnail_url || image.image_url}
        alt={image.title || 'Image'}
        className="h-full w-full object-cover cursor-pointer transition-transform group-hover:scale-105"
        onClick={onSelect}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Delete Button - Temporarily disabled */}
        {false && (
          <div className="absolute top-2 right-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-8 w-8 p-0"
              disabled
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="absolute bottom-2 left-2 text-white">
          <p className="text-sm font-medium">{image.title || 'Untitled'}</p>
          <p className="text-xs opacity-80">
            {image.asset_type === 'ai-generated' && '🤖 AI Generated'}
            {image.asset_type === 'unsplash' && '📸 Unsplash'}
            {image.asset_type === 'user-upload' && '📤 Uploaded'}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Workspace Library Image Grid
 */
export function WorkspaceLibraryImageGrid() {
  const { images, isLoading, onSelectImage, deleteImage } =
    useWorkspaceLibraryContext();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">이미지가 없습니다</p>
          <p className="text-sm">이미지를 생성하거나 추가해보세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map(image => (
          <LibraryImageCard
            key={image.id}
            image={image}
            onSelect={() => onSelectImage(image)}
            onDelete={() => deleteImage(image.id)}
          />
        ))}
      </div>
    </div>
  );
}
