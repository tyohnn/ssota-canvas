import { useCallback } from 'react';
import type { PropertyTypeLike } from '../types';

export interface UseAddPopoverCreatePropertyDeps {
  onSubmit: (params: {
    name: string;
    type: PropertyTypeLike;
    icon: string;
  }) => Promise<string | void>;
  onSuccess?: (propertyId?: string) => void;
}

const DEFAULT_ICON_BY_TYPE: Partial<Record<PropertyTypeLike, string>> = {
  text: 'Type',
  number: 'Hash',
  select: 'List',
  multiselect: 'ListChecks',
  status: 'Star',
  date: 'Calendar',
  boolean: 'CheckSquare',
  url: 'Link',
  email: 'Mail',
  phone: 'Phone',
  color: 'Palette',
  profile: 'User',
};

function resolveIconForType(
  type: PropertyTypeLike,
  providedIcon: string | null
): string {
  if (providedIcon && providedIcon.trim().length > 0) {
    return providedIcon.trim();
  }
  return DEFAULT_ICON_BY_TYPE[type] ?? 'FileText';
}

/**
 * Create property submission.
 */
export function useAddPopoverCreateProperty({
  onSubmit,
  onSuccess,
}: UseAddPopoverCreatePropertyDeps): (params: {
  type: PropertyTypeLike;
  name: string;
  icon: string | null;
}) => Promise<void> {
  return useCallback(
    async (params: {
      type: PropertyTypeLike;
      name: string;
      icon: string | null;
    }) => {
      const iconResolved = resolveIconForType(params.type, params.icon);
      const id = await onSubmit({
        name: params.name.trim(),
        type: params.type,
        icon: iconResolved,
      });
      onSuccess?.(id ?? undefined);
    },
    [onSubmit, onSuccess]
  );
}
