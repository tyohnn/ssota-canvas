import React from 'react';

import { Separator } from '@/components/ui/separator';
import { ColorToolbarItem } from '@/domains/block-management/frontend/components/block/common-toolbar-items/color-toolbar-item';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import { ShapeTypeToolbarItem } from './shape-type-toolbar-item';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
// Mount toolbar: 도형·색상만 표시 (BorderStyle 제외)
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
  const { readonly } = useCanvasReadOnly();

  // readonly 모드에서는 전체 toolbar items를 숨김
  if (readonly) {
    return null;
  }

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
      <Separator orientation="vertical" className="h-4!" />
    </>
  );
}
