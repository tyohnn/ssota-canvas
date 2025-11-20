/**
 * Image Visibility Hook
 *
 * Process Model: Scenario 7 - 이미지 공개 설정 변경
 */

'use client';

import { useState, useCallback } from 'react';
import { changeImageVisibilityAction } from '@/domains/image-app-space/actions/image-asset.actions';
import { ImageAssetEntity } from '@/domains/image-app-space/shared/entities/image-asset.entity';
import type { ImageAsset } from '@/db/schemas/image-app-space-schema';

export function useImageVisibility(
  imageAsset: ImageAsset,
  onSuccess?: () => void
) {
  const [isChanging, setIsChanging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const entity = ImageAssetEntity.fromDatabase(imageAsset);
  const canSetPublicResult = entity.canSetPublic();

  const toggleVisibility = useCallback(async () => {
    // Public으로 전환하려는 경우 검증
    if (!imageAsset.is_public && !canSetPublicResult.valid) {
      setValidationErrors([canSetPublicResult.reason!]);
      return;
    }

    setIsChanging(true);
    setValidationErrors([]);

    try {
      const result = await changeImageVisibilityAction({
        imageAssetId: imageAsset.id,
        isPublic: !imageAsset.is_public,
      });

      if (!result.success) {
        setValidationErrors([result.error]);
        return;
      }

      onSuccess?.();
    } catch (error) {
      setValidationErrors([
        error instanceof Error ? error.message : 'Failed to change visibility',
      ]);
    } finally {
      setIsChanging(false);
    }
  }, [imageAsset, canSetPublicResult, onSuccess]);

  return {
    isPublic: imageAsset.is_public,
    isChanging,
    canSetPublic: canSetPublicResult.valid,
    validationErrors,
    toggleVisibility,
  };
}
