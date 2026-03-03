/**
 * Timeline tab for YouTube block.
 * Uses TimelineTab (source-management) with props only.
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  YoutubeBlockPropertiesVO,
  type YoutubeBlockProperties,
} from '@/domains/block-management/shared/value-objects/block-properties';

import { TimelineTab } from '@/domains/source-management/frontend/components/timeline-tab';

export interface YouTubeTimelineTabProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
  blockMountId?: string;
  switchToTab?: (tabId: string) => void;
}

export default function YouTubeTimelineTab({
  blockId,
  blockData,
  blockMountId,
  switchToTab,
}: YouTubeTimelineTabProps) {
  let sourceTitle: string | undefined;
  try {
    const props = blockData?.properties as YoutubeBlockProperties | undefined;
    if (props) {
      sourceTitle = YoutubeBlockPropertiesVO.fromJSON(props).youtubeTitle;
    }
  } catch {
    // ignore
  }

  return (
    <TimelineTab
      blockSlug={blockId}
      sourceId={blockData?.sourceId}
      sourceTitle={sourceTitle}
      blockMountId={blockMountId}
      blockData={blockData}
      switchToTab={switchToTab}
    />
  );
}
