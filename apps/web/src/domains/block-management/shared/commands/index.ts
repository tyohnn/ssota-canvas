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
  // 선택적으로 초기 properties 제공 가능 (예: 클립보드 붙여넣기)
  initialProperties?: Record<string, any>;
  // 선택적으로 초기 content 제공 가능 (예: 마크다운 텍스트 붙여넣기)
  initialContent?: unknown; // JSONB - TipTap JSON, 텍스트, 코드 등
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

export interface UpdateBlockContentCommand {
  blockId: BlockId;
  content: unknown; // JSONB - TipTap JSON, 기타 구조화된 콘텐츠
  contentRaw?: string; // Markdown text (optional, for AI context)
  workspaceId: string; // 블록 소유권 검증용
}

export interface DeleteBlockCommand {
  blockId: BlockId;
}

export interface DuplicateBlockCommand {
  userId: UserId;
}
