import { EventLog } from '../entities/event-log.entity';
import { EventId } from '../value-objects/event-id.vo';
import { EventType } from '../value-objects/event-type.vo';
import { UtteranceContent } from '../value-objects/utterance-content.vo';
import { AIResponse } from '../value-objects/ai-response.vo';
import { ToolCallResult } from '../value-objects/tool-call-result.vo';
import {
  EventManagementError,
  EventManagementErrorCode,
} from '../errors/event-management.error';
import {
  LogUserUtteranceCommand,
  LogAIResponseCommand,
  LogToolCallCommand,
  LogBlockCreatedCommand,
  LogBlockUpdatedCommand,
  LogBlockMountUpdatedCommand,
  LogBlockDeletedCommand,
  LogBlockMountSoftDeletedCommand,
  LogBlockMountsSoftDeletedCommand,
  LogEdgeCreatedCommand,
  LogEdgeUpdatedCommand,
  LogEdgeDeletedCommand,
} from '../commands';
import {
  UserUtteranceLoggedEvent,
  AIResponseLoggedEvent,
  ToolCallLoggedEvent,
  BlockCreatedLoggedEvent,
  BlockUpdatedLoggedEvent,
  BlockMountUpdatedLoggedEvent,
  BlockDeletedLoggedEvent,
  BlockMountSoftDeletedLoggedEvent,
  BlockMountsSoftDeletedLoggedEvent,
  EdgeCreatedLoggedEvent,
  EdgeUpdatedLoggedEvent,
  EdgeDeletedLoggedEvent,
  DomainEvent,
} from '../events';
import { randomUUID } from 'crypto';

/**
 * EventLogAggregate
 *
 * BlockAggregate가 _block을, SourceJobAggregate가 _job을 들고 있듯이
 * EventLogAggregate는 _eventLog (EventLog entity)를 직접 들고 있는다.
 *
 * 서비스는 aggregate.getEventLog()로 entity를 꺼내 repo.save()하고,
 * 그 다음 handle() → markEventsAsCommitted().
 */
export class EventLogAggregate {
  private _uncommittedEvents: DomainEvent[] = [];
  private _eventLog: EventLog | null = null;

  logUserUtterance(command: LogUserUtteranceCommand): this {
    this.validateUtterance(command.utterance);

    const eventId = new EventId(randomUUID());
    const occurredAt = new Date();

    this._eventLog = new EventLog(
      eventId,
      new EventType('user_utterance'),
      command.pageId,
      command.userId,
      occurredAt,
      new UtteranceContent(command.utterance),
      {
        selectedBlockIds: command.selectedBlockIds,
        nearbyBlockIds: command.nearbyBlockIds,
        visibleBlockIds: command.visibleBlockIds,
      }
    );

    const event = new UserUtteranceLoggedEvent(
      eventId.value,
      command.pageId.value,
      command.userId.value,
      command.utterance,
      command.selectedBlockIds,
      command.nearbyBlockIds,
      command.visibleBlockIds,
      occurredAt
    );
    this._uncommittedEvents.push(event);
    return this;
  }

  logAIResponse(command: LogAIResponseCommand): this {
    this.validateResponse(command.response);
    this.validateAgentLoopCount(command.agentLoopCount);

    const tokensNumber =
      typeof command.tokens === 'number'
        ? command.tokens
        : command.tokens
          ? (command.tokens.input ?? 0) +
          (command.tokens.output ?? 0) +
          (command.tokens.reasoning ?? 0) +
          (command.tokens.cached ?? 0) || undefined
          : undefined;

    const eventId = new EventId(randomUUID());
    const occurredAt = new Date();

    this._eventLog = new EventLog(
      eventId,
      new EventType('ai_response'),
      command.pageId,
      command.userId,
      occurredAt,
      new AIResponse(command.response),
      tokensNumber != null ? { tokens: tokensNumber } : undefined
    );

    const event = new AIResponseLoggedEvent(
      eventId.value,
      command.pageId.value,
      command.userId.value,
      command.response,
      command.relatedUtteranceEventId.value,
      command.agentLoopCount,
      command.model,
      tokensNumber,
      occurredAt
    );
    this._uncommittedEvents.push(event);
    return this;
  }

