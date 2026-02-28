/**
 * Link Block Metadata Server Action
 *
 * sources 캐시 우선 조회 → 히트 시 fetch 생략. 미스 시 HTML 파싱 + publishLinkMetadataFetched.
 * markdown/raw_content는 Source Job LinkExtractAdapter에서 Firecrawl로 처리 (YouTube 패턴)
 * 메타데이터(ogTitle 등) 저장은 클라이언트 updateProperties에서 처리
 */

'use server';

import { ActionResult, err, ok } from '@/lib';
import { z } from 'zod';

import type { BlockActionContext } from '@/domains/block-management/actions/block/secure-action';
import { withBlockAggregateSecureAction } from '@/domains/block-management/actions/block/secure-action';
import { BlockSlugSchema } from '@/domains/block-management/shared/dtos/requests/block.requests';
import { DrizzleSourceRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source.repository';
import type { LinkSourceMetadata } from '@/domains/source-management/shared/types/source-metadata.types';

import { LanguageCode } from '@/domains/source-management/shared/value-objects/language-code.vo';

import { fetchLinkMetadataFast } from '../../backend/services/fetch-link-metadata-fast.service';
import type { OpenGraphMetadata } from '../../shared/types/open-graph-metadata';
import { publishLinkMetadataFetched } from '../../backend/services/link-metadata-fetched/publish-link-metadata-fetched.service';

const FetchLinkMetadataRequestSchema = z.object({
  workspaceId: z.uuid(),
  blockId: BlockSlugSchema,
  url: z.url({ message: 'Invalid URL' }),
  language: z.string().min(2).max(5).optional(),
});

function resolveLanguage(
  requestLanguage: string | undefined,
  profileLanguage: string | undefined
): string {
  const code = LanguageCode.optional(
    requestLanguage ?? profileLanguage ?? undefined
  );
  return code?.value ?? 'en';
}

export type FetchLinkMetadataRequest = z.output<
  typeof FetchLinkMetadataRequestSchema
>;

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

/** Decode HTML entities in URL so img src loads (e.g. &amp; -> &). */
function decodeUrlEntities(s: string): string {
  if (!s) return s;
  return s.replace(/&amp;/gi, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

function linkMetadataToOg(
  m: LinkSourceMetadata,
  url: string
): OpenGraphMetadata {
  const domain = m.domain ?? getDomain(url);
  return {
    title: m.ogTitle ?? domain ?? 'Unknown',
    description: m.ogDescription ?? '',
    imageUrl: decodeUrlEntities(m.ogImage ?? ''),
    siteName: m.siteName ?? domain,
    domain,
    faviconUrl:
      m.faviconUrl ??
      (domain ? `https://icons.duckduckgo.com/ip3/${domain}.ico` : ''),
    type: m.type ?? 'website',
    author: m.author,
    publishedAt: m.publishedAt,
  };
}

export const fetchLinkMetadataAction = withBlockAggregateSecureAction(
  FetchLinkMetadataRequestSchema,
  'fetchLinkMetadataAction',
  fetchLinkMetadataInternal,
  {
    getLogMetadata: req => ({ blockId: req.blockId, url: req.url }),
  }
);

async function fetchLinkMetadataInternal(
  safeDto: FetchLinkMetadataRequest,
  context: BlockActionContext
): Promise<
  ActionResult<{
    sourceId?: string;
    blockUuid: string;
    metadata: {
      title: string;
      description: string;
      imageUrl: string;
      siteName: string;
      domain: string;
      faviconUrl: string;
      type: string;
      author?: string;
      publishedAt?: string;
    };
  }>
> {
  const block = context.blockAggregate.getBlock();

  if (block.blockType.value !== 'link') {
    return err('Block must be a link block', { code: 'INVALID_BLOCK_TYPE' });
  }

  const sourceRepository = new DrizzleSourceRepository();
  const cached = await sourceRepository.findNonExpiredByUrl(
    safeDto.url,
    'link'
  );

  const language = resolveLanguage(
    safeDto.language,
    context.authenticatedUser.profile.language
  );

  let metadata: OpenGraphMetadata;
  let sourceId: string | undefined;

  if (cached?.metadata && (cached.metadata as LinkSourceMetadata).ogTitle) {
    metadata = linkMetadataToOg(
      cached.metadata as LinkSourceMetadata,
      safeDto.url
    );
    sourceId = cached.id.value;
    // 캐시 히트: publishLinkMetadataFetched로 block.sourceId·ensureSourceJob 처리 (fetch 스킵)
    const resolvedSourceId = await publishLinkMetadataFetched({
      workspaceId: safeDto.workspaceId,
      blockId: safeDto.blockId,
      orgId: context.organization.id,
      url: safeDto.url,
      language,
      metadata,
    });
    sourceId = resolvedSourceId ?? sourceId;
  } else {
    metadata = await fetchLinkMetadataFast(safeDto.url);
    sourceId = await publishLinkMetadataFetched({
      workspaceId: safeDto.workspaceId,
      blockId: safeDto.blockId,
      orgId: context.organization.id,
      url: safeDto.url,
      language,
      metadata,
    });
  }

  return ok({
    sourceId,
    blockUuid: block.id.value,
    metadata: {
      title: metadata.title,
      description: metadata.description,
      imageUrl: metadata.imageUrl,
      siteName: metadata.siteName,
      domain: metadata.domain,
      faviconUrl: metadata.faviconUrl,
      type: metadata.type,
      author: metadata.author,
      publishedAt: metadata.publishedAt,
    },
  });
}
