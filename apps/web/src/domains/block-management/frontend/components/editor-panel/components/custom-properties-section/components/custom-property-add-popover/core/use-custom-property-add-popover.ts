import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PropertyType } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import type { CustomPropertyAddPopoverContextValue } from './context';
import { usePropertyAddPopoverUI } from './use-custom-property-add-popover.ui';
import {
  usePropertyAddBusiness,
  type PropertyAddBusinessLogic,
} from './use-custom-property-add-popover.business';
import { toast } from '@workspace/ui/components/ui/sonner';

/**
 * Combined Hook: UI + Business Logic
 *
 * UI 상태와 비즈니스 로직을 통합하여 제공
 * - Production: 기본 비즈니스 로직 사용
 * - Test/Framer: Mock 비즈니스 로직 주입 가능
 */

const DEFAULT_ICON_BY_TYPE: Partial<Record<PropertyType, string>> = {
  [PropertyType.TEXT]: 'Type',
  [PropertyType.NUMBER]: 'Hash',
  [PropertyType.SELECT]: 'List',
  [PropertyType.MULTISELECT]: 'ListChecks',
  [PropertyType.STATUS]: 'Star',
  [PropertyType.DATE]: 'Calendar',
  [PropertyType.BOOLEAN]: 'CheckSquare',
  [PropertyType.URL]: 'Link',
  [PropertyType.EMAIL]: 'Mail',
  [PropertyType.PHONE]: 'Phone',
  [PropertyType.COLOR]: 'Palette',
  [PropertyType.PROFILE]: 'User',
};

function resolveIconForType(
  type: PropertyType,
  providedIcon: string | null
): string {
  if (providedIcon && providedIcon.trim().length > 0) {
    return providedIcon.trim();
  }

  return DEFAULT_ICON_BY_TYPE[type] || 'FileText';
}

export function useCustomPropertyAddPopover(
  blockId: string,
  businessLogic?: PropertyAddBusinessLogic // 🎯 Optional injection for testing/mocking
): CustomPropertyAddPopoverContextValue {
  // UI State (디자이너 영역)
  const uiState = usePropertyAddPopoverUI();

  // Business Logic (엔지니어 영역)
  const defaultBusiness = usePropertyAddBusiness(blockId);
  const business = businessLogic ?? defaultBusiness;

  // Combined Logic: UI + Business with TanStack Query
  const mutation = useMutation({
    mutationFn: async ({
      type,
      name,
      icon,
    }: {
      type: PropertyType;
      name: string;
      icon: string;
    }) => {
      await business.onSubmit({ name, type, icon });
    },
    onMutate: async ({ name, icon }) => {
      // Store previous state for error recovery
      const previousName = uiState.propertyName;
      const previousIcon = uiState.icon;

      // UI: Close popover optimistically
      uiState.setOpen(false);

      // Return context for rollback
      return { previousName, previousIcon };
    },
    onError: (error, variables, context) => {
      console.error('Failed to create property:', error);

      // UI: Restore state and reopen on error
      if (context) {
        uiState.setOpen(true);
        uiState.setPropertyName(context.previousName);
        uiState.setIcon(context.previousIcon);
        uiState.inputRef.current?.focus();
      }
    },
    onSuccess: () => {
      // UI: Reset form on success
      uiState.setPropertyName('');
      uiState.setIcon(null);
    },
  });

  const handleSelectType = useCallback(
    async (type: PropertyType, fallbackName: string) => {
      const trimmedName = uiState.propertyName.trim();
      const finalName = trimmedName || fallbackName.trim();

      // Business: Validation (before mutation)
      const error = business.validate?.(finalName);
      if (error) {
        toast.error(error);
        uiState.inputRef.current?.focus();
        return;
      }

      const resolvedIcon = resolveIconForType(type, uiState.icon);

      // Trigger mutation
      mutation.mutate({
        type,
        name: finalName,
        icon: resolvedIcon,
      });
    },
    [uiState, business, mutation]
  );

  return {
    blockId,
    ...uiState,
    handleSelectType,
  };
}
