/**
 * Fetch YouTube Metadata Service (블록 독립)
 *
 * getVideo → 없으면 getVideoMetadata(YouTube API) → createChannel → createVideo
 * linkSourceToBlock, publishYoutubeMetadataFetched는 호출하지 않음.
 * Drive 미리보기 등 블록 없이 메타데이터만 조회할 때 사용.
 */

import type { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';

import { ChannelId } from '../../shared/value-objects/channel-id.vo';
import type { YoutubeView } from '../../shared/dtos/views/youtube.views';
import { DrizzleChannelRepository } from '../repositories/implementations/drizzle-channel.repository';
import { DrizzleVideoRepository } from '../repositories/implementations/drizzle-video.repository';
import {
  createChannel,
  getChannel,
  getChannelById,
} from './channel';
import { createVideo, getVideo } from './video';
import {
  getChannelMetadata,
  getVideoMetadata,
} from './youtube-api';
import type { ChannelAggregate } from '../../shared/aggregates/channel.aggregate';

export interface FetchYoutubeMetadataResult {
  video: YoutubeView;
  channelName?: string;
  channelThumbnail?: string;
  youtubeChannelId?: string;
}

/**
 * Fetch YouTube metadata (block-independent).
 * Uses same logic as getYoutubeMetadataAction but without linkSourceToBlock / publishYoutubeMetadataFetched.
 */
export async function fetchYoutubeMetadata(
  slug: string,
  userId: UserId
): Promise<Result<FetchYoutubeMetadataResult, Error>> {
  const videoRepository = new DrizzleVideoRepository();
  const channelRepository = new DrizzleChannelRepository();

  const videoResult = await getVideo({ slug }, videoRepository);

  if (videoResult.isError()) {
    return Result.error(
      new Error(videoResult.error instanceof Error ? videoResult.error.message : String(videoResult.error))
    );
  }

  if (videoResult.value) {
    const video = videoResult.value;
    let channel: ChannelAggregate | undefined = undefined;

    const videoEntity = video.getVideo();
    if (videoEntity.channelId) {
      const channelResult = await getChannelById(
        { channelId: videoEntity.channelId },
        channelRepository
      );
      if (channelResult.isError()) {
        return Result.error(
          new Error(channelResult.error instanceof Error ? channelResult.error.message : String(channelResult.error))
        );
      }
      if (channelResult.value) {
        channel = channelResult.value;
      }
    }

    return Result.success({
      video: video.toView(),
      channelName: channel?.toView().channelName,
      channelThumbnail: channel?.toView().channelThumbnailUrl,
      youtubeChannelId: channel?.toView().channelId,
    });
  }

  const metadata = await getVideoMetadata(slug);

  let channelAggregate: ChannelAggregate | undefined = undefined;
  let channelId: ChannelId | undefined = undefined;

  if (metadata.channelId && metadata.channelTitle) {
    const channelResult = await getChannel(
      { youtubeChannelId: metadata.channelId },
      channelRepository
    );

    if (channelResult.isError()) {
      return Result.error(
        new Error(channelResult.error instanceof Error ? channelResult.error.message : String(channelResult.error))
      );
    }

    if (channelResult.value) {
      channelAggregate = channelResult.value;
      channelId = new ChannelId(channelAggregate.getChannel().id);
    } else {
      let channelMetadata;
      try {
        channelMetadata = await getChannelMetadata(metadata.channelId);
      } catch (error) {
        console.warn(
          `[fetchYoutubeMetadata] Failed to fetch channel metadata for ${metadata.channelId}:`,
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
        return Result.error(
          new Error(createChannelResult.error instanceof Error ? createChannelResult.error.message : String(createChannelResult.error))
        );
      }

      channelAggregate = createChannelResult.value;
      channelId = new ChannelId(channelAggregate.getChannel().id);
    }
  }

  const createVideoResult = await createVideo(
    {
      slug,
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
    },
    userId,
    videoRepository
  );

  if (createVideoResult.isError()) {
    return Result.error(
      new Error(createVideoResult.error instanceof Error ? createVideoResult.error.message : String(createVideoResult.error))
    );
  }

  const video = createVideoResult.value;
  return Result.success({
    video: video.toView(),
    channelName: channelAggregate?.toView().channelName,
    channelThumbnail: channelAggregate?.toView().channelThumbnailUrl,
    youtubeChannelId: channelAggregate?.toView().channelId,
  });
}
