import React from 'react';
import { ShapeTypeToolbarItem } from './shape-type-toolbar-item';
import { ColorToolbarItem } from '../../../common-toolbar-items/color-toolbar-item';
import { BorderStyleToolbarItem } from '../../../common-toolbar-items/border-style-toolbar-item';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
export function ShapeToolbarItems({
  blockId,
  blockMountId,
  blockData,
  disabled,
  onPropertyUpdate,
  zoom = 1,
}: {
  blockId: string;
  blockMountId?: string;
  blockData: any;
  disabled: boolean;
  onPropertyUpdate: (path: string, value: any) => Promise<void>;
  zoom?: number;
}) {
  const shapeProperties = blockData.properties;

  return (
    <>
      <ShapeTypeToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentShapeType={shapeProperties.shapeType}
        disabled={disabled}
        onShapeTypeChange={async (shapeType: any) => {
          await onPropertyUpdate('properties.shapeType', shapeType);
        }}
        zoom={zoom}
      />
      <ColorToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentColor={shapeProperties.color}
        disabled={disabled}
        onColorChange={async (color: any) => {
          await onPropertyUpdate('properties.color', color);
        }}
        zoom={zoom}
      />
      <BorderStyleToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentBorderStyle={shapeProperties.borderStyle}
        disabled={disabled}
        onBorderStyleChange={async (borderStyle: any) => {
          await onPropertyUpdate('properties.borderStyle', borderStyle);
        }}
        zoom={zoom}
      />
    </>
  );
}
