/**
 * Form Header Component
 */

'use client';

import {
  CardHeader,
  CardTitle,
  CardDescription,
} from '@workspace/ui/components/ui/card';

export interface FormHeaderProps {
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Form Header
 *
 * Displays form title and description
 */
export function FormHeader({
  title = 'Apply for Beta Access',
  description = 'Fill out the information below to join the SSOTA closed beta. We will review your application and notify you via email within 1-2 business days.',
  className,
}: FormHeaderProps) {
  return (
    <CardHeader className={className || 'space-y-1'}>
      <CardTitle className="text-2xl font-bold">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  );
}
