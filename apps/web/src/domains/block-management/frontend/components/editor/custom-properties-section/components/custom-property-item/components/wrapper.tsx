import { Box } from '@/components/ui/box';
import type { PropsWithChildren } from 'react';
import type { ComponentProps } from 'react';

export function Wrapper({
  children,
  ...props
}: PropsWithChildren<ComponentProps<typeof Box>>) {
  return (
    <Box
      className="group flex gap-2 py-0.5 px-2 transition-colors hover:bg-accent/30"
      {...props}
    >
      {children}
    </Box>
  );
}
