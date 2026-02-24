'use client';

import { useReactFlow } from '@xyflow/react';

import type { SchemaFieldPropertyOption } from './types';
import { useCommitOptions } from './use-commit-options';
import { useDeleteField } from './use-delete-field';
import { useDuplicateField } from './use-duplicate-field';
import { useSaveLabel } from './use-save-label';

export type { SchemaFieldPropertyOption as PropertyOption } from './types';

export interface UseSchemaFieldEditorResult {
  saveLabel: (
    blockId: string,
    propertyId: string,
    label: string
  ) => Promise<void>;
  deleteField: (blockId: string, propertyId: string) => Promise<void>;
  duplicateField: (blockId: string, propertyId: string) => Promise<void>;
  commitOptions: (
    blockId: string,
    propertyId: string,
    options: SchemaFieldPropertyOption[]
  ) => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
  isDuplicating: boolean;
  isCommitting: boolean;
}

/**
 * 커스텀 속성 정의 관리 Hook (saveLabel, deleteField, duplicateField, commitOptions 조합)
 *
 * - 속성 라벨 저장
 * - 속성 삭제
 * - 속성 복제
 * - 옵션 커밋 (select/multi-select/status 타입)
 */
export function useSchemaFieldEditor(): UseSchemaFieldEditorResult {
  const { getNode, updateNode } = useReactFlow();
  const reactFlow = { getNode, updateNode };

  const { saveLabel, isSaving } = useSaveLabel(reactFlow);
  const { deleteField, isDeleting } = useDeleteField(reactFlow);
  const { duplicateField, isDuplicating } = useDuplicateField(reactFlow);
  const { commitOptions, isCommitting } = useCommitOptions(reactFlow);

  return {
    saveLabel: (blockId, propertyId, label) =>
      saveLabel({ blockId, propertyId, label }),
    deleteField: (blockId, propertyId) => deleteField({ blockId, propertyId }),
    duplicateField: (blockId, propertyId) =>
      duplicateField({ blockId, propertyId }),
    commitOptions: (blockId, propertyId, options) =>
      commitOptions({ blockId, propertyId, options }),
    isSaving,
    isDeleting,
    isDuplicating,
    isCommitting,
  };
}
