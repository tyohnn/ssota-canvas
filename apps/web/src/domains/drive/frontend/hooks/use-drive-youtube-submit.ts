'use client';

import { useCallback } from 'react';

import type { GetYoutubeMetadataDTO } from '@/domains/youtube-app-space/shared/dtos/responses/video.responses';
import { YoutubeBlockPropertiesVO } from '@/domains/block-management/shared/value-objects/block-properties/youtube.vo';
import { isSuccess } from '@/lib';
import { fetchYoutubeMetadataPreviewAction } from '@/domains/youtube-app-space/actions/video/fetch-youtube-metadata-preview.action';

/**
 * Drive YouTube URL submit (Enter flow)
 *
 * 메타데이터 fetch만 수행. create block, source job 등록 없음.
 * Enter 시 미리보기 표시용.
 */
export function useDriveYoutubeSubmit() {
  const fetchMetadataForPreview = useCallback(
    async (params: {
      workspaceId: string;
      url: string;
    }): Promise<GetYoutubeMetadataDTO> => {
      const { workspaceId, url } = params;
      const vo = YoutubeBlockPropertiesVO.fromJSON({ url });
      const slug = vo.getVideoId();
      if (!slug) {
        throw new Error('Invalid YouTube URL');
      }

      const result = await fetchYoutubeMetadataPreviewAction({
        workspaceId,
        slug,
      });

      if (!isSuccess(result)) {
        throw new Error(result.error ?? 'Failed to fetch metadata');
      }

      return result.data;
    },
    []
  );

  return {
    fetchMetadataForPreview,
  };
}
