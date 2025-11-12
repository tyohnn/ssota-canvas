import type { PropsWithChildren } from 'react';
import { CustomPropertyItemContext } from './context';
import { useCustomPropertyItem } from './use-custom-property-item';
import type { CustomPropertyItemProps } from './types';

export function CustomPropertyItemProvider({
  property,
  children,
}: PropsWithChildren<CustomPropertyItemProps>) {
  const value = useCustomPropertyItem(property);

  return (
    <CustomPropertyItemContext.Provider value={value}>
      {children}
    </CustomPropertyItemContext.Provider>
  );
}
