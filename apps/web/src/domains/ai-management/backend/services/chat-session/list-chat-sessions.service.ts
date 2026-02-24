import { Result } from '@/utils/result';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import type { IChatSessionRepository } from '../../repositories/interfaces/chat-session.repository.interface';
import type { ChatSession } from '../../../shared/entities/chat-session.entity';
import type { ListChatSessionsParams } from './types';

export async function listChatSessions(
  params: ListChatSessionsParams,
  repository: IChatSessionRepository
): Promise<Result<ChatSession[], Error>> {
  try {
    const workspaceId = new WorkspaceId(params.workspaceId);
    const userId = new UserId(params.userId);

    const sessions = await repository.findByWorkspaceAndUser(workspaceId, userId);
    return Result.success(sessions);
  } catch (error) {
    return Result.error(
      error instanceof Error ? error : new Error('Failed to list chat sessions')
    );
  }
}
