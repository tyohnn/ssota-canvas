import { Box } from '@/components/ui/box';
import type { PropsWithChildren } from 'react';
import type { ComponentProps } from 'react';

export function Wrapper({
  children,
  ...props
}: PropsWithChildren<ComponentProps<typeof Box>>) {
  return (
    <Box className="w-fit" {...props}>
      {children}
    </Box>
  );
}
