/**
 * Fetch X Metadata Service (block-independent)
 *
 * getPost -> 없으면 getPostMetadata(X API) -> getOrCreateProfile -> createPost
 */
import type { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';
import type { PostView } from '../../shared/dtos/views/post.views';
import { DrizzlePostRepository } from '../repositories/implementations/drizzle-post.repository';
import { DrizzleProfileRepository } from '../repositories/implementations/drizzle-profile.repository';
import { createPost } from './post/create-post.service';
import { getPost } from './post/get-post.service';
import { createProfile, getProfile, getProfileById } from './profile';
import { getPostMetadata } from './x-api/get-post-metadata.service';

export interface FetchXMetadataResult {
  post: PostView;
}

export async function fetchXMetadata(
  postId: string,
  userId: UserId
): Promise<Result<FetchXMetadataResult, Error>> {
  const postRepository = new DrizzlePostRepository();
  const profileRepository = new DrizzleProfileRepository();

  const existing = await getPost({ postId }, postRepository);
  if (existing.isError()) {
    return Result.error(
      new Error(existing.error instanceof Error ? existing.error.message : String(existing.error))
    );
  }
  if (existing.value) {
    let profileView: { username?: string; name?: string; profileImageUrl?: string } | undefined;
    const profileId = existing.value.getPost().profileId;
    if (profileId) {
      const profileRes = await getProfileById(
        { profileId },
        profileRepository
      );
      profileView = profileRes.value?.toView();
    }
    return Result.success({
      post: existing.value.toView(profileView),
    });
  }

  const metadata = await getPostMetadata(postId);

  let profileId: string | undefined;
  let profileView: { username?: string; name?: string; profileImageUrl?: string } | undefined;

  if (metadata.authorId && metadata.authorUsername) {
    const profileResult = await getProfile(
      { userId: metadata.authorId },
      profileRepository
    );

    if (profileResult.isError()) {
      return Result.error(
        new Error(profileResult.error instanceof Error ? profileResult.error.message : String(profileResult.error))
      );
    }

    let profileAgg = profileResult.value;
    if (!profileAgg) {
      const createProfileResult = await createProfile(
        {
          userId: metadata.authorId,
          username: metadata.authorUsername,
          name: metadata.authorName,
          profileImageUrl: metadata.authorProfileImageUrl,
          description: metadata.authorDescription,
          followersCount: metadata.authorFollowersCount,
          followingCount: metadata.authorFollowingCount,
          tweetCount: metadata.authorTweetCount,
        },
        profileRepository
      );
      if (createProfileResult.isError()) {
        return Result.error(
          new Error(
            createProfileResult.error instanceof Error
              ? createProfileResult.error.message
              : String(createProfileResult.error)
          )
        );
      }
      profileAgg = createProfileResult.value;
    }

    profileId = profileAgg.getProfile().id;
    profileView = profileAgg.toView();
  }

  const createResult = await createPost(
    {
      postId,
      text: metadata.text,
      articleUrl: metadata.articleUrl,
      attachmentUrls: metadata.attachmentUrls ?? [],
      profileId,
      postedAt: metadata.postedAt,
      likeCount: metadata.likeCount,
      retweetCount: metadata.retweetCount,
      replyCount: metadata.replyCount,
      quoteCount: metadata.quoteCount,
    },
    userId,
    postRepository
  );

  if (createResult.isError()) {
    return Result.error(
      new Error(createResult.error instanceof Error ? createResult.error.message : String(createResult.error))
    );
  }

  const postView = createResult.value.toView(profileView);
  if (metadata.entities) {
    postView.entities = metadata.entities;
  }
  return Result.success({ post: postView });
}
