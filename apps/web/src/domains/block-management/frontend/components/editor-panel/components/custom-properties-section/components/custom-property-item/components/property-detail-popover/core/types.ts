import type { CustomPropertyDefinition } from '@/domains/block-management/shared/value-objects/block-properties/common-types';

export type DetailPopoverField = CustomPropertyDefinition;

export interface DetailPopoverProps {
  blockId: string;
  field: DetailPopoverField;
}
