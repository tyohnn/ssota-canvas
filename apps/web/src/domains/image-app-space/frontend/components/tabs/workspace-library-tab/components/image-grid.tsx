/**
 * Workspace Library Image Grid
 */

'use client';

import { useWorkspaceLibraryContext } from '../core/context';
import {
  ImageGridContainer,
  ImageGridSkeleton,
  ImageGridEmpty,
} from '../../common/components';
import { Box } from '@workspace/ui/components/ui/box';
import { LibraryImageCard } from './library-image-card';

/**
 * Workspace Library Image Grid
 */
export function WorkspaceLibraryImageGrid() {
  const { images, isLoading, onSelectImage, deleteImage, openImageSettings } =
    useWorkspaceLibraryContext();

  if (isLoading) {
    return <ImageGridSkeleton />;
  }

  if (images.length === 0) {
    return (
      <ImageGridEmpty
        title="No images found"
        description="Create or add images"
      />
    );
  }

  return (
    <Box className="flex-1 overflow-y-auto">
      <ImageGridContainer>
        {images.map(image => (
          <LibraryImageCard
            key={image.id}
            image={image}
            onSelect={() => onSelectImage(image)}
            onDelete={() => deleteImage(image.id)}
            onOpenSettings={() => openImageSettings(image)}
          />
        ))}
      </ImageGridContainer>
    </Box>
  );
}
