'use client';

import * as React from 'react';
import { Box } from '@workspace/ui/components/ui/box';

export interface CustomPropertyItemWrapperProps
  extends React.ComponentPropsWithoutRef<typeof Box> {
  children: React.ReactNode;
}

export function CustomPropertyItemWrapper({
  children,
  ...props
}: CustomPropertyItemWrapperProps): React.JSX.Element {
  return (
    <Box
      className="group flex gap-2 py-0.5 px-2 transition-colors hover:bg-accent/30"
      {...props}
    >
      {children}
    </Box>
  );
}
