/**
 * Post creation service
 */
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { Result } from '@/utils/result';
import { PostAggregate } from '../../../shared/aggregates/post.aggregate';
import type { CreatePostRequest } from '../../../shared/dtos/requests/post.requests';
import { XAppSpaceError } from '../../../shared/errors/x-app-space.error';
import { PostId } from '../../../shared/value-objects/post-id.vo';
import { PostSlug } from '../../../shared/value-objects/post-slug.vo';
import type { IPostRepository } from '../../repositories/interfaces/post.repository.interface';

export async function createPost(
  safeDto: CreatePostRequest,
  _userId: UserId,
  postRepository: IPostRepository
): Promise<Result<PostAggregate, XAppSpaceError>> {
  try {
    const postId = PostId.generate();
    const postSlug = new PostSlug(safeDto.postId);

    const aggregate = PostAggregate.createPost({
      postId,
      postSlug,
      text: safeDto.text,
      articleUrl: safeDto.articleUrl,
      attachmentUrls: safeDto.attachmentUrls ?? [],
      profileId: safeDto.profileId,
      postedAt: safeDto.postedAt,
      likeCount: safeDto.likeCount,
      retweetCount: safeDto.retweetCount,
      replyCount: safeDto.replyCount,
      quoteCount: safeDto.quoteCount,
      userId: _userId,
    });

    await postRepository.create(aggregate);

    const uncommittedEvents = aggregate.getUncommittedEvents();
    await Promise.allSettled(uncommittedEvents.map(e => e.handle()));
    aggregate.markEventsAsCommitted();

    return Result.success(aggregate);
  } catch (error) {
    if (error instanceof XAppSpaceError) {
      return Result.error(error);
    }
    return Result.error(
      new XAppSpaceError(
        'POST_CREATION_FAILED',
        error instanceof Error ? error.message : 'Failed to create post',
        { postId: safeDto.postId }
      )
    );
  }
}
