import React from 'react';
import type { XPostEntities } from './types';

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

/** First N characters of content as block title; appends "..." when truncated. */
export function contentTitleFromText(
  text: string | undefined,
  maxLength = 50
): string {
  const trimmed = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength).trim() + '...';
}

/** Post permalink (X Display Requirements: link timestamp and card to this) */
export function buildPostPermalink(postId: string): string {
  return `https://x.com/i/status/${postId}`;
}

/** Author profile URL (X Display Requirements: link avatar/name/username to this) */
export function buildAuthorProfileUrl(username: string): string {
  return `https://x.com/${username}`;
}

export function getDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Build React nodes for text with entity links (mentions, hashtags, URLs). */
export function renderTextWithEntities(
  text: string,
  entities: XPostEntities | undefined
): React.ReactNode[] {
  if (!entities || (!entities.urls?.length && !entities.mentions?.length && !entities.hashtags?.length)) {
    return [text];
  }
  type Span = { start: number; end: number; href: string; priority: number };
  const spans: Span[] = [];
  for (const u of entities.urls ?? []) {
    const href = u.expanded_url ?? u.url;
    if (href) spans.push({ start: u.start, end: u.end, href, priority: 0 });
  }
  for (const m of entities.mentions ?? []) {
    spans.push({
      start: m.start,
      end: m.end,
      href: `https://x.com/${m.username}`,
      priority: 1,
    });
  }
  for (const h of entities.hashtags ?? []) {
    spans.push({
      start: h.start,
      end: h.end,
      href: `https://x.com/hashtag/${encodeURIComponent(h.tag)}`,
      priority: 2,
    });
  }
  spans.sort((a, b) => a.start - b.start || a.priority - b.priority);
  const merged: Span[] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s.start < last.end) continue;
    merged.push(s);
  }
  const nodes: React.ReactNode[] = [];
  let i = 0;
  for (const s of merged) {
    if (s.start > i) {
      nodes.push(text.slice(i, s.start));
    }
    const slice = text.slice(s.start, s.end);
    nodes.push(
      React.createElement(
        'a',
        {
          key: `${s.start}-${s.end}`,
          href: s.href,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'text-primary hover:underline',
          onClick: (e: React.MouseEvent) => e.stopPropagation(),
        },
        slice
      )
    );
    i = s.end;
  }
  if (i < text.length) nodes.push(text.slice(i));
  return nodes;
}

export function buildFallbackMetadata(url: string): {
  postId: string;
  text: string;
  authorUsername?: string;
  authorName?: string;
} {
  const postId = getPostIdFromUrl(url);
  return {
    postId: postId ?? '',
    text: url,
    authorUsername: undefined,
    authorName: undefined,
  };
}
