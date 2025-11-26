/**
 * Beta Application Form
 *
 * Beta application form component
 *
 * This component follows the Compound Component Pattern:
 * - Provider shares state via Context
 * - Sub-components automatically access state from Context
 * - Structure compatible with no-code tools (Framer, etc.)
 *
 * @example
 * ```tsx
 * // Production environment
 * <BetaApplicationForm
 *   onSuccess={() => console.log('Success!')}
 *   onError={(error) => console.error(error)}
 * />
 *
 * // Test environment (Mock business logic)
 * const mockBusiness = useMockBetaApplicationBusiness();
 * <BetaApplicationForm businessLogic={mockBusiness} />
 * ```
 */

'use client';

import { Card, CardContent } from '@workspace/ui/components/ui/card';
import { BetaApplicationFormProvider } from './core/provider';
import { useBetaApplicationFormContext } from './core/context';
import { FormHeader } from './components/form-header';
import { NameInput } from './components/name-input';
import { OrganizationInput } from './components/organization-input';
import { PurposeSelect } from './components/purpose-select';
import { UseCaseSelect } from './components/use-case-select';
import { FormFooter } from './components/form-footer';
import type { BetaApplicationFormProps } from './core/types';

/**
 * Form Content (Internal Component)
 *
 * Form content that uses Context
 */
function FormContent() {
  const { handleSubmit } = useBetaApplicationFormContext();

  return (
    <form onSubmit={handleSubmit}>
      <FormHeader />
      <CardContent className="space-y-6">
        <NameInput />
        <OrganizationInput />
        <PurposeSelect />
        <UseCaseSelect />
      </CardContent>
      <FormFooter />
    </form>
  );
}

/**
 * Beta Application Form
 *
 * Main component: Provider + Internal composition
 */
export function BetaApplicationForm({
  onSuccess,
  onError,
}: BetaApplicationFormProps = {}) {
  return (
    <BetaApplicationFormProvider onSuccess={onSuccess} onError={onError}>
      <Card className="w-full max-w-2xl">
        <FormContent />
      </Card>
    </BetaApplicationFormProvider>
  );
}

// Export sub-components (for individual use in no-code tools)
export { FormHeader } from './components/form-header';
export { NameInput } from './components/name-input';
export { OrganizationInput } from './components/organization-input';
export { PurposeSelect } from './components/purpose-select';
export { UseCaseSelect } from './components/use-case-select';
export { FormFooter } from './components/form-footer';
export { BetaApplicationFormProvider } from './core/provider';
export { useBetaApplicationFormContext } from './core/context';

// Export hooks (for testing and customization)
export { useBetaApplicationForm } from './core/use-beta-application-form';
export { useBetaApplicationFormUI } from './core/use-beta-application-form.ui';
export {
  useBetaApplicationBusiness,
  useMockBetaApplicationBusiness,
} from './core/use-beta-application-form.business';

// Export types
export type { BetaApplicationFormProps } from './core/types';
