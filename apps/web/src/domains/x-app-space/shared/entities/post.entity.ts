/**
 * Post Entity - X 포스트 메타데이터
 */
import { PostId } from '../value-objects/post-id.vo';
import { PostSlug } from '../value-objects/post-slug.vo';

export class PostEntity {
  constructor(
    public readonly id: PostId,
    public readonly postId: PostSlug,
    public readonly text: string,
    public readonly articleUrl: string | undefined,
    public readonly attachmentUrls: string[],
    public readonly profileId: string | undefined,
    public readonly postedAt: Date | undefined,
    public readonly likeCount: number,
    public readonly retweetCount: number,
    public readonly replyCount: number,
    public readonly quoteCount: number,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  static reconstitute(params: {
    id: PostId;
    postId: PostSlug;
    text: string;
    articleUrl?: string;
    attachmentUrls?: string[];
    profileId?: string;
    postedAt?: Date;
    likeCount: number;
    retweetCount: number;
    replyCount: number;
    quoteCount: number;
    createdAt: Date;
    updatedAt: Date;
  }): PostEntity {
    return new PostEntity(
      params.id,
      params.postId,
      params.text,
      params.articleUrl,
      params.attachmentUrls ?? [],
      params.profileId,
      params.postedAt,
      params.likeCount,
      params.retweetCount,
      params.replyCount,
      params.quoteCount,
      params.createdAt,
      params.updatedAt
    );
  }
}
