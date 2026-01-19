import React from 'react';

import { CopyYoutubeLinkToolbarItem } from './components/copy-youtube-link-toolbar-item';
import { OpenYoutubeToolbarItem } from './components/open-youtube-toolbar-item';
import { YouTubeUrlToolbarItem } from './components/youtube-url-toolbar-item';

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
    <>
      {/* readonly 모드에서는 YouTubeUrlToolbarItem만 숨김 */}
      {!readonly && (
        <YouTubeUrlToolbarItem
          blockId={blockId}
          blockMountId={blockMountId}
          currentValue={youtubeProperties?.url || ''}
          disabled={disabled}
          onValueChange={async (url: string) => {
            await onPropertyUpdate('properties.url', url);
          }}
        />
      )}
      <OpenYoutubeToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        url={youtubeProperties?.url || ''}
        disabled={disabled || !youtubeProperties?.url}
      />
      <CopyYoutubeLinkToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        url={youtubeProperties?.url || ''}
        disabled={disabled || !youtubeProperties?.url}
      />
    </>
  );
}
