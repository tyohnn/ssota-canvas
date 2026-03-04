/**
 * X 메타데이터 조회 Action
 */
'use server';

import type { Block } from '@/domains/block-management/shared/entities/block.entity';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';
import { DrizzleSourceRepository } from '@/domains/source-management/backend/repositories/implementations/drizzle-source.repository';
import { findOrCreateSource } from '@/domains/source-management/backend/services/source';
import { DrizzlePostRepository } from '../../backend/repositories/implementations/drizzle-post.repository';
import { fetchXMetadata } from '../../backend/services/fetch-x-metadata.service';
import { publishXMetadataFetched } from '../../backend/services/x-metadata-fetched/publish-x-metadata-fetched.service';
import { getPost } from '../../backend/services/post/get-post.service';
import { GetXMetadataRequestSchema } from '../../shared/dtos/requests/post.requests';
import type { GetXMetadataRequest } from '../../shared/dtos/requests/post.requests';
import type { GetXMetadataDTO } from '../../shared/dtos/responses/post.responses';
import type { PostAggregate } from '../../shared/aggregates/post.aggregate';
import { withXBlockSecureAction } from '../secure-action';
import type { XBlockActionContext } from '../secure-action';

export const getXMetadataAction = withXBlockSecureAction(
  GetXMetadataRequestSchema,
  'getXMetadataAction',
  getXMetadataInternal,
  {
    getLogMetadata: req => ({ blockId: req.blockId, postId: req.postId }),
  }
);

async function getXMetadataInternal(
  safeDto: GetXMetadataRequest,
  context: XBlockActionContext
): Promise<ActionResult<GetXMetadataDTO>> {
  try {
    const userId = new UserId(context.authenticatedUser.id);

    const metadataResult = await fetchXMetadata(safeDto.postId, userId);

    if (metadataResult.isError()) {
      return err(String(metadataResult.error), {
        code: 'METADATA_FETCH_FAILED',
        meta: { originalError: metadataResult.error },
      });
    }

    const postView = metadataResult.value.post;
    const response: GetXMetadataDTO = { post: postView };

    const postRepository = new DrizzlePostRepository();
    const postForLink = await getPost({ postId: safeDto.postId }, postRepository);
    const postAggregate =
      postForLink.isError() || !postForLink.value
        ? undefined
        : (postForLink.value as PostAggregate);

    if (postAggregate) {
      const sourceId = await linkSourceToBlock(
        postAggregate,
        safeDto.postId,
        context.block
      );
      if (sourceId) response.sourceId = sourceId;
    }
    response.blockUuid = context.block.id.value;

    const language =
      safeDto.language ?? context.authenticatedUser.profile.language ?? 'en';

    await publishXMetadataFetched({
      workspaceId: context.block.workspaceId.value,
      blockId: context.block.getSlug(),
      orgId: context.organization.id,
      xPostId: safeDto.postId,
      language: language.length >= 2 ? language.slice(0, 2) : 'en',
    });

    return ok(response);
  } catch (error) {
    console.error('[getXMetadataInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}

async function linkSourceToBlock(
  post: PostAggregate,
  postId: string,
  block: Block
): Promise<string | undefined> {
  const url = `https://x.com/i/status/${postId}`;
  const sourceRepository = new DrizzleSourceRepository();
  const result = await findOrCreateSource(
    {
      url,
      sourceType: 'x',
      metadata: {
        appSpaceId: post.getPost().id.value,
        postId,
      },
    },
    sourceRepository
  );
  if (result.isError()) {
    console.warn('[linkSourceToBlock] findOrCreateSource failed:', result.error);
    return undefined;
  }
  const source = result.value.getSource();
  const sourceId = source.id.value;
  block.updateSourceId(sourceId);
  const blockRepository = new DrizzleBlockRepository();
  await blockRepository.update(block);
  return sourceId;
}