  /** Tool name validation removed so V2 tool names (e.g. grepBlockContent, renderCanvasdown) are accepted. */
  logToolCall(command: LogToolCallCommand): this {
    this.validateToolNameNonEmpty(command.toolName);

    const eventId = new EventId(randomUUID());
    const occurredAt = new Date();
    const payload = {
      toolName: command.toolName,
      params: command.params,
      result: command.result,
    };

    this._eventLog = new EventLog(
      eventId,
      new EventType('tool_call'),
      command.pageId,
      command.userId,
      occurredAt,
      new ToolCallResult(JSON.stringify(payload)),
      payload,
      command.agentExecutionId.value
    );

    const event = new ToolCallLoggedEvent(
      eventId.value,
      command.pageId.value,
      command.userId.value,
      command.toolName,
      command.params,
      command.result,
      command.executionTime,
      command.agentExecutionId.value,
      command.success,
      command.errorMessage,
      occurredAt
    );
    this._uncommittedEvents.push(event);
    return this;
  }

  logBlockCreated(command: LogBlockCreatedCommand): this {
    const eventId = new EventId(randomUUID());
    const occurredAt = new Date();
    const payload = {
      blockId: command.blockId,
      blockType: command.blockType,
      ...(command.properties && { properties: command.properties }),
    };

    this._eventLog = new EventLog(
      eventId,
      new EventType('block_created'),
      command.pageId,
      command.userId,
      occurredAt,
      new ToolCallResult(JSON.stringify(payload)),
      payload,
      command.agentExecutionId?.value
    );

    const event = new BlockCreatedLoggedEvent(
      eventId.value,
      command.pageId.value,
      command.userId.value,
      command.blockId,
      command.blockType,
      command.properties,
      command.agentExecutionId?.value,
      occurredAt
    );
    this._uncommittedEvents.push(event);
    return this;
  }

  logBlockUpdated(command: LogBlockUpdatedCommand): this {
    const eventId = new EventId(randomUUID());
    const occurredAt = new Date();
    const payload = { blockId: command.blockId, changes: command.changes };

    this._eventLog = new EventLog(
      eventId,
      new EventType('block_updated'),
      command.pageId,
      command.userId,
      occurredAt,
      new ToolCallResult(JSON.stringify(payload)),
      payload,
      command.agentExecutionId?.value
    );

    const event = new BlockUpdatedLoggedEvent(
      eventId.value,
      command.pageId.value,
      command.userId.value,
      command.blockId,
      command.changes,
      command.agentExecutionId?.value,
      occurredAt
    );
    this._uncommittedEvents.push(event);
    return this;
  }

  logBlockMountUpdated(command: LogBlockMountUpdatedCommand): this {
    const eventId = new EventId(randomUUID());
    const occurredAt = new Date();
    const payload = {
      blockMountId: command.blockMountId,
      changes: command.changes,
    };

    this._eventLog = new EventLog(
      eventId,
      new EventType('block_mount_updated'),
      command.pageId,
      command.userId,
      occurredAt,
      new ToolCallResult(JSON.stringify(payload)),
      payload
    );

    const event = new BlockMountUpdatedLoggedEvent(
      eventId.value,
      command.pageId.value,
      command.userId.value,
      command.blockMountId,
      command.changes,
      occurredAt
    );
    this._uncommittedEvents.push(event);
    return this;
  }

  logBlockDeleted(command: LogBlockDeletedCommand): this {
    const eventId = new EventId(randomUUID());
    const occurredAt = new Date();
    const payload = { blockId: command.blockId };

    this._eventLog = new EventLog(
      eventId,
      new EventType('block_deleted'),
      command.pageId,
      command.userId,
      occurredAt,
      new ToolCallResult(JSON.stringify(payload)),
      payload,
      command.agentExecutionId?.value
    );

    const event = new BlockDeletedLoggedEvent(
      eventId.value,
      command.pageId.value,
      command.userId.value,
      command.blockId,
      command.agentExecutionId?.value,
      occurredAt
    );
    this._uncommittedEvents.push(event);
    return this;
  }

  /** 블록 마운트 소프트 삭제 (단일) — type=block_mount_soft_deleted */
  logBlockMountSoftDeleted(command: LogBlockMountSoftDeletedCommand): this {
    const eventId = new EventId(randomUUID());
    const occurredAt = new Date();
    const payload = { blockMountId: command.blockMountId };

    this._eventLog = new EventLog(
      eventId,
      new EventType('block_mount_soft_deleted'),
      command.pageId,
      command.userId,
      occurredAt,
      new ToolCallResult(JSON.stringify(payload)),
      payload
    );

    const event = new BlockMountSoftDeletedLoggedEvent(
      eventId.value,
      command.pageId.value,
      command.userId.value,
      command.blockMountId,
      occurredAt
    );
    this._uncommittedEvents.push(event);
    return this;
  }

