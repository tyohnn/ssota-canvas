'use client';

import { useCallback, useRef } from 'react';

import type { YoutubeBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { YoutubeBlockPropertiesVO } from '@/domains/block-management/shared/value-objects/block-properties/youtube.vo';
import { getYoutubeMetadataAction } from '@/domains/youtube-app-space/actions/video/get-youtube-metadata.action';
import { isFailure } from '@/lib';

import type { YoutubeBlockBusinessLogic, YoutubeMetadata } from './types';

/**
 * YouTube Block Business Hook
 *
 * 비즈니스 로직 및 서버 액션 호출을 담당합니다.
 * UI 상태 직접 조작 없음 - 메인 훅에서 조합
 */
export function useYoutubeBlockBusiness(
  nodeData: YoutubeBlockNodeData,
  vo: YoutubeBlockPropertiesVO,
  updateProperties: (
    nodeId: string,
    properties: Record<string, unknown>,
    blockData: YoutubeBlockNodeData
  ) => Promise<void>,
  updateBlockTitle?: (input: {
    nodeId: string;
    title: string;
    blockData: YoutubeBlockNodeData;
  }) => Promise<boolean>
): YoutubeBlockBusinessLogic {
  // 메타데이터 fetch 실행 여부 추적 (중복 방지)
  const isFetchingRef = useRef(false);
  const fetchedUrlRef = useRef<string | null>(null);

  /**
   * 썸네일 URL 가져오기 (VO 메서드 사용)
   */
  const getThumbnailUrl = useCallback((): string | null => {
    return vo.getThumbnailUrl();
  }, [vo]);

  /**
   * Embed URL 생성 (VO 메서드 사용)
   * VO의 getEmbedUrl()은 string을 반환하지만, videoId가 없으면 원본 URL을 반환
   * 빈 URL이거나 유효한 embed URL이 아닌 경우 null 반환
   */
  const getEmbedUrl = useCallback((): string | null => {
    const embedUrl = vo.getEmbedUrl();
    // videoId가 없으면 원본 URL을 반환하므로, embed URL 형식인지 확인
    if (!embedUrl || !embedUrl.trim()) {
      return null;
    }
    // embed URL 형식인 경우만 반환 (원본 URL이 아닌 경우)
    return embedUrl.startsWith('https://www.youtube.com/embed/')
      ? embedUrl
      : null;
  }, [vo]);

  /**
   * Video ID 추출 (VO 메서드 사용, 타입 변환: undefined → null)
   */
  const getVideoId = useCallback((urlString: string): string | null => {
    // 임시 VO 인스턴스를 생성하여 videoId 추출
    // 또는 현재 VO의 URL과 다를 수 있으므로 새 인스턴스 생성
    const tempVo = YoutubeBlockPropertiesVO.fromJSON({ url: urlString });
    return tempVo.getVideoId() ?? null;
  }, []);

  /**
   * YouTube 메타데이터 fetch 및 URL/메타데이터 업데이트 (서버 액션 연동)
   *
   * URL과 메타데이터를 한번에 업데이트합니다.
   */
  const fetchMetadata = useCallback(
    async (
      urlString: string
    ): Promise<{
      success: boolean;
      metadata?: YoutubeMetadata;
      error?: string;
    }> => {
      // Block ID 확인
      const blockId = nodeData.blockId;

      if (!urlString) {
        return { success: false, error: 'No URL provided' };
      }

      if (!blockId) {
        return { success: false, error: 'No block ID' };
      }

      // 중복 호출 방지
      if (isFetchingRef.current || fetchedUrlRef.current === urlString) {
        return { success: false, error: 'Already fetching' };
      }

      // URL에서 slug (video ID) 추출 (VO 사용)
      const tempVo = YoutubeBlockPropertiesVO.fromJSON({ url: urlString });
      const videoId = tempVo.getVideoId();
      if (!videoId) {
        return { success: false, error: 'Invalid video ID' };
      }

      isFetchingRef.current = true;
      fetchedUrlRef.current = urlString;

      try {
        const result = await getYoutubeMetadataAction({
          blockId,
          slug: videoId,
        });

        if (isFailure(result)) {
          return { success: false, error: result.error };
        }

        const dto = result.data;
        const video = dto.video;

        // GetYoutubeMetadataDTO → 기존 메타데이터 형식으로 변환
        const metadata: YoutubeMetadata = {
          youtubeTitle: video.title,
          youtubeDescription: video.description,
          youtubeThumbnail:
            video.thumbnailHighUrl || video.thumbnailUrl || undefined,
          channelName: dto.channelName,
          channelThumbnail: dto.channelThumbnail,
          youtubeChannelId: dto.youtubeChannelId,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          subscriberCount: undefined, // 새로운 액션에서 제공되지 않음
          commentCount: video.commentCount,
          publishedAt: video.publishedAt,
        };

        // URL과 메타데이터를 한번에 업데이트 (비즈니스 훅에서 처리)
        // ⚠️ 중요: updateProperties는 blockId를 받아야 함 (id는 nodeId이므로 사용 불가)
        await updateProperties(
          blockId,
          {
            url: urlString, // URL도 함께 업데이트
            youtubeId: video.id, // YouTube App Space의 Video ID (UUID) 업데이트
            ...metadata,
          } as Record<string, unknown>,
          nodeData
        );

        // YouTube 제목을 블록 title로 설정
        if (video.title && updateBlockTitle) {
          await updateBlockTitle({
            nodeId: nodeData.blockMountId,
            title: video.title,
            blockData: nodeData,
          });
        }

        return { success: true, metadata };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      } finally {
        isFetchingRef.current = false;
      }
    },
    [nodeData, updateProperties, updateBlockTitle]
  );

  return {
    getVideoId,
    getThumbnailUrl,
    getEmbedUrl,
    fetchMetadata,
  };
}
