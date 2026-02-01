import React from 'react';
import { YoutubeToolbarItemsView } from './youtube-toolbar-items.view';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
export function YoutubeToolbarItems({
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
  const youtubeProperties = blockData.properties;

  return (
    <YoutubeToolbarItemsView
      blockId={blockId}
      blockMountId={blockMountId}
      url={youtubeProperties?.url || ''}
      disabled={disabled || !youtubeProperties?.url}
    />
  );
}
