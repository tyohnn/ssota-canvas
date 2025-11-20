import { Box } from '@/components/ui/box';
import type { PropsWithChildren } from 'react';

export function InputBox({ children }: PropsWithChildren) {
  return <Box className="min-w-0 flex-1">{children}</Box>;
}
