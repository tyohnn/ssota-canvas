/**
 * Beta Application Form - Combined Hook
 *
 * Integrates UI State + Business Logic
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@workspace/ui/components/ui/sonner';
import {
  useBetaApplicationFormUI,
  type BetaApplicationFormUIState,
} from './use-beta-application-form.ui';
import {
  useBetaApplicationBusiness,
  type BetaApplicationBusinessLogic,
} from './use-beta-application-form.business';

export interface BetaApplicationFormHookReturn
  extends BetaApplicationFormUIState {
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleFieldChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

/**
 * Combined Hook
 *
 * Integrates UI State and Business Logic
 * Supports Optional Injection for Mock/Test logic
 *
 * @param businessLogic - Optional business logic injection
 * @param onSuccess - Success callback
 * @param onError - Error callback
 */
export function useBetaApplicationForm(
  businessLogic?: BetaApplicationBusinessLogic,
  onSuccess?: () => void,
  onError?: (error: string) => void
): BetaApplicationFormHookReturn {
  const router = useRouter();

  // UI State (Designer domain)
  const uiState = useBetaApplicationFormUI();

  // Business Logic (Engineer domain)
  const defaultBusiness = useBetaApplicationBusiness();
  const business = businessLogic ?? defaultBusiness;

  // Combined Logic: Form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Business: Validation
      const validationError = business.validate?.(uiState.formData);
      if (validationError) {
        toast.error('Validation Error', {
          description: validationError,
        });
        return;
      }

      // UI: Start submitting
      uiState.setIsSubmitting(true);

      try {
        // Business: Submit
        const result = await business.onSubmit(uiState.formData);

        if (result.success) {
          // Success: Show toast, reset form and redirect
          toast.success('Application Submitted', {
            description:
              'Your beta application has been successfully submitted.',
          });
          uiState.resetForm();
          onSuccess?.();
          router.push('/beta/pending');
        } else {
          // Error: Show toast
          const errorMessage =
            result.error || 'An error occurred. Please try again.';
          toast.error('Submission Failed', {
            description: errorMessage,
          });
          onError?.(errorMessage);
        }
      } catch (error) {
        console.error('[BetaApplicationForm] Submit error:', error);
        const errorMessage = 'An unexpected error occurred. Please try again.';
        toast.error('Unexpected Error', {
          description: errorMessage,
        });
        onError?.(errorMessage);
      } finally {
        // UI: Stop submitting
        uiState.setIsSubmitting(false);
      }
    },
    [uiState, business, router, onSuccess, onError]
  );

  // Helper: Field change handler
  const handleFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      uiState.updateField(name as keyof typeof uiState.formData, value);
    },
    [uiState]
  );

  return {
    ...uiState,
    handleSubmit,
    handleFieldChange,
  };
}
