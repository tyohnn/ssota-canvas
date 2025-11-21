import type { PropsWithChildren } from 'react';
import * as React from 'react';
import { CustomPropertyAddPopoverContext } from './context';
import { useCustomPropertyAddPopover } from './use-custom-property-add-popover';
import type { CustomPropertyAddPopoverProps } from './types';

export function CustomPropertyAddPopoverProvider({
  blockId,
  businessLogic,
  children,
}: PropsWithChildren<CustomPropertyAddPopoverProps>): React.JSX.Element {
  const logic = useCustomPropertyAddPopover(blockId, businessLogic);

  return (
    <CustomPropertyAddPopoverContext.Provider value={logic}>
      {children}
    </CustomPropertyAddPopoverContext.Provider>
  );
}
