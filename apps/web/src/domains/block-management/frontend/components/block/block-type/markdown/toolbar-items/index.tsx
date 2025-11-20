import React from 'react';
import { ColorToolbarItem } from '../../../common-toolbar-items/color-toolbar-item';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
export function MarkdownToolbarItems({
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

  const markdownProperties = blockData.properties;

  return (
    <>
      <ColorToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentColor={markdownProperties.color}
        disabled={disabled}
        onColorChange={async (color: any) => {
          await onPropertyUpdate('properties.color', color);
        }}
      />
    </>
  );
}
