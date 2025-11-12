'use client';

import type { PropsWithChildren } from 'react';
import { OptionManagementContext } from './context';
import { useOptionManagement } from './use-option-management';
import type { OptionManagementConfig } from './use-option-management';

export interface OptionManagementProviderProps
  extends PropsWithChildren,
    OptionManagementConfig {}

export function OptionManagementProvider({
  children,
  ...config
}: OptionManagementProviderProps) {
  const value = useOptionManagement(config);

  return (
    <OptionManagementContext.Provider value={value}>
      {children}
    </OptionManagementContext.Provider>
  );
}
