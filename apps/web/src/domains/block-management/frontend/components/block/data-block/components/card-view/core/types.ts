/**
 * Card View Types
 *
 * CardView 컴포넌트의 타입 정의
 */
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { CustomPropertyDefinition } from '@/domains/block-management/shared/value-objects/block-properties/common-types';

export interface CardViewProps {
  data: BlockNodeData;
  className?: string;
  selected?: boolean;
}

export interface CardViewViewProps {
  title: string;
  blockType: string;
  customProperties: Array<{
    property: CustomPropertyDefinition;
    value: unknown;
  }>;
  className?: string;
  selected?: boolean;
  onOpenEditorPanel: () => void;
}

export interface CustomPropertyRowProps {
  property: CustomPropertyDefinition;
  value: unknown;
}

export interface CardViewBusinessLogic {
  getCustomPropertyValues: (
    customProperties: CustomPropertyDefinition[],
    properties: Record<string, unknown>
  ) => Array<{
    property: CustomPropertyDefinition;
    value: unknown;
  }>;
  openEditorPanel: () => void;
}

export interface UseCardViewReturn {
  viewProps: CardViewViewProps;
  business: CardViewBusinessLogic;
}

export interface UseCardViewBusinessOptions {
  blockId?: string;
  canvasMode?: {
    mode: { type: string; blockId?: string };
    isBlockEditingMode: () => boolean;
    enterBlockEditingMode: (blockId: string) => void;
  };
}

export interface UseCardViewOptions {
  businessLogic?: CardViewBusinessLogic;
}
