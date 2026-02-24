import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { ChatSessionId } from '../value-objects/chat-session-id.vo';

/**
 * Create new chat session command
 */
export interface CreateChatSessionCommand {
  chatSessionId: ChatSessionId;
  workspaceId: WorkspaceId;
  userId: UserId;
  title?: string;
}

/**
 * Update chat session title command
 */
export interface UpdateChatSessionTitleCommand {
  newTitle: string;
  userId: UserId;
}

/**
 * Update chat session messages command
 */
export interface UpdateChatSessionMessagesCommand {
  newMessages: unknown[];
  userId: UserId;
}

/**
 * Delete chat session command
 */
export interface DeleteChatSessionCommand {
  userId: UserId;
}
