import { BlockId } from '../value-objects/block-id.vo';
import { BlockType } from '../value-objects/block-type.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { BlockPropertiesVO } from '../value-objects/block-properties';
import { CustomPropertyDefinitionVO } from '../value-objects/custom-property-definition.vo';

export interface CreateBlockCommand {
  blockId: BlockId;
  userId: UserId;
  workspaceId: WorkspaceId;
  blockType: BlockType;
  title: string;
  // ✅ Properties 초기화는 Block.create() 내부에서 처리됨
}

export interface UpdateBlockCommand {
  blockId: BlockId;
  updateData: {
    title?: string;
    properties?: Record<string, any>;
  };
}

export interface UpdateBlockPropertyCommand {
  blockId: BlockId;
  propertyPath: string;
  value: unknown;
  workspaceId: string; // 블록 소유권 검증용
}

export interface DeleteBlockCommand {
  blockId: BlockId;
}

export interface DuplicateBlockCommand {
  userId: UserId;
}
