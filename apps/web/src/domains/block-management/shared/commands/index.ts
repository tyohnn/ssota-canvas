import { BlockId } from '../value-objects/block-id.vo';

export interface CreateBlockCommand {
  blockType: string;
  workspaceId: string;
  metadata?: Record<string, any>;
  userId: string;
}

export interface UpdateBlockCommand {
  blockId: BlockId;
  blockType?: string;
  metadata?: Record<string, any>;
  userId: string;
}

export interface DeleteBlockCommand {
  blockId: BlockId;
  userId: string;
}
