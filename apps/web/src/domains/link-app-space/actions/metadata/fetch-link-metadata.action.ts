/**
 * Link Block Metadata Server Action
 *
 * Firecrawl 메타데이터 scrape + block properties 업데이트 + publishLinkMetadataFetched 이벤트
 * (Source 연결·Job enqueue는 publishLinkMetadataFetched 내부에서 처리)
 */

'use server';

import { ActionResult, err, ok } from '@/lib';
import { z } from 'zod';

import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { updateBlockProperties } from '@/domains/block-management/backend/services/block/property/update-block-properties.service';
import type { BlockActionContext } from '@/domains/block-management/actions/block/secure-action';
import { withBlockAggregateSecureAction } from '@/domains/block-management/actions/block/secure-action';
import { BlockSlugSchema } from '@/domains/block-management/shared/dtos/requests/block.requests';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';

import { publishLinkMetadataFetched } from '../../backend/services/link-metadata-fetched/publish-link-metadata-fetched.service';
import { scrapeLinkContent } from '../../backend/services/scrape-link-content.service';

const FetchLinkMetadataRequestSchema = z.object({
  workspaceId: z.uuid(),
  blockId: BlockSlugSchema,
  url: z.url({ message: 'Invalid URL' }),
  language: z.string().min(2).max(5).optional().default('en'),
});

export type FetchLinkMetadataRequest = z.output<
  typeof FetchLinkMetadataRequestSchema
>;

/**
 * 클라이언트용: metadata 조회 (optimistic UI)
 * scrapeLinkContent 호출 후 metadata만 반환
 */
export async function fetchLinkMetadataFromFirecrawlAction(url: string) {
  const result = await scrapeLinkContent(url);
  if (!result.success) {
    return result;
  }
  return { success: true as const, data: result.metadata };
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

  const blockRepository = new DrizzleBlockRepository();
  const userId = new UserId(context.authenticatedUser.id);

  const result = await scrapeLinkContent(safeDto.url);
  const metadata = result.success
    ? result.metadata
    : {
      title: new URL(safeDto.url).hostname,
      description: safeDto.url,
      imageUrl: '',
      siteName: new URL(safeDto.url).hostname,
      domain: new URL(safeDto.url).hostname.replace('www.', ''),
      faviconUrl: `https://icons.duckduckgo.com/ip3/${new URL(safeDto.url).hostname}.ico`,
      type: 'website',
    };

  const updateResult = await updateBlockProperties({
    properties: {
      ogTitle: metadata.title,
      ogDescription: metadata.description,
      ogImage: metadata.imageUrl,
      siteName: metadata.siteName,
      domain: metadata.domain,
      faviconUrl: metadata.faviconUrl,
      author: metadata.author,
      publishedAt: metadata.publishedAt,
      pageType: metadata.type,
    },
    safeBlockAggregate: context.blockAggregate,
    safeUserId: userId,
    blockRepository,
  });

  if (updateResult.isError()) {
    return err(String(updateResult.error), {
      code: 'BLOCK_UPDATE_FAILED',
      meta: { originalError: updateResult.error },
    });
  }

  const sourceId = await publishLinkMetadataFetched({
    workspaceId: safeDto.workspaceId,
    blockId: safeDto.blockId,
    orgId: context.organization.id,
    url: safeDto.url,
    language: safeDto.language,
    markdown: result.success ? result.markdown ?? undefined : undefined,
  });

  return ok({
    sourceId,
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
