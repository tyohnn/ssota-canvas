/**
 * Image Change Toolbar Item Business Logic
 *
 * 비즈니스 로직만 처리
 * - 파일 선택
 * - 이미지 업로드 (공통 훅 사용)
 * - Properties 업데이트
 */

'use client';

import { useCallback } from 'react';
import type { ImageChangeBusinessLogic } from './types';
import { useImageUpload } from '../../../core/use-image-upload';

/**
 * Business Logic Hook (Production)
 */
export function useImageChangeToolbarItemBusiness(
  workspaceId: string,
  disabled: boolean,
  onPropertiesChange?: (properties: Record<string, any>) => Promise<void>
): ImageChangeBusinessLogic {
  // 공통 이미지 업로드 훅 사용
  const { uploadImage, isUploading } = useImageUpload({
    workspaceId,
    onSuccess: async properties => {
      if (onPropertiesChange) {
        await onPropertiesChange(properties);
      }
    },
  });

  const handleImageChange = useCallback(() => {
    if (disabled || isUploading) return;
    if (!onPropertiesChange) return;

    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      await uploadImage(file);
    };

    input.click();
  }, [disabled, isUploading, onPropertiesChange, uploadImage]);

  return {
    handleImageChange,
    isUploading,
  };
}

/**
 * Mock Business Logic Hook (노코드 툴용)
 */
export function useMockImageChangeToolbarItemBusiness(): ImageChangeBusinessLogic {
  const handleImageChange = useCallback(() => {
    console.log('[Mock] Image change triggered');
  }, []);

  return {
    handleImageChange,
    isUploading: false,
  };
}
