/**
 * Metadata Section Container
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

import { MetadataSectionView } from './metadata-section.view';

/**
 * Metadata Section Props
 */
interface MetadataSectionProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

/**
 * Metadata Section Component
 *
 * YouTube 블록의 메타데이터를 표시하는 컴포넌트
 */
export default function MetadataSection({
  blockId,
  blockData,
}: MetadataSectionProps) {
  // Block properties에서 YouTube 정보 추출
  const properties = blockData?.properties as
    | YoutubeBlockProperties
    | undefined;

  // YoutubeBlockPropertiesVO로 변환하여 타입 안전하게 메타데이터 추출
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
    console.warn(
      '[MetadataSection] Failed to parse YouTube properties:',
      error
    );
  }

  return <MetadataSectionView metadata={metadata} />;
}
