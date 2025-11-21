/**
 * AI Management Domain - Events
 * 도메인에서 발생한 중요한 사건들을 표현하는 Event 클래스들
 */

/**
 * UserUtteranceLoggedEvent
 * 사용자 발화가 로깅됨
 */
export class UserUtteranceLoggedEvent {
  readonly type = 'UserUtteranceLogged';

  constructor(
    public readonly eventId: string,
    public readonly pageId: string,
    public readonly userId: string,
    public readonly utterance: string,
    public readonly selectedBlockIds: string[] | undefined,
    public readonly nearbyBlockIds: string[] | undefined,
    public readonly visibleBlockIds: string[] | undefined,
    public readonly occurredAt: Date = new Date()
  ) {}
}

/**
 * AIResponseLoggedEvent
 * AI 응답이 로깅됨
 */
export class AIResponseLoggedEvent {
  readonly type = 'AIResponseLogged';

  constructor(
    public readonly eventId: string,
    public readonly pageId: string,
    public readonly userId: string,
    public readonly response: string,
    public readonly relatedUtteranceEventId: string,
    public readonly agentLoopCount: number,
    public readonly model: string | undefined,
    public readonly tokens: number | undefined,
    public readonly occurredAt: Date = new Date()
  ) {}
}

/**
 * ToolCallLoggedEvent
 * 툴 호출이 로깅됨
 */
export class ToolCallLoggedEvent {
  readonly type = 'ToolCallLogged';

  constructor(
    public readonly eventId: string,
    public readonly pageId: string,
    public readonly userId: string,
    public readonly toolName: string,
    public readonly params: Record<string, unknown>,
    public readonly result: Record<string, unknown>,
    public readonly executionTime: number,
    public readonly agentExecutionId: string,
    public readonly success: boolean,
    public readonly errorMessage: string | undefined,
    public readonly occurredAt: Date = new Date()
  ) {}
}

/**
 * BlockCreatedLoggedEvent
 * 블럭 생성이 로깅됨
 */
export class BlockCreatedLoggedEvent {
  readonly type = 'BlockCreatedLogged';

  constructor(
    public readonly eventId: string,
    public readonly pageId: string,
    public readonly userId: string,
    public readonly blockId: string,
    public readonly blockType: string,
    public readonly properties: Record<string, unknown> | undefined,
    public readonly agentExecutionId: string | undefined,
    public readonly occurredAt: Date = new Date()
  ) {}
}

/**
 * BlockUpdatedLoggedEvent
 * 블럭 수정이 로깅됨
 */
export class BlockUpdatedLoggedEvent {
  readonly type = 'BlockUpdatedLogged';

  constructor(
    public readonly eventId: string,
    public readonly pageId: string,
    public readonly userId: string,
    public readonly blockId: string,
    public readonly changes: Record<string, unknown>,
    public readonly agentExecutionId: string | undefined,
    public readonly occurredAt: Date = new Date()
  ) {}
}

/**
 * BlockDeletedLoggedEvent
 * 블럭 삭제가 로깅됨
 */
export class BlockDeletedLoggedEvent {
  readonly type = 'BlockDeletedLogged';

  constructor(
    public readonly eventId: string,
    public readonly pageId: string,
    public readonly userId: string,
    public readonly blockId: string,
    public readonly agentExecutionId: string | undefined,
    public readonly occurredAt: Date = new Date()
  ) {}
}

/**
 * 모든 도메인 이벤트 타입
 */
export type DomainEvent =
  | UserUtteranceLoggedEvent
  | AIResponseLoggedEvent
  | ToolCallLoggedEvent
  | BlockCreatedLoggedEvent
  | BlockUpdatedLoggedEvent
  | BlockDeletedLoggedEvent;
