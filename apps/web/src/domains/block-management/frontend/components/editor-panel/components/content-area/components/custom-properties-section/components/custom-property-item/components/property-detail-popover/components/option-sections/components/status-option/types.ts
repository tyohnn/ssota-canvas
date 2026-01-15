import type { PropertyOption } from '@/domains/block-management/shared/value-objects/block-properties/common-types';

export type StatusOption = PropertyOption & { group?: string };

export interface StatusOptionField {
  id: string;
  name: string;
  type: string;
  options?: StatusOption[];
}

export interface StatusGroup {
  id: string;
  label: string;
  color: string;
}
