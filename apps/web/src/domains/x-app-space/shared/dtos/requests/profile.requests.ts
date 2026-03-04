import { z } from 'zod';

export const GetProfileRequestSchema = z.object({
  userId: z.string().min(6, 'X User ID must be at least 6 digits'),
});

export const GetProfileByIdRequestSchema = z.object({
  profileId: z.uuid('Invalid profile ID'),
});

export const CreateProfileRequestSchema = z.object({
  userId: z.string().min(6, 'X User ID is required'),
  username: z.string().min(1, 'Username is required'),
  name: z.string().optional(),
  profileImageUrl: z.string().url().optional(),
  description: z.string().optional(),
  followersCount: z.number().int().nonnegative().optional(),
  followingCount: z.number().int().nonnegative().optional(),
  tweetCount: z.number().int().nonnegative().optional(),
});

export type GetProfileRequest = z.output<typeof GetProfileRequestSchema>;
export type GetProfileByIdRequest = z.output<
  typeof GetProfileByIdRequestSchema
>;
export type CreateProfileRequest = z.output<typeof CreateProfileRequestSchema>;
