'use client';

import { Box } from '@workspace/ui/components/ui/box';

/**
 * General Settings Form Header (Presentational)
 *
 * Displays title and description
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only (optional for customization)
 * - Storybook testable
 */

interface FormHeaderProps {
  title?: string;
  description?: string;
}

export function FormHeader({
  title = 'General Settings',
  description = 'Edit workspace name, description, and icon.',
}: FormHeaderProps) {
  return (
    <Box>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Box>
  );
}
