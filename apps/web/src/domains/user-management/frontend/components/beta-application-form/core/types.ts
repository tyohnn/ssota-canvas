/**
 * Beta Application Form Types
 */

export interface BetaApplicationFormData {
  name: string;
  organization: string;
  purpose: string;
  use_case: string;
}

export interface BetaApplicationFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const PURPOSE_OPTIONS = [
  { value: 'personal', label: 'Personal Use' },
  { value: 'work', label: 'Work / Business' },
  { value: 'education', label: 'Education / Learning' },
  { value: 'research', label: 'Research' },
  { value: 'testing', label: 'Testing / Development' },
  { value: 'other', label: 'Other' },
] as const;

export const USE_CASE_OPTIONS = [
  { value: 'product_management', label: 'Product Management' },
  { value: 'design', label: 'Design' },
  { value: 'development', label: 'Development' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'content_creation', label: 'Content Creation' },
  { value: 'project_management', label: 'Project Management' },
  { value: 'other', label: 'Other' },
] as const;
