'use client';

import { useReactFlow } from '@xyflow/react';

import type {
  PropertyOption,
  PropertyType,
} from '../../../shared/value-objects/block-properties/common-types';
import type { SchemaFieldPropertyOption } from './types';
import { useCommitOptions } from './use-commit-options';
import { useCreateProperty } from './use-create-property';
import { useDeleteField } from './use-delete-field';
import { useDuplicateField } from './use-duplicate-field';
import { useSaveIcon } from './use-save-icon';
import { useSaveLabel } from './use-save-label';

export interface UseCustomPropertyResult {
  saveLabel: (
    blockId: string,
    propertyId: string,
    label: string
  ) => Promise<void>;
  saveIcon: (
    blockId: string,
    propertyId: string,
    icon: string | null
  ) => Promise<void>;
  deleteProperty: (blockId: string, propertyId: string) => Promise<void>;
  duplicateProperty: (blockId: string, propertyId: string) => Promise<void>;
  commitOptions: (
    blockId: string,
    propertyId: string,
    options: PropertyOption[]
  ) => Promise<void>;
  createProperty: (
    blockId: string,
    params: { name: string; type: PropertyType; icon: string }
  ) => Promise<string>;
  isSavingLabel: boolean;
  isSavingIcon: boolean;
  isDeleting: boolean;
  isDuplicating: boolean;
  isCommitting: boolean;
  isCreating: boolean;
}

/**
 * 커스텀 속성 정의 관리 Hook (TanStack Query Optimistic Update)
 *
 * - 속성 라벨 저장
 * - 속성 아이콘 저장
 * - 속성 삭제
 * - 속성 복제
 * - 옵션 커밋 (select/multi-select/status 타입)
 * - 속성 생성
 */
export function useCustomProperty(): UseCustomPropertyResult {
  const { getNode, updateNode } = useReactFlow();
  const reactFlow = { getNode, updateNode };

  const { saveLabel, isSaving: isSavingLabel } = useSaveLabel(reactFlow);
  const { saveIcon, isSaving: isSavingIcon } = useSaveIcon(reactFlow);
  const { deleteField, isDeleting } = useDeleteField(reactFlow);
  const { duplicateField, isDuplicating } = useDuplicateField(reactFlow);
  const { commitOptions, isCommitting } = useCommitOptions(reactFlow);
  const { createProperty, isCreating } = useCreateProperty(reactFlow);

  return {
    saveLabel: (blockId, propertyId, label) =>
      saveLabel({ blockId, propertyId, label }),
    saveIcon: (blockId, propertyId, icon) =>
      saveIcon({ blockId, propertyId, icon }),
    deleteProperty: (blockId, propertyId) =>
      deleteField({ blockId, propertyId }),
    duplicateProperty: (blockId, propertyId) =>
      duplicateField({ blockId, propertyId }),
    commitOptions: (blockId, propertyId, options) =>
      commitOptions({
        blockId,
        propertyId,
        options: options as SchemaFieldPropertyOption[],
      }),
    createProperty: (blockId, params) =>
      createProperty({ blockId, params }),
    isSavingLabel,
    isSavingIcon,
    isDeleting,
    isDuplicating,
    isCommitting,
    isCreating,
  };
}
