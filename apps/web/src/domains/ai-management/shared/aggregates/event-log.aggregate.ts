import { EventLog } from '../entities/event-log.entity';
import { EventId } from '../value-objects/event-id.vo';
import { EventType } from '../value-objects/event-type.vo';
import { UtteranceContent } from '../value-objects/utterance-content.vo';
import { AIResponse } from '../value-objects/ai-response.vo';
import { ToolCallResult } from '../value-objects/tool-call-result.vo';
import {
  AIManagementError,
  AIManagementErrorCode,
} from '../errors/ai-management.error';
import {
  LogUserUtteranceCommand,
  LogAIResponseCommand,
  LogToolCallCommand,
  LogBlockCreatedCommand,
  LogBlockUpdatedCommand,
  LogBlockDeletedCommand,
} from '../commands';
import {
  UserUtteranceLoggedEvent,
  AIResponseLoggedEvent,
  ToolCallLoggedEvent,
  BlockCreatedLoggedEvent,
  BlockUpdatedLoggedEvent,
  BlockDeletedLoggedEvent,
  DomainEvent,
} from '../events';
import { randomUUID } from 'crypto';

/**
 * EventLogAggregate
 * Event Log 관련 도메인 로직과 일관성 경계를 담당하는 Aggregate Root
 *
 * 비즈니스 규칙:
 * - Append-Only: Event Log는 생성 후 수정/삭제 불가 (Immutable Audit Log)
 * - 페이지 격리: Event Log는 반드시 하나의 Page에 속하며, 페이지 간 격리됨
 * - Temporal Ordering: Event는 timestamp 기준으로 정렬 가능해야 함
 */
export class EventLogAggregate {
  private uncommittedEvents: DomainEvent[] = [];

  /**
   * 사용자 발화 로깅
   */
  logUserUtterance(command: LogUserUtteranceCommand): DomainEvent[] {
    // 1. 입력 검증
    this.validateUtterance(command.utterance);
    this.validateUUID(command.pageId, 'Page ID');
    this.validateUUID(command.userId, 'User ID');

    // 2. Event ID 생성
    const eventId = new EventId(randomUUID());

    // 3. 도메인 이벤트 생성
    const event = new UserUtteranceLoggedEvent(
      eventId.value,
      command.pageId,
      command.userId,
      command.utterance,
      command.selectedBlockIds,
      command.nearbyBlockIds,
      command.visibleBlockIds,
      new Date()
    );

    // 4. 이벤트 추가
    this.uncommittedEvents.push(event);

    return [event];
  }

  /**
   * AI 응답 로깅
   */
  logAIResponse(command: LogAIResponseCommand): DomainEvent[] {
    // 1. 입력 검증
    this.validateResponse(command.response);
    this.validateUUID(command.pageId, 'Page ID');
    this.validateUUID(command.userId, 'User ID');
    this.validateUUID(
      command.relatedUtteranceEventId,
      'Related Utterance Event ID'
    );
    this.validateAgentLoopCount(command.agentLoopCount);

    // 2. Event ID 생성
    const eventId = new EventId(randomUUID());

    // 3. 도메인 이벤트 생성
    const event = new AIResponseLoggedEvent(
      eventId.value,
      command.pageId,
      command.userId,
      command.response,
      command.relatedUtteranceEventId,
      command.agentLoopCount,
      command.model,
      command.tokens,
      new Date()
    );

    // 4. 이벤트 추가
    this.uncommittedEvents.push(event);

    return [event];
  }

  /**
   * 툴 호출 로깅
   */
  logToolCall(command: LogToolCallCommand): DomainEvent[] {
    // 1. 입력 검증
    this.validateUUID(command.pageId, 'Page ID');
    this.validateUUID(command.userId, 'User ID');
    this.validateToolName(command.toolName);

    // 2. Event ID 생성
    const eventId = new EventId(randomUUID());

    // 3. 도메인 이벤트 생성
    const event = new ToolCallLoggedEvent(
      eventId.value,
      command.pageId,
      command.userId,
      command.toolName,
      command.params,
      command.result,
      command.executionTime,
      command.agentExecutionId,
      command.success,
      command.errorMessage,
      new Date()
    );

    // 4. 이벤트 추가
    this.uncommittedEvents.push(event);

    return [event];
  }

