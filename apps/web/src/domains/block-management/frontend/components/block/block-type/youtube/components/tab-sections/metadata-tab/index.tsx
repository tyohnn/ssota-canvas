/**
 * Metadata tab
 *
 * Editor Panel의 Metadata 탭 컴포넌트
 * YouTube 블록의 메타데이터를 표시
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';

import { MetadataTabView } from './metadata-tab.view';

export interface MetadataTabProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function MetadataTab({
  blockId,
  blockData,
}: MetadataTabProps) {
  const properties = blockData?.properties as YoutubeBlockProperties | undefined;

  let metadata: {
    youtubeTitle?: string;
    youtubeDescription?: string;
    viewCount?: number;
    likeCount?: number;
    channelName?: string;
    youtubeChannelId?: string;
    channelThumbnail?: string;
    subscriberCount?: number;
    commentCount?: number;
    publishedAt?: string;
  } = {};

  try {
    if (properties) {
      const youtubeProperties = YoutubeBlockPropertiesVO.fromJSON(properties);
      metadata = {
        youtubeTitle: youtubeProperties.youtubeTitle,
        youtubeDescription: youtubeProperties.youtubeDescription,
        viewCount: youtubeProperties.viewCount,
        likeCount: youtubeProperties.likeCount,
        channelName: youtubeProperties.channelName,
        youtubeChannelId: youtubeProperties.youtubeChannelId,
        channelThumbnail: youtubeProperties.channelThumbnail,
        subscriberCount: youtubeProperties.subscriberCount,
        commentCount: youtubeProperties.commentCount,
        publishedAt: youtubeProperties.publishedAt,
      };
    }
  } catch (error) {
    console.warn('[MetadataTab] Failed to parse YouTube properties:', error);
  }

  return <MetadataTabView metadata={metadata} />;
}
