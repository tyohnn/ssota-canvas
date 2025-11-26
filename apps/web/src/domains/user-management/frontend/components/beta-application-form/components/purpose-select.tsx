/**
 * Purpose Select Component
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
import { PURPOSE_OPTIONS } from '../core/types';
import { Box } from '@/components/ui/box';

export interface PurposeSelectProps {
  label?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Purpose Select
 *
 * Purpose selection field (optional)
 */
export function PurposeSelect({
  label = 'Purpose',
  placeholder = 'Select your purpose',
  className,
}: PurposeSelectProps) {
  const { formData, updateField } = useBetaApplicationFormContext();

  return (
    <Box className="space-y-2">
      <Label htmlFor="purpose" className="text-sm font-medium">
        {label} <span className="text-gray-400 text-xs">(optional)</span>
      </Label>
      <Select
        value={formData.purpose}
        onValueChange={value => updateField('purpose', value)}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {PURPOSE_OPTIONS.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Box>
  );
}
