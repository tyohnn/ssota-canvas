/**
 * Drive Timeline Tab
 *
 * Uses TimelineTab with Drive deps (no Canvas context).
 */

'use client';

import type { DriveBlockData } from '@/domains/drive/frontend/hooks/use-drive-block';
import {
  useSourceTimelineTabDriveDeps,
  useTimelineTranscriptDriveDeps,
} from '@/domains/drive/frontend/adapters/source-tab-drive-deps';
import { TimelineTab } from '@/domains/source-management/frontend/adapters/source-timeline';
import type { YoutubeBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { YoutubeBlockPropertiesVO } from '@/domains/block-management/shared/value-objects/block-properties';

export interface DriveTimelineTabProps {
  blockId: string;
  blockData: DriveBlockData | undefined;
  blockMountId?: string;
  switchToTab?: (tabId: string) => void;
}

function getSourceTitle(properties: unknown): string | undefined {
  if (!properties || typeof properties !== 'object') return undefined;
  try {
    const vo = YoutubeBlockPropertiesVO.fromJSON(
      properties as YoutubeBlockProperties
    );
    return vo.youtubeTitle;
  } catch {
    return undefined;
  }
}

export function DriveTimelineTab({
  blockId,
  blockData,
  blockMountId,
  switchToTab,
}: DriveTimelineTabProps) {
  const timelineTabDeps = useSourceTimelineTabDriveDeps(blockData);
  const transcriptDeps = useTimelineTranscriptDriveDeps(blockData);
  const sourceTitle = blockData?.properties
    ? getSourceTitle(blockData.properties)
    : undefined;

  const blockSlug = blockData?.blockSlug ?? blockId;

  return (
    <TimelineTab
      blockSlug={blockSlug}
      sourceId={blockData?.sourceId}
      sourceTitle={sourceTitle}
      blockMountId={blockMountId}
      blockData={blockData}
      switchToTab={switchToTab}
      timelineTabDeps={timelineTabDeps}
      transcriptDeps={transcriptDeps}
    />
  );
}
