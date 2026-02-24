/**
 * Timeline tab for audio block.
 * Uses TimelineTab (source-management) with blockSlug, sourceId, sourceTitle.
 * Script comes from sources.raw_content (parsed by parseTimelineRawContent).
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  AudioBlockPropertiesVO,
  type AudioBlockProperties,
} from '@/domains/block-management/shared/value-objects/block-properties';

import { TimelineTab } from '@/domains/source-management/frontend/components/timeline-tab';

export interface AudioTimelineTabProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function AudioTimelineTab({
  blockId,
  blockData,
}: AudioTimelineTabProps) {
  let sourceTitle: string | undefined;
  try {
    const props = blockData?.properties as AudioBlockProperties | undefined;
    if (props) {
      const vo = AudioBlockPropertiesVO.fromJSON(props);
      sourceTitle =
        vo.getTitle() || vo.getFilename() || vo.getAudioUrl() || undefined;
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
