'use server';

import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { DrizzleBlockRepository } from '@/domains/block-management/backend/repositories/implementations/drizzle-block.repository';
import type { OrganizationActionContext } from '@/domains/common/auth/types';
import { withOrganizationSecureAction } from '@/domains/common/server-actions';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { ActionResult, err, ok } from '@/lib';

import {
  GetDriveBlockRequest,
  GetDriveBlockRequestSchema,
} from './schemas/get-drive-block.schema';

export const getDriveBlockAction = withOrganizationSecureAction(
  GetDriveBlockRequestSchema,
  'getDriveBlockAction',
  getDriveBlockInternal
);

/** DTO for Drive block detail (client maps to BlockNodeData) */
export interface GetDriveBlockResult {
  id: string;
  workspaceId: string;
  blockType: string;
  title: string;
  properties: Record<string, unknown>;
  customProperties: Array<Record<string, unknown>>;
  content: unknown;
  contentVersion: number;
  /** Linked source ID (sources.id). Required for summary/timeline/extract tabs */
  sourceId: string | null;
  /** 8-10 hex slug for source-management APIs (getSourceSummary, etc.) */
  blockSlug: string;
  createdByProfile: {
    userId: string;
    email: string | null;
    name: string | null;
    profileImageUrl: string | null;
  };
}

async function getDriveBlockInternal(
  safeDto: GetDriveBlockRequest,
  _context: OrganizationActionContext
): Promise<ActionResult<GetDriveBlockResult>> {
  try {
    const workspaceRepository = new DrizzleWorkspaceRepository();
    const orgId = new OrganizationId(safeDto.organizationId);
    const workspaces = await workspaceRepository.findByOrganizationId(orgId);
    const workspaceIds = new Set(workspaces.map(w => w.workspaceId.value));

    const blockRepository = new DrizzleBlockRepository();
    const block = await blockRepository.findById(
      new BlockId(safeDto.blockId)
    );

    if (!block || block.deletedAt) {
      return err('Block not found');
    }

    if (!workspaceIds.has(block.workspaceId.value)) {
      return err('Block does not belong to this organization');
    }

    const profile = block.createdByProfile;
    const createdByProfile = profile
      ? {
          userId: profile.userId,
          email: profile.email ?? null,
          name: profile.name ?? null,
          profileImageUrl: profile.profileImageUrl ?? null,
        }
      : {
          userId: block.userId.value,
          email: null,
          name: null,
          profileImageUrl: null,
        };

    return ok({
      id: block.id.value,
      workspaceId: block.workspaceId.value,
      blockType: block.blockType.value,
      title: block.title,
      properties: block.properties.toJSON() as Record<string, unknown>,
      customProperties: block.customProperties.map(c => c.toJSON()),
      content: block.content,
      contentVersion: block.contentVersion,
      sourceId: block.sourceId,
      blockSlug: block.getSlug(),
      createdByProfile,
    });
  } catch (e) {
    console.error('[getDriveBlockAction]', e);
    return err(
      e instanceof Error ? e.message : 'Failed to get block'
    );
  }
}
