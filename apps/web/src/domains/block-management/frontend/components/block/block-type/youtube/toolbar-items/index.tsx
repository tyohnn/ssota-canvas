import React from 'react';
import { YouTubeUrlToolbarItem } from './youtube-url-toolbar-item';
import { OpenYoutubeToolbarItem } from './open-youtube-toolbar-item';
import { CopyYoutubeLinkToolbarItem } from './copy-youtube-link-toolbar-item';
import { Separator } from '@workspace/ui/components/ui/separator';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
export function YoutubeToolbarItems({
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

  const youtubeProperties = blockData.properties;

  return (
    <>
      <YouTubeUrlToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        currentValue={youtubeProperties.url}
        disabled={disabled}
        onValueChange={async (url: string) => {
          await onPropertyUpdate('properties.url', url);
        }}
      />
      <Separator orientation="vertical" className="h-6" />
      <OpenYoutubeToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        url={youtubeProperties.url}
        disabled={disabled || !youtubeProperties.url}
      />
      <CopyYoutubeLinkToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        url={youtubeProperties.url}
        disabled={disabled || !youtubeProperties.url}
      />
    </>
  );
}
