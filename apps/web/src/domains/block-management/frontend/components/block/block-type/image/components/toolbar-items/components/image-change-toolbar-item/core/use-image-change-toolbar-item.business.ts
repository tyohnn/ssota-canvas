/**
 * Image Change Toolbar Item Business Logic
 *
 * 비즈니스 로직만 처리
 * - 파일 선택
 * - 이미지 업로드 (공통 훅 사용)
 * - Properties 업데이트
 * - 블록 크기 자동 조정 (종횡비 맞춤)
 */

'use client';

import { useCallback } from 'react';

import { useReactFlow } from '@xyflow/react';

import { useImageUpload } from '@/domains/block-management/frontend/components/block/block-type/image/core/use-image-upload';
import { calculateBlockSizeFromImage } from '@/domains/block-management/frontend/components/block/block-type/image/utils/image-file.utils';
import { useUpdateBlockSize } from '@/domains/block-management/frontend/hooks/use-block-commands';

import { useImageToolbarContext } from '../../../core/image-toolbar.context';
import type { ImageChangeBusinessLogic } from './types';

/**
 * Business Logic Hook (Production)
 */
export function useImageChangeToolbarItemBusiness(
  workspaceId: string,
  disabled: boolean,
  onPropertiesChange?: (properties: Record<string, any>) => Promise<void>
): ImageChangeBusinessLogic {
  const { blockMountId, height: currentHeight } = useImageToolbarContext();
  const { getNodes, setNodes } = useReactFlow();
  const { updateBlockSize } = useUpdateBlockSize({
    reactFlow: {
      getNodes,
      setNodes,
    },
  });

  // 공통 이미지 업로드 훅 사용
  const { uploadImage, isUploading } = useImageUpload({
    workspaceId,
    onSuccess: async (properties, metadata) => {
      if (onPropertiesChange) {
        await onPropertiesChange(properties);
      }

      // 이미지 종횡비에 맞춰 블록 크기 업데이트 (Optimistic update 포함)
      if (blockMountId && metadata?.width && metadata?.height) {
        const newSize = calculateBlockSizeFromImage(
          metadata.width,
          metadata.height,
          currentHeight
        );

        await updateBlockSize({
          blockMountId,
          width: newSize.width,
          height: newSize.height,
        });
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
