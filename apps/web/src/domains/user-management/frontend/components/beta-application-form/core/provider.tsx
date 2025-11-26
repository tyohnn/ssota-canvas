/**
 * Beta Application Form Provider
 */

'use client';

import { BetaApplicationFormContext } from './context';
import { useBetaApplicationForm } from './use-beta-application-form';
import type { BetaApplicationBusinessLogic } from './use-beta-application-form.business';
import type { BetaApplicationFormProps } from './types';

interface BetaApplicationFormProviderProps extends BetaApplicationFormProps {
  children: React.ReactNode;
  businessLogic?: BetaApplicationBusinessLogic;
}

/**
 * Provider Component
 *
 * Shares state to sub-components via Context
 */
export function BetaApplicationFormProvider({
  children,
  businessLogic,
  onSuccess,
  onError,
}: BetaApplicationFormProviderProps) {
  const formState = useBetaApplicationForm(businessLogic, onSuccess, onError);

  return (
    <BetaApplicationFormContext.Provider value={formState}>
      {children}
    </BetaApplicationFormContext.Provider>
  );
}
