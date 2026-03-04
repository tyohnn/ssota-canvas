/**
 * X 메타데이터 미리보기 조회 Action (블록 독립)
 *
 * 블록 없이 workspaceId + postId로 메타데이터만 조회.
 * linkSourceToBlock, publishXMetadataFetched 호출하지 않음.
 * Drive add dialog 미리보기 등에 사용.
 */

'use server';

import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { ActionResult, err, ok } from '@/lib';
import { withWorkspaceSecureAction } from '@/domains/common/server-actions';

import { fetchXMetadata } from '../../backend/services/fetch-x-metadata.service';
import {
  FetchXMetadataPreviewRequestSchema,
  type FetchXMetadataPreviewRequest,
} from '../../shared/dtos/requests/post.requests';
import type { GetXMetadataDTO } from '../../shared/dtos/responses/post.responses';

export const fetchXMetadataPreviewAction = withWorkspaceSecureAction(
  FetchXMetadataPreviewRequestSchema,
  'fetchXMetadataPreviewAction',
  fetchXMetadataPreviewInternal,
  {
    getLogMetadata: req => ({ postId: req.postId }),
  }
);

async function fetchXMetadataPreviewInternal(
  safeDto: FetchXMetadataPreviewRequest,
  context: WorkspaceActionContext
): Promise<ActionResult<GetXMetadataDTO>> {
  try {
    const userId = new UserId(context.authenticatedUser.id);
    const result = await fetchXMetadata(safeDto.postId, userId);

    if (result.isError()) {
      return err(String(result.error), {
        code: 'METADATA_FETCH_FAILED',
        meta: { originalError: result.error },
      });
    }

    return ok({ post: result.value.post });
  } catch (error) {
    console.error('[fetchXMetadataPreviewInternal] Internal error:', error);
    return err('Internal server error', {
      code: 'INTERNAL_SERVER_ERROR',
      meta: {
        originalError: error instanceof Error ? error.message : 'Unknown error',
        request: safeDto,
      },
    });
  }
}