  /** 블록 마운트 소프트 삭제 (배치) — type=block_mount_soft_deleted, payload.blockMountIds */
  logBlockMountsSoftDeleted(command: LogBlockMountsSoftDeletedCommand): this {
    const eventId = new EventId(randomUUID());
    const occurredAt = new Date();
    const payload = { blockMountIds: command.blockMountIds };

    this._eventLog = new EventLog(
      eventId,
      new EventType('block_mount_soft_deleted'),
      command.pageId,
      command.userId,
      occurredAt,
      new ToolCallResult(JSON.stringify(payload)),
      payload
    );

    const event = new BlockMountsSoftDeletedLoggedEvent(
      eventId.value,
      command.pageId.value,
      command.userId.value,
      command.blockMountIds,
      occurredAt
    );
    this._uncommittedEvents.push(event);
    return this;
  }

  logEdgeCreated(command: LogEdgeCreatedCommand): this {
    const eventId = new EventId(randomUUID());
    const occurredAt = new Date();
    const payload = {
      edgeId: command.edgeId,
      sourceBlockMountId: command.sourceBlockMountId,
      targetBlockMountId: command.targetBlockMountId,
    };

    this._eventLog = new EventLog(
      eventId,
      new EventType('edge_created'),
      command.pageId,
      command.userId,
      occurredAt,
      new ToolCallResult(JSON.stringify(payload)),
      payload
    );

    const event = new EdgeCreatedLoggedEvent(
      eventId.value,
      command.pageId.value,
      command.userId.value,
      command.edgeId,
      command.sourceBlockMountId,
      command.targetBlockMountId,
      occurredAt
    );
    this._uncommittedEvents.push(event);
    return this;
  }

  logEdgeUpdated(command: LogEdgeUpdatedCommand): this {
    const eventId = new EventId(randomUUID());
    const occurredAt = new Date();
    const payload = { edgeId: command.edgeId, changes: command.changes };

    this._eventLog = new EventLog(
      eventId,
      new EventType('edge_updated'),
      command.pageId,
      command.userId,
      occurredAt,
      new ToolCallResult(JSON.stringify(payload)),
      payload
    );

    const event = new EdgeUpdatedLoggedEvent(
      eventId.value,
      command.pageId.value,
      command.userId.value,
      command.edgeId,
      command.changes,
      occurredAt
    );
    this._uncommittedEvents.push(event);
    return this;
  }

  logEdgeDeleted(command: LogEdgeDeletedCommand): this {
    const eventId = new EventId(randomUUID());
    const occurredAt = new Date();
    const payload = { edgeId: command.edgeId };

    this._eventLog = new EventLog(
      eventId,
      new EventType('edge_deleted'),
      command.pageId,
      command.userId,
      occurredAt,
      new ToolCallResult(JSON.stringify(payload)),
      payload
    );

    const event = new EdgeDeletedLoggedEvent(
      eventId.value,
      command.pageId.value,
      command.userId.value,
      command.edgeId,
      occurredAt
    );
    this._uncommittedEvents.push(event);
    return this;
  }

  /** aggregate가 들고 있는 EventLog entity. BlockAggregate.getBlock()과 동일 패턴. */
  getEventLog(): EventLog {
    if (!this._eventLog) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_INPUT,
        'No event log; call a log* method first'
      );
    }
    return this._eventLog;
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  private validateUtterance(utterance: string): void {
    new UtteranceContent(utterance);
  }

  private validateResponse(response: string): void {
    new AIResponse(response);
  }

  private validateAgentLoopCount(count: number): void {
    if (count < 1 || count > 10) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_INPUT,
        'Agent loop count must be between 1 and 10'
      );
    }
  }

  /** Only ensure non-empty; allow any V2 tool name. */
  private validateToolNameNonEmpty(toolName: string): void {
    if (!toolName || toolName.trim().length === 0) {
      throw new EventManagementError(
        EventManagementErrorCode.INVALID_TOOL_NAME,
        'Tool name cannot be empty'
      );
    }
  }
}
