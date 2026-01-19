import React from 'react';

import { CopyYoutubeLinkToolbarItem } from './components/copy-youtube-link-toolbar-item';
import { OpenYoutubeToolbarItem } from './components/open-youtube-toolbar-item';

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
      {/* URL 변경 기능 제거: YouTube 블록은 생성 시 URL이 고정됨 */}
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
