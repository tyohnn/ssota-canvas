/**
 * Beta Application Form - UI State Hook
 *
 * Designer Domain: UI state management only
 * - Local state management
 * - No business logic
 * - Can be used independently in no-code tools
 */

import { useState, useCallback } from 'react';
import type { BetaApplicationFormData } from './types';

export interface BetaApplicationFormUIState {
  // Form data
  formData: BetaApplicationFormData;

  // UI state
  isSubmitting: boolean;

  // UI actions
  setFormData: (data: Partial<BetaApplicationFormData>) => void;
  updateField: (field: keyof BetaApplicationFormData, value: string) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  resetForm: () => void;

  // Validation
  isValid: boolean;
}

const initialFormData: BetaApplicationFormData = {
  name: '',
  organization: '',
  purpose: '',
  use_case: '',
};

/**
 * UI State Hook
 *
 * Manages form state only, no API calls or business logic
 */
export function useBetaApplicationFormUI(): BetaApplicationFormUIState {
  const [formData, setFormDataState] =
    useState<BetaApplicationFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFormData = useCallback((data: Partial<BetaApplicationFormData>) => {
    setFormDataState(prev => ({ ...prev, ...data }));
  }, []);

  const updateField = useCallback(
    (field: keyof BetaApplicationFormData, value: string) => {
      setFormDataState(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormDataState(initialFormData);
  }, []);

  // Client-side validation - all fields are optional
  const isValid = true;

  return {
    formData,
    isSubmitting,
    setFormData,
    updateField,
    setIsSubmitting,
    resetForm,
    isValid,
  };
}
