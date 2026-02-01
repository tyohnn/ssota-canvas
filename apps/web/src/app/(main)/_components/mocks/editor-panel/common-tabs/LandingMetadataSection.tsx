/**
 * Landing Metadata Section
 * 
 * Replicated from Metadata Section
 * 공통 컴포넌트 - summarize와 structure 탭 모두에서 사용
 */

'use client';

import { MetadataSectionView } from '@/domains/block-management/frontend/components/block/block-type/youtube/components/section-tabs/metadata-section.view';

interface LandingMetadataSectionProps {
  metadata: {
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
  };
}

export function LandingMetadataSection({ metadata }: LandingMetadataSectionProps) {
  return <MetadataSectionView metadata={metadata} />;
}
