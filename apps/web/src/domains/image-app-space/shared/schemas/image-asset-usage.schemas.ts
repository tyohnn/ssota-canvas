/**
 * Image Asset Usage Zod Schemas
 */

import { z } from 'zod';

/**
 * 이미지 사용 기록 요청 스키마
 */
export const RecordImageUsageRequestSchema = z.object({
  imageAssetId: z.uuid({ message: 'Invalid image asset ID' }),
  blockId: z.uuid({ message: 'Invalid block ID' }),
  pageId: z.uuid({ message: 'Invalid page ID' }),
});

export type RecordImageUsageRequest = z.infer<
  typeof RecordImageUsageRequestSchema
>;
