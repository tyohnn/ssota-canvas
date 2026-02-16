import type { IBlockRepository } from '../../repositories/interfaces/block.repository.interface';
import { addCustomProperty } from './add-custom-property.service';
import { deleteCustomProperty } from './delete-custom-property.service';
import { updateCustomProperty } from './update-custom-property.service';
import type {
  AddCustomPropertyCommand,
  DeleteCustomPropertyCommand,
  UpdateCustomPropertyCommand,
} from './types';

export type { AddCustomPropertyCommand, DeleteCustomPropertyCommand, UpdateCustomPropertyCommand } from './types';

export class BlockCustomPropertyService {
  constructor(private readonly blockRepository: IBlockRepository) {}

  async addCustomProperty(command: AddCustomPropertyCommand) {
    return addCustomProperty(this.blockRepository, command);
  }

  async updateCustomProperty(command: UpdateCustomPropertyCommand) {
    return updateCustomProperty(this.blockRepository, command);
  }

  async deleteCustomProperty(command: DeleteCustomPropertyCommand) {
    return deleteCustomProperty(this.blockRepository, command);
  }
}
