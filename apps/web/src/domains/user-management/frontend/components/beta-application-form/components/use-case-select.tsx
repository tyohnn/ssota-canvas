/**
 * Use Case Select Component
 */

'use client';

import { Label } from '@workspace/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/ui/select';
import { useBetaApplicationFormContext } from '../core/context';
import { USE_CASE_OPTIONS } from '../core/types';
import { Box } from '@/components/ui/box';

export interface UseCaseSelectProps {
  label?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Use Case Select
 *
 * Use case selection field (optional)
 */
export function UseCaseSelect({
  label = 'Use Case',
  placeholder = 'Select your primary use case',
  className,
}: UseCaseSelectProps) {
  const { formData, updateField } = useBetaApplicationFormContext();

  return (
    <Box className="space-y-2">
      <Label htmlFor="use_case" className="text-sm font-medium">
        {label} <span className="text-gray-400 text-xs">(optional)</span>
      </Label>
      <Select
        value={formData.use_case}
        onValueChange={value => updateField('use_case', value)}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {USE_CASE_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Box>
  );
}
