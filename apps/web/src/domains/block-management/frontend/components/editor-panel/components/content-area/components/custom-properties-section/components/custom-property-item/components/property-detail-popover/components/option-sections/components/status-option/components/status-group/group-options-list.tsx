'use client';

import { OptionItem } from '../../../option-item';
import { useOptionManagementContext } from '../../../../core/context';
import type { StatusGroup } from '../../types';

interface GroupOptionsListProps {
  group: StatusGroup;
}

export function GroupOptionsList({ group }: GroupOptionsListProps) {
  const { getOptionsByGroup } = useOptionManagementContext();
  const options = getOptionsByGroup?.(group.id) || [];

  return (
    <div className="space-y-1">
      {options.map(option => (
        <OptionItem key={option.id} option={option} />
      ))}
    </div>
  );
}