  /**
   * 블럭 생성 로깅
   */
  logBlockCreated(command: LogBlockCreatedCommand): DomainEvent[] {
    // 1. 입력 검증
    this.validateUUID(command.blockId, 'Block ID');
    this.validateUUID(command.pageId, 'Page ID');
    this.validateUUID(command.userId, 'User ID');

    // 2. Event ID 생성
    const eventId = new EventId(randomUUID());

    // 3. 도메인 이벤트 생성
    const event = new BlockCreatedLoggedEvent(
      eventId.value,
      command.pageId,
      command.userId,
      command.blockId,
      command.blockType,
      command.properties,
      command.agentExecutionId,
      new Date()
    );

    // 4. 이벤트 추가
    this.uncommittedEvents.push(event);

    return [event];
  }

  /**
   * 블럭 수정 로깅
   */
  logBlockUpdated(command: LogBlockUpdatedCommand): DomainEvent[] {
    // 1. 입력 검증
    this.validateUUID(command.blockId, 'Block ID');
    this.validateUUID(command.pageId, 'Page ID');
    this.validateUUID(command.userId, 'User ID');

    // 2. Event ID 생성
    const eventId = new EventId(randomUUID());

    // 3. 도메인 이벤트 생성
    const event = new BlockUpdatedLoggedEvent(
      eventId.value,
      command.pageId,
      command.userId,
      command.blockId,
      command.changes,
      command.agentExecutionId,
      new Date()
    );

    // 4. 이벤트 추가
    this.uncommittedEvents.push(event);

    return [event];
  }

  /**
   * 블럭 삭제 로깅
   */
  logBlockDeleted(command: LogBlockDeletedCommand): DomainEvent[] {
    // 1. 입력 검증
    this.validateUUID(command.blockId, 'Block ID');
    this.validateUUID(command.pageId, 'Page ID');
    this.validateUUID(command.userId, 'User ID');

    // 2. Event ID 생성
    const eventId = new EventId(randomUUID());

    // 3. 도메인 이벤트 생성
    const event = new BlockDeletedLoggedEvent(
      eventId.value,
      command.pageId,
      command.userId,
      command.blockId,
      command.agentExecutionId,
      new Date()
    );

    // 4. 이벤트 추가
    this.uncommittedEvents.push(event);

    return [event];
  }

  /**
   * 커밋되지 않은 이벤트들 반환
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  /**
   * 이벤트를 커밋 완료로 표시
   */
  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  // ============================================
  // Private 검증 메서드들
  // ============================================

  private validateUtterance(utterance: string): void {
    new UtteranceContent(utterance); // UtteranceContent VO가 검증
  }

  private validateResponse(response: string): void {
    new AIResponse(response); // AIResponse VO가 검증
  }

  private validateUUID(uuid: string, fieldName: string): void {
    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuid || !UUID_REGEX.test(uuid)) {
      throw new AIManagementError(
        AIManagementErrorCode.INVALID_INPUT,
        `${fieldName} must be a valid UUID`
      );
    }
  }

  private validateAgentLoopCount(count: number): void {
    if (count < 1 || count > 10) {
      throw new AIManagementError(
        AIManagementErrorCode.INVALID_INPUT,
        'Agent loop count must be between 1 and 10'
      );
    }
  }

  private validateToolName(toolName: string): void {
    const VALID_TOOLS = [
      'addBlock',
      'deleteBlock',
      'updateProperty',
      'connectBlocks',
      'executeBlockAction',
      'searchByHop',
      'searchByKeyword',
      'searchBlockActions',
      'searchMultimodal',
    ];

    if (!VALID_TOOLS.includes(toolName)) {
      throw new AIManagementError(
        AIManagementErrorCode.INVALID_TOOL_NAME,
        `Invalid tool name: ${toolName}. Must be one of: ${VALID_TOOLS.join(', ')}`
      );
    }
  }
}
