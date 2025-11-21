/**
 * Image Generation Request DTOs
 *
 * ⚠️ Migrated from block-management domain to image-app-space domain
 */

import { z } from 'zod';

/**
 * Generate Image Request Schema
 */
export const GenerateImageRequestSchema = z
  .object({
    orgId: z.string().min(1, 'Organization ID is required'),
    workspaceId: z.string().min(1, 'Workspace ID is required'),
    prompt: z
      .string()
      .min(1, 'Prompt is required')
      .max(1000, 'Prompt is too long'),
    negativePrompt: z
      .string()
      .max(500, 'Negative prompt is too long')
      .optional(),
    modelId: z.string().min(1, 'Model ID is required'),
    outputCount: z.number().int().min(1).max(4),
    size: z.string().optional(),
    aspectRatio: z.string().optional(),
    seed: z.number().int().positive().optional(),
  })
  .passthrough(); // 알 수 없는 필드 허용 (providerOptions 등)

export type GenerateImageRequest = z.infer<typeof GenerateImageRequestSchema>;
