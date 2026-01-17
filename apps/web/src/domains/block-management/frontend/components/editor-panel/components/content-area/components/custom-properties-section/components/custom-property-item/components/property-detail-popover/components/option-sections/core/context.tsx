import { createContext, useContext } from 'react';
import type { PropertyOption } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import type { StatusGroup } from '../components/status-option/types';

// Option Management Context - 전체 옵션 관리 상태와 핸들러 제공
export interface OptionManagementContextValue {
  options: PropertyOption[];
  statusGroups?: StatusGroup[];
  handleCreateOption: (
    label: string,
    color: string,
    group?: string
  ) => Promise<PropertyOption | undefined>;
  handleDeleteOption: (optionId: string) => Promise<void>;
  handleOptionLabelChange: (
    optionId: string,
    newLabel: string
  ) => Promise<void>;
  handleOptionColorChange: (
    optionId: string,
    newColor: string
  ) => Promise<void>;
  handleOptionGroupChange?: (
    optionId: string,
    newGroup: string
  ) => Promise<void>;
  handleDuplicateOption: (optionId: string) => Promise<void>;
  getOptionsByGroup?: (groupId: string) => PropertyOption[];
}

export const OptionManagementContext =
  createContext<OptionManagementContextValue | null>(null);

export function useOptionManagementContext(): OptionManagementContextValue {
  const context = useContext(OptionManagementContext);
  if (!context) {
    throw new Error(
      'useOptionManagementContext must be used within OptionManagementProvider'
    );
  }
  return context;
}
