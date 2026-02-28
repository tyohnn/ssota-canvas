/**
 * YouTube 메타데이터 조회 Action
 *
 * 패턴: withYoutubeBlockSecureAction HOF 사용
 *
 * ⚠️ Security: withYoutubeBlockSecureAction HOF를 통해 Defense in Depth 적용
 * 1. Request 스키마 검증
 * 2. 사용자 인증 확인
 * 3. Block 권한 및 타입 검증 (YouTube 블록인지 확인)
 */

'use server';

import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import type { Block } from '@/domains/block-management/shared/entities/block.entity';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import { DrizzleSourceRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source.repository';
import { findOrCreateSource } from '@/domains/source-management/backend/services/source';
import { DrizzleVideoRepository } from '../../backend/repositories/implementations/drizzle-video.repository';
import { fetchYoutubeMetadata } from '../../backend/services/fetch-youtube-metadata.service';
import { publishYoutubeMetadataFetched } from '../../backend/services/youtube-metadata-fetched';
import { getVideo } from '../../backend/services/video';
import { GetYoutubeMetadataRequestSchema } from '../../shared/dtos/requests/video.requests';
import type { GetYoutubeMetadataRequest } from '../../shared/dtos/requests/video.requests';
import type { GetYoutubeMetadataDTO } from '../../shared/dtos/responses/video.responses';
import type { VideoAggregate } from '../../shared/aggregates/video.aggregate';
import { withYoutubeBlockSecureAction } from '../secure-action';
import type { YoutubeBlockActionContext } from '../secure-action';

/**
 * YouTube 메타데이터 조회 Action
 * 해당 블록이 속한 워크스페이스, 조직에 대한 권한이 있는지 확인
 * 블록의 타입이 유튜브 블록인지 확인
 */
export const getYoutubeMetadataAction = withYoutubeBlockSecureAction(
  GetYoutubeMetadataRequestSchema,
  'getYoutubeMetadataAction',
  getYoutubeMetadataInternal,
  {
    getLogMetadata: req => ({
      blockId: req.blockId,
      slug: req.slug,
    }),
  }
);

/**
 * 내부 구현 (검증된 데이터만 처리)
 *
 * fetchYoutubeMetadata 서비스를 사용해 메타데이터 조회 후,
 * linkSourceToBlock + publishYoutubeMetadataFetched로 source job 등록.
 */
async function getYoutubeMetadataInternal(
  safeDto: GetYoutubeMetadataRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<GetYoutubeMetadataDTO>> {
  try {
    const userId = new UserId(context.authenticatedUser.id);
    const ytCtx = context as YoutubeBlockActionContext;

    const metadataResult = await fetchYoutubeMetadata(safeDto.slug, userId);

    if (metadataResult.isError()) {
      return err(String(metadataResult.error), {
        code: 'METADATA_FETCH_FAILED',
        meta: { originalError: metadataResult.error },
      });
    }

    const data = metadataResult.value;
    const response: GetYoutubeMetadataDTO = {
      video: data.video,
      channelName: data.channelName,
      channelThumbnail: data.channelThumbnail,
      youtubeChannelId: data.youtubeChannelId,
    };

    const videoForLinkResult = await getVideo(
      { slug: safeDto.slug },
      new DrizzleVideoRepository()
    );
    const videoForLink = videoForLinkResult.isError()
      ? undefined
      : videoForLinkResult.value;
    if (videoForLink) {
      const sourceId = await linkSourceToBlock(
        videoForLink,
        safeDto.slug,
        ytCtx.block
      );
      if (sourceId) response.sourceId = sourceId;
    }
    response.blockUuid = ytCtx.block.id.value;

    await Promise.allSettled([
      publishYoutubeMetadataFetched({
        workspaceId: ytCtx.block.workspaceId.value,
        blockId: ytCtx.block.getSlug(),
        orgId: context.organization.id,
        youtubeId: safeDto.slug,
        language: safeDto.language ?? 'en',
      }),
    ]);

    return ok(response);
  } catch (error) {
    console.error('[getYoutubeMetadataInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}

/**
 * Find or create Source for the YouTube video and link it to the block (block.source_id).
 * Returns sourceId when successful, undefined on failure (logged).
 * sources.metadata에 고화질 썸네일 URL(thumbnailUrl)을 저장합니다.
 */
async function linkSourceToBlock(
  video: VideoAggregate,
  slug: string,
  block: Block
): Promise<string | undefined> {
  const youtubeUrl = `https://www.youtube.com/watch?v=${slug}`;
  const thumbnailUrl = video.getVideo().thumbnailUrl ?? undefined;
  const sourceRepository = new DrizzleSourceRepository();
  const result = await findOrCreateSource(
    {
      url: youtubeUrl,
      sourceType: 'youtube',
      metadata: {
        appSpaceId: video.getVideo().id.value,
        videoSlug: slug,
        ...(thumbnailUrl && { thumbnailUrl }),
      },
    },
    sourceRepository
  );
  if (result.isError()) {
    console.warn(
      '[linkSourceToBlock] findOrCreateSource failed:',
      result.error
    );
    return undefined;
  }
  const aggregate = result.value;
  const source = aggregate.getSource();
  // 기존 source인 경우 metadata에 thumbnailUrl이 없으면 업데이트
  const meta = (source.metadata || {}) as Record<string, unknown>;
  if (thumbnailUrl && !meta.thumbnailUrl) {
    aggregate.updateMetadata({ metadata: { thumbnailUrl } });
    await sourceRepository.update(aggregate.getSource());
  }
  const sourceId = source.id.value;
  block.updateSourceId(sourceId);
  const blockRepository = new DrizzleBlockRepository();
  await blockRepository.update(block);
  return sourceId;
}
