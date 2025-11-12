import React from 'react';
import * as Icons from 'lucide-react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyIconProps {
  icon?: string | null;
  className?: string;
  size?: number;
}

export function PropertyIcon({
  icon,
  className,
  size = 14,
}: PropertyIconProps) {
  const iconName = icon?.trim();
  const iconLibrary = Icons as Record<string, any>;
  const IconComponent = (iconName && iconLibrary[iconName]) || FileText;

  return (
    <IconComponent
      className={cn('h-3.5 w-3.5 text-muted-foreground/70', className)}
      size={size}
    />
  );
}
