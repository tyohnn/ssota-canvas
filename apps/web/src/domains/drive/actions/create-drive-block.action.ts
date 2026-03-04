'use server';

import { createBlock } from '@/domains/block-management/backend/services/block/lifecycle/create-block.service';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import type { OrganizationActionContext } from '@/domains/common/auth/types';
import { withOrganizationSecureAction } from '@/domains/common/server-actions';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { ActionResult, err, ok } from '@/lib';

import {
  CreateDriveBlockRequest,
  CreateDriveBlockRequestSchema,
} from './schemas/create-drive-block.schema';

export const createDriveBlockAction = withOrganizationSecureAction(
  CreateDriveBlockRequestSchema,
  'createDriveBlockAction',
  createDriveBlockInternal
);

async function createDriveBlockInternal(
  safeDto: CreateDriveBlockRequest,
  context: OrganizationActionContext
): Promise<ActionResult<{ blockId: string }>> {
  try {
    const workspaceRepository = new DrizzleWorkspaceRepository();
    const workspaces = await workspaceRepository.findByOrganizationId(
      context.organization.id
    );
    const workspaceIds = new Set(workspaces.map(w => w.workspaceId.value));

    if (!workspaceIds.has(safeDto.workspaceId)) {
      return err('Workspace does not belong to this organization');
    }

    const blockRepository = new DrizzleBlockRepository();
    const userId = new UserId(context.authenticatedUser.id);

    const result = await createBlock(
      {
        workspaceId: safeDto.workspaceId,
        blockType: safeDto.blockType,
        title: safeDto.title,
        initialProperties: safeDto.initialProperties,
        initialContent: safeDto.initialContent,
      },
      userId,
      blockRepository
    );

    if (result.isError()) {
      return err(result.error.message);
    }

    const block = result.value.getBlock();
    return ok({ blockId: block.id.value });
  } catch (e) {
    console.error('[createDriveBlockAction]', e);
    return err(
      e instanceof Error ? e.message : 'Failed to create block'
    );
  }
}
