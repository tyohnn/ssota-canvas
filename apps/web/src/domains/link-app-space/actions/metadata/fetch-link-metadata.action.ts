/**
 * Link Block Metadata Server Action
 *
 * HTML 파싱(빠른 metadata) + publishLinkMetadataFetched (Source 연결·block.sourceId·Job enqueue)
 * markdown/raw_content는 Source Job LinkExtractAdapter에서 Firecrawl로 처리 (YouTube 패턴)
 * 메타데이터(ogTitle 등) 저장은 클라이언트 updateProperties에서 처리
 */

'use server';

import { ActionResult, err, ok } from '@/lib';
import { z } from 'zod';

import type { BlockActionContext } from '@/domains/block-management/actions/block/secure-action';
import { withBlockAggregateSecureAction } from '@/domains/block-management/actions/block/secure-action';
import { BlockSlugSchema } from '@/domains/block-management/shared/dtos/requests/block.requests';

import { fetchLinkMetadataFast } from '../../backend/services/fetch-link-metadata-fast.service';
import { publishLinkMetadataFetched } from '../../backend/services/link-metadata-fetched/publish-link-metadata-fetched.service';

const FetchLinkMetadataRequestSchema = z.object({
  workspaceId: z.uuid(),
  blockId: BlockSlugSchema,
  url: z.url({ message: 'Invalid URL' }),
  language: z.string().min(2).max(5).optional().default('en'),
});

export type FetchLinkMetadataRequest = z.output<
  typeof FetchLinkMetadataRequestSchema
>;

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

  const metadata = await fetchLinkMetadataFast(safeDto.url);

  // 메타데이터(ogTitle 등) 저장은 클라이언트 updateProperties에서 처리 (YouTube 패턴·탭 데이터 동기화)
  // markdown/raw_content 없음 → Source Job에서 LinkExtractAdapter가 Firecrawl로 추출
  const sourceId = await publishLinkMetadataFetched({
    workspaceId: safeDto.workspaceId,
    blockId: safeDto.blockId,
    orgId: context.organization.id,
    url: safeDto.url,
    language: safeDto.language,
  });

  return ok({
    sourceId,
    /** block entity UUID - use for source_jobs Realtime (block_id=eq.${blockUuid}) */
    blockUuid: context.blockAggregate.getBlock().id.value,
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
