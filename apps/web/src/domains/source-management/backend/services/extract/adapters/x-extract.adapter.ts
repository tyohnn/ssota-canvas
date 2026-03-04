/**
 * X extract adapter: URL → rawContent (markdown)
 *
 * Prioritizes x_app_space data (post/profile) to avoid extra X API credits.
 */
import { DrizzlePostRepository } from '@/domains/x-app-space/backend/repositories/implementations/drizzle-post.repository';
import { DrizzleProfileRepository } from '@/domains/x-app-space/backend/repositories/implementations/drizzle-profile.repository';
import { getPost } from '@/domains/x-app-space/backend/services/post/get-post.service';
import { getProfileById } from '@/domains/x-app-space/backend/services/profile/get-profile-by-id.service';

import type { ExtractResult, IExtractAdapter } from './types';

function getPostIdFromUrl(url: string): string | null {
  try {
    const match = url.match(
      /(?:x\.com|twitter\.com)\/(?:\w+\/status\/|i\/status\/)(\d{10,25})/
    );
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

async function readPostContentFromAppSpace(
  postId: string,
  metadata?: Record<string, unknown>
): Promise<{
  text: string;
  articleUrl?: string;
  attachmentUrls: string[];
  authorUsername?: string;
  authorName?: string;
  postedAt?: string;
  likeCount?: number;
  retweetCount?: number;
  replyCount?: number;
}> {
  const postRepository = new DrizzlePostRepository();
  const profileRepository = new DrizzleProfileRepository();

  const appSpaceId = metadata?.appSpaceId;
  let postAggregate = null;

  if (typeof appSpaceId === 'string' && appSpaceId) {
    postAggregate = await postRepository.findById(appSpaceId);
  }
  if (!postAggregate) {
    const postResult = await getPost({ postId }, postRepository);
    if (postResult.isError()) {
      throw new Error(postResult.error.message);
    }
    postAggregate = postResult.value;
  }
  if (!postAggregate) {
    throw new Error(
      `X post not found in app space (postId: ${postId}). Run getXMetadataAction first.`
    );
  }

  const post = postAggregate.getPost();
  let authorUsername: string | undefined;
  let authorName: string | undefined;
  if (post.profileId) {
    const profileResult = await getProfileById(
      { profileId: post.profileId },
      profileRepository
    );
    if (!profileResult.isError() && profileResult.value) {
      const profile = profileResult.value.toView();
      authorUsername = profile.username;
      authorName = profile.name;
    }
  }

  return {
    text: post.text,
    articleUrl: post.articleUrl,
    attachmentUrls: post.attachmentUrls,
    authorUsername,
    authorName,
    postedAt: post.postedAt?.toISOString(),
    likeCount: post.likeCount,
    retweetCount: post.retweetCount,
    replyCount: post.replyCount,
  };
}

export class XExtractAdapter implements IExtractAdapter {
  async extract(
    url: string,
    metadata?: Record<string, unknown>
  ): Promise<ExtractResult> {
    const postId = getPostIdFromUrl(url);
    if (!postId) {
      throw new Error(`Invalid X post URL: ${url}`);
    }

    const post = await readPostContentFromAppSpace(postId, metadata);

    // Markdown-style raw content for Extract tab (Link pattern)
    const lines: string[] = [];
    if (post.authorName || post.authorUsername) {
      lines.push(`**${post.authorName ?? post.authorUsername ?? 'Unknown'}** (@${post.authorUsername ?? '—'})`);
    }
    if (post.postedAt) {
      lines.push(`*${new Date(post.postedAt).toISOString()}*`);
    }
    lines.push('');
    lines.push(post.text);
    if (post.articleUrl) {
      lines.push('');
      lines.push(`Article: ${post.articleUrl}`);
    }
    if (post.attachmentUrls.length > 0) {
      lines.push('');
      lines.push('Attachments:');
      for (const attachmentUrl of post.attachmentUrls) {
        lines.push(`- ${attachmentUrl}`);
      }
    }
    if (
      post.likeCount != null ||
      post.retweetCount != null ||
      post.replyCount != null
    ) {
      lines.push('');
      const stats: string[] = [];
      if (post.likeCount != null) stats.push(`❤️ ${post.likeCount}`);
      if (post.retweetCount != null) stats.push(`🔁 ${post.retweetCount}`);
      if (post.replyCount != null) stats.push(`💬 ${post.replyCount}`);
      lines.push(stats.join(' · '));
    }

    const rawContent = lines.join('\n');

    return {
      rawContent,
      contentLanguage: null,
    };
  }
}
