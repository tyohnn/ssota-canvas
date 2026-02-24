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
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';

import type { Block } from '@/domains/block-management/shared/entities/block.entity';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { DrizzleChannelRepository } from '../../backend/repositories/implementations/drizzle-channel.repository';
import { DrizzleVideoRepository } from '../../backend/repositories/implementations/drizzle-video.repository';
import {
  createChannel,
  getChannel,
  getChannelById,
} from '../../backend/services/channel';
import { publishYoutubeMetadataFetched } from '../../backend/services/youtube-metadata-fetched';
import { createVideo, getVideo } from '../../backend/services/video';
import {
  getChannelMetadata,
  getVideoMetadata,
} from '../../backend/services/youtube-api';
import { ChannelAggregate } from '../../shared/aggregates/channel.aggregate';
import type { VideoAggregate } from '../../shared/aggregates/video.aggregate';
import { GetYoutubeMetadataRequestSchema } from '../../shared/dtos/requests/video.requests';
import type { GetYoutubeMetadataRequest } from '../../shared/dtos/requests/video.requests';
import type { GetYoutubeMetadataDTO } from '../../shared/dtos/responses/video.responses';
import { ChannelId } from '../../shared/value-objects/channel-id.vo';
import { DrizzleSourceRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source.repository';
import { findOrCreateSource } from '@/domains/source-management/backend/services/source';
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
 * ✅ 서버 액션에서 서비스들을 조합해서 사용하는 방식
 * 1. getVideo 호출 (slug로 조회)
 * 2. 없으면 getVideoMetadata 호출 (YouTube API)
 * 3. getChannel 호출하고 없으면 createChannel 호출
 * 4. createVideo 호출
 *
 * ⚠️ 이 함수는 이미 검증된 요청과 인증된 사용자만 받습니다
 * - Block 권한 및 타입 검증 완료
 *
 * @param safeDto - 검증된 SafeDTO
 * @param context - 검증된 사용자, 워크스페이스 정보
 */
async function getYoutubeMetadataInternal(
  safeDto: GetYoutubeMetadataRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<GetYoutubeMetadataDTO>> {
  try {
    const userId: UserId = new UserId(context.authenticatedUser.id);
    const youtubeContext = context as YoutubeBlockActionContext;

    // 1. Repository 생성
    const videoRepository = new DrizzleVideoRepository();
    const channelRepository = new DrizzleChannelRepository();

    // 2. getVideo 호출 (slug로 조회)
    const videoResult = await getVideo({ slug: safeDto.slug }, videoRepository);

    if (videoResult.isError()) {
      return err(String(videoResult.error), {
        code: 'VIDEO_QUERY_FAILED',
        meta: { originalError: videoResult.error },
      });
    }

    // 4. Video가 있으면 반환
    if (videoResult.value) {
      const video = videoResult.value;
      let channel: ChannelAggregate | undefined = undefined;

      // 채널 정보도 함께 조회 (서비스 사용)
      const videoEntity = video.getVideo();
      if (videoEntity.channelId) {
        const channelResult = await getChannelById(
          { channelId: videoEntity.channelId },
          channelRepository
        );
        if (channelResult.isError()) {
          return err(String(channelResult.error), {
            code: 'CHANNEL_QUERY_FAILED',
            meta: { originalError: channelResult.error },
          });
        }
        if (channelResult.value) {
          channel = channelResult.value;
        }
      }

      const response: GetYoutubeMetadataDTO = {
        video: video.toView(),
        channelName: channel?.toView().channelName,
        channelThumbnail: channel?.toView().channelThumbnailUrl,
        youtubeChannelId: channel?.toView().channelId,
      };

      const ytCtx = context as YoutubeBlockActionContext;
      const sourceId = await linkSourceToBlock(
        video,
        safeDto.slug,
        ytCtx.block
      );
      if (sourceId) response.sourceId = sourceId;
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
    }

    // 5. Video가 없으면 getVideoMetadata 호출 (YouTube API)
    const metadata = await getVideoMetadata(safeDto.slug);

    // 6. getChannel 호출하고 없으면 createChannel 호출
    let channelAggregate: ChannelAggregate | undefined = undefined;
    let channelId: ChannelId | undefined = undefined;

    if (metadata.channelId && metadata.channelTitle) {
      // getChannel 호출
      const channelResult = await getChannel(
        { youtubeChannelId: metadata.channelId },
        channelRepository
      );

      if (channelResult.isError()) {
        return err(String(channelResult.error), {
          code: 'CHANNEL_QUERY_FAILED',
          meta: { originalError: channelResult.error },
        });
      }

      if (channelResult.value) {
        // 기존 Channel이 있으면 사용
        channelAggregate = channelResult.value;
        channelId = new ChannelId(channelAggregate.getChannel().id);
      } else {
        // Channel이 없으면 getChannelMetadata 호출 후 createChannel 호출
        let channelMetadata;
        try {
          channelMetadata = await getChannelMetadata(metadata.channelId);
        } catch (error) {
          // 채널 메타데이터 조회 실패 시 기본값으로 계속 진행
          console.warn(
            `[getYoutubeMetadataInternal] Failed to fetch channel metadata for ${metadata.channelId}:`,
            error
          );
          channelMetadata = {
            channelName: metadata.channelTitle,
            channelDescription: undefined,
            channelThumbnailUrl: undefined,
            subscriberCount: undefined,
            videoCount: undefined,
          };
        }

        const createChannelResult = await createChannel(
          {
            youtubeChannelId: metadata.channelId,
            channelName: channelMetadata.channelName,
            channelDescription: channelMetadata.channelDescription,
            channelThumbnailUrl: channelMetadata.channelThumbnailUrl,
            subscriberCount: channelMetadata.subscriberCount,
            videoCount: channelMetadata.videoCount,
          },
          channelRepository
        );

        if (createChannelResult.isError()) {
          return err(String(createChannelResult.error), {
            code: 'CHANNEL_CREATION_FAILED',
            meta: { originalError: createChannelResult.error },
          });
        }

        channelAggregate = createChannelResult.value;
        channelId = new ChannelId(channelAggregate.getChannel().id);
      }
    }

    // 7. createVideo 호출
    const createVideoRequest = {
      slug: safeDto.slug,
      title: metadata.title,
      description: metadata.description,
      channelId: channelId?.value,
      publishedAt: metadata.publishedAt,
      durationSeconds: metadata.durationSeconds,
      thumbnailUrl: metadata.thumbnailUrl,
      thumbnailHighUrl: metadata.thumbnailHighUrl,
      viewCount: metadata.viewCount,
      likeCount: metadata.likeCount,
      commentCount: metadata.commentCount,
    };

    const createVideoResult = await createVideo(
      createVideoRequest,
      userId,
      videoRepository
    );

    if (createVideoResult.isError()) {
      return err(String(createVideoResult.error), {
        code: 'VIDEO_CREATION_FAILED',
        meta: { originalError: createVideoResult.error },
      });
    }

    // 8. Response DTO 생성
    const video = createVideoResult.value;
    const response: GetYoutubeMetadataDTO = {
      video: video.toView(),
      channelName: channelAggregate?.toView().channelName,
      channelThumbnail: channelAggregate?.toView().channelThumbnailUrl,
      youtubeChannelId: channelAggregate?.toView().channelId,
    };

    const ytCtx = context as YoutubeBlockActionContext;
    const sourceId = await linkSourceToBlock(
      video,
      safeDto.slug,
      ytCtx.block
    );
    if (sourceId) response.sourceId = sourceId;
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
