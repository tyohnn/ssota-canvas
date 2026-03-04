/**
 * Link 메타데이터 미리보기 조회 Action (블록 독립)
 *
 * 블록 없이 workspaceId + url로 메타데이터만 조회.
 * Drive add dialog 미리보기 등에 사용.
 */

'use server';

import { z } from 'zod';

import { ActionResult, err, ok } from '@/lib';
import { withWorkspaceSecureAction } from '@/domains/common/server-actions';

import { fetchLinkMetadataFast } from '../../backend/services/fetch-link-metadata-fast.service';
import type { OpenGraphMetadata } from '../../shared/types/open-graph-metadata';

const FetchLinkMetadataPreviewRequestSchema = z.object({
  workspaceId: z.uuid('Invalid workspace ID'),
  url: z.string().url('Invalid URL'),
});

export type FetchLinkMetadataPreviewRequest = z.infer<
  typeof FetchLinkMetadataPreviewRequestSchema
>;

export const fetchLinkMetadataPreviewAction = withWorkspaceSecureAction(
  FetchLinkMetadataPreviewRequestSchema,
  'fetchLinkMetadataPreviewAction',
  fetchLinkMetadataPreviewInternal,
  {
    getLogMetadata: req => ({ url: req.url }),
  }
);

async function fetchLinkMetadataPreviewInternal(
  safeDto: FetchLinkMetadataPreviewRequest
): Promise<ActionResult<OpenGraphMetadata>> {
  try {
    const metadata = await fetchLinkMetadataFast(safeDto.url);
    return ok(metadata);
  } catch (error) {
    console.error(
      '[fetchLinkMetadataPreviewInternal] Internal error:',
      error
    );
    return err('Failed to fetch link metadata', {
      code: 'METADATA_FETCH_FAILED',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        url: safeDto.url,
      },
    });
  }
}