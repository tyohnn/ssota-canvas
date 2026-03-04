import type { DomainEvent } from './domain-event';

export class ProfileCreatedEvent implements DomainEvent {
  readonly type = 'ProfileCreated';

  constructor(
    public readonly aggregateId: string,
    public readonly data: {
      profileId: string;
      userId: string;
      username: string;
    },
    public readonly occurredAt: Date
  ) {}

  async handle(): Promise<void> {
    await Promise.allSettled([]);
  }
}
