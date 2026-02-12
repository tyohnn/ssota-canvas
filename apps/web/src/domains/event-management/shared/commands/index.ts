/**
 * Event Management Domain - Commands
 */

import type { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import type { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import type { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import type { EventId } from '../value-objects/event-id.vo';
import type { AgentExecutionId } from '../value-objects/agent-execution-id.vo';

export interface LogUserUtteranceCommand {
  utterance: string;
  pageId: PageId;
  userId: UserId;
  selectedBlockIds?: string[];
  nearbyBlockIds?: string[];
  visibleBlockIds?: string[];
}

export interface TokenUsage {
  input?: number;
  output?: number;
  reasoning?: number;
  cached?: number;
}

export interface LogAIResponseCommand {
  response: string;
  pageId: PageId;
  userId: UserId;
  relatedUtteranceEventId: EventId;
  agentLoopCount: number;
  model?: string;
  tokens?: number | TokenUsage;
}

export interface LogToolCallCommand {
  toolName: string;
  params: Record<string, unknown>;
  result: Record<string, unknown>;
  pageId: PageId;
  userId: UserId;
  agentExecutionId: AgentExecutionId;
  executionTime: number;
  success: boolean;
  errorMessage?: string;
}

export interface LogBlockCreatedCommand {
  blockId: BlockId;
  blockType: string;
  pageId: PageId;
  userId: UserId;
  properties?: Record<string, unknown>;
  agentExecutionId?: AgentExecutionId;
}

export interface LogBlockUpdatedCommand {
  blockId: BlockId;
  pageId: PageId;
  userId: UserId;
  changes: Record<string, unknown>;
  agentExecutionId?: AgentExecutionId;
}

export interface LogBlockDeletedCommand {
  blockId: BlockId;
  pageId: PageId;
  userId: UserId;
  agentExecutionId?: AgentExecutionId;
}
