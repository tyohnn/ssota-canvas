'use client';

import * as React from 'react';
import { Box } from '@workspace/ui/components/ui/box';

export interface CustomPropertyInputBoxProps {
  children: React.ReactNode;
}

export function CustomPropertyInputBox({
  children,
}: CustomPropertyInputBoxProps): React.JSX.Element {
  return <Box className="min-w-0 flex-1">{children}</Box>;
}
