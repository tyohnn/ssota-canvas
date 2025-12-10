/**
 * Image Toolbar Provider
 *
 * Context Provider 컴포넌트
 */

'use client';

import { useMemo, useCallback } from 'react';
import { ImageToolbarContext } from './image-toolbar.context';
import type { ImageToolbarItemsProps, ImageToolbarContextValue } from './types';
import type { ImageBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

/**
 * Image Toolbar Provider Component
 */
export function ImageToolbarProvider({
  blockId,
  blockMountId,
  blockData,
  disabled,
  onPropertyUpdate,
  onPropertiesUpdate,
  width,
  height,
  children,
}: ImageToolbarItemsProps & { children: React.ReactNode }) {
  // Properties 추출 (ImageBlockProperties로 타입 캐스팅)
  const properties = blockData.properties as ImageBlockProperties;

  const imageProperties = useMemo(
    () => ({
      imageUrl: properties.imageUrl,
      imageAssetId: properties.imageAssetId,
      imageSource: properties.imageSource,
      objectFit: properties.objectFit || 'contain',
      caption: properties.caption,
      isCaptionVisible: properties.isCaptionVisible ?? false,
      alt: properties.alt,
      unsplashAuthorName: properties.unsplashAuthorName,
      unsplashAuthorLink: properties.unsplashAuthorLink,
    }),
    [properties]
  );

  // 단일 속성 업데이트
  const updateProperty = useCallback(
    async (key: string, value: any) => {
      await onPropertyUpdate(`properties.${key}`, value);
    },
    [onPropertyUpdate]
  );

  // Context value 생성
  const contextValue: ImageToolbarContextValue = useMemo(
    () => ({
      blockId,
      blockMountId,
      blockData,
      disabled,
      workspaceId: blockData.workspaceId,
      orgId: blockData.orgId,
      pageId: blockData.pageId,
      width,
      height,
      imageProperties,
      updateProperty,
      onPropertiesUpdate,
    }),
    [
      blockId,
      blockMountId,
      blockData,
      disabled,
      width,
      height,
      updateProperty,
      onPropertiesUpdate,
    ]
  );

  return (
    <ImageToolbarContext.Provider value={contextValue}>
      {children}
    </ImageToolbarContext.Provider>
  );
}
