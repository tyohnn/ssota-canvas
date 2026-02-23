import React from 'react';

import { Separator } from '@/components/ui/separator';
import { LinkToolbarItemsView } from './link-toolbar-items.view';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
export function LinkToolbarItems({
  blockId,
  blockMountId,
  blockData,
  disabled,
  onPropertyUpdate,
  readonly = false,
}: {
  blockId: string;
  blockMountId?: string;
  blockData: any;
  disabled: boolean;
  onPropertyUpdate: (path: string, value: any) => Promise<void>;
  readonly?: boolean;
}) {
  const linkProperties = blockData.properties;

  return (
    <>
      <LinkToolbarItemsView
        blockId={blockId}
        blockMountId={blockMountId}
        url={linkProperties?.url ?? ''}
        disabled={disabled}
      />
      {!readonly && <Separator orientation="vertical" className="h-6!" />}
    </>
  );
}
