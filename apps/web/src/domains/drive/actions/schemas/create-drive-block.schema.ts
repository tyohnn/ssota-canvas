import { z } from 'zod';

const DriveBlockTypeSchema = z.enum([
  'link',
  'audio',
  'markdown',
  'pdf',
  'youtube',
  'image',
  'x',
]);

export const CreateDriveBlockRequestSchema = z.object({
  organizationId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  blockType: DriveBlockTypeSchema,
  title: z.string().min(1, 'Title is required').max(500),
  initialProperties: z.record(z.string(), z.unknown()).optional(),
  initialContent: z.unknown().optional(),
});

export type CreateDriveBlockRequest = z.infer<
  typeof CreateDriveBlockRequestSchema
>;
