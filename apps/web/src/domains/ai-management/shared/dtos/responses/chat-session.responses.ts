import { z } from 'zod';

export const ChatSessionResponseSchema = z.object({
  id: z.uuid(),
  workspaceId: z.uuid(),
  userId: z.uuid(),
  title: z.string(),
  messages: z.array(z.unknown()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ChatSessionResponse = z.output<typeof ChatSessionResponseSchema>;

export const ChatSessionListItemSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  updatedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export type ChatSessionListItem = z.output<typeof ChatSessionListItemSchema>;

export const CreateChatSessionResponseSchema = z.object({
  sessionId: z.uuid(),
});

export type CreateChatSessionResponse = z.output<typeof CreateChatSessionResponseSchema>;
