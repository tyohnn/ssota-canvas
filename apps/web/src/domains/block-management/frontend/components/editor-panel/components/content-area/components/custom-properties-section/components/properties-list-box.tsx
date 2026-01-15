import { Box } from '@/components/ui/box';
import { PropsWithChildren } from 'react';

export function PropertiesListBox({ children }: PropsWithChildren) {
  return <Box className="space-y-1">{children}</Box>;
}
