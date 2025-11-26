/**
 * Beta Access Validation Schemas
 */

import { z } from 'zod';

/**
 * Purpose Options
 */
export const purposeOptions = [
  'personal',
  'work',
  'education',
  'research',
  'testing',
  'other',
] as const;

/**
 * Use Case Options
 */
export const useCaseOptions = [
  'product_management',
  'design',
  'development',
  'marketing',
  'content_creation',
  'project_management',
  'other',
] as const;

/**
 * Beta Application Form Schema
 *
 * Frontend에서 1차 검증 (UX)
 * Server Action에서 2차 검증 (보안)
 */
export const BetaApplicationSchema = z.object({
  name: z.string().max(100, 'Name is too long (max 100 characters)').optional(),
  organization: z
    .string()
    .max(200, 'Organization is too long (max 200 characters)')
    .optional(),
  purpose: z.enum(purposeOptions).optional(),
  use_case: z.enum(useCaseOptions).optional(),
});

/**
 * TypeScript 타입 추론
 */
export type BetaApplicationInput = z.input<typeof BetaApplicationSchema>;
export type BetaApplicationData = z.output<typeof BetaApplicationSchema>;
