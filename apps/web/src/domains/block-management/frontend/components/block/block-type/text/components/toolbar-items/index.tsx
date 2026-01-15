import React from 'react';

import { ColorToolbarItem } from '@/domains/block-management/frontend/components/block/common-toolbar-items/color-toolbar-item';
import { FontSizeToolbarItem } from '@/domains/block-management/frontend/components/block/common-toolbar-items/font-size-toolbar-item';
import { RichStyleToolbarItem } from '@/domains/block-management/frontend/components/block/common-toolbar-items/rich-style-toolbar-item';
import { TextAlignToolbarItem } from '@/domains/block-management/frontend/components/block/common-toolbar-items/text-align-toolbar-item';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
export function TextToolbarItems({
  blockId,
  blockMountId,
  blockData,
  disabled,
  onPropertyUpdate,
}: {
  blockId: string;
  blockMountId?: string;
  blockData: any;
  disabled: boolean;
  onPropertyUpdate: (path: string, value: any) => Promise<void>;
}) {
  const textProperties = blockData.properties;

  return (
    <>
      <ColorToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentColor={textProperties.color}
        disabled={disabled}
        onColorChange={async (color: any) => {
          await onPropertyUpdate('properties.color', color);
        }}
      />
      <FontSizeToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentFontSize={textProperties.fontSize}
        disabled={disabled}
        onFontSizeChange={async (fontSize: any) => {
          await onPropertyUpdate('properties.fontSize', fontSize);
        }}
      />
      <TextAlignToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentAlign={textProperties.textAlign}
        disabled={disabled}
        onAlignChange={async (align: any) => {
          await onPropertyUpdate('properties.textAlign', align);
        }}
      />
      <RichStyleToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentRichStyle={textProperties.richStyle}
        disabled={disabled}
        onRichStyleChange={async (richStyle: any) => {
          await onPropertyUpdate('properties.richStyle', richStyle);
        }}
      />
    </>
  );
}
