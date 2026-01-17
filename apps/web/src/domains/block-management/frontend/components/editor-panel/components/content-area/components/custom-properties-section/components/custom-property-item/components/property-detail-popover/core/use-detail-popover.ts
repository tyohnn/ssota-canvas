import { useState, useEffect, useCallback, useRef } from 'react';
import { useCustomProperty } from '@/domains/block-management/frontend/hooks/use-custom-property';
import { useCustomPropertyItemContext } from '../../../core/context';
import type { DetailPopoverField } from './types';
import type { DetailPopoverContextValue } from './context';

export function useDetailPopover(
  blockId: string,
  field: DetailPopoverField
): DetailPopoverContextValue {
  const [label, setLabel] = useState(field.name);
  const [icon, setIconState] = useState<string | null>(field.icon ?? null);
  const { saveLabel, saveIcon, deleteProperty, duplicateProperty } =
    useCustomProperty();
  const { setPopoverOpen } = useCustomPropertyItemContext();
  const iconSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync label when field.name changes externally
  useEffect(() => {
    setLabel(field.name);
  }, [field.name]);

  // Sync icon when field.icon changes externally
  useEffect(() => {
    setIconState(field.icon ?? null);
  }, [field.icon]);

  // Optimistic icon update handler
  const setIcon = useCallback(
    (nextIcon: string | null) => {
      // Update local state immediately
      setIconState(nextIcon);

      // Clear existing timeout
      if (iconSaveTimeoutRef.current) {
        clearTimeout(iconSaveTimeoutRef.current);
      }

      // Perform optimistic update immediately
      saveIcon(blockId, field.id, nextIcon).catch(error => {
        console.error('Failed to save icon:', error);
        // Rollback on error - the saveIcon function handles rollback internally
        setIconState(field.icon ?? null);
      });
    },
    [blockId, field.id, field.icon, saveIcon]
  );

  // Auto-save label with debounce
  useEffect(() => {
    if (label !== field.name) {
      const timeoutId = setTimeout(() => {
        saveLabel(blockId, field.id, label).catch(error => {
          console.error('Failed to save label:', error);
          setLabel(field.name);
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [label, field.name, blockId, field.id, saveLabel]);

  const handleDuplicate = useCallback(async () => {
    try {
      await duplicateProperty(blockId, field.id);
      setPopoverOpen(false);
    } catch (error) {
      console.error('Failed to duplicate property:', error);
    }
  }, [blockId, field.id, duplicateProperty, setPopoverOpen]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteProperty(blockId, field.id);
      setPopoverOpen(false);
    } catch (error) {
      console.error('Failed to delete property:', error);
    }
  }, [blockId, field.id, deleteProperty, setPopoverOpen]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPopoverOpen(false);
      }
    },
    [setPopoverOpen]
  );

  return {
    blockId,
    field,
    label,
    setLabel,
    icon,
    setIcon,
    handleDuplicate,
    handleDelete,
    handleKeyDown,
  };
}
