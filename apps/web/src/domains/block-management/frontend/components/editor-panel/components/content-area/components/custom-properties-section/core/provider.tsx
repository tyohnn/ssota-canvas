import type { PropsWithChildren } from 'react';
import { CustomPropertiesSectionContext } from './context';
import { useCustomPropertiesSection } from './use-custom-properties-section';
import type { CustomPropertiesSectionProps } from './types';

export function CustomPropertiesSectionProvider({
  blockId,
  children,
}: PropsWithChildren<CustomPropertiesSectionProps>) {
  const value = useCustomPropertiesSection(blockId);

  return (
    <CustomPropertiesSectionContext.Provider value={value}>
      {children}
    </CustomPropertiesSectionContext.Provider>
  );
}
