'use client';

import { OptionItem } from '../../option-item';
import { useOptionManagementContext } from '../../../core/context';

export function OptionsList() {
  const { options } = useOptionManagementContext();

  return (
    <div className="space-y-1">
      {options.map(option => (
        <OptionItem key={option.id} option={option} />
      ))}
      {options.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-4">
          No options defined
        </div>
      )}
    </div>
  );
}
