'use client';

import * as React from 'react';
import {
  Type,
  Hash,
  List,
  ListChecks,
  Star,
  Calendar,
  CheckSquare,
  Link,
  Mail,
  Phone,
  Palette,
} from 'lucide-react';
import { Box } from '@workspace/ui/components/ui/box';
import { cn } from '@workspace/ui/lib/utils';
import type { PropertyTypeLike } from '../core/types';

export interface TypeGridOption {
  type: PropertyTypeLike;
  label: string;
  icon: React.ReactNode;
}

export const FIELD_TYPE_OPTIONS: TypeGridOption[] = [
  { type: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
  { type: 'number', label: 'Number', icon: <Hash className="w-4 h-4" /> },
  { type: 'select', label: 'Select', icon: <List className="w-4 h-4" /> },
  { type: 'multiselect', label: 'Multi Select', icon: <ListChecks className="w-4 h-4" /> },
  { type: 'status', label: 'Status', icon: <Star className="w-4 h-4" /> },
  { type: 'date', label: 'Date', icon: <Calendar className="w-4 h-4" /> },
  { type: 'boolean', label: 'Checkbox', icon: <CheckSquare className="w-4 h-4" /> },
  { type: 'url', label: 'URL', icon: <Link className="w-4 h-4" /> },
  { type: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { type: 'phone', label: 'Phone', icon: <Phone className="w-4 h-4" /> },
  { type: 'color', label: 'Color', icon: <Palette className="w-4 h-4" /> },
];

export interface TypeGridItemViewProps {
  type: PropertyTypeLike;
  label: string;
  icon: React.ReactNode;
  onSelect: (type: PropertyTypeLike, fallbackName: string) => void;
  className?: string;
}

export function TypeGridItemView({
  type,
  label,
  icon,
  onSelect,
  className,
}: TypeGridItemViewProps): React.JSX.Element {
  const handleClick = () => {
    onSelect(type, label);
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

export interface TypeGridViewProps {
  options?: TypeGridOption[];
  onSelectType: (type: PropertyTypeLike, fallbackName: string) => void;
}

export function TypeGridView({
  options = FIELD_TYPE_OPTIONS,
  onSelectType,
}: TypeGridViewProps): React.JSX.Element {
  return (
    <Box className="grid grid-cols-2 gap-2">
      {options.map(({ type, label, icon }) => (
        <TypeGridItemView
          key={type}
          type={type}
          label={label}
          icon={icon}
          onSelect={onSelectType}
        />
      ))}
    </Box>
  );
}
