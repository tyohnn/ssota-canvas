/**
 * Property Icon
 *
 * Renders a Lucide icon by name.
 */

'use client';

import * as React from 'react';
import * as Icons from 'lucide-react';
import { FileText } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

export interface PropertyIconProps {
  icon?: string | null;
  className?: string;
  size?: number;
}

export function PropertyIcon({
  icon,
  className,
  size = 14,
}: PropertyIconProps): React.JSX.Element {
  const iconName = icon?.trim();
  const iconLibrary = Icons as unknown as Record<
    string,
    React.ComponentType<{ size?: number; className?: string }>
  >;
  const IconComponent = (iconName && iconLibrary[iconName]) || FileText;

  return (
    <IconComponent
      className={cn('h-3.5 w-3.5 text-muted-foreground/70 shrink-0', className)}
      size={size}
    />
  );
}
