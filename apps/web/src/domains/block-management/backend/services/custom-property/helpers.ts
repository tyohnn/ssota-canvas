import { randomUUID } from 'crypto';

import type { IBlockRepository } from '../../repositories/interfaces/block.repository.interface';
import { BlockManagementError } from '../../../shared/errors/block-management.error';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { PropertyOptionVO } from '../../../shared/value-objects/property-option.vo';
import type { PropertyOptionInput } from './types';

export async function getBlockForUpdate(
  blockRepository: IBlockRepository,
  workspaceId: string,
  blockSlug: string
) {
  const block = await blockRepository.findByWorkspaceIdAndSlug(
    new WorkspaceId(workspaceId),
    blockSlug
  );

  if (!block) {
    throw new BlockManagementError(
      'BLOCK_NOT_FOUND',
      'Block not found for custom property operation'
    );
  }

  if (block.workspaceId.value !== workspaceId) {
    throw new BlockManagementError(
      'WORKSPACE_MISMATCH',
      'Block does not belong to the provided workspace'
    );
  }

  if (block.isDeleted()) {
    throw new BlockManagementError(
      'BLOCK_ALREADY_DELETED',
      'Cannot modify custom properties of a deleted block'
    );
  }

  return block;
}

export function mapOptions(options?: PropertyOptionInput[]): PropertyOptionVO[] {
  if (!options || options.length === 0) {
    return [];
  }

  return options.map(option =>
    PropertyOptionVO.fromJSON({
      id: option.id ?? randomUUID(),
      label: option.label,
      value: option.value ?? option.id ?? option.label,
      color: option.color,
      order: option.order ?? 0,
      disabled: option.disabled ?? false,
      description: option.description,
    })
  );
}
