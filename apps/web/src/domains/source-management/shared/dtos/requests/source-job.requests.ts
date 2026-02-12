/**
 * Source Job Request DTOs
 *
 * Zod 스키마와 자동 생성된 타입들
 */
import { z } from 'zod';

export const GetInProgressSourceJobRequestSchema = z.object({
  pageId: z.uuid({ message: 'Invalid page ID' }),
});

export type GetInProgressSourceJobRequest = z.output<
  typeof GetInProgressSourceJobRequestSchema
>;

export const GetInProgressSourceJobByBlockIdRequestSchema = z.object({
  blockId: z.uuid({ message: 'Invalid block ID' }),
});

export type GetInProgressSourceJobByBlockIdRequest = z.output<
  typeof GetInProgressSourceJobByBlockIdRequestSchema
>;
