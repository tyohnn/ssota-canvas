import type { IBlockRepository } from '../../repositories/interfaces/block.repository.interface';
import { getBlockForUpdate } from './helpers';
import type { DeleteCustomPropertyCommand } from './types';

export async function deleteCustomProperty(
  blockRepository: IBlockRepository,
  command: DeleteCustomPropertyCommand
): Promise<{ updatedAt: Date }> {
  const block = await getBlockForUpdate(
    blockRepository,
    command.workspaceId,
    command.blockSlug
  );

  block.removeCustomPropertyDefinition(command.propertyId);
  await blockRepository.update(block);

  return {
    updatedAt: block.updatedAt,
  };
}
