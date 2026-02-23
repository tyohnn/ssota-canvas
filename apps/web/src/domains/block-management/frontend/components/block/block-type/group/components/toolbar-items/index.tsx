'use client';

import React from 'react';

import { Separator } from '@/components/ui/separator';
import { ColorToolbarItem } from '@/domains/block-management/frontend/components/block/common-toolbar-items/color-toolbar-item';
import { ColorToken } from '@/domains/block-management/shared/types/style-tokens.types';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import type { GroupBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

export function GroupToolbarItems({
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

  if (readonly) {
    return null;
  }

  const groupProperties = (blockData?.properties ?? {}) as Partial<GroupBlockProperties>;
  const currentColor = groupProperties.color ?? ColorToken.BLUE;

  return (
    <>
      <ColorToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentColor={currentColor}
        disabled={disabled}
        onColorChange={async color => {
          await onPropertyUpdate('properties.color', color);
        }}
        zoom={zoom}
      />
      <Separator orientation="vertical" className="h-6!" />
    </>
  );
}
