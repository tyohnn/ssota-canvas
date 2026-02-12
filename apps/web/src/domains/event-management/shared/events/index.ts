/**
 * Event Management Domain - Events
 *
 * 도메인 이벤트는 이미 발생한 사실(fact)의 기록이므로 VO 대신 primitive string을 사용한다.
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

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}

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

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}

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

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}

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

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}

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

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}

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

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}

export type DomainEvent =
  | UserUtteranceLoggedEvent
  | AIResponseLoggedEvent
  | ToolCallLoggedEvent
  | BlockCreatedLoggedEvent
  | BlockUpdatedLoggedEvent
  | BlockDeletedLoggedEvent;
