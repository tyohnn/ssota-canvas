/**
 * Channel Request DTOs
 *
 * Zod 스키마와 자동 생성된 타입들
 * - Schemas: 런타임 검증용
 * - Input types: 프론트엔드에서 사용 (더 유연한 타입)
 * - Output types: 서버에서 사용 (검증된 타입, SafeDTO)
 */
import { z } from 'zod';

/**
 * Channel 조회 요청 스키마
 * YouTube Channel ID로 조회
 */
export const GetChannelRequestSchema = z.object({
  youtubeChannelId: z
    .string()
    .min(1, { message: 'YouTube Channel ID is required' }),
});

/**
 * Channel ID로 조회 요청 스키마
 * Channel Aggregate ID (UUID)로 조회
 */
export const GetChannelByIdRequestSchema = z.object({
  channelId: z.uuid('Invalid channel ID'),
});

// Input types (프론트엔드에서 사용)
export type GetChannelRequestInput = z.input<typeof GetChannelRequestSchema>;
export type GetChannelByIdRequestInput = z.input<
  typeof GetChannelByIdRequestSchema
>;

// Output types (서버에서 사용, SafeDTO)
export type GetChannelRequest = z.output<typeof GetChannelRequestSchema>;
export type GetChannelByIdRequest = z.output<
  typeof GetChannelByIdRequestSchema
>;

/**
 * Channel 생성 요청 스키마
 * YouTube Channel ID와 채널 정보를 받음
 */
export const CreateChannelRequestSchema = z.object({
  youtubeChannelId: z
    .string()
    .min(1, { message: 'YouTube Channel ID is required' }),
  channelName: z.string().min(1, { message: 'Channel name is required' }),
  channelDescription: z.string().optional(),
  channelThumbnailUrl: z.url().optional(),
  subscriberCount: z.number().int().nonnegative().optional(),
  videoCount: z.number().int().nonnegative().optional(),
});

// Input types (프론트엔드에서 사용)
export type CreateChannelRequestInput = z.input<
  typeof CreateChannelRequestSchema
>;

// Output types (서버에서 사용, SafeDTO)
export type CreateChannelRequest = z.output<typeof CreateChannelRequestSchema>;
