/**
 * Beta Application Form - Business Logic Hook
 *
 * Engineer Domain: Business logic only
 * - API calls
 * - Data validation
 * - Error handling
 */

import { useCallback } from 'react';
import { submitBetaApplicationAction } from '../../../../actions/beta.actions';
import type { BetaApplicationFormData } from './types';

export interface BetaApplicationBusinessLogic {
  onSubmit: (formData: BetaApplicationFormData) => Promise<{
    success: boolean;
    error?: string;
  }>;
  validate?: (formData: BetaApplicationFormData) => string | null;
}

/**
 * Production Business Logic
 *
 * Actual server action integration
 */
export function useBetaApplicationBusiness(): BetaApplicationBusinessLogic {
  const onSubmit = useCallback(async (formData: BetaApplicationFormData) => {
    try {
      const result = await submitBetaApplicationAction(formData);
      return result;
    } catch (error) {
      console.error('[BetaApplicationBusiness] Submit error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }, []);

  const validate = useCallback((formData: BetaApplicationFormData) => {
    // All fields are optional, no validation needed
    return null;
  }, []);

  return { onSubmit, validate };
}

/**
 * Mock Business Logic (for no-code tools)
 *
 * Test without actual API calls
 */
export function useMockBetaApplicationBusiness(): BetaApplicationBusinessLogic {
  const onSubmit = useCallback(async (formData: BetaApplicationFormData) => {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock success
    return { success: true };
  }, []);

  return { onSubmit };
}
