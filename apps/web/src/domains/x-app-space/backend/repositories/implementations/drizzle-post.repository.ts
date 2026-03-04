/**
 * Drizzle Post Repository Implementation
 *
 * UUID는 서버에서 생성하므로, pk 충돌 시 재시도 (최대 3회)
 */
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { adminDb } from '@/db';
import { posts } from '@/db/schemas/x-app-space-schema';
import type { Post } from '@/db/schemas/x-app-space-schema';

import { PostAggregate } from '../../../shared/aggregates/post.aggregate';
import { PostEntity } from '../../../shared/entities/post.entity';
import { PostId } from '../../../shared/value-objects/post-id.vo';
import { PostSlug } from '../../../shared/value-objects/post-slug.vo';
import type { IPostRepository } from '../interfaces/post.repository.interface';

export class DrizzlePostRepository implements IPostRepository {
  async create(postAggregate: PostAggregate): Promise<void> {
    let currentAggregate = postAggregate;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const post = currentAggregate.getPost();
        await adminDb.insert(posts).values({
          id: post.id.value,
          post_id: post.postId.value,
          text: post.text,
          article_url: post.articleUrl ?? null,
          attachment_urls: post.attachmentUrls,
          profile_id: post.profileId ?? null,
          posted_at: post.postedAt ?? null,
          like_count: post.likeCount,
          retweet_count: post.retweetCount,
          reply_count: post.replyCount,
          quote_count: post.quoteCount,
        });
        return;
      } catch (error) {
        if (
          (error as { code?: string; constraint?: string }).code === '23505' &&
          (error as { code?: string; constraint?: string }).constraint ===
            'posts_pkey'
        ) {
          attempts++;
          if (attempts < maxAttempts) {
            const post = currentAggregate.getPost();
            const newId = randomUUID();
            console.warn(
              `[DrizzlePostRepository] ID collision detected (attempt ${attempts}), retrying with new ID: ${newId}`
            );
            const newEntity = PostEntity.reconstitute({
              id: new PostId(newId),
              postId: post.postId,
              text: post.text,
              articleUrl: post.articleUrl,
              attachmentUrls: post.attachmentUrls,
              profileId: post.profileId,
              postedAt: post.postedAt,
              likeCount: post.likeCount,
              retweetCount: post.retweetCount,
              replyCount: post.replyCount,
              quoteCount: post.quoteCount,
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
            });
            currentAggregate = PostAggregate.reconstitute(newEntity);
          } else {
            console.error(
              '❌ [DrizzlePostRepository] Failed to generate unique ID after multiple attempts'
            );
            throw new Error(
              'Failed to generate unique ID after multiple attempts'
            );
          }
        } else {
          throw error;
        }
      }
    }
  }

  async findById(id: string): Promise<PostAggregate | null> {
    const result = await adminDb.query.posts.findFirst({
      where: eq(posts.id, id),
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  async findByPostId(postId: string): Promise<PostAggregate | null> {
    const result = await adminDb.query.posts.findFirst({
      where: eq(posts.post_id, postId),
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  private toDomain(data: Post): PostAggregate {
    const entity = PostEntity.reconstitute({
      id: new PostId(data.id),
      postId: new PostSlug(data.post_id),
      text: data.text,
      articleUrl: data.article_url ?? undefined,
      attachmentUrls: data.attachment_urls ?? [],
      profileId: data.profile_id ?? undefined,
      postedAt: data.posted_at ? new Date(data.posted_at) : undefined,
      likeCount: data.like_count ?? 0,
      retweetCount: data.retweet_count ?? 0,
      replyCount: data.reply_count ?? 0,
      quoteCount: data.quote_count ?? 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
    return PostAggregate.reconstitute(entity);
  }
}
