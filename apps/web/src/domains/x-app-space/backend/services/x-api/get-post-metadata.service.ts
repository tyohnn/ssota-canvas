/**
 * X API - Fetch single post (tweet) metadata
 *
 * X API v2: GET /2/tweets/:id
 * Requires X_API_BEARER_TOKEN (OAuth 2.0 App-Only)
 */
import { config } from '@/config';
import { XAppSpaceError } from '../../../shared/errors/x-app-space.error';
import type {
  PostMetadata,
  XPostEntities,
  XPostEntityHashtag,
  XPostEntityMention,
  XPostEntityUrl,
} from '../../../shared/types/post-metadata.types';

const X_API_BASE = 'https://api.twitter.com/2';

function buildEntities(
  entities: {
    urls?: Array<{
      start?: number;
      end?: number;
      url?: string;
      expanded_url?: string;
      display_url?: string;
    }>;
    mentions?: Array<{
      start?: number;
      end?: number;
      username?: string;
    }>;
    hashtags?: Array<{
      start?: number;
      end?: number;
      tag?: string;
    }>;
  } | undefined
): XPostEntities | undefined {
  if (!entities) return undefined;
  const urls: XPostEntityUrl[] | undefined = entities.urls
    ?.filter((u): u is { start: number; end: number; url: string; expanded_url?: string; display_url?: string } =>
      typeof u.start === 'number' && typeof u.end === 'number' && typeof u.url === 'string'
    )
    .map(u => ({
      start: u.start,
      end: u.end,
      url: u.url,
      expanded_url: u.expanded_url,
      display_url: u.display_url,
    }));
  const mentions: XPostEntityMention[] | undefined = entities.mentions
    ?.filter((m): m is { start: number; end: number; username: string } =>
      typeof m.start === 'number' && typeof m.end === 'number' && typeof m.username === 'string'
    )
    .map(m => ({ start: m.start, end: m.end, username: m.username }));
  const hashtags: XPostEntityHashtag[] | undefined = entities.hashtags
    ?.filter((h): h is { start: number; end: number; tag: string } =>
      typeof h.start === 'number' && typeof h.end === 'number' && typeof h.tag === 'string'
    )
    .map(h => ({ start: h.start, end: h.end, tag: h.tag }));
  if (!urls?.length && !mentions?.length && !hashtags?.length) return undefined;
  return { urls, mentions, hashtags };
}

export async function getPostMetadata(postId: string): Promise<PostMetadata> {
  const token = config.providers.xApiBearerToken;
  if (!token) {
    throw new XAppSpaceError(
      'X_API_TOKEN_MISSING',
      'X API Bearer token is not configured',
      { postId }
    );
  }

  const url = `${X_API_BASE}/tweets/${postId}?expansions=author_id,attachments.media_keys&user.fields=username,name,profile_image_url,description,public_metrics&tweet.fields=created_at,public_metrics,entities,attachments,note_tweet&media.fields=url,preview_image_url,type`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorCode: XAppSpaceError['code'] = 'X_API_ERROR';
    if (response.status === 401) errorCode = 'X_API_UNAUTHORIZED';
    else if (response.status === 403) errorCode = 'X_API_FORBIDDEN';
    else if (response.status === 404) errorCode = 'X_API_NOT_FOUND';
    else if (response.status === 400) errorCode = 'X_API_BAD_REQUEST';
    else if (response.status === 429) errorCode = 'X_API_RATE_LIMIT_EXCEEDED';

    throw new XAppSpaceError(errorCode, `X API error: ${response.status}`, {
      postId,
      status: response.status,
      body: errorText,
    });
  }

  const data = (await response.json()) as {
    data?: {
      id: string;
      text: string;
      created_at?: string;
      author_id?: string;
      attachments?: {
        media_keys?: string[];
      };
      entities?: {
        urls?: Array<{
          start?: number;
          end?: number;
          url?: string;
          expanded_url?: string;
          display_url?: string;
        }>;
        mentions?: Array<{
          start?: number;
          end?: number;
          username?: string;
        }>;
        hashtags?: Array<{
          start?: number;
          end?: number;
          tag?: string;
        }>;
      };
      public_metrics?: {
        like_count?: number;
        retweet_count?: number;
        reply_count?: number;
        quote_count?: number;
      };
      note_tweet?: { text?: string };
    };
    includes?: {
      users?: Array<{
        id: string;
        username?: string;
        name?: string;
        profile_image_url?: string;
        description?: string;
        public_metrics?: {
          followers_count?: number;
          following_count?: number;
          tweet_count?: number;
        };
      }>;
      media?: Array<{
        media_key: string;
        url?: string;
        preview_image_url?: string;
        type?: string;
      }>;
    };
  };

  const tweet = data.data;
  if (!tweet) {
    throw new XAppSpaceError('X_API_NOT_FOUND', 'Post not found', { postId });
  }

  const users = data.includes?.users ?? [];
  const author = users.find(u => u.id === tweet.author_id);
  const entitiesUrls = tweet.entities?.urls ?? [];
  const articleUrl =
    entitiesUrls.find(u => u.expanded_url)?.expanded_url ?? entitiesUrls[0]?.url;
  const entities = buildEntities(tweet.entities);
  const mediaByKey = new Map(
    (data.includes?.media ?? []).map(m => [m.media_key, m] as const)
  );
  const attachmentUrls = (tweet.attachments?.media_keys ?? [])
    .map(key => mediaByKey.get(key))
    .map(m => m?.url ?? m?.preview_image_url)
    .filter((u): u is string => Boolean(u));

  const fullText = tweet.note_tweet?.text ?? tweet.text;

  return {
    text: fullText,
    articleUrl,
    entities,
    attachmentUrls: [...new Set(attachmentUrls)],
    authorId: tweet.author_id,
    authorUsername: author?.username,
    authorName: author?.name,
    authorProfileImageUrl: author?.profile_image_url,
    authorDescription: author?.description,
    authorFollowersCount: author?.public_metrics?.followers_count,
    authorFollowingCount: author?.public_metrics?.following_count,
    authorTweetCount: author?.public_metrics?.tweet_count,
    postedAt: tweet.created_at ? new Date(tweet.created_at) : undefined,
    likeCount: tweet.public_metrics?.like_count,
    retweetCount: tweet.public_metrics?.retweet_count,
    replyCount: tweet.public_metrics?.reply_count,
    quoteCount: tweet.public_metrics?.quote_count,
  };
}
