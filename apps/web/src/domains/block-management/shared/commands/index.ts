import { BlockId } from '../value-objects/block-id.vo';
import { BlockType } from '../value-objects/block-type.vo';

export interface CreateBlockCommand {
  blockId: BlockId;
  workspaceId: string;
  blockType: BlockType;
  title?: string;
  initialProperties?: Record<string, any>;
  userId: string;
}

export interface UpdateBlockCommand {
  blockId: BlockId;
  updateData: {
    title?: string;
    description?: string;
    properties?: Record<string, any>;
  };
  userId: string;
}

export interface DeleteBlockCommand {
  blockId: BlockId;
  userId: string;
}
