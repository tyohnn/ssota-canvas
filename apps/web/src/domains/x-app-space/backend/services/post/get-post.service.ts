/**
 * Post retrieval service
 */
import { Result } from '@/utils/result';
import { PostAggregate } from '../../../shared/aggregates/post.aggregate';
import type { GetPostRequest } from '../../../shared/dtos/requests/post.requests';
import { XAppSpaceError } from '../../../shared/errors/x-app-space.error';
import { PostSlug } from '../../../shared/value-objects/post-slug.vo';
import type { IPostRepository } from '../../repositories/interfaces/post.repository.interface';

export async function getPost(
  safeDto: GetPostRequest,
  postRepository: IPostRepository
): Promise<Result<PostAggregate | null, XAppSpaceError>> {
  try {
    new PostSlug(safeDto.postId); // validate format
    const aggregate = await postRepository.findByPostId(safeDto.postId);
    return Result.success(aggregate);
  } catch (error) {
    if (error instanceof XAppSpaceError) {
      return Result.error(error);
    }
    return Result.error(
      new XAppSpaceError(
        'POST_QUERY_FAILED',
        error instanceof Error ? error.message : 'Failed to get post',
        { postId: safeDto.postId }
      )
    );
  }
}
