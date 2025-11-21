'use client';

import { type PropsWithChildren } from 'react';
import { type ComponentProps } from 'react';

export function Box({
  className,
  children,
  ...props
}: PropsWithChildren<ComponentProps<'div'>>) {
  return (
    <div className={className} data-slot="box" {...props}>
      {children}
    </div>
  );
}
