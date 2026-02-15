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

/** 블럭 마운트 변경 감사 (position, size, move, group) */
export class BlockMountUpdatedLoggedEvent {
  readonly type = 'BlockMountUpdatedLogged';

  constructor(
    public readonly eventId: string,
    public readonly pageId: string,
    public readonly userId: string,
    public readonly blockMountId: string,
    public readonly changes: Record<string, unknown>,
    public readonly occurredAt: Date = new Date()
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}

/** 블록 엔티티 영구 삭제 (휴지통 완전 삭제 시 사용 예정) */
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

/** 블록 마운트 소프트 삭제 감사 (단일) */
export class BlockMountSoftDeletedLoggedEvent {
  readonly type = 'BlockMountSoftDeletedLogged';

  constructor(
    public readonly eventId: string,
    public readonly pageId: string,
    public readonly userId: string,
    public readonly blockMountId: string,
    public readonly occurredAt: Date = new Date()
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}

/** 블록 마운트 소프트 삭제 감사 (배치) */
export class BlockMountsSoftDeletedLoggedEvent {
  readonly type = 'BlockMountsSoftDeletedLogged';

  constructor(
    public readonly eventId: string,
    public readonly pageId: string,
    public readonly userId: string,
    public readonly blockMountIds: string[],
    public readonly occurredAt: Date = new Date()
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}

export class EdgeCreatedLoggedEvent {
  readonly type = 'EdgeCreatedLogged';

  constructor(
    public readonly eventId: string,
    public readonly pageId: string,
    public readonly userId: string,
    public readonly edgeId: string,
    public readonly sourceBlockMountId: string | undefined,
    public readonly targetBlockMountId: string | undefined,
    public readonly occurredAt: Date = new Date()
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}

export class EdgeUpdatedLoggedEvent {
  readonly type = 'EdgeUpdatedLogged';

  constructor(
    public readonly eventId: string,
    public readonly pageId: string,
    public readonly userId: string,
    public readonly edgeId: string,
    public readonly changes: Record<string, unknown>,
    public readonly occurredAt: Date = new Date()
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}

export class EdgeDeletedLoggedEvent {
  readonly type = 'EdgeDeletedLogged';

  constructor(
    public readonly eventId: string,
    public readonly pageId: string,
    public readonly userId: string,
    public readonly edgeId: string,
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
  | BlockMountUpdatedLoggedEvent
  | BlockDeletedLoggedEvent
  | BlockMountSoftDeletedLoggedEvent
  | BlockMountsSoftDeletedLoggedEvent
  | EdgeCreatedLoggedEvent
  | EdgeUpdatedLoggedEvent
  | EdgeDeletedLoggedEvent;
