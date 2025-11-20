'use client';

import { Input } from '@/components/ui/input';
import { IconPicker } from '@/domains/workspace-management/frontend/components/shared/icon-picker';
import { cn } from '@/lib/utils';
import { useDetailPopoverContext } from '../core/context';
import { NameLabel } from './name-label';

export function NameInput() {
  const { label, setLabel, icon, setIcon } = useDetailPopoverContext();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  };

  const handleIconChange = (nextIcon: string) => {
    const trimmed = nextIcon.trim();
    setIcon(trimmed.length > 0 ? trimmed : null);
  };

  return (
    <div className="space-y-2">
      <NameLabel title="Property name" />
      <div className="flex items-start gap-1 mt-1">
        <IconPicker
          value={icon ?? undefined}
          onChange={handleIconChange}
          className="h-8 w-8"
          storageKey="property-detail-popover-icon"
        />
        <Input
          value={label}
          id="property-name"
          onChange={handleChange}
          placeholder="Property name"
          className={cn('h-8')}
        />
      </div>
    </div>
  );
}
