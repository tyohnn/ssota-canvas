'use client';

import { PropertyType } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import { useCustomPropertyAddPopoverContext } from '../core/context';
import { cn } from '@/lib/utils';
import { Box } from '@workspace/ui/components/ui/box';

export interface TypeGridItemProps {
  type: PropertyType;
  label: string;
  icon: React.ReactNode;
  className?: string;
}

export function TypeGridItem({
  type,
  label,
  icon,
  className,
}: TypeGridItemProps) {
  const { handleSelectType } = useCustomPropertyAddPopoverContext();

  const handleClick = () => {
    void handleSelectType(type, label);
  };

  return (
    <Box
      className={cn(
        'flex items-center gap-2 rounded-md border px-2 py-2 text-xs transition-colors hover:bg-accent/50 hover:text-accent-foreground cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className="truncate">{label}</span>
    </Box>
  );
}
