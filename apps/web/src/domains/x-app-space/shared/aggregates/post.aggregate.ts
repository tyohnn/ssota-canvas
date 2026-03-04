/**
 * Post Aggregate
 */
import type { CreatePostCommand } from '../commands/post.commands';
import type { PostView } from '../dtos/views/post.views';
import { PostEntity } from '../entities/post.entity';
import type { DomainEvent } from '../events/domain-event';
import { PostCreatedEvent } from '../events/post.events';

export class PostAggregate {
  private _uncommittedEvents: DomainEvent[] = [];
  private _post: PostEntity;

  constructor(post: PostEntity) {
    this._post = post;
  }

  getPost(): PostEntity {
    return this._post;
  }

  static createPost(command: CreatePostCommand): PostAggregate {
    const post = PostEntity.reconstitute({
      id: command.postId,
      postId: command.postSlug,
      text: command.text,
      articleUrl: command.articleUrl,
      attachmentUrls: command.attachmentUrls ?? [],
      profileId: command.profileId,
      postedAt: command.postedAt,
      likeCount: command.likeCount ?? 0,
      retweetCount: command.retweetCount ?? 0,
      replyCount: command.replyCount ?? 0,
      quoteCount: command.quoteCount ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const event = new PostCreatedEvent(
      post.id.value,
      {
        postId: post.id.value,
        postSlug: post.postId.value,
        text: post.text,
      },
      new Date()
    );

    const aggregate = new PostAggregate(post);
    aggregate._uncommittedEvents.push(event);
    return aggregate;
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  static reconstitute(post: PostEntity): PostAggregate {
    return new PostAggregate(post);
  }

  toView(profile?: {
    username?: string;
    name?: string;
    profileImageUrl?: string;
  }): PostView {
    const p = this._post;
    return {
      id: p.id.value,
      postId: p.postId.value,
      text: p.text,
      articleUrl: p.articleUrl,
      attachmentUrls: p.attachmentUrls,
      authorUsername: profile?.username,
      authorName: profile?.name,
      authorProfileImageUrl: profile?.profileImageUrl,
      postedAt: p.postedAt?.toISOString(),
      likeCount: p.likeCount,
      retweetCount: p.retweetCount,
      replyCount: p.replyCount,
      quoteCount: p.quoteCount,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
