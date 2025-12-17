'use client';

import { Form } from '@/components/ui/form';
import { GeneralSettingsFormContent } from './components/general-settings-form-content';
import { useGeneralSettingsForm } from './core/use-general-settings-form';
import type { GeneralSettingsFormProps } from './core/types';
import type { GeneralSettingsFormBusinessLogic } from './core/use-general-settings-form.business';

/**
 * GeneralSettingsForm Component (Container)
 *
 * Form for editing workspace information following Container/Presentational pattern:
 *
 * **Architecture (v4.0.0):**
 * - Container pattern: Hook → Props (no local Context)
 * - Presentational components: Props only (Storybook testable)
 * - TanStack Query for Optimistic Updates
 *
 * **Features:**
 * - Workspace name editing
 * - Icon selection
 * - Description editing
 * - Form validation (Zod)
 * - Optimistic updates
 *
 * **Usage:**
 * ```tsx
 * // Production
 * <GeneralSettingsForm workspace={workspace} onClose={handleClose} />
 *
 * // With custom business logic (testing/mock)
 * const mockBusiness = useMockGeneralSettingsFormBusiness();
 * <GeneralSettingsForm
 *   workspace={workspace}
 *   onClose={handleClose}
 *   businessLogic={mockBusiness}
 * />
 * ```
 */
export function GeneralSettingsForm({
  workspace,
  onClose,
  businessLogic,
}: GeneralSettingsFormProps & {
  businessLogic?: GeneralSettingsFormBusinessLogic;
}) {
  // Container: Hook으로 데이터 가져오기
  const {
    form,
    isDirty,
    isSubmitting,
    descriptionLength,
    handleSubmit,
    handleClose,
  } = useGeneralSettingsForm({ workspace, onClose }, businessLogic);

  // Props로 Presentational에 전달
  return (
    <Form {...form}>
      <GeneralSettingsFormContent
        form={form}
        isSubmitting={isSubmitting}
        isDirty={isDirty}
        descriptionLength={descriptionLength}
        isDefault={workspace.isDefault}
        onSubmit={handleSubmit}
        onCancel={handleClose}
      />
    </Form>
  );
}
