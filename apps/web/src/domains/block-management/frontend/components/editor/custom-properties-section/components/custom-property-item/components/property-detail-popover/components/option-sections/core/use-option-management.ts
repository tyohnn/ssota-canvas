import { useState, useEffect, useCallback } from 'react';
import { useCustomProperty } from '@/domains/block-management/frontend/hooks/use-custom-property';
import { useDetailPopoverContext } from '../../../core/context';
import type { PropertyOption } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import type { StatusGroup } from '../components/status-option/types';
import type { OptionManagementContextValue } from './context';

export interface OptionManagementConfig {
  withGroups?: boolean;
  defaultGroups?: StatusGroup[];
}

export function useOptionManagement(
  config: OptionManagementConfig = {}
): OptionManagementContextValue {
  const { blockId, field } = useDetailPopoverContext();
  const { withGroups = false, defaultGroups = [] } = config;

  const [options, setOptions] = useState<PropertyOption[]>(field.options || []);
  const { commitOptions } = useCustomProperty();

  // Sync options when field.options changes externally
  useEffect(() => {
    setOptions(field.options || []);
  }, [field.options]);

  // Transform options before commit (remove group for status)
  const transformOptionsForCommit = useCallback(
    (opts: PropertyOption[]) => {
      if (withGroups) {
        return opts.map(({ group, ...rest }) => rest);
      }
      return opts;
    },
    [withGroups]
  );

  const handleCreateOption = useCallback(
    async (
      label: string,
      color: string,
      group?: string
    ): Promise<PropertyOption | undefined> => {
      if (!label.trim()) return;

      const optionId = `opt-${Date.now()}`;
      const targetGroup = group || defaultGroups[0]?.id || 'not-started';
      const newOption: PropertyOption = {
        id: optionId,
        label: label.trim(),
        value: optionId,
        color,
        order: withGroups
          ? options.filter(
              o =>
                (o as PropertyOption & { group?: string }).group === targetGroup
            ).length
          : options.length,
        ...(withGroups && { group: targetGroup }),
      };

      const updatedOptions = [...options, newOption];
      setOptions(updatedOptions);

      try {
        await commitOptions(
          blockId,
          field.id,
          transformOptionsForCommit(updatedOptions)
        );
        return newOption;
      } catch (error) {
        console.error('Failed to create option:', error);
        setOptions(options); // Revert on error
        return undefined;
      }
    },
    [
      options,
      blockId,
      field.id,
      commitOptions,
      withGroups,
      defaultGroups,
      transformOptionsForCommit,
    ]
  );

  const handleDeleteOption = useCallback(
    async (optionId: string) => {
      const updatedOptions = options.filter(option => option.id !== optionId);
      setOptions(updatedOptions);

      try {
        await commitOptions(
          blockId,
          field.id,
          transformOptionsForCommit(updatedOptions)
        );
      } catch (error) {
        console.error('Failed to delete option:', error);
        setOptions(options); // Revert on error
      }
    },
    [options, blockId, field.id, commitOptions, transformOptionsForCommit]
  );

  const handleOptionLabelChange = useCallback(
    async (optionId: string, newLabel: string) => {
      const updatedOptions = options.map(option =>
        option.id === optionId ? { ...option, label: newLabel } : option
      );
      setOptions(updatedOptions);

      try {
        await commitOptions(
          blockId,
          field.id,
          transformOptionsForCommit(updatedOptions)
        );
      } catch (error) {
        console.error('Failed to update option:', error);
        setOptions(options); // Revert on error
      }
    },
    [options, blockId, field.id, commitOptions, transformOptionsForCommit]
  );

  const handleOptionColorChange = useCallback(
    async (optionId: string, newColor: string) => {
      const updatedOptions = options.map(option =>
        option.id === optionId ? { ...option, color: newColor } : option
      );
      setOptions(updatedOptions);

      try {
        await commitOptions(
          blockId,
          field.id,
          transformOptionsForCommit(updatedOptions)
        );
      } catch (error) {
        console.error('Failed to update option color:', error);
        setOptions(options); // Revert on error
      }
    },
    [options, blockId, field.id, commitOptions, transformOptionsForCommit]
  );

  const handleOptionGroupChange = useCallback(
    async (optionId: string, newGroup: string) => {
      if (!withGroups) return;

      const updatedOptions = options.map(option =>
        option.id === optionId ? { ...option, group: newGroup } : option
      );
      setOptions(updatedOptions);

      try {
        await commitOptions(
          blockId,
          field.id,
          transformOptionsForCommit(updatedOptions)
        );
      } catch (error) {
        console.error('Failed to update option group:', error);
        setOptions(options); // Revert on error
      }
    },
    [
      options,
      blockId,
      field.id,
      commitOptions,
      withGroups,
      transformOptionsForCommit,
    ]
  );

  const handleDuplicateOption = useCallback(
    async (optionId: string) => {
      const optionToDuplicate = options.find(o => o.id === optionId);
      if (!optionToDuplicate) return;

      const newOptionId = `opt-${Date.now()}`;
      const duplicatedOption: PropertyOption = {
        ...optionToDuplicate,
        id: newOptionId,
        value: newOptionId, // value도 새로운 값으로 변경하여 key 중복 방지
        label: `${optionToDuplicate.label} Copy`,
        order: options.length,
      };

      const updatedOptions = [...options, duplicatedOption];
      setOptions(updatedOptions);

      try {
        await commitOptions(
          blockId,
          field.id,
          transformOptionsForCommit(updatedOptions)
        );
      } catch (error) {
        console.error('Failed to duplicate option:', error);
        setOptions(options); // Revert on error
      }
    },
    [options, blockId, field.id, commitOptions, transformOptionsForCommit]
  );

  const getOptionsByGroup = useCallback(
    (groupId: string) => {
      if (!withGroups) return [];
      return options.filter(
        option =>
          (option as PropertyOption & { group?: string }).group === groupId
      );
    },
    [options, withGroups]
  );

  return {
    options,
    statusGroups: withGroups ? defaultGroups : undefined,
    handleCreateOption,
    handleDeleteOption,
    handleOptionLabelChange,
    handleOptionColorChange,
    handleOptionGroupChange: withGroups ? handleOptionGroupChange : undefined,
    handleDuplicateOption,
    getOptionsByGroup: withGroups ? getOptionsByGroup : undefined,
  };
}
