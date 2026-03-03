import { z } from 'zod';

export const ListDriveBlocksRequestSchema = z.object({
  organizationId: z.uuid(),
  limit: z.number().int().min(1).max(100).optional().default(24),
  cursor: z.uuid().nullable().optional(),
  typeFilter: z
    .enum(['link', 'audio', 'markdown', 'pdf', 'youtube', 'image', 'x'])
    .nullable()
    .optional(),
  search: z.string().max(500).nullable().optional(),
});

export type ListDriveBlocksRequest = z.infer<typeof ListDriveBlocksRequestSchema>;
