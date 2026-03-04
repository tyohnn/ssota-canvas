'use client';

import * as React from 'react';
import * as Icons from 'lucide-react';
import { FileText } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

export interface CustomPropertyLabelViewProps {
  propertyName: string;
  propertyIcon: string | null;
  className?: string;
}

/**
 * Label with optional icon.
 */
export function CustomPropertyLabelView({
  propertyName,
  propertyIcon,
  className,
}: CustomPropertyLabelViewProps): React.JSX.Element {
  const iconName = propertyIcon?.trim();
  const iconLibrary = Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;
  const IconComponent = (iconName && iconLibrary[iconName]) || FileText;

  return (
    <>
      <IconComponent
        className={cn('h-3.5 w-3.5 text-muted-foreground/70 shrink-0', className)}
        size={14}
      />
      <span className="w-full text-xs text-left font-medium truncate text-muted-foreground">
        {propertyName}
      </span>
    </>
  );
}
