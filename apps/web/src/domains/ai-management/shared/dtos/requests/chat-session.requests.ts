import { z } from 'zod';

export const CreateChatSessionRequestSchema = z.object({
  workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
});

export type CreateChatSessionRequest = z.output<typeof CreateChatSessionRequestSchema>;

export const ListChatSessionsRequestSchema = z.object({
  workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
});

export type ListChatSessionsRequest = z.output<typeof ListChatSessionsRequestSchema>;

export const GetChatSessionRequestSchema = z.object({
  workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  sessionId: z.uuid({ message: 'Invalid session ID' }),
  limit: z.number().int().positive().optional(),
  beforeIndex: z.number().int().nonnegative().optional(),
});

export type GetChatSessionRequest = z.output<typeof GetChatSessionRequestSchema>;

export const GetChatMessagesRequestSchema = z.object({
  workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  sessionId: z.uuid({ message: 'Invalid session ID' }),
  limit: z.number().int().positive().default(20),
  beforeIndex: z.number().int().nonnegative(),
});

export type GetChatMessagesRequest = z.output<typeof GetChatMessagesRequestSchema>;

export const UpdateChatSessionTitleRequestSchema = z.object({
  workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  sessionId: z.uuid({ message: 'Invalid session ID' }),
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
});

export type UpdateChatSessionTitleRequest = z.output<typeof UpdateChatSessionTitleRequestSchema>;

export const SaveChatSessionMessagesRequestSchema = z.object({
  workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  sessionId: z.uuid({ message: 'Invalid session ID' }),
  appendMessages: z.array(z.unknown()),
});

export type SaveChatSessionMessagesRequest = z.output<typeof SaveChatSessionMessagesRequestSchema>;

export const DeleteChatSessionRequestSchema = z.object({
  workspaceId: z.uuid({ message: 'Invalid workspace ID' }),
  sessionId: z.uuid({ message: 'Invalid session ID' }),
});

export type DeleteChatSessionRequest = z.output<typeof DeleteChatSessionRequestSchema>;
