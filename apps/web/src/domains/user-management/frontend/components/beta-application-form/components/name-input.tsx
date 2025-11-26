/**
 * Name Input Component
 */

'use client';

import { Input } from '@workspace/ui/components/ui/input';
import { Label } from '@workspace/ui/components/ui/label';
import { useBetaApplicationFormContext } from '../core/context';
import { Box } from '@/components/ui/box';

export interface NameInputProps {
  label?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Name Input
 *
 * Name field (optional)
 */
export function NameInput({
  label = 'Name',
  placeholder = 'Your name',
  className,
}: NameInputProps) {
  const { formData, handleFieldChange } = useBetaApplicationFormContext();

  return (
    <Box className="space-y-2">
      <Label htmlFor="name" className="text-sm font-medium">
        {label} <span className="text-gray-400 text-xs">(optional)</span>
      </Label>
      <Input
        id="name"
        name="name"
        type="text"
        placeholder={placeholder}
        value={formData.name}
        onChange={handleFieldChange}
        maxLength={100}
        className={className}
      />
    </Box>
  );
}
