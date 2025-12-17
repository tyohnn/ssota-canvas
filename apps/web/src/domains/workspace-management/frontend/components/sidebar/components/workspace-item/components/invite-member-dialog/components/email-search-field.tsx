'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

/**
 * Email Search Field (Presentational)
 *
 * Input field for searching organization members by email
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only
 * - Storybook testable
 */
interface EmailSearchFieldProps {
  email: string;
  onEmailChange: (email: string) => void;
  disabled?: boolean;
}

export function EmailSearchField({
  email,
  onEmailChange,
  disabled = false,
}: EmailSearchFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Search organization members by email</Label>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          id="email"
          type="email"
          placeholder="member@example.com"
          value={email}
          onChange={e => onEmailChange(e.target.value)}
          className="pl-9"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
