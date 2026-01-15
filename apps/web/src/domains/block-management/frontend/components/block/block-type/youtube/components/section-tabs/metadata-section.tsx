/**
 * Metadata Section
 *
 * Editor Panel의 Metadata 탭 컴포넌트
 * YouTube 블록의 메타데이터를 표시
 */

'use client';

import { Box } from '@/components/ui/box';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';

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

  return (
    <Box className="pl-6 pr-4 py-3 min-h-[200px]">
      <Box className="space-y-6">
        {/* Title */}
        {metadata.youtubeTitle && (
          <Box className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Video Title
            </h3>
            <p className="text-sm">{metadata.youtubeTitle}</p>
          </Box>
        )}

        {/* Description */}
        {metadata.youtubeDescription && (
          <Box className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Video Description
            </h3>
            <p className="text-sm whitespace-pre-wrap">
              {metadata.youtubeDescription}
            </p>
          </Box>
        )}

        {/* Statistics */}
        <Box className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Statistics
          </h3>
          <Box className="grid grid-cols-2 gap-4">
            {metadata.viewCount !== undefined && (
              <Box className="space-y-1">
                <p className="text-xs text-muted-foreground">View Count</p>
                <p className="text-sm font-medium">
                  {formatNumber(metadata.viewCount)}
                </p>
              </Box>
            )}
            {metadata.likeCount !== undefined && (
              <Box className="space-y-1">
                <p className="text-xs text-muted-foreground">Like Count</p>
                <p className="text-sm font-medium">
                  {formatNumber(metadata.likeCount)}
                </p>
              </Box>
            )}
            {metadata.commentCount !== undefined && (
              <Box className="space-y-1">
                <p className="text-xs text-muted-foreground">Comment Count</p>
                <p className="text-sm font-medium">
                  {formatNumber(metadata.commentCount)}
                </p>
              </Box>
            )}
            {metadata.subscriberCount !== undefined && (
              <Box className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Subscriber Count
                </p>
                <p className="text-sm font-medium">
                  {formatNumber(metadata.subscriberCount)}
                </p>
              </Box>
            )}
          </Box>
        </Box>

        {/* Channel Info */}
        {metadata.channelName && (
          <Box className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Channel
            </h3>
            <p className="text-sm">{metadata.channelName}</p>
          </Box>
        )}

        {/* Published Date */}
        {metadata.publishedAt && (
          <Box className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Published At
            </h3>
            <p className="text-sm">{formatDate(metadata.publishedAt)}</p>
          </Box>
        )}

        {/* Empty State */}
        {!metadata.youtubeTitle &&
          !metadata.youtubeDescription &&
          !metadata.viewCount &&
          !metadata.likeCount &&
          !metadata.channelName &&
          !metadata.subscriberCount &&
          !metadata.commentCount &&
          !metadata.publishedAt && (
            <Box className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No metadata available. Metadata will be loaded when the YouTube
                video URL is set.
              </p>
            </Box>
          )}
      </Box>
    </Box>
  );
}

/**
 * 숫자 포맷팅 헬퍼
 */
function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * 날짜 포맷팅 헬퍼
 */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return isoString;
  }
}
