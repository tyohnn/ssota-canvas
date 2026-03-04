'use server';

import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import type { OrganizationActionContext } from '@/domains/common/auth/types';
import { withOrganizationSecureAction } from '@/domains/common/server-actions';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { ActionResult, err, ok } from '@/lib';

import { listDriveBlocks } from '../backend/services/list-drive-blocks.service';
import {
  ListDriveBlocksRequest,
  ListDriveBlocksRequestSchema,
} from './schemas/list-drive-blocks.schema';

export const listDriveBlocksAction = withOrganizationSecureAction(
  ListDriveBlocksRequestSchema,
  'listDriveBlocksAction',
  listDriveBlocksInternal
);

async function listDriveBlocksInternal(
  safeDto: ListDriveBlocksRequest,
  _context: OrganizationActionContext
): Promise<
  ActionResult<{
    items: Array<{
      id: string;
      title: string | null;
      blockType: string;
      workspaceId: string;
      properties?: Record<string, unknown>;
      content?: unknown;
    }>;
    nextCursor: string | null;
  }>
> {
  try {
    const blockRepository = new DrizzleBlockRepository();
    const workspaceRepository = new DrizzleWorkspaceRepository();
    const orgId = new OrganizationId(safeDto.organizationId);

    const result = await listDriveBlocks(
      orgId,
      {
        limit: safeDto.limit,
        cursor: safeDto.cursor ?? undefined,
        typeFilter: safeDto.typeFilter ?? undefined,
      },
      blockRepository,
      workspaceRepository
    );

    return ok(result);
  } catch (e) {
    console.error('[listDriveBlocksAction]', e);
    return err(
      e instanceof Error ? e.message : 'Failed to list drive blocks'
    );
  }
}
