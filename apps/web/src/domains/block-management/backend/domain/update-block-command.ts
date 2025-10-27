import { BlockId } from '../../shared/value-objects/block-id.vo';
import { BlockManagementError } from '../../shared/errors/block-management.error';

export interface UpdateBlockData {
  title?: string;
  description?: string;
  properties?: Record<string, any>;
}

export class UpdateBlockCommand {
  constructor(
    public readonly blockId: BlockId,
    public readonly updateData: UpdateBlockData
  ) {
    this.validate(blockId, updateData);
  }

  private validate(blockId: BlockId, updateData: UpdateBlockData): void {
    if (!blockId) {
      throw new BlockManagementError(
        'INVALID_BLOCK_ID',
        'Block ID cannot be null or undefined'
      );
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      throw new BlockManagementError(
        'INVALID_OPERATION',
        'Update data cannot be empty'
      );
    }
  }

  hasTitleUpdate(): boolean {
    return 'title' in this.updateData;
  }

  hasDescriptionUpdate(): boolean {
    return 'description' in this.updateData;
  }

  hasPropertiesUpdate(): boolean {
    return 'properties' in this.updateData;
  }

  getUpdateFields(): string[] {
    return Object.keys(this.updateData);
  }

  toJSON(): { blockId: string; updateData: UpdateBlockData } {
    return {
      blockId: this.blockId.value,
      updateData: this.updateData,
    };
  }
}
