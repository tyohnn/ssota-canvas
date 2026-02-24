import { BlockManagementError } from '../../../shared/errors/block-management.error';
import type { DeleteCustomPropertyParams } from './types';

export async function deleteCustomProperty(
  params: DeleteCustomPropertyParams
): Promise<{ updatedAt: Date }> {
  const { blockAggregate, blockRepository, propertyId } = params;
  const block = blockAggregate.getBlock();

  if (block.isDeleted()) {
    throw new BlockManagementError(
      'BLOCK_ALREADY_DELETED',
      'Cannot modify custom properties of a deleted block'
    );
  }

  block.removeCustomPropertyDefinition(propertyId);
  await blockRepository.update(block);

  return {
    updatedAt: block.updatedAt,
  };
}
