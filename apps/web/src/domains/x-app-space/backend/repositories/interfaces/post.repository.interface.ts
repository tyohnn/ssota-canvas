/**
 * Post Repository Interface
 */
import type { PostAggregate } from '../../../shared/aggregates/post.aggregate';

export interface IPostRepository {
  create(postAggregate: PostAggregate): Promise<void>;
  findById(id: string): Promise<PostAggregate | null>;
  findByPostId(postId: string): Promise<PostAggregate | null>;
}
