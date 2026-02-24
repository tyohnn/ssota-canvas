/**
 * Audio Block Metadata Server Action
 *
 * publishAudioMetadataFetched → findOrCreateSource, block.sourceId, ensureSourceJob
 * raw_content/summary는 Source Job AudioExtractAdapter (ElevenLabs STT)에서 처리
 */

'use server';

import { ActionResult, err, ok } from '@/lib';
import { z } from 'zod';

import type { BlockActionContext } from '@/domains/block-management/actions/block/secure-action';
import { withBlockAggregateSecureAction } from '@/domains/block-management/actions/block/secure-action';
import { BlockSlugSchema } from '@/domains/block-management/shared/dtos/requests/block.requests';

import { publishAudioMetadataFetched } from '../../backend/services/audio-metadata-fetched/publish-audio-metadata-fetched.service';

const FetchAudioMetadataRequestSchema = z.object({
  workspaceId: z.uuid(),
  blockId: BlockSlugSchema,
  url: z.url({ message: 'Invalid URL' }),
  language: z.string().min(2).max(5).optional().default('en'),
});

export type FetchAudioMetadataRequest = z.output<
  typeof FetchAudioMetadataRequestSchema
>;

export const fetchAudioMetadataAction = withBlockAggregateSecureAction(
  FetchAudioMetadataRequestSchema,
  'fetchAudioMetadataAction',
  fetchAudioMetadataInternal,
  {
    getLogMetadata: req => ({ blockId: req.blockId, url: req.url }),
  }
);

async function fetchAudioMetadataInternal(
  safeDto: FetchAudioMetadataRequest,
  context: BlockActionContext
): Promise<
  ActionResult<{
    sourceId?: string;
    blockUuid: string;
  }>
> {
  const block = context.blockAggregate.getBlock();

  if (block.blockType.value !== 'audio') {
    return err('Block must be an audio block', { code: 'INVALID_BLOCK_TYPE' });
  }

  const sourceId = await publishAudioMetadataFetched({
    workspaceId: safeDto.workspaceId,
    blockId: safeDto.blockId,
    orgId: context.organization.id,
    url: safeDto.url,
    language: safeDto.language,
  });

  return ok({
    sourceId,
    blockUuid: block.id.value,
  });
}
