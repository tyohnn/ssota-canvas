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
}

export default function YouTubeTimelineTab({
  blockId,
  blockData,
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
    />
  );
}
