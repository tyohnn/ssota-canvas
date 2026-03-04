import { z } from 'zod';

export const GetDriveBlockRequestSchema = z.object({
  organizationId: z.uuid(),
  blockId: z.uuid(),
});

export type GetDriveBlockRequest = z.infer<typeof GetDriveBlockRequestSchema>;
