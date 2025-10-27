'use client';

import React, { useCallback } from 'react';
import { useBlockPropertyUpdate } from '../../hooks/use-block-property-update';
import {
  ColorToolbarItem,
  FontSizeToolbarItem,
  TextAlignToolbarItem,
  RichStyleToolbarItem,
} from './index';
import {
  FontSize,
  TextAlign,
} from '../../../shared/types/block-properties.types';
import { ColorToken } from '../../../shared/types/style-tokens.types';

interface BlockToolbarMapperProps {
  blockId: string;
  blockType: string;
  blockData?: any;
  disabled?: boolean;
}

/**
 * 블럭 타입별 툴바 아이템 매핑 컴포넌트
 *
 * 각 블럭 타입에 따라 적절한 툴바 아이템을 렌더링
 */
export function BlockToolbarMapper({
  blockId,
  blockType,
  blockData,
  disabled = false,
}: BlockToolbarMapperProps) {
  const { updateProperty } = useBlockPropertyUpdate();

  // 속성 업데이트 핸들러
  const handlePropertyUpdate = useCallback(
    async (propertyPath: string, value: any) => {
      await updateProperty(blockId, propertyPath, value);
    },
    [blockId, updateProperty]
  );

  // 블럭 타입별 툴바 아이템 매핑
  const renderToolbarItem = () => {
    switch (blockType) {
      case 'text':
        return (
          <>
            <ColorToolbarItem
              blockId={blockId}
              blockMountId={blockData?.blockMountId}
              currentColor={
                (blockData?.properties?.color as ColorToken) || ColorToken.GRAY
              }
              disabled={disabled}
              onColorChange={async color => {
                await handlePropertyUpdate('properties.color', color);
              }}
            />
            <FontSizeToolbarItem
              blockId={blockId}
              blockMountId={blockData?.blockMountId}
              currentFontSize={
                blockData?.properties?.fontSize || FontSize.MEDIUM
              }
              disabled={disabled}
              onFontSizeChange={async fontSize => {
                await handlePropertyUpdate('properties.fontSize', fontSize);
              }}
            />
            <TextAlignToolbarItem
              blockId={blockId}
              blockMountId={blockData?.blockMountId}
              currentAlign={blockData?.properties?.textAlign || TextAlign.LEFT}
              disabled={disabled}
              onAlignChange={async align => {
                await handlePropertyUpdate('properties.textAlign', align);
              }}
            />
            <RichStyleToolbarItem
              blockId={blockId}
              blockMountId={blockData?.blockMountId}
              currentRichStyle={blockData?.properties?.richStyle || false}
              disabled={disabled}
              onRichStyleChange={async richStyle => {
                await handlePropertyUpdate('properties.richStyle', richStyle);
              }}
            />
          </>
        );

      case 'basic':
        return <></>;

      case 'markdown':
        return <></>;

      case 'youtube':
        return <></>;

      default:
        // 기본 블럭 타입에 대한 기본 툴바 아이템
        return <></>;
    }
  };

  return <div className="flex items-center gap-2">{renderToolbarItem()}</div>;
}
