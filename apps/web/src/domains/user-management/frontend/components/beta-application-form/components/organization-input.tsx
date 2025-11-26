/**
 * Organization Input Component
 */

'use client';

import { Input } from '@workspace/ui/components/ui/input';
import { Label } from '@workspace/ui/components/ui/label';
import { useBetaApplicationFormContext } from '../core/context';
import { Box } from '@/components/ui/box';

export interface OrganizationInputProps {
  label?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Organization Input
 *
 * Organization field (optional)
 */
export function OrganizationInput({
  label = 'Organization',
  placeholder = 'e.g., Acme Inc., Your Team Name',
  className,
}: OrganizationInputProps) {
  const { formData, handleFieldChange } = useBetaApplicationFormContext();

  return (
    <Box className="space-y-2">
      <Label htmlFor="organization" className="text-sm font-medium">
        {label} <span className="text-gray-400 text-xs">(optional)</span>
      </Label>
      <Input
        id="organization"
        name="organization"
        type="text"
        placeholder={placeholder}
        value={formData.organization}
        onChange={handleFieldChange}
        maxLength={200}
        className={className}
      />
    </Box>
  );
}
