import { useMemo } from 'react';
import type { DetailPopoverFieldLike } from './types';
import type { PropertyDetailPopoverDeps } from './types';
import { useDetailPopoverUI } from './use-detail-popover.ui';
import { useDetailLabelSave } from './business/use-detail-label-save.business';
import { useDetailIconSave } from './business/use-detail-icon-save.business';
import { useDetailDelete } from './business/use-detail-delete.business';
import { useDetailDuplicate } from './business/use-detail-duplicate.business';
import { useDetailClose } from './business/use-detail-close.business';

export interface UseDetailPopoverArgs {
  entityId: string;
  field: DetailPopoverFieldLike;
  deps: PropertyDetailPopoverDeps;
}

export interface UseDetailPopoverResult {
  label: string;
  setLabel: (value: string) => void;
  icon: string | null;
  setIcon: (value: string | null) => void;
  handleDuplicate: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleKeyDown: (event: React.KeyboardEvent) => void;
}

/**
 * Orchestration: UI + business hooks.
 */
export function useDetailPopover({
  entityId,
  field,
  deps,
}: UseDetailPopoverArgs): UseDetailPopoverResult {
  const { label, setLabel } = useDetailPopoverUI({ field });

  useDetailLabelSave(
    { entityId, field, label },
    { saveLabel: deps.saveLabel }
  );

  const { icon, setIcon } = useDetailIconSave(
    { entityId, field },
    { saveIcon: deps.saveIcon }
  );

  const handleDelete = useDetailDelete(
    { entityId, field },
    { deleteProperty: deps.deleteProperty, onRequestClose: deps.onRequestClose }
  );

  const handleDuplicate = useDetailDuplicate(
    { entityId, field },
    {
      duplicateProperty: deps.duplicateProperty,
      onRequestClose: deps.onRequestClose,
    }
  );

  const handleKeyDown = useDetailClose({
    onRequestClose: deps.onRequestClose,
  });

  return useMemo(
    () => ({
      label,
      setLabel,
      icon,
      setIcon,
      handleDuplicate,
      handleDelete,
      handleKeyDown,
    }),
    [
      label,
      setLabel,
      icon,
      setIcon,
      handleDuplicate,
      handleDelete,
      handleKeyDown,
    ]
  );
}
