import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { AgentExecutionId } from '../../shared/value-objects/agent-execution-id.vo';
import { EventId } from '../../shared/value-objects/event-id.vo';
import { EventLogRepository } from '../repositories/interfaces/event-log.repository.interface';
import { EventLogAggregate } from '../../shared/aggregates/event-log.aggregate';
import { EventLog } from '../../shared/entities/event-log.entity';

/**
 * EventLogService
 * Persists user_utterance, ai_response, tool_call, block_* events (fire-and-forget safe).
 *
 * 패턴 (BlockAggregate.getBlock() / SourceJobAggregate.getJob()과 동일):
 * (1) aggregate.log*() → entity + domain event 생성
 * (2) repo.save(aggregate.getEventLog())
 * (3) handle() → markEventsAsCommitted()
 */
export class EventLogService {
  constructor(private readonly repo: EventLogRepository) {}

  async logUserUtterance(params: {
    pageId: string;
    userId: string;
    utterance: string;
    agentExecutionId?: string;
    selectedBlockIds?: string[];
  }): Promise<string> {
    const aggregate = new EventLogAggregate();
    aggregate.logUserUtterance({
      utterance: params.utterance,
      pageId: new PageId(params.pageId),
      userId: new UserId(params.userId),
      selectedBlockIds: params.selectedBlockIds,
    });

    const eventLog = aggregate.getEventLog();
    const toSave = params.agentExecutionId
      ? new EventLog(
          eventLog.id,
          eventLog.eventType,
          eventLog.pageId,
          eventLog.userId,
          eventLog.timestamp,
          eventLog.content,
          eventLog.metadata,
          params.agentExecutionId
        )
      : eventLog;
    await this.repo.save(toSave);

    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map((e) => e.handle()));
    aggregate.markEventsAsCommitted();
    return eventLog.id.value;
  }

  async logAIResponse(params: {
    pageId: string;
    userId: string;
    response: string;
    agentExecutionId: string;
    model?: string;
    tokens?: { input: number; output: number };
  }): Promise<string> {
    const aggregate = new EventLogAggregate();
    aggregate.logAIResponse({
      response: params.response,
      pageId: new PageId(params.pageId),
      userId: new UserId(params.userId),
      relatedUtteranceEventId: new EventId(crypto.randomUUID()),
      agentLoopCount: 1,
      model: params.model,
      tokens: params.tokens ? params.tokens.input + params.tokens.output : undefined,
    });

    const eventLog = aggregate.getEventLog();
    const toSave = new EventLog(
      eventLog.id,
      eventLog.eventType,
      eventLog.pageId,
      eventLog.userId,
      eventLog.timestamp,
      eventLog.content,
      eventLog.metadata,
      params.agentExecutionId
    );
    await this.repo.save(toSave);

    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map((e) => e.handle()));
    aggregate.markEventsAsCommitted();
    return eventLog.id.value;
  }

  async logToolCall(params: {
    pageId: string;
    userId: string;
    toolName: string;
    args: Record<string, unknown>;
    result: Record<string, unknown>;
    success: boolean;
    agentExecutionId: string;
    relatedBlockMountIds?: string[];
  }): Promise<string> {
    const aggregate = new EventLogAggregate();
    aggregate.logToolCall({
      toolName: params.toolName,
      params: params.args,
      result: params.result,
      pageId: new PageId(params.pageId),
      userId: new UserId(params.userId),
      agentExecutionId: new AgentExecutionId(params.agentExecutionId),
      executionTime: 0,
      success: params.success,
    });

    const eventLog = aggregate.getEventLog();
    const metadata = {
      ...eventLog.metadata,
      ...(params.relatedBlockMountIds?.length && {
        blockMountIds: params.relatedBlockMountIds,
      }),
    };
    const toSave = new EventLog(
      eventLog.id,
      eventLog.eventType,
      eventLog.pageId,
      eventLog.userId,
      eventLog.timestamp,
      eventLog.content,
      metadata,
      eventLog.agentExecutionId
    );
    await this.repo.save(toSave);

    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map((e) => e.handle()));
    aggregate.markEventsAsCommitted();
    return eventLog.id.value;
  }

  /** Block lifecycle logging (e.g. from block domain Event.handle() policy). */
  async logBlockCreated(params: {
    pageId: string;
    userId: string;
    blockId: string;
    blockType: string;
    properties?: Record<string, unknown>;
    agentExecutionId?: string;
  }): Promise<string> {
    const aggregate = new EventLogAggregate();
    aggregate.logBlockCreated({
      pageId: new PageId(params.pageId),
      userId: new UserId(params.userId),
      blockId: new BlockId(params.blockId),
      blockType: params.blockType,
      properties: params.properties,
      agentExecutionId: params.agentExecutionId
        ? new AgentExecutionId(params.agentExecutionId)
        : undefined,
    });

    await this.repo.save(aggregate.getEventLog());

    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map((e) => e.handle()));
    aggregate.markEventsAsCommitted();
    return aggregate.getEventLog().id.value;
  }

  async logBlockUpdated(params: {
    pageId: string;
    userId: string;
    blockId: string;
    changes: Record<string, unknown>;
    agentExecutionId?: string;
  }): Promise<string> {
    const aggregate = new EventLogAggregate();
    aggregate.logBlockUpdated({
      pageId: new PageId(params.pageId),
      userId: new UserId(params.userId),
      blockId: new BlockId(params.blockId),
      changes: params.changes,
      agentExecutionId: params.agentExecutionId
        ? new AgentExecutionId(params.agentExecutionId)
        : undefined,
    });

    await this.repo.save(aggregate.getEventLog());

    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map((e) => e.handle()));
    aggregate.markEventsAsCommitted();
    return aggregate.getEventLog().id.value;
  }

  async logBlockDeleted(params: {
    pageId: string;
    userId: string;
    blockId: string;
    agentExecutionId?: string;
  }): Promise<string> {
    const aggregate = new EventLogAggregate();
    aggregate.logBlockDeleted({
      pageId: new PageId(params.pageId),
      userId: new UserId(params.userId),
      blockId: new BlockId(params.blockId),
      agentExecutionId: params.agentExecutionId
        ? new AgentExecutionId(params.agentExecutionId)
        : undefined,
    });

    await this.repo.save(aggregate.getEventLog());

    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map((e) => e.handle()));
    aggregate.markEventsAsCommitted();
    return aggregate.getEventLog().id.value;
  }
}
