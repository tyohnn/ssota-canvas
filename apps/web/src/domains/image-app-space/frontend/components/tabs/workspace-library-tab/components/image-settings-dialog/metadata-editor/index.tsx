/**
 * Image Metadata Editor
 *
 * Process Model: Scenario 6 - 이미지 메타데이터 편집
 */

'use client';

import { Button } from '@workspace/ui/components/ui/button';
import { MetadataEditorContext } from './core/metadata-editor.context';
import { useMetadataEditor } from './core/use-metadata-editor';
import {
  TitleInput,
  DescriptionTextarea,
  TagsInput,
  CategorySelect,
} from './components/form-fields';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';
import { Box } from '@workspace/ui/components/ui/box';

interface ImageMetadataEditorProps {
  imageAsset: ImageAsset;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ImageMetadataEditor({
  imageAsset,
  onClose,
  onSuccess,
}: ImageMetadataEditorProps) {
  const contextValue = useMetadataEditor(imageAsset, () => {
    onSuccess?.();
    onClose();
  });

  return (
    <MetadataEditorContext.Provider value={contextValue}>
      <Box className="space-y-6">
        <h2 className="text-lg font-semibold">Edit Metadata</h2>

        <TitleInput />
        <DescriptionTextarea />
        <TagsInput />
        <CategorySelect />

        {contextValue.errors.general && (
          <p className="text-sm text-destructive">
            {contextValue.errors.general}
          </p>
        )}

        <Box className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={contextValue.isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={contextValue.saveMetadata}
            disabled={contextValue.isSaving}
          >
            {contextValue.isSaving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Box>
    </MetadataEditorContext.Provider>
  );
}
