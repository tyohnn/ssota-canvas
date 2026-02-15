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

/** 블럭 마운트 변경 (position, size, movedToPage, group) — block_updated와 분리 */
export interface LogBlockMountUpdatedCommand {
  pageId: PageId;
  userId: UserId;
  blockMountId: string;
  changes: Record<string, unknown>;
}

/** 블록 엔티티 영구 삭제 (휴지통에서 완전 삭제 시 사용 예정) */
export interface LogBlockDeletedCommand {
  blockId: BlockId;
  pageId: PageId;
  userId: UserId;
  agentExecutionId?: AgentExecutionId;
}

/** 블록 마운트 소프트 삭제 (단일) — 캔버스에서 제거 */
export interface LogBlockMountSoftDeletedCommand {
  pageId: PageId;
  userId: UserId;
  blockMountId: string;
}

/** 블록 마운트 소프트 삭제 (배치) — 캔버스에서 여러 개 제거 */
export interface LogBlockMountsSoftDeletedCommand {
  pageId: PageId;
  userId: UserId;
  blockMountIds: string[];
}

export interface LogEdgeCreatedCommand {
  pageId: PageId;
  userId: UserId;
  edgeId: string;
  sourceBlockMountId: string;
  targetBlockMountId: string;
}

export interface LogEdgeUpdatedCommand {
  pageId: PageId;
  userId: UserId;
  edgeId: string;
  changes: Record<string, unknown>;
}

export interface LogEdgeDeletedCommand {
  pageId: PageId;
  userId: UserId;
  edgeId: string;
}
