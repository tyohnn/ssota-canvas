/**
 * Metadata Editor Hook
 */

'use client';

import { useState, useCallback } from 'react';
import { updateImageMetadataAction } from '@/domains/image-app-space/actions/image-asset.actions';
import type { ImageAsset, ImageCategory } from '@/db/schemas/image-app-space-schema';
import type { MetadataEditorContextValue } from './metadata-editor.context';

export function useMetadataEditor(
  imageAsset: ImageAsset,
  onSuccess?: () => void
): MetadataEditorContextValue {
  const [title, setTitle] = useState(imageAsset.title || '');
  const [description, setDescription] = useState(imageAsset.description || '');
  const [tags, setTags] = useState<string[]>(imageAsset.tags || []);
  const [category, setCategory] = useState<ImageCategory | undefined>(
    imageAsset.category || undefined
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (tags.length > 10) {
      newErrors.tags = 'Maximum 10 tags allowed';
    }

    if (title.length > 200) {
      newErrors.title = 'Title is too long (max 200 characters)';
    }

    if (description.length > 1000) {
      newErrors.description = 'Description is too long (max 1000 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, description, tags]);

  const saveMetadata = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateImageMetadataAction({
        imageAssetId: imageAsset.id,
        title: title || undefined,
        description: description || undefined,
        tags: tags.length > 0 ? tags : undefined,
        category,
      });

      if (!result.success) {
        setErrors({ general: result.error });
        return;
      }

      onSuccess?.();
    } catch (error) {
      setErrors({
        general:
          error instanceof Error ? error.message : 'Failed to save metadata',
      });
    } finally {
      setIsSaving(false);
    }
  }, [imageAsset.id, title, description, tags, category, validateForm, onSuccess]);

  return {
    title,
    description,
    tags,
    category,
    errors,
    isSaving,
    setTitle,
    setDescription,
    setTags,
    setCategory,
    validateForm,
    saveMetadata,
  };
}

