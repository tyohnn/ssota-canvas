/**
 * YouTube 메타데이터 미리보기 조회 Action (블록 독립)
 *
 * 블록 없이 workspaceId + slug로 메타데이터만 조회.
 * linkSourceToBlock, publishYoutubeMetadataFetched 호출하지 않음.
 * Drive add dialog 미리보기 등에 사용.
 */

'use server';

import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';
import { withWorkspaceSecureAction } from '@/domains/common/server-actions';

import { fetchYoutubeMetadata } from '../../backend/services/fetch-youtube-metadata.service';
import {
  FetchYoutubeMetadataPreviewRequestSchema,
  type FetchYoutubeMetadataPreviewRequest,
} from '../../shared/dtos/requests/video.requests';
import type { GetYoutubeMetadataDTO } from '../../shared/dtos/responses/video.responses';

export const fetchYoutubeMetadataPreviewAction = withWorkspaceSecureAction(
  FetchYoutubeMetadataPreviewRequestSchema,
  'fetchYoutubeMetadataPreviewAction',
  fetchYoutubeMetadataPreviewInternal,
  {
    getLogMetadata: req => ({ slug: req.slug }),
  }
);

async function fetchYoutubeMetadataPreviewInternal(
  safeDto: FetchYoutubeMetadataPreviewRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<GetYoutubeMetadataDTO>> {
  try {
    const userId = new UserId(context.authenticatedUser.id);
    const result = await fetchYoutubeMetadata(safeDto.slug, userId);

    if (result.isError()) {
      return err(String(result.error), {
        code: 'METADATA_FETCH_FAILED',
        meta: { originalError: result.error },
      });
    }

    const data = result.value;
    const response: GetYoutubeMetadataDTO = {
      video: data.video,
      channelName: data.channelName,
      channelThumbnail: data.channelThumbnail,
      youtubeChannelId: data.youtubeChannelId,
    };

    return ok(response);
  } catch (error) {
    console.error('[fetchYoutubeMetadataPreviewInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
