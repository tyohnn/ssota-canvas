'use client';

import React from 'react';

import { Separator } from '@/components/ui/separator';

import { CopyLinkToolbarItem } from '../../../link/components/toolbar-items/components/copy-link-toolbar-item';
import { OpenLinkToolbarItem } from '../../../link/components/toolbar-items/components/open-link-toolbar-item';

export function XToolbarItems({
  blockId,
  blockMountId,
  blockData,
  disabled,
  readonly = false,
}: {
  blockId: string;
  blockMountId?: string;
  blockData: { properties?: { url?: string } };
  disabled: boolean;
  onPropertyUpdate?: (path: string, value: unknown) => Promise<void>;
  onPropertiesUpdate?: (updates: Record<string, unknown>) => Promise<void>;
  readonly?: boolean;
}) {
  const url = blockData?.properties?.url ?? '';

  return (
    <>
      <OpenLinkToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        url={url}
        disabled={disabled || !url}
      />
      <CopyLinkToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        url={url}
        disabled={disabled || !url}
      />
      {!readonly && <Separator orientation="vertical" className="h-4!" />}
    </>
  );
}
