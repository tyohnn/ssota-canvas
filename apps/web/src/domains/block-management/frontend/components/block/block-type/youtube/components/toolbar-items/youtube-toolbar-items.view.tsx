/**
 * Youtube Toolbar Items View
 * 
 * Presentational component for Youtube Toolbar Items
 */

'use client';

import React from 'react';
import { CopyYoutubeLinkToolbarItem } from './components/copy-youtube-link-toolbar-item';
import { OpenYoutubeToolbarItem } from './components/open-youtube-toolbar-item';

export interface YoutubeToolbarItemsViewProps {
  blockId: string;
  blockMountId?: string;
  url: string;
  disabled: boolean;
}

export function YoutubeToolbarItemsView({
  blockId,
  blockMountId,
  url,
  disabled,
}: YoutubeToolbarItemsViewProps) {
  return (
    <>
      {/* URL 변경 기능 제거: YouTube 블록은 생성 시 URL이 고정됨 */}
      <OpenYoutubeToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        url={url}
        disabled={disabled}
      />
      <CopyYoutubeLinkToolbarItem
        blockId={blockId}
        blockMountId={blockMountId}
        url={url}
        disabled={disabled}
      />
    </>
  );
}
