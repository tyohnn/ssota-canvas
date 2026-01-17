import React from 'react';

import { Separator } from '@workspace/ui/components/ui/separator';

import { CopyLinkToolbarItem } from './components/copy-link-toolbar-item';
import { LinkUrlToolbarItem } from './components/link-url-toolbar-item';
import { OpenLinkToolbarItem } from './components/open-link-toolbar-item';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
export function LinkToolbarItems({
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
  const linkProperties = blockData.properties;

  return (
    <>
      <LinkUrlToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentValue={linkProperties.url}
        disabled={disabled}
        onValueChange={async (url: string) => {
          await onPropertyUpdate('properties.url', url);
        }}
      />
      <Separator orientation="vertical" className="h-6" />
      <OpenLinkToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        url={linkProperties.url}
        disabled={disabled || !linkProperties.url}
      />
      <CopyLinkToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        url={linkProperties.url}
        disabled={disabled || !linkProperties.url}
      />
    </>
  );
}
