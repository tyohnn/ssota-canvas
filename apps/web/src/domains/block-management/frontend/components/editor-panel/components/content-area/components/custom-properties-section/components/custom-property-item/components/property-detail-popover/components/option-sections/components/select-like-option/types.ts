import type { PropertyOption } from '@/domains/block-management/shared/value-objects/block-properties/common-types';

export interface SelectLikeOptionField {
  id: string;
  name: string;
  type: string;
  options: PropertyOption[];
}
